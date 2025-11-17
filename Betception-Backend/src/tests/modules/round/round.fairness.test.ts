import { roundTestUtils } from '../../../modules/round/round.controller.js';

describe('round.controller fairness helpers', () => {
  it('buildSeededDeck returns deterministic order for the same seed', () => {
    const deckA = roundTestUtils.buildSeededDeck('seed-123');
    const deckB = roundTestUtils.buildSeededDeck('seed-123');
    const deckC = roundTestUtils.buildSeededDeck('other-seed');

    expect(deckA).toEqual(deckB);
    expect(deckA).not.toEqual(deckC);
    expect(deckA).toHaveLength(52);
  });

  it('drawCardFromSeed respects deck order and uniqueness', () => {
    const seed = 'seed-xyz';
    const used = new Set<string>();
    const expectedDeck = roundTestUtils.buildSeededDeck(seed);

    const drawnCards = expectedDeck.map(() =>
      roundTestUtils.drawCardFromSeed(seed, used),
    );

    expect(drawnCards).toEqual(expectedDeck);
    expect(() => roundTestUtils.drawCardFromSeed(seed, used)).toThrow(
      'No cards left in the deck',
    );
  });

  it('drawCardFromSeed throws when seed is missing', () => {
    expect(() =>
      roundTestUtils.drawCardFromSeed(null as unknown as string, new Set()),
    ).toThrow('Round is missing a server seed');
  });
});
