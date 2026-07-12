import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { getQueryOptions, buildMeta } from '../../utils/pagination.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth, type AuthRequest } from '../../middlewares/auth.middleware.js';
import { nextInvoiceNo } from '../../utils/invoiceNumber.js';

// NOTE: cost price is intentionally NOT part of the input. It is read from the
// product at sale time. Only the selling price (unitPrice) is entered manually.
const salesSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().min(0), // selling price, manual
      }),
    )
    .min(1, 'At least one item is required'),
});

export const salesRouter = Router();
salesRouter.use(requireAuth);

// List sales invoices
salesRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, search, sortBy, sortOrder } = getQueryOptions(req);
    const where: Prisma.SalesInvoiceWhereInput = search
      ? { invoiceNo: { contains: search, mode: 'insensitive' } }
      : {};
    const [items, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
      }),
      prisma.salesInvoice.count({ where }),
    ]);
    sendSuccess(res, items, 'Sales invoices', 200, buildMeta(total, page, limit));
  }),
);

// Single invoice (used for printing)
salesRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });
    if (!invoice) throw ApiError.notFound('Sales invoice not found');
    sendSuccess(res, invoice, 'Sales invoice');
  }),
);

/**
 * Create a sales invoice.
 * ── Automatic inventory + profit rule ──
 * Inside ONE transaction: verify stock, SNAPSHOT the product's current costPrice
 * onto each line, compute lineProfit = (unitPrice - costPrice) * qty, decrease
 * stock, and append a SALE movement. The invoice stores totalProfit for fast
 * dashboard reads. All-or-nothing.
 */
salesRouter.post(
  '/',
  validate({ body: salesSchema }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body as z.infer<typeof salesSchema>;
    const userId = req.user!.sub;

    const invoice = await prisma.$transaction(async (tx) => {
      const productIds = body.items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate existence + sufficient stock BEFORE any mutation
      for (const item of body.items) {
        const product = productMap.get(item.productId);
        if (!product) throw ApiError.badRequest(`Product ${item.productId} does not exist`);
        if (product.stock < item.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for "${product.name}" (have ${product.stock}, need ${item.quantity})`,
          );
        }
      }

      // Build line items with snapshotted cost + computed profit
      const lines = body.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const costPrice = Number(product.costPrice);
        const lineTotal = item.quantity * item.unitPrice;
        const lineProfit = (item.unitPrice - costPrice) * item.quantity;
        return { ...item, costPrice, lineTotal, lineProfit };
      });

      const subTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      const total = subTotal - body.discount + body.tax;
      const totalProfit = lines.reduce((s, l) => s + l.lineProfit, 0) - body.discount;
      const paymentStatus =
        body.paidAmount >= total ? 'PAID' : body.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

      const created = await tx.salesInvoice.create({
        data: {
          invoiceNo: await nextInvoiceNo(tx, 'SAL', new Date().getFullYear()),
          customerId: body.customerId ?? null,
          userId,
          subTotal,
          discount: body.discount,
          tax: body.tax,
          total,
          totalProfit,
          paidAmount: body.paidAmount,
          paymentStatus,
          note: body.note ?? null,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              costPrice: l.costPrice,
              lineTotal: l.lineTotal,
              lineProfit: l.lineProfit,
            })),
          },
        },
      });

      // Decrease stock + ledger entry per item
      for (const item of body.items) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            balance: updated.stock,
            reference: created.invoiceNo,
            userId,
          },
        });
      }

      return created;
    });

    const full = await prisma.salesInvoice.findUnique({
      where: { id: invoice.id },
      include: {
        customer: true,
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });
    sendSuccess(res, full, 'Sale recorded — stock reduced and profit calculated automatically', 201);
  }),
);
