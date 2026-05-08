import { roundTestUtils } from '../../../modules/round/round.controller.js';
import {
  CardRank,
  CardSuit,
  HandOwnerType,
  HandStatus,
  MainBetStatus,
  SideBetColor,
  SideBetStatus,
  SideBetTargetContext,
} from '../../../entity/enums.js';
import type { Card } from '../../../entity/Card.js';
import type { Hand } from '../../../entity/Hand.js';

// ─── Minimal factories (no TypeORM instantiation needed for pure functions) ───

function card(rank: CardRank, suit: CardSuit = CardSuit.SPADES, drawOrder = 0): Card {
  return { rank, suit, drawOrder } as unknown as Card;
}

function hand(cards: Card[], status: HandStatus, ownerType = HandOwnerType.PLAYER, userId?: string): Hand & { cards: Card[] } {
  return {
    cards,
    status,
    handValue: null,
    ownerType,
    user: userId ? { id: userId } : null,
  } as unknown as Hand & { cards: Card[] };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateHand', () => {
  const { evaluateHand } = roundTestUtils;

  it('returns zero totals for an empty hand', () => {
    expect(evaluateHand([])).toEqual({ total: 0, isSoft: false, isBlackjack: false });
  });

  it('detects a two-card blackjack (ACE + TEN-value)', () => {
    const result = evaluateHand([card(CardRank.ACE), card(CardRank.TEN)]);
    expect(result).toEqual({ total: 21, isSoft: true, isBlackjack: true });
  });

  it('treats ACE + KING as a blackjack', () => {
    const result = evaluateHand([card(CardRank.ACE), card(CardRank.KING)]);
    expect(result.isBlackjack).toBe(true);
    expect(result.total).toBe(21);
  });

  it('counts ACE as 11 (soft) when it does not bust the hand', () => {
    const result = evaluateHand([card(CardRank.ACE), card(CardRank.SEVEN)]);
    expect(result).toEqual({ total: 18, isSoft: true, isBlackjack: false });
  });

  it('reduces an ACE from 11 to 1 when the hand would bust', () => {
    // ACE(11) + KING(10) + ACE(11) = 32 → reduce first ACE → 22 → reduce second → 12
    const result = evaluateHand([
      card(CardRank.ACE, CardSuit.SPADES, 0),
      card(CardRank.KING, CardSuit.SPADES, 1),
      card(CardRank.ACE, CardSuit.HEARTS, 2),
    ]);
    expect(result).toEqual({ total: 12, isSoft: false, isBlackjack: false });
  });

  it('handles two number cards with no aces', () => {
    const result = evaluateHand([card(CardRank.TEN), card(CardRank.NINE)]);
    expect(result).toEqual({ total: 19, isSoft: false, isBlackjack: false });
  });

  it('handles two face cards (KING + QUEEN)', () => {
    const result = evaluateHand([card(CardRank.KING), card(CardRank.QUEEN)]);
    expect(result).toEqual({ total: 20, isSoft: false, isBlackjack: false });
  });

  it('produces a soft-21 with three cards (ACE + ACE + 9) — not a blackjack', () => {
    // ACE(11) + ACE(11) + 9 = 31 → reduce → 21 with 1 soft ace remaining
    const result = evaluateHand([
      card(CardRank.ACE, CardSuit.SPADES, 0),
      card(CardRank.ACE, CardSuit.HEARTS, 1),
      card(CardRank.NINE, CardSuit.CLUBS, 2),
    ]);
    expect(result).toEqual({ total: 21, isSoft: true, isBlackjack: false });
  });

  it('totals pure number cards correctly', () => {
    const result = evaluateHand([
      card(CardRank.TWO),
      card(CardRank.THREE),
      card(CardRank.FOUR),
    ]);
    expect(result).toEqual({ total: 9, isSoft: false, isBlackjack: false });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('resolveMainBet', () => {
  const { resolveMainBet } = roundTestUtils;

  // NOTE: resolveMainBet calls recalcHand internally, which OVERWRITES hand.status
  // based on the cards provided. Hands must carry the correct cards to produce
  // the intended post-recalc status.

  it('returns LOST when the player busts', () => {
    // TEN(10) + EIGHT(8) + SEVEN(7) = 25 → recalcHand sets BUSTED
    const player = hand(
      [card(CardRank.TEN), card(CardRank.EIGHT), card(CardRank.SEVEN)],
      HandStatus.ACTIVE,
    );
    const dealer = hand(
      [card(CardRank.TEN), card(CardRank.SIX)],
      HandStatus.STOOD,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.LOST,
      multiplier: 0,
    });
  });

  it('returns WON x2.5 when player has blackjack and dealer does not', () => {
    // ACE + KING → player BJ; TEN + SIX → dealer 16 (no BJ)
    const player = hand(
      [card(CardRank.ACE), card(CardRank.KING)],
      HandStatus.ACTIVE,
    );
    const dealer = hand(
      [card(CardRank.TEN), card(CardRank.SIX)],
      HandStatus.STOOD,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.WON,
      multiplier: 2.5,
    });
  });

  it('returns PUSH x1 when both have blackjack', () => {
    const player = hand(
      [card(CardRank.ACE), card(CardRank.KING)],
      HandStatus.ACTIVE,
    );
    const dealer = hand(
      [card(CardRank.ACE), card(CardRank.QUEEN)],
      HandStatus.ACTIVE,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.PUSH,
      multiplier: 1,
    });
  });

  it('returns WON x2 when dealer busts and player stood', () => {
    // Player: TEN + EIGHT = 18, STOOD; Dealer: TEN + EIGHT + SEVEN = 25, BUSTED
    const player = hand(
      [card(CardRank.TEN, CardSuit.SPADES, 0), card(CardRank.EIGHT, CardSuit.SPADES, 1)],
      HandStatus.STOOD,
    );
    const dealer = hand(
      [
        card(CardRank.TEN, CardSuit.HEARTS, 0),
        card(CardRank.EIGHT, CardSuit.HEARTS, 1),
        card(CardRank.SEVEN, CardSuit.HEARTS, 2),
      ],
      HandStatus.ACTIVE,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.WON,
      multiplier: 2,
    });
  });

  it('returns LOST when dealer has blackjack and player does not', () => {
    // Player: TEN + EIGHT = 18, STOOD; Dealer: ACE + KING → BJ
    const player = hand(
      [card(CardRank.TEN), card(CardRank.EIGHT)],
      HandStatus.STOOD,
    );
    const dealer = hand(
      [card(CardRank.ACE), card(CardRank.KING)],
      HandStatus.ACTIVE,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.LOST,
      multiplier: 0,
    });
  });

  it('returns WON x2 when player score is higher than dealer', () => {
    // Player: TEN + NINE = 19; Dealer: TEN + SEVEN = 17
    const player = hand(
      [card(CardRank.TEN, CardSuit.SPADES, 0), card(CardRank.NINE, CardSuit.SPADES, 1)],
      HandStatus.STOOD,
    );
    const dealer = hand(
      [card(CardRank.TEN, CardSuit.HEARTS, 0), card(CardRank.SEVEN, CardSuit.HEARTS, 1)],
      HandStatus.STOOD,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.WON,
      multiplier: 2,
    });
  });

  it('returns LOST when dealer score is higher than player', () => {
    // Player: TEN + SEVEN = 17; Dealer: TEN + NINE = 19
    const player = hand(
      [card(CardRank.TEN, CardSuit.SPADES, 0), card(CardRank.SEVEN, CardSuit.SPADES, 1)],
      HandStatus.STOOD,
    );
    const dealer = hand(
      [card(CardRank.TEN, CardSuit.HEARTS, 0), card(CardRank.NINE, CardSuit.HEARTS, 1)],
      HandStatus.STOOD,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.LOST,
      multiplier: 0,
    });
  });

  it('returns PUSH x1 when player and dealer have the same score', () => {
    // Both: TEN + EIGHT = 18
    const player = hand(
      [card(CardRank.TEN, CardSuit.SPADES, 0), card(CardRank.EIGHT, CardSuit.SPADES, 1)],
      HandStatus.STOOD,
    );
    const dealer = hand(
      [card(CardRank.TEN, CardSuit.HEARTS, 0), card(CardRank.EIGHT, CardSuit.HEARTS, 1)],
      HandStatus.STOOD,
    );
    expect(resolveMainBet(player, dealer)).toEqual({
      status: MainBetStatus.PUSH,
      multiplier: 1,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateSideBet', () => {
  const { evaluateSideBet } = roundTestUtils;
  const USER_ID = 'user-1';

  function makeSideBet(params: {
    odds?: number | null;
    baseOdds?: number;
    code?: string;
    predictedColor?: SideBetColor | null;
    predictedSuit?: CardSuit | null;
    predictedRank?: CardRank | null;
    targetContext?: SideBetTargetContext;
    selectionJson?: Record<string, unknown> | null;
  }): any {
    return {
      odds: params.odds ?? null,
      type: {
        baseOdds: params.baseOdds ?? 2,
        code: params.code ?? 'FIRST_CARD_COLOR',
      },
      predictedColor: params.predictedColor ?? null,
      predictedSuit: params.predictedSuit ?? null,
      predictedRank: params.predictedRank ?? null,
      targetContext: params.targetContext ?? SideBetTargetContext.FIRST_PLAYER_CARD,
      selectionJson: params.selectionJson ?? null,
    };
  }

  function makeRound(playerCards: ReturnType<typeof card>[], dealerCards: ReturnType<typeof card>[]): any {
    return {
      hands: [
        {
          ownerType: HandOwnerType.PLAYER,
          user: { id: USER_ID },
          cards: playerCards,
          status: HandStatus.ACTIVE,
          handValue: null,
        },
        {
          ownerType: HandOwnerType.DEALER,
          user: null,
          cards: dealerCards,
          status: HandStatus.ACTIVE,
          handValue: null,
        },
      ],
      mainBets: [],
      sideBets: [],
    };
  }

  it('returns REFUNDED when odds is zero', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.HEARTS)], []);
    const bet = makeSideBet({ odds: 0 });
    const result = evaluateSideBet(bet, round, USER_ID);
    expect(result).toEqual({ status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true });
  });

  it('returns REFUNDED when odds is negative', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.HEARTS)], []);
    const bet = makeSideBet({ odds: -1 });
    const result = evaluateSideBet(bet, round, USER_ID);
    expect(result).toEqual({ status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true });
  });

  it('returns REFUNDED when there are no player cards (no target card)', () => {
    const round = makeRound([], []);
    const bet = makeSideBet({ odds: 2 });
    const result = evaluateSideBet(bet, round, USER_ID);
    expect(result).toEqual({ status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true });
  });

  it('CARD_EXACT: returns WON when the predicted card appears in the player hand', () => {
    const round = makeRound([
      card(CardRank.TEN, CardSuit.SPADES, 0),
      card(CardRank.JACK, CardSuit.HEARTS, 1),
    ], []);
    const bet = makeSideBet({
      odds: 12,
      code: 'CARD_EXACT',
      predictedSuit: CardSuit.HEARTS,
      predictedRank: CardRank.JACK,
      selectionJson: { suit: CardSuit.HEARTS, rank: CardRank.JACK },
    });

    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 12, isRefund: false,
    });
  });

  it('CARD_EXACT: returns LOST when the predicted card is absent', () => {
    const round = makeRound([
      card(CardRank.TEN, CardSuit.SPADES, 0),
      card(CardRank.JACK, CardSuit.HEARTS, 1),
    ], []);
    const bet = makeSideBet({
      odds: 12,
      code: 'CARD_EXACT',
      predictedSuit: CardSuit.CLUBS,
      predictedRank: CardRank.ACE,
      selectionJson: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
    });

    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.LOST, multiplier: 0, isRefund: false,
    });
  });

  it('WINNER: returns WON when a dealer prediction matches a lost main bet', () => {
    const round = makeRound([card(CardRank.TEN)], [card(CardRank.KING, CardSuit.HEARTS)]);
    const bet = makeSideBet({
      odds: 2,
      code: 'WINNER',
      selectionJson: { winner: 'DEALER' },
    });

    expect(evaluateSideBet(bet, round, USER_ID, 0, {
      rawMainBetStatus: MainBetStatus.LOST,
      triggeredPowerupEffect: null,
    })).toEqual({
      status: SideBetStatus.WON, multiplier: 2, isRefund: false,
    });
  });

  it('WINNER: refunds when the main bet pushes', () => {
    const round = makeRound([card(CardRank.TEN)], [card(CardRank.KING, CardSuit.HEARTS)]);
    const bet = makeSideBet({
      odds: 2,
      code: 'WINNER',
      selectionJson: { winner: 'PLAYER' },
    });

    expect(evaluateSideBet(bet, round, USER_ID, 0, {
      rawMainBetStatus: MainBetStatus.PUSH,
      triggeredPowerupEffect: null,
    })).toEqual({
      status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true,
    });
  });

  it('PILL_TRIGGER: returns WON only when the expected pill effect triggered', () => {
    const round = makeRound([card(CardRank.TEN)], [card(CardRank.KING, CardSuit.HEARTS)]);
    const bet = makeSideBet({
      odds: 5,
      code: 'PILL_TRIGGER',
      selectionJson: { powerupCode: 'RED_PILL', color: 'red' },
    });

    expect(evaluateSideBet(bet, round, USER_ID, 0, {
      rawMainBetStatus: MainBetStatus.WON,
      triggeredPowerupEffect: { code: 'RED_PILL', color: 'red' },
    })).toEqual({
      status: SideBetStatus.WON, multiplier: 5, isRefund: false,
    });
    expect(evaluateSideBet(bet, round, USER_ID, 0, {
      rawMainBetStatus: MainBetStatus.WON,
      triggeredPowerupEffect: null,
    })).toEqual({
      status: SideBetStatus.LOST, multiplier: 0, isRefund: false,
    });
  });

  it('PLAYER_BLACKJACK: wins only for a natural two-card blackjack', () => {
    const blackjackRound = makeRound([
      card(CardRank.ACE, CardSuit.SPADES, 0),
      card(CardRank.KING, CardSuit.HEARTS, 1),
    ], []);
    blackjackRound.hands[0].status = HandStatus.BLACKJACK;

    const threeCardTwentyOneRound = makeRound([
      card(CardRank.SEVEN, CardSuit.SPADES, 0),
      card(CardRank.SEVEN, CardSuit.HEARTS, 1),
      card(CardRank.SEVEN, CardSuit.CLUBS, 2),
    ], []);
    threeCardTwentyOneRound.hands[0].status = HandStatus.BLACKJACK;

    const bet = makeSideBet({ odds: 12, code: 'PLAYER_BLACKJACK' });

    expect(evaluateSideBet(bet, blackjackRound, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 12, isRefund: false,
    });
    expect(evaluateSideBet(bet, threeCardTwentyOneRound, USER_ID)).toEqual({
      status: SideBetStatus.LOST, multiplier: 0, isRefund: false,
    });
  });

  it('FIRST_CARD_COLOR: returns WON when predicted RED and first card is HEARTS', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.HEARTS, 0)], []);
    const bet = makeSideBet({ odds: 2, code: 'FIRST_CARD_COLOR', predictedColor: SideBetColor.RED });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 2, isRefund: false,
    });
  });

  it('FIRST_CARD_COLOR: returns WON when predicted RED and first card is DIAMONDS', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.DIAMONDS, 0)], []);
    const bet = makeSideBet({ odds: 2, code: 'FIRST_CARD_COLOR', predictedColor: SideBetColor.RED });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 2, isRefund: false,
    });
  });

  it('FIRST_CARD_COLOR: returns LOST when predicted RED but first card is CLUBS (black)', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.CLUBS, 0)], []);
    const bet = makeSideBet({ odds: 2, code: 'FIRST_CARD_COLOR', predictedColor: SideBetColor.RED });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.LOST, multiplier: 0, isRefund: false,
    });
  });

  it('FIRST_CARD_COLOR: returns WON when predicted BLACK and first card is SPADES', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.SPADES, 0)], []);
    const bet = makeSideBet({ odds: 2, code: 'FIRST_CARD_COLOR', predictedColor: SideBetColor.BLACK });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 2, isRefund: false,
    });
  });

  it('FIRST_CARD_SUIT: returns WON when predicted suit matches', () => {
    const round = makeRound([card(CardRank.KING, CardSuit.HEARTS, 0)], []);
    const bet = makeSideBet({ odds: 3, code: 'FIRST_CARD_SUIT', predictedSuit: CardSuit.HEARTS });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 3, isRefund: false,
    });
  });

  it('FIRST_CARD_SUIT: returns LOST when predicted suit does not match', () => {
    const round = makeRound([card(CardRank.KING, CardSuit.CLUBS, 0)], []);
    const bet = makeSideBet({ odds: 3, code: 'FIRST_CARD_SUIT', predictedSuit: CardSuit.HEARTS });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.LOST, multiplier: 0, isRefund: false,
    });
  });

  it('FIRST_CARD_RANK: returns WON when predicted rank matches', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.SPADES, 0)], []);
    const bet = makeSideBet({ odds: 12, code: 'FIRST_CARD_RANK', predictedRank: CardRank.ACE });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 12, isRefund: false,
    });
  });

  it('FIRST_CARD_RANK: returns LOST when predicted rank does not match', () => {
    const round = makeRound([card(CardRank.KING, CardSuit.SPADES, 0)], []);
    const bet = makeSideBet({ odds: 12, code: 'FIRST_CARD_RANK', predictedRank: CardRank.ACE });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.LOST, multiplier: 0, isRefund: false,
    });
  });

  it('returns VOID for an unknown type code', () => {
    const round = makeRound([card(CardRank.ACE, CardSuit.SPADES, 0)], []);
    const bet = makeSideBet({ odds: 2, code: 'UNKNOWN_BET_TYPE' });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.VOID, multiplier: 1, isRefund: true,
    });
  });

  it('FIRST_DEALER_CARD context uses the dealer hand', () => {
    // Player card is CLUBS (would be LOST for RED), dealer card is HEARTS (should be WON for RED)
    const round = makeRound(
      [card(CardRank.TWO, CardSuit.CLUBS, 0)],
      [card(CardRank.ACE, CardSuit.HEARTS, 0)],
    );
    const bet = makeSideBet({
      odds: 2,
      code: 'FIRST_CARD_COLOR',
      predictedColor: SideBetColor.RED,
      targetContext: SideBetTargetContext.FIRST_DEALER_CARD,
    });
    expect(evaluateSideBet(bet, round, USER_ID)).toEqual({
      status: SideBetStatus.WON, multiplier: 2, isRefund: false,
    });
  });
});
