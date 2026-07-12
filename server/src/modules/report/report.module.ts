import { Router } from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const reportRouter = Router();
reportRouter.use(requireAuth);

/** Parse ?from & ?to date range (defaults: last 30 days). */
function range(req: Request) {
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const from = req.query.from
    ? new Date(String(req.query.from))
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

// Sales report — totals + profit within range
reportRouter.get(
  '/sales',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = range(req);
    const where: Prisma.SalesInvoiceWhereInput = { createdAt: { gte: from, lte: to } };
    const [agg, invoices] = await Promise.all([
      prisma.salesInvoice.aggregate({ where, _sum: { total: true, totalProfit: true }, _count: true }),
      prisma.salesInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
        take: 200,
      }),
    ]);
    sendSuccess(res, {
      from,
      to,
      totalSales: Number(agg._sum.total ?? 0),
      totalProfit: Number(agg._sum.totalProfit ?? 0),
      invoiceCount: agg._count,
      invoices,
    }, 'Sales report');
  }),
);

// Purchase report
reportRouter.get(
  '/purchases',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = range(req);
    const where: Prisma.PurchaseInvoiceWhereInput = { createdAt: { gte: from, lte: to } };
    const [agg, invoices] = await Promise.all([
      prisma.purchaseInvoice.aggregate({ where, _sum: { total: true }, _count: true }),
      prisma.purchaseInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { name: true } } },
        take: 200,
      }),
    ]);
    sendSuccess(res, {
      from,
      to,
      totalPurchases: Number(agg._sum.total ?? 0),
      invoiceCount: agg._count,
      invoices,
    }, 'Purchase report');
  }),
);

// Profit & loss — revenue vs cost vs expenses within range
reportRouter.get(
  '/profit-loss',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = range(req);
    const [sales, expenses] = await Promise.all([
      prisma.salesInvoice.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _sum: { total: true, totalProfit: true },
      }),
      prisma.expense.aggregate({ where: { spentAt: { gte: from, lte: to } }, _sum: { amount: true } }),
    ]);
    const revenue = Number(sales._sum.total ?? 0);
    const grossProfit = Number(sales._sum.totalProfit ?? 0);
    const totalExpenses = Number(expenses._sum.amount ?? 0);
    sendSuccess(res, {
      from,
      to,
      revenue,
      grossProfit,
      totalExpenses,
      netProfit: grossProfit - totalExpenses,
    }, 'Profit & loss report');
  }),
);

// Inventory valuation
reportRouter.get(
  '/inventory',
  asyncHandler(async (_req: Request, res: Response) => {
    const products = await prisma.product.findMany({
      orderBy: { stock: 'asc' },
      include: { category: { select: { name: true } } },
    });
    const stockValue = products.reduce((s, p) => s + p.stock * Number(p.costPrice), 0);
    const retailValue = products.reduce((s, p) => s + p.stock * Number(p.sellingPrice), 0);
    sendSuccess(res, {
      productCount: products.length,
      stockValue,
      retailValue,
      potentialProfit: retailValue - stockValue,
      products,
    }, 'Inventory report');
  }),
);
