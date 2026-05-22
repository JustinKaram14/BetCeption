import {
  getBalanceLeaderboard,
  getLevelLeaderboard,
  getWeeklyWinningsLeaderboard,
} from '../../../modules/leaderboard/leaderboard.controller.js';
import {
  LeaderboardAlltimeWinningsView,
  LeaderboardBalanceView,
  LeaderboardLevelView,
  LeaderboardWeeklyBalanceView,
  LeaderboardWeeklyLevelView,
  LeaderboardWeeklyWinningsView,
} from '../../../entity/index.js';
import {
  createMockRequest,
  createMockResponse,
  createMockRepository,
  mockAppDataSourceRepositories,
} from '../../test-utils.js';

describe('leaderboard.controller', () => {
  it('returns balance leaderboard data with current user rank', async () => {
    const rows = [
      { userId: '1', username: 'alpha', balance: '100.00' },
      { userId: '2', username: 'beta', balance: '90.00' },
    ] as LeaderboardBalanceView[];
    const repo = createMockRepository<LeaderboardBalanceView>({
      findAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
    });
    mockAppDataSourceRepositories(new Map([[LeaderboardBalanceView, repo]]));

    const req = createMockRequest({
      query: { limit: 10, offset: 0 } as any,
      user: { sub: '1' } as any,
    });
    const res = createMockResponse();

    await getBalanceLeaderboard(req as any, res);

    expect(res.json).toHaveBeenCalledWith({
      total: 2,
      limit: 10,
      offset: 0,
      items: [
        { rank: 1, userId: '1', username: 'alpha', balance: 100 },
        { rank: 2, userId: '2', username: 'beta', balance: 90 },
      ],
      currentUserRank: 1,
    });
  });

  it('returns level leaderboard data', async () => {
    const rows = [
      { userId: '1', username: 'alpha', level: 5, xp: 100 },
    ] as LeaderboardLevelView[];
    const repo = createMockRepository<LeaderboardLevelView>({
      findAndCount: jest.fn().mockResolvedValue([rows, 1]),
    });
    mockAppDataSourceRepositories(new Map([[LeaderboardLevelView, repo]]));

    const req = createMockRequest({
      query: { limit: 5, offset: 5 } as any,
    });
    const res = createMockResponse();

    await getLevelLeaderboard(req as any, res);

    expect(res.json).toHaveBeenCalledWith({
      total: 1,
      limit: 5,
      offset: 5,
      items: [{ rank: 6, userId: '1', username: 'alpha', level: 5, xp: 100 }],
      currentUserRank: null,
    });
  });

  it('returns weekly winnings leaderboard data', async () => {
    const rows = [
      { userId: '3', username: 'gamma', netWinnings7d: '250.00' },
    ] as LeaderboardWeeklyWinningsView[];
    const repo = createMockRepository<LeaderboardWeeklyWinningsView>({
      findAndCount: jest.fn().mockResolvedValue([rows, 1]),
    });
    mockAppDataSourceRepositories(new Map([[LeaderboardWeeklyWinningsView, repo]]));

    const req = createMockRequest({
      query: { limit: 1, offset: 0, period: 'seven_days' } as any,
    });
    const res = createMockResponse();

    await getWeeklyWinningsLeaderboard(req as any, res);

    expect(res.json).toHaveBeenCalledWith({
      total: 1,
      limit: 1,
      offset: 0,
      items: [{ rank: 1, userId: '3', username: 'gamma', netWinnings7d: 250 }],
      currentUserRank: null,
    });
  });

  it('returns weekly balance leaderboard data when period is seven_days', async () => {
    const rows = [
      { userId: '4', username: 'delta', balance7d: '75.00' },
    ] as LeaderboardWeeklyBalanceView[];
    const repo = createMockRepository<LeaderboardWeeklyBalanceView>({
      findAndCount: jest.fn().mockResolvedValue([rows, 1]),
    });
    mockAppDataSourceRepositories(new Map([[LeaderboardWeeklyBalanceView, repo]]));

    const req = createMockRequest({
      query: { limit: 5, offset: 0, period: 'seven_days' } as any,
    });
    const res = createMockResponse();

    await getBalanceLeaderboard(req as any, res);

    expect(repo.findAndCount).toHaveBeenCalledWith({
      order: { balance7d: 'DESC' },
      take: 5,
      skip: 0,
    });
    expect(res.json).toHaveBeenCalledWith({
      total: 1,
      limit: 5,
      offset: 0,
      items: [{ rank: 1, userId: '4', username: 'delta', balance7d: 75 }],
      currentUserRank: null,
    });
  });

  it('returns weekly level leaderboard data when period is seven_days', async () => {
    const rows = [
      { userId: '5', username: 'echo', xp7d: 420 },
    ] as LeaderboardWeeklyLevelView[];
    const repo = createMockRepository<LeaderboardWeeklyLevelView>({
      findAndCount: jest.fn().mockResolvedValue([rows, 1]),
    });
    mockAppDataSourceRepositories(new Map([[LeaderboardWeeklyLevelView, repo]]));

    const req = createMockRequest({
      query: { limit: 5, offset: 0, period: 'seven_days' } as any,
    });
    const res = createMockResponse();

    await getLevelLeaderboard(req as any, res);

    expect(repo.findAndCount).toHaveBeenCalledWith({
      order: { xp7d: 'DESC' },
      take: 5,
      skip: 0,
    });
    expect(res.json).toHaveBeenCalledWith({
      total: 1,
      limit: 5,
      offset: 0,
      items: [{ rank: 1, userId: '5', username: 'echo', xp7d: 420 }],
      currentUserRank: null,
    });
  });

  it('returns all-time winnings leaderboard data by default', async () => {
    const rows = [
      { userId: '6', username: 'foxtrot', netWinnings: '500.00' },
    ] as LeaderboardAlltimeWinningsView[];
    const repo = createMockRepository<LeaderboardAlltimeWinningsView>({
      findAndCount: jest.fn().mockResolvedValue([rows, 1]),
    });
    mockAppDataSourceRepositories(new Map([[LeaderboardAlltimeWinningsView, repo]]));

    const req = createMockRequest({
      query: { limit: 5, offset: 0 } as any,
    });
    const res = createMockResponse();

    await getWeeklyWinningsLeaderboard(req as any, res);

    expect(repo.findAndCount).toHaveBeenCalledWith({
      order: { netWinnings: 'DESC' },
      take: 5,
      skip: 0,
    });
    expect(res.json).toHaveBeenCalledWith({
      total: 1,
      limit: 5,
      offset: 0,
      items: [{ rank: 1, userId: '6', username: 'foxtrot', netWinnings: 500 }],
      currentUserRank: null,
    });
  });
});
