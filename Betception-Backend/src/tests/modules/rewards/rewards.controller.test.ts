import crypto from 'crypto';
import { claimDailyReward } from '../../../modules/rewards/rewards.controller.js';
import { User } from '../../../entity/User.js';
import { DailyRewardClaim } from '../../../entity/DailyRewardClaim.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import {
  createMockRequest,
  createMockResponse,
  createMockRepository,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';

describe('rewards.controller', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('awards the daily reward and records the claim', async () => {
    const now = new Date('2025-01-01T12:00:00Z');
    jest.setSystemTime(now);
    jest.spyOn(crypto, 'randomInt').mockImplementation(() => 5); // min 200 + 5 = 205

    const user = {
      id: '1',
      balance: '100.00',
      lastDailyRewardAt: null,
    } as User;

    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockResolvedValue(undefined),
    });
    const claimRepo = createMockRepository<DailyRewardClaim>({
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue(undefined),
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

    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ lastDailyRewardAt: '2025-01-01' }));
    expect(claimRepo.save).toHaveBeenCalled();
    expect(walletRepo.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      claimedAmount: 205,
      balance: expect.any(Number),
      eligibleAt: '2025-01-02T00:00:00.000Z',
    });
  });

  it('returns 409 when the user already claimed today', async () => {
    const now = new Date('2025-01-01T12:00:00Z');
    jest.setSystemTime(now);

    const user = {
      id: '1',
      balance: '100.00',
      lastDailyRewardAt: '2025-01-01',
    } as User;

    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
    });
    const claimRepo = createMockRepository<DailyRewardClaim>();
    const walletRepo = createMockRepository<WalletTransaction>();

    const transactionRepos = new Map<any, any>();
    transactionRepos.set(User, userRepo);
    transactionRepos.set(DailyRewardClaim, claimRepo);
    transactionRepos.set(WalletTransaction, walletRepo);
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
});
