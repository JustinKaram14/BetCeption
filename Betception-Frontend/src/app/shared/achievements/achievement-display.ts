import type { Achievement, AchievementIcon } from '../../core/api/api.types';

export type AchievementTier = {
  code: string;
  target: number;
  progress: number;
  unlocked: boolean;
  rewardCoins: number;
  rewardClaimable: boolean;
  rewardClaimed: boolean;
  rewardedAt: string | null;
};

export type AchievementDisplayItem = Achievement & {
  tiers: AchievementTier[];
  completedTiers: number;
  currentTier: AchievementTier;
  displayTitleKey: string;
  displayDescriptionKey: string;
  displayTarget: number;
  displayProgress: number;
};

type TierGroup = {
  code: string;
  codes: string[];
  titleKey: string;
  descriptionKey: string;
  icon: AchievementIcon;
  sortOrder: number;
};

const TIER_GROUPS: TierGroup[] = [
  {
    code: 'GROUP_ROUNDS',
    codes: ['ROUND_10', 'ROUND_100', 'ROUND_500'],
    titleKey: 'achievement.GROUP_ROUNDS.title',
    descriptionKey: 'achievement.GROUP_ROUNDS.description',
    icon: 'calendar',
    sortOrder: 30,
  },
  {
    code: 'GROUP_WINS',
    codes: ['WIN_10', 'WIN_50', 'WIN_250'],
    titleKey: 'achievement.GROUP_WINS.title',
    descriptionKey: 'achievement.GROUP_WINS.description',
    icon: 'medal',
    sortOrder: 60,
  },
  {
    code: 'GROUP_BLACKJACKS',
    codes: ['BLACKJACK_1', 'BLACKJACK_10', 'BLACKJACK_50'],
    titleKey: 'achievement.GROUP_BLACKJACKS.title',
    descriptionKey: 'achievement.GROUP_BLACKJACKS.description',
    icon: 'ace',
    sortOrder: 90,
  },
  {
    code: 'GROUP_SIDEBETS',
    codes: ['SIDEBET_WIN_1', 'SIDEBET_WIN_25', 'SIDEBET_WIN_100'],
    titleKey: 'achievement.GROUP_SIDEBETS.title',
    descriptionKey: 'achievement.GROUP_SIDEBETS.description',
    icon: 'crosshair',
    sortOrder: 140,
  },
  {
    code: 'GROUP_DEALER_BUSTS',
    codes: ['DEALER_BUST_10', 'DEALER_BUST_50', 'DEALER_BUST_150'],
    titleKey: 'achievement.GROUP_DEALER_BUSTS.title',
    descriptionKey: 'achievement.GROUP_DEALER_BUSTS.description',
    icon: 'skull',
    sortOrder: 120,
  },
  {
    code: 'GROUP_LEVELS',
    codes: ['LEVEL_5', 'LEVEL_10', 'LEVEL_25'],
    titleKey: 'achievement.GROUP_LEVELS.title',
    descriptionKey: 'achievement.GROUP_LEVELS.description',
    icon: 'signal',
    sortOrder: 240,
  },
];

const GROUPED_CODES = new Set(TIER_GROUPS.flatMap((group) => group.codes));

export function buildAchievementDisplayItems(
  achievements: readonly Achievement[],
): AchievementDisplayItem[] {
  const byCode = new Map(achievements.map((achievement) => [achievement.code, achievement]));
  const grouped = TIER_GROUPS
    .map((group) => buildTierGroup(group, byCode))
    .filter((item): item is AchievementDisplayItem => !!item);

  const singles = achievements
    .filter((achievement) => !GROUPED_CODES.has(achievement.code))
    .map((achievement) => toSingleDisplayItem(achievement));

  return [...singles, ...grouped].sort((a, b) => a.sortOrder - b.sortOrder);
}

function buildTierGroup(
  group: TierGroup,
  byCode: Map<string, Achievement>,
): AchievementDisplayItem | null {
  const rawTiers = group.codes
    .map((code) => byCode.get(code))
    .filter((achievement): achievement is Achievement => !!achievement);

  if (rawTiers.length === 0) {
    return null;
  }

  const tiers = rawTiers.map(toTier);
  const completedTiers = tiers.filter((tier) => tier.unlocked).length;
  const currentTier = tiers.find((tier) => !tier.unlocked) ?? tiers[tiers.length - 1];
  const claimableTier = tiers.find((tier) => tier.rewardClaimable);
  const progress = Math.max(...tiers.map((tier) => tier.progress));
  const latestUnlocked = [...rawTiers].reverse().find((achievement) => achievement.unlocked);
  const first = rawTiers[0];
  const displayTier = tiers.find((tier) => !tier.unlocked) ?? tiers[tiers.length - 1];

  return {
    ...first,
    code: group.code,
    titleKey: group.titleKey,
    descriptionKey: group.descriptionKey,
    displayTitleKey: `achievement.${displayTier.code}.title`,
    displayDescriptionKey: `achievement.${displayTier.code}.description`,
    icon: group.icon,
    target: tiers[tiers.length - 1].target,
    progress,
    unlocked: completedTiers === tiers.length,
    unlockedAt: latestUnlocked?.unlockedAt ?? null,
    seen: rawTiers.every((achievement) => !achievement.unlocked || achievement.seen),
    rewardCoins: claimableTier?.rewardCoins ?? currentTier.rewardCoins,
    rewardClaimable: tiers.some((tier) => tier.rewardClaimable),
    rewardClaimed: completedTiers > 0 && tiers.filter((tier) => tier.unlocked).every((tier) => tier.rewardClaimed),
    rewardedAt: latestUnlocked?.rewardedAt ?? null,
    secret: false,
    sortOrder: group.sortOrder,
    tiers,
    completedTiers,
    currentTier,
    displayTarget: currentTier.target,
    displayProgress: Math.min(progress, currentTier.target),
  };
}

function toSingleDisplayItem(achievement: Achievement): AchievementDisplayItem {
  const tier = toTier(achievement);
  return {
    ...achievement,
    tiers: [tier],
    displayTitleKey: `achievement.${achievement.code}.title`,
    displayDescriptionKey: `achievement.${achievement.code}.description`,
    completedTiers: achievement.unlocked ? 1 : 0,
    currentTier: tier,
    displayTarget: achievement.target,
    displayProgress: achievement.progress,
  };
}

function toTier(achievement: Achievement): AchievementTier {
  return {
    code: achievement.code,
    target: achievement.target,
    progress: achievement.progress,
    unlocked: achievement.unlocked,
    rewardCoins: achievement.rewardCoins,
    rewardClaimable: achievement.rewardClaimable,
    rewardClaimed: achievement.rewardClaimed,
    rewardedAt: achievement.rewardedAt,
  };
}
