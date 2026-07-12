import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { isProd } from '../config/env.js';

/**
 * Global error handler — the single place that converts any thrown error into
 * a consistent JSON response. Handles ApiError, Zod validation errors, and
 * known Prisma errors; everything else becomes a 500.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Zod validation error → 400 with field details
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
  }

  // Known Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return res.status(409).json({ success: false, message: `Duplicate value for ${target}` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({ success: false, message: 'Related record constraint failed' });
    }
  }

  // Our own operational errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // Unknown / programmer error
  console.error('💥 Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(isProd ? {} : { error: err instanceof Error ? err.message : String(err) }),
  });
}
