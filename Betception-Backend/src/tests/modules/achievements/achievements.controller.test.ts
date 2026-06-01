import {
  claimOwnAchievementReward,
  listOwnAchievements,
  markOwnAchievementsSeen,
} from '../../../modules/achievements/achievements.controller.js';
import { User } from '../../../entity/User.js';
import { UserAchievement } from '../../../entity/UserAchievement.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import {
  createMockRepository,
  createMockRequest,
  createMockResponse,
  mockAppDataSourceRepositories,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';

describe('achievements.controller', () => {
  const row = {
    id: 'ua-1',
    achievementCode: 'FIRST_ROUND',
    progress: 1,
    unlocked: true,
    unlockedAt: new Date('2026-01-01T00:00:00Z'),
    seenAt: null,
    rewardedAt: new Date('2026-01-01T00:00:00Z'),
  } as UserAchievement;

  it('returns 401 when listing achievements without an authenticated user', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await listOwnAchievements(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthenticated',
      code: 'UNAUTHENTICATED',
    });
  });

  it('lists achievements for the authenticated user', async () => {
    const repo = createMockRepository<UserAchievement>({
      find: jest.fn().mockResolvedValue([row]),
    });
    mockAppDataSourceRepositories(new Map([[UserAchievement, repo]]));
    const req = createMockRequest({ user: { sub: 'user-1' } as any });
    const res = createMockResponse();

    await listOwnAchievements(req, res);

    expect(repo.find).toHaveBeenCalledWith({ where: { user: { id: 'user-1' } } });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        unseenCount: expect.any(Number),
        items: expect.arrayContaining([
          expect.objectContaining({ code: 'FIRST_ROUND', unlocked: true }),
        ]),
      }),
    );
  });

  it('returns 401 when marking achievements seen without an authenticated user', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await markOwnAchievementsSeen(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthenticated',
      code: 'UNAUTHENTICATED',
    });
  });

  it('marks unseen achievements as seen and returns the refreshed list', async () => {
    const repo = createMockRepository<UserAchievement>({
      find: jest
        .fn()
        .mockResolvedValueOnce([row])
        .mockResolvedValueOnce([{ ...row, seenAt: new Date('2026-01-02T00:00:00Z') }]),
      save: jest.fn().mockResolvedValue(undefined),
    });
    mockAppDataSourceRepositories(new Map([[UserAchievement, repo]]));
    const req = createMockRequest({ user: { sub: 'user-1' } as any });
    const res = createMockResponse();

    await markOwnAchievementsSeen(req, res);

    expect(repo.save).toHaveBeenCalledWith([expect.objectContaining({ seenAt: expect.any(Date) })]);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        unseenCount: 0,
        items: expect.arrayContaining([
          expect.objectContaining({ code: 'FIRST_ROUND', seen: true }),
        ]),
      }),
    );
  });

  it('returns 401 when claiming an achievement reward without an authenticated user', async () => {
    const req = createMockRequest({ params: { code: 'FIRST_ROUND' } });
    const res = createMockResponse();

    await claimOwnAchievementReward(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthenticated',
      code: 'UNAUTHENTICATED',
    });
  });

  it('claims an achievement reward for the authenticated user', async () => {
    const claimableRow = {
      ...row,
      rewardedAt: null,
    } as UserAchievement;
    const user = { id: 'user-1', balance: '100.00' } as User;
    const achievementRepo = createMockRepository<UserAchievement>({
      findOne: jest.fn().mockResolvedValue(claimableRow),
      find: jest.fn().mockResolvedValue([claimableRow]),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const walletRepo = createMockRepository<WalletTransaction>({
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    mockAppDataSourceTransaction(new Map<any, any>([
      [UserAchievement, achievementRepo],
      [User, userRepo],
      [WalletTransaction, walletRepo],
    ]));
    const req = createMockRequest({
      user: { sub: 'user-1' } as any,
      params: { code: 'FIRST_ROUND' },
    });
    const res = createMockResponse();

    await claimOwnAchievementReward(req, res);

    expect(user.balance).toBe('150.00');
    expect(walletRepo.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: 150,
        rewardCoins: 50,
        achievement: expect.objectContaining({
          code: 'FIRST_ROUND',
          rewardClaimed: true,
        }),
      }),
    );
  });

  it('returns a localized-safe error code when the reward was already claimed', async () => {
    const achievementRepo = createMockRepository<UserAchievement>({
      findOne: jest.fn().mockResolvedValue(row),
    });
    mockAppDataSourceTransaction(new Map<any, any>([[UserAchievement, achievementRepo]]));
    const req = createMockRequest({
      user: { sub: 'user-1' } as any,
      params: { code: 'FIRST_ROUND' },
    });
    const res = createMockResponse();

    await claimOwnAchievementReward(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Achievement reward already claimed',
      code: 'ACHIEVEMENT_REWARD_ALREADY_CLAIMED',
    });
  });
});
