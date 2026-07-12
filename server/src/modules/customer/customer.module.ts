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

const customerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
});

export const customerRouter = Router();
customerRouter.use(requireAuth);

customerRouter.get(
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
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { salesInvoices: true } } },
      }),
      prisma.customer.count({ where }),
    ]);
    sendSuccess(res, items, 'Customers', 200, buildMeta(total, page, limit));
  }),
);

customerRouter.post(
  '/',
  validate({ body: customerSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await prisma.customer.create({ data: req.body });
    sendSuccess(res, customer, 'Customer created', 201);
  }),
);

customerRouter.put(
  '/:id',
  validate({ body: customerSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, customer, 'Customer updated');
  }),
);

customerRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const inUse = await prisma.salesInvoice.count({ where: { customerId: req.params.id } });
    if (inUse > 0) throw ApiError.conflict('Cannot delete a customer with sales history');
    await prisma.customer.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Customer deleted');
  }),
);
