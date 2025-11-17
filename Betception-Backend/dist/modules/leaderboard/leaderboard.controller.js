import { AppDataSource } from '../../db/data-source.js';
import { LeaderboardBalanceView } from '../../entity/LeaderboardBalanceView.js';
import { LeaderboardLevelView } from '../../entity/LeaderboardLevelView.js';
import { LeaderboardWeeklyWinningsView } from '../../entity/LeaderboardWeeklyWinningsView.js';
async function respondWithLeaderboard(req, res, options) {
    const { limit, offset } = req.query;
    const repo = AppDataSource.getRepository(options.entity);
    const [rows, total] = await repo.findAndCount({
        order: options.order,
        take: limit,
        skip: offset,
    });
    const items = rows.map((row, idx) => ({
        rank: offset + idx + 1,
        ...options.mapRow(row),
    }));
    const currentUserId = req.user?.sub ? String(req.user.sub) : null;
    const currentItem = currentUserId
        ? rows.find((row) => options.getUserId(row) === currentUserId)
        : null;
    const currentUserRank = currentItem
        ? offset + rows.indexOf(currentItem) + 1
        : null;
    return res.json({
        total,
        limit,
        offset,
        items,
        currentUserRank,
    });
}
export function getBalanceLeaderboard(req, res) {
    return respondWithLeaderboard(req, res, {
        entity: LeaderboardBalanceView,
        order: { balance: 'DESC' },
        mapRow: (row) => ({
            userId: row.userId,
            username: row.username,
            balance: row.balance,
        }),
        getUserId: (row) => row.userId,
    });
}
export function getLevelLeaderboard(req, res) {
    return respondWithLeaderboard(req, res, {
        entity: LeaderboardLevelView,
        order: { level: 'DESC', xp: 'DESC' },
        mapRow: (row) => ({
            userId: row.userId,
            username: row.username,
            level: row.level,
            xp: row.xp,
        }),
        getUserId: (row) => row.userId,
    });
}
export function getWeeklyWinningsLeaderboard(req, res) {
    return respondWithLeaderboard(req, res, {
        entity: LeaderboardWeeklyWinningsView,
        order: { netWinnings7d: 'DESC' },
        mapRow: (row) => ({
            userId: row.userId,
            netWinnings7d: row.netWinnings7d,
        }),
        getUserId: (row) => row.userId,
    });
}
