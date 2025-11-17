import rateLimit from 'express-rate-limit';
import type { Options, Store } from 'express-rate-limit';
import type { Request } from 'express';
import { AppDataSource } from '../db/data-source.js';
import { RateLimitCounter } from '../entity/RateLimitCounter.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

class TypeOrmRateLimitStore implements Store {
  windowMs = 60_000;
  localKeys = false;

  init?(options: Options): void {
    if (typeof options.windowMs === 'number') {
      this.windowMs = options.windowMs;
    }
  }

  private get repo() {
    if (!AppDataSource.isInitialized) {
      throw new Error('Rate limit store requires an initialized data source.');
    }
    return AppDataSource.getRepository(RateLimitCounter);
  }

  async get(key: string) {
    const repo = this.repo;
    const record = await repo.findOne({ where: { key } });
    if (!record) return undefined;
    if (record.expiresAt.getTime() <= Date.now()) {
      await repo.delete({ key });
      return undefined;
    }
    return { totalHits: record.points, resetTime: record.expiresAt };
  }

  async increment(key: string) {
    const now = Date.now();
    const expiresAt = new Date(now + this.windowMs);
    return AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RateLimitCounter);
      const existing = await repo.findOne({
        where: { key },
        lock: { mode: 'pessimistic_write' },
      });

      if (!existing || existing.expiresAt.getTime() <= now) {
        const fresh = repo.create({ key, points: 1, expiresAt });
        await repo.save(fresh);
        return { totalHits: fresh.points, resetTime: fresh.expiresAt };
      }

      existing.points += 1;
      await repo.save(existing);
      return { totalHits: existing.points, resetTime: existing.expiresAt };
    });
  }

  async decrement(key: string) {
    const repo = this.repo;
    const record = await repo.findOne({ where: { key } });
    if (!record) return;

    const updatedPoints = Math.max(0, record.points - 1);
    if (updatedPoints === 0 && record.expiresAt.getTime() <= Date.now()) {
      await repo.delete({ key });
      return;
    }
    record.points = updatedPoints;
    await repo.save(record);
  }

  async resetKey(key: string) {
    await this.repo.delete({ key });
  }

  async resetAll() {
    await this.repo.createQueryBuilder().delete().execute();
  }

  shutdown?(): void {
    // no-op
  }
}

type RateLimiterConfig = {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
};

const shouldUseDistributedStore = env.nodeEnv !== 'test';

function createLimiter(config: RateLimiterConfig) {
  const store = shouldUseDistributedStore ? new TypeOrmRateLimitStore() : undefined;
  const keyGenerator =
    config.keyGenerator ??
    ((req: Request) => req.ip ?? req.headers['x-forwarded-for']?.toString() ?? 'anonymous');

  return rateLimit({
    windowMs: config.windowMs,
    limit: config.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: config.message ?? 'Too many requests, please try again later.',
    keyGenerator,
    store,
    handler: (req, res, next, options) => {
      logger.warn('rate_limit.exceeded', {
        path: req.path,
        key: keyGenerator(req),
        prefix: config.prefix,
      });
      return res.status(options.statusCode ?? 429).json({ message: 'Too many requests' });
    },
  });
}

export const globalRateLimiter = createLimiter({
  windowMs: env.rateLimit.global.windowMs,
  max: env.rateLimit.global.max,
  prefix: 'global',
});

export const loginRateLimiter = createLimiter({
  windowMs: env.rateLimit.auth.windowMs,
  max: env.rateLimit.auth.max,
  prefix: 'auth-login',
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'unknown';
    return `${req.ip ?? 'unknown'}:${email}`;
  },
});

export const refreshRateLimiter = createLimiter({
  windowMs: env.rateLimit.auth.windowMs,
  max: env.rateLimit.auth.max,
  prefix: 'auth-refresh',
  keyGenerator: (req) => {
    const token = req.cookies?.refresh_token ?? 'no-token';
    return `${req.ip ?? 'unknown'}:${token}`;
  },
});
