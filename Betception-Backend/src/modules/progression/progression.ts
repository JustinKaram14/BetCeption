import { HandStatus, MainBetStatus, SideBetStatus } from '../../entity/enums.js';
import { User } from '../../entity/User.js';
import { decimalToCents } from '../../utils/money.js';

const BASE_LEVEL_XP = 500;
const LEVEL_XP_GROWTH = 175;

export type LevelProgress = {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
};

export type RoundXpContext = {
  mainBetStatus: MainBetStatus;
  playerHandStatus: HandStatus;
  wonSideBets: number;
  splitHandCount?: number;
  wonSplitHands?: number;
  dealerBust?: boolean;
  triggeredPowerup?: boolean;
  totalStake?: string;
  totalPayout?: string;
};

export function totalXpForLevel(level: number) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  let total = 0;
  for (let currentLevel = 1; currentLevel < normalizedLevel; currentLevel += 1) {
    total += xpRequiredForLevel(currentLevel);
  }
  return total;
}

export function xpRequiredForLevel(level: number) {
  return BASE_LEVEL_XP + Math.max(0, Math.floor(level) - 1) * LEVEL_XP_GROWTH;
}

export function levelFromXp(xp: number) {
  const normalizedXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (normalizedXp >= totalXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function buildLevelProgress(user: Pick<User, 'xp' | 'level'>): LevelProgress {
  const xp = Math.max(0, Math.floor(user.xp ?? 0));
  const level = Math.max(1, Math.floor(user.level ?? levelFromXp(xp)));
  const currentLevelXp = totalXpForLevel(level);
  const nextLevelXp = totalXpForLevel(level + 1);
  const levelSpan = Math.max(1, nextLevelXp - currentLevelXp);
  const xpIntoLevel = Math.max(0, Math.min(levelSpan, xp - currentLevelXp));
  const xpToNextLevel = Math.max(0, nextLevelXp - xp);

  return {
    level,
    xp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent: Math.round((xpIntoLevel / levelSpan) * 1000) / 10,
  };
}

export function awardRoundXp(user: User, context: RoundXpContext) {
  const xpGained = calculateRoundXp(context);
  user.xp = Math.max(0, Math.floor(user.xp ?? 0)) + xpGained;
  user.level = Math.max(Math.max(1, Math.floor(user.level ?? 1)), levelFromXp(user.xp));

  return {
    xpGained,
    progress: buildLevelProgress(user),
  };
}

export function calculateRoundXp(context: RoundXpContext) {
  let xp = 25;

  if (context.mainBetStatus === MainBetStatus.WON) {
    xp += context.playerHandStatus === HandStatus.BLACKJACK ? 85 : 60;
  } else if (context.mainBetStatus === MainBetStatus.PUSH) {
    xp += 30;
  } else if (context.mainBetStatus === MainBetStatus.REFUNDED) {
    xp += 15;
  }

  const splitHandCount = Math.max(0, Math.floor(context.splitHandCount ?? 0));
  const wonSplitHands = Math.max(0, Math.floor(context.wonSplitHands ?? 0));
  xp += splitHandCount * 20;
  xp += wonSplitHands * 25;
  if (splitHandCount >= 3) xp += 100;
  if (splitHandCount >= 3 && wonSplitHands >= splitHandCount) xp += 100;

  if (context.dealerBust) xp += 40;
  if (context.triggeredPowerup) xp += 35;

  xp += netWinXp(context.totalStake, context.totalPayout);
  xp += Math.max(0, context.wonSideBets) * 15;
  return xp;
}

export function countWonSideBets(sideBetStatuses: SideBetStatus[]) {
  return sideBetStatuses.filter((status) => status === SideBetStatus.WON).length;
}

function netWinXp(totalStake?: string, totalPayout?: string) {
  if (!totalStake || !totalPayout) return 0;
  const stakeCents = decimalToCents(totalStake);
  const payoutCents = decimalToCents(totalPayout);
  if (stakeCents <= 0n || payoutCents <= stakeCents) return 0;

  const netCents = payoutCents - stakeCents;
  const scaledRatio = Number((netCents * 100n) / stakeCents) / 100;
  if (scaledRatio >= 10) return 220;
  if (scaledRatio >= 5) return 140;
  if (scaledRatio >= 2) return 75;
  if (scaledRatio >= 1) return 40;
  return 0;
}
