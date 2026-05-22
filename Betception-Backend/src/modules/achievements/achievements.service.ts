import { EntityManager, IsNull, Repository } from 'typeorm';
import { User } from '../../entity/User.js';
import { UserAchievement } from '../../entity/UserAchievement.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import {
  HandStatus,
  MainBetStatus,
  SideBetStatus,
  WalletTransactionKind,
} from '../../entity/enums.js';
import { centsToDecimal, decimalToCents } from '../../utils/money.js';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_CODE,
  COMPLETIONIST_ACHIEVEMENT_CODE,
  type AchievementDefinition,
  achievementTarget,
} from './achievement-definitions.js';

type AchievementProgressUpdate = {
  code: string;
  increment?: number;
  progress?: number;
};

export type SerializedAchievement = {
  code: string;
  category: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: Date | null;
  seen: boolean;
  rewardCoins: number;
  secret: boolean;
  sortOrder: number;
};

export type AchievementResolutionStep = {
  kind: string;
  status: MainBetStatus | SideBetStatus | string;
  amount: string;
  payout: string | null;
  selection: Record<string, unknown> | null;
};

export type RoundAchievementContext = {
  mainBetStatus: MainBetStatus;
  playerHandStatus: HandStatus;
  playerCardCount: number;
  splitHandCount: number;
  splitBetStatuses: MainBetStatus[];
  dealerHandStatus: HandStatus;
  sideBetResolutionSteps: AchievementResolutionStep[];
  totalStake: string;
  totalPayout: string;
  triggeredPowerupEffect: { code: string; color: string } | null;
};

const PUBLIC_SIDEBET_KINDS = new Set([
  'CARD_EXACT',
  'CARD_SUIT',
  'DEALER_BUST',
  'PILL_TRIGGER',
  'PLAYER_BLACKJACK',
  'SPLIT_COUNT',
]);

export async function listAchievementsForUser(
  userId: string,
  manager: EntityManager,
) {
  const repo = manager.getRepository(UserAchievement);
  const rows = await repo.find({
    where: { user: { id: userId } },
  });
  const rowByCode = new Map(rows.map((row) => [row.achievementCode, row]));
  const items = ACHIEVEMENTS
    .map((definition) => serializeAchievement(definition, rowByCode.get(definition.code)))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const unseenCount = items.filter((item) => item.unlocked && !item.seen).length;
  return { items, unseenCount };
}

export async function markAchievementsSeen(userId: string, manager: EntityManager) {
  const repo = manager.getRepository(UserAchievement);
  const unseenRows = await repo.find({
    where: {
      user: { id: userId },
      unlocked: true,
      seenAt: IsNull(),
    },
  });

  if (unseenRows.length > 0) {
    const now = new Date();
    for (const row of unseenRows) {
      row.seenAt = now;
    }
    await repo.save(unseenRows);
  }

  return listAchievementsForUser(userId, manager);
}

export async function evaluateRoundAchievements(
  manager: EntityManager,
  user: User,
  context: RoundAchievementContext,
): Promise<SerializedAchievement[]> {
  const updates: AchievementProgressUpdate[] = [
    { code: 'FIRST_ROUND', increment: 1 },
    { code: 'ROUND_10', increment: 1 },
    { code: 'ROUND_100', increment: 1 },
    { code: 'ROUND_500', increment: 1 },
    { code: 'LEVEL_5', progress: user.level },
    { code: 'LEVEL_10', progress: user.level },
    { code: 'LEVEL_25', progress: user.level },
  ];

  const wonMainOrSplit =
    context.mainBetStatus === MainBetStatus.WON ||
    context.splitBetStatuses.some((status) => status === MainBetStatus.WON);
  if (wonMainOrSplit) {
    updates.push(
      { code: 'FIRST_WIN', increment: 1 },
      { code: 'WIN_10', increment: 1 },
      { code: 'WIN_50', increment: 1 },
      { code: 'WIN_250', increment: 1 },
    );
  }

  if (context.playerHandStatus === HandStatus.BLACKJACK && context.playerCardCount === 2) {
    updates.push(
      { code: 'BLACKJACK_1', increment: 1 },
      { code: 'BLACKJACK_10', increment: 1 },
      { code: 'BLACKJACK_50', increment: 1 },
    );
  }

  if (context.dealerHandStatus === HandStatus.BUSTED) {
    updates.push(
      { code: 'DEALER_BUST_10', increment: 1 },
      { code: 'DEALER_BUST_50', increment: 1 },
      { code: 'DEALER_BUST_150', increment: 1 },
    );
  }

  const wonSideBetSteps = context.sideBetResolutionSteps.filter(
    (step) => PUBLIC_SIDEBET_KINDS.has(step.kind) && step.status === SideBetStatus.WON,
  );
  if (wonSideBetSteps.length > 0) {
    updates.push(
      { code: 'SIDEBET_WIN_1', increment: wonSideBetSteps.length },
      { code: 'SIDEBET_WIN_25', increment: wonSideBetSteps.length },
      { code: 'SIDEBET_WIN_100', increment: wonSideBetSteps.length },
    );
  }
  const exactCardWins = wonSideBetSteps.filter((step) => step.kind === 'CARD_EXACT').length;
  if (exactCardWins > 0) {
    updates.push({ code: 'CARD_EXACT_HIT_1', increment: exactCardWins });
  }

  const comboStep = context.sideBetResolutionSteps.find(
    (step) => step.kind === 'COMBO_BONUS' && step.status === SideBetStatus.WON,
  );
  if (comboStep) {
    updates.push({ code: 'COMBO_3', increment: 1 });
  }

  const netCents = decimalToCents(context.totalPayout) - decimalToCents(context.totalStake);
  if (netCents >= 100000n) updates.push({ code: 'NET_1000', progress: 1 });
  if (netCents >= 1000000n) updates.push({ code: 'NET_10000', progress: 1 });
  if (netCents >= 5000000n) updates.push({ code: 'NET_50000', progress: 1 });
  if (context.mainBetStatus === MainBetStatus.LOST && netCents > 0n) {
    updates.push({ code: 'SECRET_LOST_BUT_WON', progress: 1 });
  }

  if (context.splitHandCount > 0) {
    updates.push(
      { code: 'SPLIT_1', increment: 1 },
      { code: 'SPLIT_10', increment: 1 },
    );
  }
  if (context.splitHandCount >= 3) {
    updates.push({ code: 'SECRET_FOUR_HANDS', progress: 1 });
  }

  if (context.triggeredPowerupEffect) {
    if (context.triggeredPowerupEffect.code === 'RED_PILL') {
      updates.push({ code: 'SECRET_RED_PILL_HIT', progress: 1 });
    }
    if (context.triggeredPowerupEffect.code === 'BLUE_PILL') {
      updates.push({ code: 'SECRET_BLUE_PILL_SAVE', progress: 1 });
    }
  }

  const wonCategories = new Set(wonSideBetSteps.map((step) => sideBetCategory(step.kind)));
  const publicSteps = context.sideBetResolutionSteps.filter((step) => PUBLIC_SIDEBET_KINDS.has(step.kind));
  if (wonCategories.size >= 3) {
    updates.push({ code: 'SIDEBET_SWEEP_3', progress: 1 });
  }
  if (
    publicSteps.length > 0 &&
    wonCategories.size >= 5 &&
    publicSteps.every((step) => step.status === SideBetStatus.WON)
  ) {
    updates.push({ code: 'SIDEBET_SWEEP_5', progress: 1 });
    updates.push({ code: 'SECRET_CLEAN_SWEEP', progress: 1 });
  }

  return applyAchievementProgress(manager, user, updates);
}

export async function applyAchievementProgress(
  manager: EntityManager,
  user: User,
  updates: AchievementProgressUpdate[],
): Promise<SerializedAchievement[]> {
  if (updates.length === 0) return [];

  const repo = manager.getRepository(UserAchievement);
  const walletRepo = manager.getRepository(WalletTransaction);
  const rows = await repo.find({ where: { user: { id: user.id } } });
  const rowByCode = new Map(rows.map((row) => [row.achievementCode, row]));
  const combined = combineUpdates(updates);
  const unlocked: SerializedAchievement[] = [];

  for (const [code, update] of combined) {
    const definition = ACHIEVEMENT_BY_CODE.get(code);
    if (!definition) continue;
    const row = rowByCode.get(code) ?? repo.create({
      user,
      achievementCode: code,
      progress: 0,
      unlocked: false,
      unlockedAt: null,
      seenAt: null,
      rewardedAt: null,
    });
    rowByCode.set(code, row);

    const target = achievementTarget(definition);
    const nextProgress = Math.min(
      target,
      Math.max(row.progress, update.progress ?? 0, row.progress + (update.increment ?? 0)),
    );
    row.progress = nextProgress;

    if (!row.unlocked && row.progress >= target) {
      unlockAchievement(row);
      await repo.save(row);
      await grantAchievementReward(walletRepo, user, row, definition);
      unlocked.push(serializeAchievement(definition, row));
    } else {
      await repo.save(row);
    }
  }

  const completionist = await applyCompletionistProgress(repo, walletRepo, user, rowByCode);
  if (completionist) {
    unlocked.push(completionist);
  }

  return unlocked;
}

function serializeAchievement(
  definition: AchievementDefinition,
  row: UserAchievement | undefined,
): SerializedAchievement {
  const target = achievementTarget(definition);
  const progress = Math.min(target, Math.max(0, row?.progress ?? 0));
  return {
    code: definition.code,
    category: definition.category,
    titleKey: definition.titleKey,
    descriptionKey: definition.descriptionKey,
    icon: definition.icon,
    target,
    progress,
    unlocked: row?.unlocked ?? false,
    unlockedAt: row?.unlockedAt ?? null,
    seen: !row?.unlocked || !!row.seenAt,
    rewardCoins: definition.rewardCoins,
    secret: definition.secret,
    sortOrder: definition.sortOrder,
  };
}

function combineUpdates(updates: AchievementProgressUpdate[]) {
  const combined = new Map<string, AchievementProgressUpdate>();
  for (const update of updates) {
    const current = combined.get(update.code) ?? { code: update.code, increment: 0, progress: 0 };
    combined.set(update.code, {
      code: update.code,
      increment: (current.increment ?? 0) + (update.increment ?? 0),
      progress: Math.max(current.progress ?? 0, update.progress ?? 0),
    });
  }
  return combined;
}

async function applyCompletionistProgress(
  repo: Repository<UserAchievement>,
  walletRepo: Repository<WalletTransaction>,
  user: User,
  rowByCode: Map<string, UserAchievement>,
): Promise<SerializedAchievement | null> {
  const definition = ACHIEVEMENT_BY_CODE.get(COMPLETIONIST_ACHIEVEMENT_CODE);
  if (!definition) return null;

  const target = achievementTarget(definition);
  const unlockedNonMeta = [...rowByCode.entries()]
    .filter(([code, row]) => code !== COMPLETIONIST_ACHIEVEMENT_CODE && row.unlocked)
    .length;
  const row = rowByCode.get(COMPLETIONIST_ACHIEVEMENT_CODE) ?? repo.create({
    user,
    achievementCode: COMPLETIONIST_ACHIEVEMENT_CODE,
    progress: 0,
    unlocked: false,
    unlockedAt: null,
    seenAt: null,
    rewardedAt: null,
  });

  row.progress = Math.min(target, Math.max(row.progress, unlockedNonMeta));
  rowByCode.set(COMPLETIONIST_ACHIEVEMENT_CODE, row);

  if (!row.unlocked && row.progress >= target) {
    unlockAchievement(row);
    await repo.save(row);
    await grantAchievementReward(walletRepo, user, row, definition);
    return serializeAchievement(definition, row);
  }

  await repo.save(row);
  return null;
}

function unlockAchievement(row: UserAchievement) {
  const now = new Date();
  row.unlocked = true;
  row.unlockedAt = now;
  row.seenAt = null;
  row.rewardedAt = now;
}

async function grantAchievementReward(
  walletRepo: Repository<WalletTransaction>,
  user: User,
  row: UserAchievement,
  definition: AchievementDefinition,
) {
  const rewardCents = decimalToCents(definition.rewardCoins);
  if (rewardCents <= 0n) return;

  user.balance = centsToDecimal(decimalToCents(user.balance) + rewardCents);
  await walletRepo.save(
    walletRepo.create({
      user,
      kind: WalletTransactionKind.ACHIEVEMENT_REWARD,
      amount: centsToDecimal(rewardCents),
      refTable: 'user_achievements',
      refId: row.id,
    }),
  );
}

function sideBetCategory(kind: string) {
  return kind === 'CARD_EXACT' || kind === 'CARD_SUIT' ? 'CARD' : kind;
}
