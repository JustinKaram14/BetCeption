import { claimDailyReward, getDailyRewardStatus } from '../../../modules/rewards/rewards.controller.js';
import { User } from '../../../entity/User.js';
import { DailyRewardClaim } from '../../../entity/DailyRewardClaim.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import { DAILY_STREAK_REWARDS } from '../../../config/rewards.js';
import {
  createMockRequest,
  createMockResponse,
  createMockRepository,
  mockAppDataSourceTransaction,
  mockAppDataSourceRepositories,
} from '../../test-utils.js';

describe('rewards.controller', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('claimDailyReward', () => {
    it('awards day-1 reward (150 coins) and records the claim', async () => {
      const now = new Date('2025-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const user = {
        id: '1',
        balance: '100.00',
        lastDailyRewardAt: null,
        loginStreak: 0,
        streakExpiresAt: null,
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const claimRepo = createMockRepository<DailyRewardClaim>({
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue({ id: '1', ...{} }),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue(undefined),
      });

      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      transactionRepos.set(DailyRewardClaim, claimRepo);
      transactionRepos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await claimDailyReward(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastDailyRewardAt: '2025-01-01',
          loginStreak: 1,
          streakExpiresAt: '2025-01-03',
        }),
      );
      expect(claimRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ streakDay: 1, amount: '150.00' }),
      );
      expect(walletRepo.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        claimedDay: 1,
        reward: DAILY_STREAK_REWARDS[0],
        claimedAmount: 150,
        balance: expect.any(Number),
        eligibleAt: '2025-01-02T00:00:00.000Z',
        loginStreak: 1,
        streakReset: false,
      });
    });

    it('resets streak and awards day-1 when streak has expired', async () => {
      const now = new Date('2025-01-05T12:00:00Z');
      jest.setSystemTime(now);

      const user = {
        id: '1',
        balance: '500.00',
        lastDailyRewardAt: '2025-01-02',
        loginStreak: 10,
        streakExpiresAt: '2025-01-04',
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const claimRepo = createMockRepository<DailyRewardClaim>({
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue({ id: '2' }),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue(undefined),
      });

      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      transactionRepos.set(DailyRewardClaim, claimRepo);
      transactionRepos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await claimDailyReward(req as any, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ claimedDay: 1, streakReset: true, loginStreak: 1 }),
      );
    });

    it('returns 409 when the user already claimed today', async () => {
      const now = new Date('2025-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const user = {
        id: '1',
        balance: '100.00',
        lastDailyRewardAt: '2025-01-01',
        loginStreak: 3,
        streakExpiresAt: '2025-01-03',
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });

      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await claimDailyReward(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reward already claimed for today',
        eligibleAt: '2025-01-02T00:00:00.000Z',
      });
    });

    it('returns 404 when the user is not found', async () => {
      const now = new Date('2025-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({ user: { sub: 'nonexistent' } as any });
      const res = createMockResponse();

      await claimDailyReward(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('getDailyRewardStatus', () => {
    it('returns status with schedule for eligible user', async () => {
      const now = new Date('2025-03-15T10:00:00Z');
      jest.setSystemTime(now);

      const user = {
        id: '1',
        lastDailyRewardAt: null,
        loginStreak: 0,
        streakExpiresAt: null,
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });

      const repoMap = new Map<any, any>();
      repoMap.set(User, userRepo);
      mockAppDataSourceRepositories(repoMap);

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await getDailyRewardStatus(req as any, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          loginStreak: 0,
          currentDay: 1,
          isEligible: true,
          eligibleAt: null,
          streakReset: false,
          schedule: DAILY_STREAK_REWARDS,
        }),
      );
    });

    it('returns ineligible status when already claimed today', async () => {
      const now = new Date('2025-03-15T10:00:00Z');
      jest.setSystemTime(now);

      const user = {
        id: '1',
        lastDailyRewardAt: '2025-03-15',
        loginStreak: 5,
        streakExpiresAt: '2025-03-17',
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });

      const repoMap = new Map<any, any>();
      repoMap.set(User, userRepo);
      mockAppDataSourceRepositories(repoMap);

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await getDailyRewardStatus(req as any, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          loginStreak: 5,
          currentDay: 6,
          isEligible: false,
          eligibleAt: '2025-03-16T00:00:00.000Z',
        }),
      );
    });
  });
});

