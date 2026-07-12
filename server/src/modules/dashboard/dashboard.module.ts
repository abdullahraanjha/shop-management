import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Dashboard KPIs and charts in a single call:
 * today's/monthly sales + profit, revenue, counts, low-stock list,
 * best-selling products, and a 7-day sales trend.
 */
dashboardRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const today = startOfToday();
    const monthStart = startOfMonth();

    const [
      todayAgg,
      monthAgg,
      allAgg,
      productCount,
      customerCount,
      monthExpenseAgg,
      lowStock,
      bestSelling,
      recentSales,
    ] = await Promise.all([
      prisma.salesInvoice.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { total: true, totalProfit: true },
        _count: true,
      }),
      prisma.salesInvoice.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { total: true, totalProfit: true },
        _count: true,
      }),
      prisma.salesInvoice.aggregate({ _sum: { total: true, totalProfit: true }, _count: true }),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.expense.aggregate({ where: { spentAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.$queryRawUnsafe<Array<{ id: string; name: string; sku: string; stock: number; lowStockAt: number }>>(
        `SELECT id, name, sku, stock, "lowStockAt" FROM products WHERE stock <= "lowStockAt" ORDER BY stock ASC LIMIT 8`,
      ),
      prisma.salesItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Last 7 days of sales totals grouped by day
      prisma.$queryRawUnsafe<Array<{ day: string; total: number; profit: number }>>(
        `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
                COALESCE(SUM(total), 0)::float AS total,
                COALESCE(SUM("totalProfit"), 0)::float AS profit
         FROM sales_invoices
         WHERE "createdAt" >= NOW() - INTERVAL '7 days'
         GROUP BY 1 ORDER BY 1 ASC`,
      ),
    ]);

    // Resolve best-selling product names
    const bestIds = bestSelling.map((b) => b.productId);
    const bestProducts = await prisma.product.findMany({
      where: { id: { in: bestIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(bestProducts.map((p) => [p.id, p.name]));
    const bestSellingNamed = bestSelling.map((b) => ({
      productId: b.productId,
      name: nameMap.get(b.productId) ?? 'Unknown',
      quantitySold: b._sum.quantity ?? 0,
      revenue: Number(b._sum.lineTotal ?? 0),
    }));

    sendSuccess(res, {
      todaySales: Number(todayAgg._sum.total ?? 0),
      todayProfit: Number(todayAgg._sum.totalProfit ?? 0),
      todayCount: todayAgg._count,
      monthSales: Number(monthAgg._sum.total ?? 0),
      monthProfit: Number(monthAgg._sum.totalProfit ?? 0),
      monthCount: monthAgg._count,
      totalRevenue: Number(allAgg._sum.total ?? 0),
      totalProfit: Number(allAgg._sum.totalProfit ?? 0),
      totalSalesCount: allAgg._count,
      monthExpenses: Number(monthExpenseAgg._sum.amount ?? 0),
      productCount,
      customerCount,
      lowStock,
      lowStockCount: lowStock.length,
      bestSelling: bestSellingNamed,
      salesTrend: recentSales,
    }, 'Dashboard data');
  }),
);
