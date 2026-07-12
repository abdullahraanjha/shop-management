import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { getQueryOptions, buildMeta } from '../../utils/pagination.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const categorySchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  description: z.string().optional().nullable(),
});

export const categoryRouter = Router();
categoryRouter.use(requireAuth);

// List (with search + pagination + sorting)
categoryRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, search, sortBy, sortOrder } = getQueryOptions(req);
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { products: true } } },
      }),
      prisma.category.count({ where }),
    ]);

    sendSuccess(res, items, 'Categories', 200, buildMeta(total, page, limit));
  }),
);

// Create
categoryRouter.post(
  '/',
  validate({ body: categorySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const category = await prisma.category.create({ data: req.body });
    sendSuccess(res, category, 'Category created', 201);
  }),
);

// Update
categoryRouter.put(
  '/:id',
  validate({ body: categorySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, category, 'Category updated');
  }),
);

// Delete
categoryRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const inUse = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (inUse > 0) throw ApiError.conflict('Cannot delete a category that still has products');
    await prisma.category.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Category deleted');
  }),
);
