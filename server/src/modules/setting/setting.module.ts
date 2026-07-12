import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const settingSchema = z.object({
  shopName: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

export const settingRouter = Router();
settingRouter.use(requireAuth);

/** There is a single settings row; create it lazily if missing. */
async function getOrCreate() {
  let setting = await prisma.setting.findFirst();
  if (!setting) setting = await prisma.setting.create({ data: {} });
  return setting;
}

settingRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await getOrCreate(), 'Settings');
  }),
);

settingRouter.put(
  '/',
  validate({ body: settingSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const current = await getOrCreate();
    const updated = await prisma.setting.update({ where: { id: current.id }, data: req.body });
    sendSuccess(res, updated, 'Settings updated');
  }),
);
