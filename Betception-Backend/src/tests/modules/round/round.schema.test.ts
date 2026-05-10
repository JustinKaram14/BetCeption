import { CardRank, CardSuit } from '../../../entity/enums.js';
import { StartRoundSchema } from '../../../modules/round/round.schema.js';

function cardExactSideBets(count: number) {
  const suits = Object.values(CardSuit);
  const ranks = Object.values(CardRank);

  return Array.from({ length: count }, (_, index) => ({
    typeCode: 'CARD_EXACT',
    amount: 1,
    predictedSuit: suits[index % suits.length],
    predictedRank: ranks[index % ranks.length],
  }));
}

describe('StartRoundSchema', () => {
  it('allows betting on every card plus every Betception sidebet type', () => {
    const result = StartRoundSchema.safeParse({
      betAmount: 25,
      sideBets: [
        ...cardExactSideBets(52),
        ...Object.values(CardSuit).map((suit) => ({ typeCode: 'CARD_SUIT', amount: 1, predictedSuit: suit })),
        { typeCode: 'DEALER_BUST', amount: 1 },
        { typeCode: 'PILL_TRIGGER', amount: 1 },
        { typeCode: 'PLAYER_BLACKJACK', amount: 1 },
        { typeCode: 'SPLIT_COUNT', amount: 1, selection: { splitCount: 1 } },
        { typeCode: 'SPLIT_COUNT', amount: 1, selection: { splitCount: 2 } },
        { typeCode: 'SPLIT_COUNT', amount: 1, selection: { splitCount: 3 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('still rejects excessive sidebet payloads', () => {
    const result = StartRoundSchema.safeParse({
      betAmount: 25,
      sideBets: [
        ...cardExactSideBets(62),
        { typeCode: 'DEALER_BUST', amount: 1 },
        { typeCode: 'PILL_TRIGGER', amount: 1 },
        { typeCode: 'PLAYER_BLACKJACK', amount: 1 },
      ],
    });

    expect(result.success).toBe(false);
  });
});
