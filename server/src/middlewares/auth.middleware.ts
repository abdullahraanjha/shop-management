import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

/** Express request augmented with the authenticated user. */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Protect routes: reads the JWT from the Authorization header (Bearer) or an
 * httpOnly cookie, verifies it, and attaches the payload to req.user.
 */
export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = bearer ?? (req.cookies?.token as string | undefined);

  if (!token) return next(ApiError.unauthorized('Authentication required'));

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/** Restrict a route to specific roles (use after requireAuth). */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
