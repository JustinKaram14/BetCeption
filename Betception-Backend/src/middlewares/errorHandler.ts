import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    logger.warn('request.validation_failed', { path: req.path, errors: err.flatten() });
    return res.status(400).json({ errors: err.flatten() });
  }

  const status =
    typeof (err as any)?.status === 'number' && (err as any).status >= 400 && (err as any).status < 600
      ? (err as any).status
      : 500;

  const payload = {
    path: req.path,
    method: req.method,
    statusCode: status,
  };

  if (status >= 500) {
    logger.error('request.unhandled_error', { ...payload, error: err });
    return res.status(500).json({ message: 'Internal server error' });
  }

  logger.warn('request.handled_error', { ...payload, error: err });
  return res.status(status).json({ message: (err as any)?.message ?? 'Request failed' });
}
