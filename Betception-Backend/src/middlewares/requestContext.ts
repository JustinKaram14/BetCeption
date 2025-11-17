import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { trackRequestStart, trackRequestEnd } from '../observability/metrics.js';

export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime.bigint();
  const requestId =
    (req.headers['x-request-id'] as string | undefined) ?? randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  trackRequestStart();

  logger.info('request.start', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;
    trackRequestEnd(res.statusCode, durationMs);
    logger.info('request.complete', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(3)),
    });
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      trackRequestEnd(499, Number((process.hrtime.bigint() - start)) / 1_000_000);
      logger.warn('request.aborted', { requestId, path: req.originalUrl });
    }
  });

  next();
}
