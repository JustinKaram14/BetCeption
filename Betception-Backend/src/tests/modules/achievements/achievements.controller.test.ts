import {
  listOwnAchievements,
  markOwnAchievementsSeen,
} from '../../../modules/achievements/achievements.controller.js';
import { UserAchievement } from '../../../entity/UserAchievement.js';
import {
  createMockRepository,
  createMockRequest,
  createMockResponse,
  mockAppDataSourceRepositories,
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
});
