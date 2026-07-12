import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { getQueryOptions, buildMeta } from '../../utils/pagination.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth, type AuthRequest } from '../../middlewares/auth.middleware.js';

const expenseSchema = z.object({
  title: z.string().min(2, 'Title is too short'),
  category: z.string().default('General'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  note: z.string().optional().nullable(),
  spentAt: z.coerce.date().optional(),
});

export const expenseRouter = Router();
expenseRouter.use(requireAuth);

expenseRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, search, sortBy, sortOrder } = getQueryOptions(req, 'spentAt');
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.expense.count({ where }),
    ]);
    sendSuccess(res, items, 'Expenses', 200, buildMeta(total, page, limit));
  }),
);

expenseRouter.post(
  '/',
  validate({ body: expenseSchema }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const expense = await prisma.expense.create({ data: { ...req.body, userId: req.user!.sub } });
    sendSuccess(res, expense, 'Expense recorded', 201);
  }),
);

expenseRouter.put(
  '/:id',
  validate({ body: expenseSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, expense, 'Expense updated');
  }),
);

expenseRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.expense.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Expense deleted');
  }),
);
