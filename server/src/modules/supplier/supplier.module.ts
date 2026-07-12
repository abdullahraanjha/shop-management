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

const supplierSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
});

export const supplierRouter = Router();
supplierRouter.use(requireAuth);

supplierRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, search, sortBy, sortOrder } = getQueryOptions(req);
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { purchaseInvoices: true } } },
      }),
      prisma.supplier.count({ where }),
    ]);
    sendSuccess(res, items, 'Suppliers', 200, buildMeta(total, page, limit));
  }),
);

supplierRouter.post(
  '/',
  validate({ body: supplierSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const supplier = await prisma.supplier.create({ data: req.body });
    sendSuccess(res, supplier, 'Supplier created', 201);
  }),
);

supplierRouter.put(
  '/:id',
  validate({ body: supplierSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, supplier, 'Supplier updated');
  }),
);

supplierRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const inUse = await prisma.purchaseInvoice.count({ where: { supplierId: req.params.id } });
    if (inUse > 0) throw ApiError.conflict('Cannot delete a supplier with purchase history');
    await prisma.supplier.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Supplier deleted');
  }),
);
