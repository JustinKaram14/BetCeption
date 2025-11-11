import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.flatten() });
  }

  res.status(err.status ?? 500).json({ message: err.message ?? 'Internal server error' });
}
