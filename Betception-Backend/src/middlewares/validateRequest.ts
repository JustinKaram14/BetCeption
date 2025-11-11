import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validates the specified request segment against a Zod schema.
 * Sanitized data overwrites the original request segment to keep downstream handlers typed.
 */
export function validateRequest<T extends ZodTypeAny>(schema: T, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse((req as Record<ValidationTarget, unknown>)[target]);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }

    (req as Record<ValidationTarget, unknown>)[target] = result.data;
    next();
  };
}

