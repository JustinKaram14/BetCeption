import type { EntityManager } from 'typeorm';
import { User } from '../../../entity/User.js';
import { UserAchievement } from '../../../entity/UserAchievement.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import { HandStatus, MainBetStatus, SideBetStatus, WalletTransactionKind } from '../../../entity/enums.js';
import {
  applyAchievementProgress,
  evaluateRoundAchievements,
  listAchievementsForUser,
  markAchievementsSeen,
} from '../../../modules/achievements/achievements.service.js';
import { ACHIEVEMENTS } from '../../../modules/achievements/achievement-definitions.js';
import { createMockRepository } from '../../test-utils.js';

function createManager(repositories: Map<any, any>): EntityManager {
  return {
    getRepository: (entity: any) => {
      const repo = repositories.get(entity);
      if (!repo) throw new Error(`No mock repository registered for ${entity.name}`);
      return repo;
    },
  } as unknown as EntityManager;
}

describe('achievements.service', () => {
  it('lists every achievement with saved progress and unseen count', async () => {
    const row = {
      id: 'achievement-1',
      achievementCode: 'FIRST_ROUND',
      progress: 1,
      unlocked: true,
      unlockedAt: new Date('2026-01-01T00:00:00Z'),
      seenAt: null,
      rewardedAt: new Date('2026-01-01T00:00:00Z'),
    } as UserAchievement;
    const achievementRepo = createMockRepository<UserAchievement>({
      find: jest.fn().mockResolvedValue([row]),
    });
    const manager = createManager(new Map([[UserAchievement, achievementRepo]]));

    const result = await listAchievementsForUser('user-1', manager);

    expect(result.items).toHaveLength(ACHIEVEMENTS.length);
    expect(result.unseenCount).toBe(1);
    expect(result.items[0]).toEqual(expect.objectContaining({
      code: 'FIRST_ROUND',
      progress: 1,
      unlocked: true,
      seen: false,
    }));
  });

  it('marks unlocked achievements as seen', async () => {
    const row = {
      id: 'achievement-1',
      achievementCode: 'FIRST_ROUND',
      progress: 1,
      unlocked: true,
      unlockedAt: new Date('2026-01-01T00:00:00Z'),
      seenAt: null,
    } as UserAchievement;
    const achievementRepo = createMockRepository<UserAchievement>({
      find: jest.fn()
        .mockResolvedValueOnce([row])
        .mockResolvedValueOnce([row]),
      save: jest.fn().mockResolvedValue([row]),
    });
    const manager = createManager(new Map([[UserAchievement, achievementRepo]]));

    await markAchievementsSeen('user-1', manager);

    expect(row.seenAt).toEqual(expect.any(Date));
    expect(achievementRepo.save).toHaveBeenCalledWith([row]);
  });

  it('unlocks achievements and writes a coin reward transaction', async () => {
    const user = { id: 'user-1', balance: '100.00' } as User;
    const achievementRepo = createMockRepository<UserAchievement>({
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((data) => ({ id: `row-${data.achievementCode}`, ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const walletRepo = createMockRepository<WalletTransaction>({
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const manager = createManager(new Map<any, any>([
      [UserAchievement, achievementRepo],
      [WalletTransaction, walletRepo],
    ]));

    const unlocked = await applyAchievementProgress(manager, user, [{ code: 'FIRST_ROUND', increment: 1 }]);

    expect(unlocked.map((achievement) => achievement.code)).toContain('FIRST_ROUND');
    expect(user.balance).toBe('150.00');
    expect(walletRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      kind: WalletTransactionKind.ACHIEVEMENT_REWARD,
      amount: '50.00',
      refTable: 'user_achievements',
    }));
  });

  it('evaluates round context and unlocks secret lost-but-positive achievement', async () => {
    const user = { id: 'user-1', balance: '100.00', level: 1 } as User;
    const achievementRepo = createMockRepository<UserAchievement>({
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((data) => ({ id: `row-${data.achievementCode}`, ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const walletRepo = createMockRepository<WalletTransaction>({
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const manager = createManager(new Map<any, any>([
      [UserAchievement, achievementRepo],
      [WalletTransaction, walletRepo],
    ]));

    const unlocked = await evaluateRoundAchievements(manager, user, {
      mainBetStatus: MainBetStatus.LOST,
      playerHandStatus: HandStatus.STOOD,
      playerCardCount: 3,
      splitHandCount: 0,
      splitBetStatuses: [],
      dealerHandStatus: HandStatus.STOOD,
      sideBetResolutionSteps: [
        {
          kind: 'CARD_SUIT',
          status: SideBetStatus.WON,
          amount: '25.00',
          payout: '75.00',
          selection: { suit: 'HEARTS' },
        },
      ],
      totalStake: '100.00',
      totalPayout: '150.00',
      triggeredPowerupEffect: null,
    });

    expect(unlocked.map((achievement) => achievement.code)).toEqual(expect.arrayContaining([
      'FIRST_ROUND',
      'SIDEBET_WIN_1',
      'SECRET_LOST_BUT_WON',
    ]));
  });

  it('tracks exact-card sidebets and category sweeps', async () => {
    const user = { id: 'user-1', balance: '100.00', level: 1 } as User;
    const achievementRepo = createMockRepository<UserAchievement>({
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((data) => ({ id: `row-${data.achievementCode}`, ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const walletRepo = createMockRepository<WalletTransaction>({
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const manager = createManager(new Map<any, any>([
      [UserAchievement, achievementRepo],
      [WalletTransaction, walletRepo],
    ]));

    const unlocked = await evaluateRoundAchievements(manager, user, {
      mainBetStatus: MainBetStatus.WON,
      playerHandStatus: HandStatus.STOOD,
      playerCardCount: 3,
      splitHandCount: 0,
      splitBetStatuses: [],
      dealerHandStatus: HandStatus.STOOD,
      sideBetResolutionSteps: [
        {
          kind: 'CARD_EXACT',
          status: SideBetStatus.WON,
          amount: '25.00',
          payout: '300.00',
          selection: { rank: 'A', suit: 'SPADES' },
        },
        {
          kind: 'DEALER_BUST',
          status: SideBetStatus.WON,
          amount: '25.00',
          payout: '80.00',
          selection: null,
        },
        {
          kind: 'PLAYER_BLACKJACK',
          status: SideBetStatus.WON,
          amount: '25.00',
          payout: '100.00',
          selection: null,
        },
      ],
      totalStake: '100.00',
      totalPayout: '600.00',
      triggeredPowerupEffect: null,
    });

    expect(unlocked.map((achievement) => achievement.code)).toEqual(expect.arrayContaining([
      'CARD_EXACT_HIT_1',
      'SIDEBET_SWEEP_3',
    ]));
  });

  it('unlocks the all-category sidebet sweep when every public category wins', async () => {
    const user = { id: 'user-1', balance: '100.00', level: 1 } as User;
    const achievementRepo = createMockRepository<UserAchievement>({
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((data) => ({ id: `row-${data.achievementCode}`, ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const walletRepo = createMockRepository<WalletTransaction>({
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
    });
    const manager = createManager(new Map<any, any>([
      [UserAchievement, achievementRepo],
      [WalletTransaction, walletRepo],
    ]));
    const wonStep = (kind: string) => ({
      kind,
      status: SideBetStatus.WON,
      amount: '25.00',
      payout: '100.00',
      selection: null,
    });

    const unlocked = await evaluateRoundAchievements(manager, user, {
      mainBetStatus: MainBetStatus.WON,
      playerHandStatus: HandStatus.BLACKJACK,
      playerCardCount: 2,
      splitHandCount: 0,
      splitBetStatuses: [],
      dealerHandStatus: HandStatus.BUSTED,
      sideBetResolutionSteps: [
        wonStep('CARD_EXACT'),
        wonStep('DEALER_BUST'),
        wonStep('PILL_TRIGGER'),
        wonStep('PLAYER_BLACKJACK'),
        wonStep('SPLIT_COUNT'),
      ],
      totalStake: '150.00',
      totalPayout: '2000.00',
      triggeredPowerupEffect: null,
    });

    expect(unlocked.map((achievement) => achievement.code)).toEqual(expect.arrayContaining([
      'SIDEBET_SWEEP_5',
      'SECRET_CLEAN_SWEEP',
    ]));
  });
});
