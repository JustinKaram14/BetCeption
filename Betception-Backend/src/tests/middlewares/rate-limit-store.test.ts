import { AppDataSource } from '../../db/data-source.js';
import { RateLimitCounter } from '../../entity/RateLimitCounter.js';
import { TypeOrmRateLimitStore } from '../../middlewares/rateLimiters.js';

jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

jest.mock('../../utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../db/data-source.js', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

function makeRecord(overrides: Partial<RateLimitCounter> = {}): RateLimitCounter {
  return {
    key: 'test-key',
    points: 5,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  } as RateLimitCounter;
}

describe('TypeOrmRateLimitStore', () => {
  let store: TypeOrmRateLimitStore;
  let mockRepo: {
    findOne: jest.Mock;
    delete: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockManager: { getRepository: jest.Mock };

  beforeEach(() => {
    store = new TypeOrmRateLimitStore();

    const deleteQb = { execute: jest.fn() };
    const qb = { delete: jest.fn().mockReturnValue(deleteQb) };

    mockRepo = {
      findOne: jest.fn(),
      delete: jest.fn(),
      save: jest.fn().mockImplementation(async (e) => e),
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    mockManager = { getRepository: jest.fn().mockReturnValue(mockRepo) };

    jest.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as any);
    jest.mocked(AppDataSource.transaction).mockImplementation(async (cb: any) => cb(mockManager));
  });

  describe('init', () => {
    it('sets windowMs from options when it is a number', () => {
      store.init!({ windowMs: 30_000 } as any);
      expect(store.windowMs).toBe(30_000);
    });

    it('leaves windowMs unchanged when options.windowMs is not a number', () => {
      store.windowMs = 60_000;
      store.init!({} as any);
      expect(store.windowMs).toBe(60_000);
    });
  });

  describe('get', () => {
    it('returns undefined when no record is found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await store.get('key1');
      expect(result).toBeUndefined();
    });

    it('deletes an expired record and returns undefined', async () => {
      const expired = makeRecord({ expiresAt: new Date(Date.now() - 1000) });
      mockRepo.findOne.mockResolvedValue(expired);
      const result = await store.get('key1');
      expect(mockRepo.delete).toHaveBeenCalledWith({ key: 'key1' });
      expect(result).toBeUndefined();
    });

    it('returns totalHits and resetTime for a valid record', async () => {
      const record = makeRecord({ points: 7 });
      mockRepo.findOne.mockResolvedValue(record);
      const result = await store.get('key1');
      expect(result).toEqual({ totalHits: 7, resetTime: record.expiresAt });
    });
  });

  describe('increment', () => {
    it('creates a fresh record when none exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await store.increment('key1');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'key1', points: 1 }),
      );
      expect(result.totalHits).toBe(1);
    });

    it('creates a fresh record when the existing one is expired', async () => {
      const expired = makeRecord({ points: 10, expiresAt: new Date(Date.now() - 1000) });
      mockRepo.findOne.mockResolvedValue(expired);
      const result = await store.increment('key1');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'key1', points: 1 }),
      );
      expect(result.totalHits).toBe(1);
    });

    it('increments the hit count on a valid existing record', async () => {
      const existing = makeRecord({ points: 4 });
      mockRepo.findOne.mockResolvedValue(existing);
      const result = await store.increment('key1');
      expect(result.totalHits).toBe(5);
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ points: 5 }));
    });
  });

  describe('decrement', () => {
    it('does nothing when the record is not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await store.decrement('key1');
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('decrements points on an active record', async () => {
      const record = makeRecord({ points: 5 });
      mockRepo.findOne.mockResolvedValue(record);
      await store.decrement('key1');
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ points: 4 }));
    });

    it('deletes the record when points reach zero and it is expired', async () => {
      const record = makeRecord({ points: 1, expiresAt: new Date(Date.now() - 1000) });
      mockRepo.findOne.mockResolvedValue(record);
      await store.decrement('key1');
      expect(mockRepo.delete).toHaveBeenCalledWith({ key: 'key1' });
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('resetKey', () => {
    it('deletes the record by key', async () => {
      await store.resetKey('key1');
      expect(mockRepo.delete).toHaveBeenCalledWith({ key: 'key1' });
    });
  });

  describe('resetAll', () => {
    it('executes a delete-all query builder', async () => {
      await store.resetAll();
      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('is a no-op and does not throw', () => {
      expect(() => store.shutdown!()).not.toThrow();
    });
  });

  describe('repo getter', () => {
    it('rejects when AppDataSource is not initialized', async () => {
      (AppDataSource as any).isInitialized = false;
      await expect(store.get('key')).rejects.toThrow(
        'Rate limit store requires an initialized data source.',
      );
      (AppDataSource as any).isInitialized = true;
    });
  });
});
