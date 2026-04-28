import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

type ApiKeyGuardOptions = {
  headerName?: string;
};

export function apiKeyGuard(expectedKey: string, options?: ApiKeyGuardOptions) {
  const headerName = options?.headerName ?? 'x-api-key';
  const expectedBuf = Buffer.from(expectedKey);

  return (req: Request, res: Response, next: NextFunction) => {
    const headerValue = req.header(headerName);
    const queryValue = typeof req.query.api_key === 'string' ? req.query.api_key : undefined;
    const provided = headerValue ?? queryValue;

    if (!provided) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const providedBuf = Buffer.from(provided);
    const keysMatch =
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (!keysMatch) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    return next();
  };
}
