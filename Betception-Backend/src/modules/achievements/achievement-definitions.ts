export type AchievementCategory =
  | 'starter'
  | 'blackjack'
  | 'betception'
  | 'progression'
  | 'secret'
  | 'meta';

export type AchievementIcon =
  | 'chip'
  | 'trophy'
  | 'ace'
  | 'cards'
  | 'target'
  | 'calendar'
  | 'medal'
  | 'spark'
  | 'crosshair'
  | 'signal'
  | 'skull'
  | 'vault'
  | 'gem'
  | 'shield'
  | 'mask'
  | 'flame'
  | 'bolt'
  | 'split'
  | 'pill'
  | 'star'
  | 'crown'
  | 'orbit';

export type AchievementDefinition = {
  code: string;
  category: AchievementCategory;
  titleKey: string;
  descriptionKey: string;
  icon: AchievementIcon;
  target: number;
  rewardCoins: number;
  secret: boolean;
  sortOrder: number;
};

export const COMPLETIONIST_ACHIEVEMENT_CODE = 'COMPLETIONIST';

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  def('FIRST_ROUND', 'starter', 'chip', 1, 50, 10),
  def('FIRST_WIN', 'starter', 'trophy', 1, 100, 20),
  def('ROUND_10', 'starter', 'cards', 10, 200, 30),
  def('ROUND_100', 'progression', 'calendar', 100, 1500, 40),
  def('ROUND_500', 'progression', 'signal', 500, 7500, 50),
  def('WIN_10', 'blackjack', 'trophy', 10, 400, 60),
  def('WIN_50', 'blackjack', 'medal', 50, 2500, 70),
  def('WIN_250', 'blackjack', 'crown', 250, 12000, 80),
  def('BLACKJACK_1', 'blackjack', 'ace', 1, 250, 90),
  def('BLACKJACK_10', 'blackjack', 'spark', 10, 1500, 100),
  def('BLACKJACK_50', 'blackjack', 'gem', 50, 8000, 110),
  def('DEALER_BUST_10', 'blackjack', 'skull', 10, 600, 120),
  def('DEALER_BUST_50', 'blackjack', 'flame', 50, 3500, 130),
  def('DEALER_BUST_150', 'blackjack', 'bolt', 150, 9000, 135),
  def('SIDEBET_WIN_1', 'betception', 'crosshair', 1, 250, 140),
  def('SIDEBET_WIN_25', 'betception', 'target', 25, 2500, 150),
  def('SIDEBET_WIN_100', 'betception', 'orbit', 100, 10000, 160),
  def('CARD_EXACT_HIT_1', 'betception', 'target', 1, 600, 165),
  def('COMBO_3', 'betception', 'orbit', 1, 2000, 170),
  def('SIDEBET_SWEEP_3', 'betception', 'spark', 1, 3000, 175),
  def('SIDEBET_SWEEP_5', 'betception', 'crown', 1, 15000, 176),
  def('NET_1000', 'betception', 'vault', 1, 500, 180),
  def('NET_10000', 'betception', 'bolt', 1, 4000, 190),
  def('NET_50000', 'betception', 'crown', 1, 15000, 200),
  def('SPLIT_1', 'blackjack', 'split', 1, 300, 210),
  def('SPLIT_10', 'blackjack', 'cards', 10, 2000, 220),
  def('PILL_TRIGGER_1', 'betception', 'pill', 1, 300, 230),
  def('LEVEL_5', 'progression', 'star', 10, 700, 240),
  def('LEVEL_10', 'progression', 'signal', 50, 2500, 250),
  def('LEVEL_25', 'progression', 'crown', 100, 10000, 260),
  def('SECRET_RED_PILL_HIT', 'secret', 'spark', 1, 777, 270, true),
  def('SECRET_BLUE_PILL_SAVE', 'secret', 'shield', 1, 777, 280, true),
  def('SECRET_FOUR_HANDS', 'secret', 'target', 1, 2500, 290, true),
  def('SECRET_CLEAN_SWEEP', 'secret', 'gem', 1, 8000, 300, true),
  def('SECRET_LOST_BUT_WON', 'secret', 'mask', 1, 1200, 310, true),
  {
    code: COMPLETIONIST_ACHIEVEMENT_CODE,
    category: 'meta',
    titleKey: 'achievement.COMPLETIONIST.title',
    descriptionKey: 'achievement.COMPLETIONIST.description',
    icon: 'star',
    target: 0,
    rewardCoins: 35000,
    secret: false,
    sortOrder: 999,
  },
] as const;

export const ACHIEVEMENT_BY_CODE = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.code, achievement]),
);

export function achievementTarget(definition: AchievementDefinition): number {
  if (definition.code === COMPLETIONIST_ACHIEVEMENT_CODE) {
    return ACHIEVEMENTS.length - 1;
  }
  return definition.target;
}

function def(
  code: string,
  category: AchievementCategory,
  icon: AchievementIcon,
  target: number,
  rewardCoins: number,
  sortOrder: number,
  secret = false,
): AchievementDefinition {
  return {
    code,
    category,
    titleKey: `achievement.${code}.title`,
    descriptionKey: `achievement.${code}.description`,
    icon,
    target,
    rewardCoins,
    secret,
    sortOrder,
  };
}
