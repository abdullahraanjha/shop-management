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
import { requireAuth } from '../../middlewares/auth.middleware.js';

const productSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')).nullable(),
  description: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockAt: z.coerce.number().int().min(0).default(10),
  unit: z.string().default('pcs'),
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const productRouter = Router();
productRouter.use(requireAuth);

// List — searchable by name / SKU / barcode
productRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, search, sortBy, sortOrder } = getQueryOptions(req);
    const lowStockOnly = req.query.lowStock === 'true';

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(req.query.categoryId ? { categoryId: String(req.query.categoryId) } : {}),
    };

    let items = await prisma.product.findMany({
      where,
      skip: lowStockOnly ? undefined : skip,
      take: lowStockOnly ? undefined : limit,
      orderBy: { [sortBy]: sortOrder },
      include: { category: { select: { id: true, name: true } } },
    });

    // Low-stock is a computed comparison (stock <= lowStockAt), filtered in app code
    if (lowStockOnly) items = items.filter((p) => p.stock <= p.lowStockAt);

    const total = lowStockOnly ? items.length : await prisma.product.count({ where });
    sendSuccess(res, items, 'Products', 200, buildMeta(total, page, limit));
  }),
);

// Single product
productRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!product) throw ApiError.notFound('Product not found');
    sendSuccess(res, product, 'Product');
  }),
);

// Create
productRouter.post(
  '/',
  validate({ body: productSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (data.imageUrl === '') data.imageUrl = null;
    const product = await prisma.product.create({ data });
    sendSuccess(res, product, 'Product created', 201);
  }),
);

// Update
productRouter.put(
  '/:id',
  validate({ body: productSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (data.imageUrl === '') data.imageUrl = null;
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    sendSuccess(res, product, 'Product updated');
  }),
);

// Delete — block if referenced by any invoice (history integrity), else remove
productRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const [purchases, sales] = await Promise.all([
      prisma.purchaseItem.count({ where: { productId: req.params.id } }),
      prisma.salesItem.count({ where: { productId: req.params.id } }),
    ]);
    if (purchases > 0 || sales > 0) {
      // Soft-delete to preserve transaction history
      await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
      return sendSuccess(res, null, 'Product has history — deactivated instead of deleted');
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Product deleted');
  }),
);
