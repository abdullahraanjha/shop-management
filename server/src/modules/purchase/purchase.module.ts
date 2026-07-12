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

const purchaseSchema = z.object({
  supplierId: z.string().uuid().optional().nullable(),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        unitCost: z.coerce.number().min(0),
      }),
    )
    .min(1, 'At least one item is required'),
});

export const purchaseRouter = Router();
purchaseRouter.use(requireAuth);

// List purchase invoices
purchaseRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, search, sortBy, sortOrder } = getQueryOptions(req);
    const where: Prisma.PurchaseInvoiceWhereInput = search
      ? { invoiceNo: { contains: search, mode: 'insensitive' } }
      : {};
    const [items, total] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { supplier: { select: { name: true } }, _count: { select: { items: true } } },
      }),
      prisma.purchaseInvoice.count({ where }),
    ]);
    sendSuccess(res, items, 'Purchase invoices', 200, buildMeta(total, page, limit));
  }),
);

// Single invoice with line items
purchaseRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, items: { include: { product: { select: { name: true, sku: true } } } } },
    });
    if (!invoice) throw ApiError.notFound('Purchase invoice not found');
    sendSuccess(res, invoice, 'Purchase invoice');
  }),
);

/**
 * Create a purchase invoice.
 * ── Automatic inventory rule ──
 * Inside ONE transaction: create the invoice + items, increase each product's
 * stock, refresh its costPrice to the latest purchase cost, and append a
 * PURCHASE movement to the ledger. All-or-nothing.
 */
purchaseRouter.post(
  '/',
  validate({ body: purchaseSchema }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body as z.infer<typeof purchaseSchema>;
    const userId = req.user!.sub;

    const invoice = await prisma.$transaction(async (tx) => {
      // Validate products exist
      const productIds = body.items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== new Set(productIds).size) {
        throw ApiError.badRequest('One or more products do not exist');
      }

      const subTotal = body.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
      const total = subTotal - body.discount + body.tax;
      const paymentStatus =
        body.paidAmount >= total ? 'PAID' : body.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

      const created = await tx.purchaseInvoice.create({
        data: {
          invoiceNo: await nextInvoiceNo(tx, 'PUR', new Date().getFullYear()),
          supplierId: body.supplierId ?? null,
          userId,
          subTotal,
          discount: body.discount,
          tax: body.tax,
          total,
          paidAmount: body.paidAmount,
          paymentStatus,
          note: body.note ?? null,
          items: {
            create: body.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitCost: i.unitCost,
              lineTotal: i.quantity * i.unitCost,
            })),
          },
        },
      });

      // Increase stock, refresh cost, write ledger entry per item
      for (const item of body.items) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, costPrice: item.unitCost },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE',
            quantity: item.quantity,
            balance: updated.stock,
            reference: created.invoiceNo,
            userId,
          },
        });
      }

      return created;
    });

    const full = await prisma.purchaseInvoice.findUnique({
      where: { id: invoice.id },
      include: { supplier: true, items: { include: { product: { select: { name: true } } } } },
    });
    sendSuccess(res, full, 'Purchase recorded — stock updated automatically', 201);
  }),
);
