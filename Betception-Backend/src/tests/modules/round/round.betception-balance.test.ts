import { roundTestUtils } from '../../../modules/round/round.controller.js';
import { CardRank, CardSuit, SideBetStatus } from '../../../entity/enums.js';

describe('Betception balancing', () => {
  const {
    calculateBetceptionComboBonus,
    calculateBetceptionOdds,
    validateBetceptionStakeCaps,
  } = roundTestUtils;

  it('calculates probability-based odds for the public Betception side bets', () => {
    expect(calculateBetceptionOdds({ code: 'CARD_EXACT', selection: { suit: CardSuit.HEARTS, rank: CardRank.JACK } })).toBe('24.000');
    expect(calculateBetceptionOdds({ code: 'CARD_SUIT', selection: { suit: CardSuit.HEARTS } })).toBe('1.960');
    expect(calculateBetceptionOdds({ code: 'DEALER_BUST' })).toBe('3.820');
    expect(calculateBetceptionOdds({ code: 'PLAYER_BLACKJACK' })).toBe('19.000');
    expect(calculateBetceptionOdds({ code: 'PILL_TRIGGER', activePowerupCode: 'RED_PILL' })).toBe('10.500');
    expect(calculateBetceptionOdds({ code: 'PILL_TRIGGER', activePowerupCode: 'BLUE_PILL' })).toBe('14.000');
    expect(calculateBetceptionOdds({ code: 'SPLIT_COUNT', selection: { splitCount: 1 } })).toBe('6.050');
    expect(calculateBetceptionOdds({ code: 'SPLIT_COUNT', selection: { splitCount: 2 } })).toBe('29.500');
    expect(calculateBetceptionOdds({ code: 'SPLIT_COUNT', selection: { splitCount: 3 } })).toBe('144.000');
  });

  it('rejects total and category sidebet exposure above the configured main-bet caps', () => {
    expect(validateBetceptionStakeCaps(10000n, [
      { type: { code: 'CARD_EXACT' }, amountCents: 10000n },
      { type: { code: 'DEALER_BUST' }, amountCents: 6000n },
    ])).toEqual({ ok: true });

    expect(validateBetceptionStakeCaps(10000n, [
      { type: { code: 'CARD_EXACT' }, amountCents: 20100n },
    ])).toEqual(expect.objectContaining({ ok: false, code: 'SIDEBET_TOTAL_LIMIT' }));

    expect(validateBetceptionStakeCaps(10000n, [
      { type: { code: 'DEALER_BUST' }, amountCents: 6100n },
    ])).toEqual(expect.objectContaining({ ok: false, code: 'SIDEBET_CATEGORY_LIMIT' }));
  });

  it('adds a controlled combo bonus only when multiple Betception categories hit', () => {
    const combo = calculateBetceptionComboBonus([
      {
        kind: 'CARD_EXACT',
        status: SideBetStatus.WON,
        amountCents: 100n,
        payoutCents: 2400n,
        selection: { suit: CardSuit.HEARTS, rank: CardRank.JACK },
      },
      {
        kind: 'DEALER_BUST',
        status: SideBetStatus.WON,
        amountCents: 100n,
        payoutCents: 382n,
        selection: { target: 'DEALER', outcome: 'BUST' },
      },
      {
        kind: 'CARD_SUIT',
        status: SideBetStatus.LOST,
        amountCents: 100n,
        payoutCents: 0n,
        selection: { suit: CardSuit.HEARTS },
      },
    ]);

    expect(combo.wonCategories).toEqual(['CARD', 'DEALER_BUST']);
    expect(combo.rarityScore).toBeGreaterThan(4);
    expect(combo.bonusRate).toBeGreaterThan(0);
    expect(combo.bonusCents).toBeGreaterThan(0n);
  });
});

