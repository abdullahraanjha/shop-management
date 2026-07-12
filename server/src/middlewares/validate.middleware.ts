import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Validate a request against a Zod schema shaped as { body?, query?, params? }.
 * Parsed (and coerced) values replace the originals so controllers get clean,
 * typed data. Any failure is thrown and handled by the global error handler.
 */
export const validate =
  (schema: { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) Object.assign(req.query, schema.query.parse(req.query));
      if (schema.params) Object.assign(req.params, schema.params.parse(req.params));
      next();
    } catch (err) {
      next(err);
    }
  };
