import type { Achievement } from '../../core/api/api.types';
import { buildAchievementDisplayItems } from './achievement-display';

function achievement(
  code: string,
  target: number,
  progress: number,
  unlocked = false,
): Achievement {
  return {
    code,
    category: 'progression',
    titleKey: `achievement.${code}.title`,
    descriptionKey: `achievement.${code}.description`,
    icon: 'cards',
    target,
    progress,
    unlocked,
    unlockedAt: unlocked ? '2026-01-01T00:00:00Z' : null,
    seen: true,
    rewardCoins: target,
    rewardClaimable: unlocked,
    rewardClaimed: false,
    rewardedAt: null,
    secret: false,
    sortOrder: target,
  };
}

describe('buildAchievementDisplayItems', () => {
  it('groups tiered achievements into one star-progress item', () => {
    const items = buildAchievementDisplayItems([
      achievement('ROUND_10', 10, 10, true),
      achievement('ROUND_100', 100, 24),
      achievement('ROUND_500', 500, 24),
    ]);

    expect(items.length).toBe(1);
    expect(items[0]).toEqual(jasmine.objectContaining({
      code: 'GROUP_ROUNDS',
      completedTiers: 1,
      displayProgress: 24,
      displayTarget: 100,
      unlocked: false,
      displayTitleKey: 'achievement.ROUND_100.title',
      displayDescriptionKey: 'achievement.ROUND_100.description',
    }));
    expect(items[0].tiers.map((tier) => tier.target)).toEqual([10, 100, 500]);
  });

  it('groups dealer bust achievements into one three-star item', () => {
    const items = buildAchievementDisplayItems([
      achievement('DEALER_BUST_10', 10, 10, true),
      achievement('DEALER_BUST_50', 50, 18),
      achievement('DEALER_BUST_150', 150, 18),
    ]);

    expect(items.length).toBe(1);
    expect(items[0]).toEqual(jasmine.objectContaining({
      code: 'GROUP_DEALER_BUSTS',
      completedTiers: 1,
      displayProgress: 18,
      displayTarget: 50,
      unlocked: false,
      displayTitleKey: 'achievement.DEALER_BUST_50.title',
      displayDescriptionKey: 'achievement.DEALER_BUST_50.description',
    }));
    expect(items[0].tiers.map((tier) => tier.target)).toEqual([10, 50, 150]);
  });

  it('keeps standalone achievements untouched', () => {
    const items = buildAchievementDisplayItems([
      achievement('FIRST_ROUND', 1, 1, true),
    ]);

    expect(items.length).toBe(1);
    expect(items[0]).toEqual(jasmine.objectContaining({
      code: 'FIRST_ROUND',
      completedTiers: 1,
      displayProgress: 1,
      displayTarget: 1,
      unlocked: true,
    }));
  });
});
