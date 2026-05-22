import { CardRank, CardSuit } from '../../entity/enums.js';
import type { BetceptionSideBetCode } from './round.schema.js';

export type BetceptionCategory =
  | 'CARD'
  | 'DEALER_BUST'
  | 'PILL_TRIGGER'
  | 'PLAYER_BLACKJACK'
  | 'SPLIT_COUNT';

export type BetceptionBalanceSideBet = {
  type: { code: string };
  amountCents: bigint;
  selectionJson?: Record<string, unknown> | null;
};

export type BetceptionSettlementStep = {
  kind: string;
  status: string;
  amountCents: bigint;
  payoutCents: bigint;
  selection: Record<string, unknown> | null;
};

export const BETCEPTION_COMBO_STEP_KIND = 'COMBO_BONUS';

const INITIAL_HAND_EXACT_CARD_PROBABILITY = 2 / 52;
const INITIAL_HAND_SUIT_PROBABILITY = 1 - (39 / 52) * (38 / 51);
const DEALER_BUST_PROBABILITY = 0.207;
const PLAYER_BLACKJACK_PROBABILITY = (4 * 16 * 2) / (52 * 51);
const RED_PILL_TRIGGER_PROBABILITY = 0.409 * (1 / 5);
const BLUE_PILL_TRIGGER_PROBABILITY = 0.497 * (1 / 8);

const TARGET_RTP: Record<BetceptionSideBetCode, number> = {
  CARD_EXACT: 0.92,
  CARD_SUIT: 0.90,
  DEALER_BUST: 0.86,
  PILL_TRIGGER: 0.90,
  PLAYER_BLACKJACK: 0.92,
  SPLIT_COUNT: 0.88,
};

const CORRELATION_FACTOR: Record<BetceptionSideBetCode, number> = {
  CARD_EXACT: 1,
  CARD_SUIT: 0.96,
  DEALER_BUST: 0.92,
  PILL_TRIGGER: 0.95,
  PLAYER_BLACKJACK: 1,
  SPLIT_COUNT: 0.9,
};

const SPLIT_COUNT_PROBABILITY: Record<number, number> = {
  1: 0.131,
  2: 0.027,
  3: 0.0055,
};

const STAKE_CAPS: Record<BetceptionCategory, { numerator: bigint; denominator: bigint }> = {
  CARD: { numerator: 1n, denominator: 1n },
  DEALER_BUST: { numerator: 3n, denominator: 5n },
  PILL_TRIGGER: { numerator: 1n, denominator: 2n },
  PLAYER_BLACKJACK: { numerator: 1n, denominator: 2n },
  SPLIT_COUNT: { numerator: 1n, denominator: 2n },
};

const TOTAL_SIDEBET_CAP = { numerator: 2n, denominator: 1n };

export function betceptionCategoryFor(code: string): BetceptionCategory | null {
  if (code === 'CARD_EXACT' || code === 'CARD_SUIT') return 'CARD';
  if (code === 'DEALER_BUST') return 'DEALER_BUST';
  if (code === 'PILL_TRIGGER') return 'PILL_TRIGGER';
  if (code === 'PLAYER_BLACKJACK') return 'PLAYER_BLACKJACK';
  if (code === 'SPLIT_COUNT') return 'SPLIT_COUNT';
  return null;
}

export function calculateBetceptionOdds(input: {
  code: string;
  selection?: Record<string, unknown> | null;
  activePowerupCode?: string | null;
  fallbackOdds?: string | null;
}): string | null {
  if (!isBetceptionSideBetCode(input.code)) return input.fallbackOdds ?? null;

  const probability = estimateBetceptionProbability({
    code: input.code,
    selection: input.selection,
    activePowerupCode: input.activePowerupCode,
  });
  const rawOdds =
    (TARGET_RTP[input.code] * CORRELATION_FACTOR[input.code]) /
    Math.max(probability, 0.0001);
  return normalizeOdds(rawOdds).toFixed(3);
}

export function estimateBetceptionProbability(input: {
  code: string;
  selection?: Record<string, unknown> | null;
  activePowerupCode?: string | null;
}): number {
  if (input.code === 'CARD_EXACT') return INITIAL_HAND_EXACT_CARD_PROBABILITY;
  if (input.code === 'CARD_SUIT') return INITIAL_HAND_SUIT_PROBABILITY;
  if (input.code === 'DEALER_BUST') return DEALER_BUST_PROBABILITY;
  if (input.code === 'PLAYER_BLACKJACK') return PLAYER_BLACKJACK_PROBABILITY;
  if (input.code === 'PILL_TRIGGER') {
    if (input.activePowerupCode === 'RED_PILL') return RED_PILL_TRIGGER_PROBABILITY;
    if (input.activePowerupCode === 'BLUE_PILL') return BLUE_PILL_TRIGGER_PROBABILITY;
    const selectedCode = input.selection?.['powerupCode'];
    if (selectedCode === 'RED_PILL') return RED_PILL_TRIGGER_PROBABILITY;
    if (selectedCode === 'BLUE_PILL') return BLUE_PILL_TRIGGER_PROBABILITY;
    return (RED_PILL_TRIGGER_PROBABILITY + BLUE_PILL_TRIGGER_PROBABILITY) / 2;
  }
  if (input.code === 'SPLIT_COUNT') {
    const splitCount = readNumberSelection(input.selection, 'splitCount');
    return SPLIT_COUNT_PROBABILITY[splitCount ?? 1] ?? SPLIT_COUNT_PROBABILITY[1];
  }
  return 1;
}

export function validateBetceptionStakeCaps(
  mainBetCents: bigint,
  sideBets: BetceptionBalanceSideBet[],
): { ok: true } | { ok: false; code: string; message: string } {
  if (mainBetCents <= 0n || sideBets.length === 0) return { ok: true };

  const totalSideBetCents = sideBets.reduce((sum, sideBet) => sum + sideBet.amountCents, 0n);
  if (exceedsRatio(totalSideBetCents, mainBetCents, TOTAL_SIDEBET_CAP)) {
    return {
      ok: false,
      code: 'SIDEBET_TOTAL_LIMIT',
      message: 'Total side bets cannot exceed 200% of the main bet',
    };
  }

  const byCategory = new Map<BetceptionCategory, bigint>();
  for (const sideBet of sideBets) {
    const category = betceptionCategoryFor(sideBet.type.code);
    if (!category) continue;
    byCategory.set(category, (byCategory.get(category) ?? 0n) + sideBet.amountCents);
  }

  for (const [category, amountCents] of byCategory) {
    if (!exceedsRatio(amountCents, mainBetCents, STAKE_CAPS[category])) continue;
    return {
      ok: false,
      code: 'SIDEBET_CATEGORY_LIMIT',
      message: `${category} side bets exceed the allowed stake limit`,
    };
  }

  return { ok: true };
}

export function calculateBetceptionComboBonus(
  steps: BetceptionSettlementStep[],
): {
  bonusCents: bigint;
  bonusRate: number;
  wonCategories: BetceptionCategory[];
  rarityScore: number;
} {
  const winningSideBetSteps = steps.filter(
    (step) =>
      step.status === 'won' &&
      step.payoutCents > 0n &&
      betceptionCategoryFor(step.kind),
  );
  if (winningSideBetSteps.length < 2) {
    return { bonusCents: 0n, bonusRate: 0, wonCategories: [], rarityScore: 0 };
  }

  const wonCategories = [
    ...new Set(
      winningSideBetSteps
        .map((step) => betceptionCategoryFor(step.kind))
        .filter((category): category is BetceptionCategory => !!category),
    ),
  ];
  if (wonCategories.length < 2) {
    return { bonusCents: 0n, bonusRate: 0, wonCategories, rarityScore: 0 };
  }

  const rarityScore = winningSideBetSteps.reduce((sum, step) => {
    const probability = estimateBetceptionProbability({
      code: step.kind,
      selection: step.selection,
    });
    return sum + -Math.log(Math.max(probability, 0.0001));
  }, 0);

  const rawRate =
    0.08 * Math.pow(wonCategories.length - 1, 2) +
    0.03 * rarityScore +
    (wonCategories.length >= 5 ? 0.35 : 0);
  const bonusRate = Math.min(2.5, roundTo(rawRate, 3));
  const sideBetWinPayoutCents = winningSideBetSteps.reduce(
    (sum, step) => sum + step.payoutCents,
    0n,
  );
  const bonusCents = multiplyCents(sideBetWinPayoutCents, bonusRate);

  return { bonusCents, bonusRate, wonCategories, rarityScore: roundTo(rarityScore, 3) };
}

export function normalizedBetceptionSelection(
  code: string,
  selection: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (code === 'CARD_EXACT' && selection?.['suit'] && selection?.['rank']) {
    return { suit: selection['suit'], rank: selection['rank'] };
  }
  if (code === 'CARD_SUIT' && selection?.['suit']) return { suit: selection['suit'] };
  if (code === 'SPLIT_COUNT') {
    const splitCount = readNumberSelection(selection, 'splitCount');
    return splitCount ? { splitCount } : selection;
  }
  return selection;
}

export function isInitialCardBetRank(rank: unknown): rank is CardRank {
  return typeof rank === 'string' && Object.values(CardRank).includes(rank as CardRank);
}

export function isInitialCardBetSuit(suit: unknown): suit is CardSuit {
  return typeof suit === 'string' && Object.values(CardSuit).includes(suit as CardSuit);
}

function normalizeOdds(odds: number): number {
  if (!Number.isFinite(odds) || odds <= 0) return 1;
  if (odds < 1.05) return 1.05;
  if (odds < 10) return roundTo(odds, 2);
  if (odds < 100) return roundTo(odds * 2, 0) / 2;
  return roundTo(odds, 0);
}

function readNumberSelection(selection: Record<string, unknown> | undefined | null, key: string): number | null {
  const value = selection?.[key];
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isBetceptionSideBetCode(code: string): code is BetceptionSideBetCode {
  return (
    code === 'CARD_EXACT' ||
    code === 'CARD_SUIT' ||
    code === 'DEALER_BUST' ||
    code === 'PILL_TRIGGER' ||
    code === 'PLAYER_BLACKJACK' ||
    code === 'SPLIT_COUNT'
  );
}

function exceedsRatio(
  amountCents: bigint,
  baseCents: bigint,
  ratio: { numerator: bigint; denominator: bigint },
) {
  return amountCents * ratio.denominator > baseCents * ratio.numerator;
}

function multiplyCents(amountCents: bigint, multiplier: number): bigint {
  return BigInt(Math.floor(Number(amountCents) * multiplier));
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
