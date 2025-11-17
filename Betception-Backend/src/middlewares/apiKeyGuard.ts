import type { NextFunction, Request, Response } from 'express';

type ApiKeyGuardOptions = {
  headerName?: string;
};

export function apiKeyGuard(expectedKey: string, options?: ApiKeyGuardOptions) {
  const headerName = options?.headerName ?? 'x-api-key';

  return (req: Request, res: Response, next: NextFunction) => {
    const headerValue = req.header(headerName);
    const queryValue = typeof req.query.api_key === 'string' ? req.query.api_key : undefined;
    const provided = headerValue ?? queryValue;

    if (!provided || provided !== expectedKey) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    return next();
  };
}
