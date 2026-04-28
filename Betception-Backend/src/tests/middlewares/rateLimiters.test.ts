import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  globalRateLimiter,
  loginRateLimiter,
  refreshRateLimiter,
} from '../../middlewares/rateLimiters.js';
import { createMockNext, createMockRequest, createMockResponse } from '../test-utils.js';

jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: jest.fn((options: unknown) => {
    const middleware: any = jest.fn();
    middleware.options = options;
    return middleware;
  }),
}));

jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  standardHeaders: string;
  legacyHeaders: boolean;
  message: string;
  keyGenerator: (req: any) => string;
  store?: unknown;
  handler: (req: any, res: any, next: any, options: { statusCode?: number }) => unknown;
};

describe('rateLimiters middleware', () => {
  const limiterMocks = jest.mocked(rateLimit).mock.results.map((entry) => entry.value as any);
  const globalOptions = limiterMocks[0]?.options as RateLimitOptions;
  const loginOptions = limiterMocks[1]?.options as RateLimitOptions;
  const refreshOptions = limiterMocks[2]?.options as RateLimitOptions;

  beforeEach(() => {
    jest.mocked(logger.warn).mockReset();
  });

  it('creates the global limiter with environment defaults and no store in test mode', () => {
    expect(globalRateLimiter).toBeDefined();
    expect(globalOptions.windowMs).toBe(env.rateLimit.global.windowMs);
    expect(globalOptions.limit).toBe(env.rateLimit.global.max);
    expect(globalOptions.store).toBeUndefined();
    expect(globalOptions.standardHeaders).toBe('draft-7');
    expect(globalOptions.legacyHeaders).toBe(false);
  });

  it('uses ip plus lower-cased email as the login limiter key', () => {
    const key = loginOptions.keyGenerator(
      createMockRequest({
        ip: '127.0.0.1',
        body: { email: 'Neo@Matrix.io' } as any,
      }),
    );

    expect(loginRateLimiter).toBeDefined();
    expect(key).toBe('127.0.0.1:neo@matrix.io');
  });

  it('falls back to unknown when the login request has no email', () => {
    const key = loginOptions.keyGenerator(
      createMockRequest({
        ip: '127.0.0.1',
        body: {},
      }),
    );

    expect(key).toBe('127.0.0.1:unknown');
  });

  it('uses ip plus refresh token as the refresh limiter key', () => {
    const key = refreshOptions.keyGenerator(
      createMockRequest({
        ip: '127.0.0.1',
        cookies: { refresh_token: 'refresh-123' } as any,
      }),
    );

    expect(refreshRateLimiter).toBeDefined();
    expect(key).toBe('127.0.0.1:refresh-123');
  });

  it('falls back to no-token when the refresh token cookie is missing', () => {
    const key = refreshOptions.keyGenerator(
      createMockRequest({
        ip: '127.0.0.1',
        cookies: {},
      }),
    );

    expect(key).toBe('127.0.0.1:no-token');
  });

  it('returns 429 and logs when the limiter handler is triggered', () => {
    const req = createMockRequest({ ip: '127.0.0.1', path: '/auth/login' });
    const res = createMockResponse();
    const next = createMockNext();

    loginOptions.handler(req, res, next, { statusCode: 429 });

    expect(logger.warn).toHaveBeenCalledWith('rate_limit.exceeded', {
      path: '/auth/login',
      key: '127.0.0.1:unknown',
      prefix: 'auth-login',
    });
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ message: 'Too many requests' });
  });
});
