import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { isProd } from '../../config/env.js';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { authService } from './auth.service.js';

const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await authService.register(req.body);
    res.cookie('token', token, cookieOpts);
    sendSuccess(res, { user, token }, 'Registered successfully', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await authService.login(req.body);
    res.cookie('token', token, cookieOpts);
    sendSuccess(res, { user, token }, 'Logged in successfully');
  }),

  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.me(req.user!.sub);
    sendSuccess(res, { user }, 'Current user');
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('token');
    sendSuccess(res, null, 'Logged out successfully');
  }),
};
