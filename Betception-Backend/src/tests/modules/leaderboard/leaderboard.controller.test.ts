import {
  getBalanceLeaderboard,
  getLevelLeaderboard,
  getWeeklyWinningsLeaderboard,
} from '../../../modules/leaderboard/leaderboard.controller.js';
import {
  LeaderboardBalanceView,
  LeaderboardLevelView,
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
      { userId: '3', netWinnings7d: '250.00' },
    ] as LeaderboardWeeklyWinningsView[];
    const repo = createMockRepository<LeaderboardWeeklyWinningsView>({
      findAndCount: jest.fn().mockResolvedValue([rows, 1]),
    });
    mockAppDataSourceRepositories(new Map([[LeaderboardWeeklyWinningsView, repo]]));

    const req = createMockRequest({
      query: { limit: 1, offset: 0 } as any,
    });
    const res = createMockResponse();

    await getWeeklyWinningsLeaderboard(req as any, res);

    expect(res.json).toHaveBeenCalledWith({
      total: 1,
      limit: 1,
      offset: 0,
      items: [{ rank: 1, userId: '3', netWinnings7d: 250 }],
      currentUserRank: null,
    });
  });
});
