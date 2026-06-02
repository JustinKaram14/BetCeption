import crypto from 'crypto';
import { Request, Response } from 'express';
import { EntityManager, In } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Round } from '../../entity/Round.js';
import { Hand } from '../../entity/Hand.js';
import { Card } from '../../entity/Card.js';
import { MainBet } from '../../entity/MainBet.js';
import { SideBet } from '../../entity/SideBet.js';
import { SidebetType } from '../../entity/SidebetType.js';
import { User } from '../../entity/User.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { PowerupConsumption } from '../../entity/PowerupConsumption.js';
import { UserPowerup } from '../../entity/UserPowerup.js';
import { UserCrate } from '../../entity/UserCrate.js';
import { UserXpEvent } from '../../entity/UserXpEvent.js';
import { getTierForLevel } from '../crates/crates.controller.js';
import {
  CardRank,
  CardSuit,
  HandOwnerType,
  HandStatus,
  MainBetStatus,
  RoundStatus,
  SideBetColor,
  SideBetStatus,
  SideBetTargetContext,
  WalletTransactionKind,
} from '../../entity/enums.js';
import { centsToDecimal, decimalToCents, multiplyMoney } from '../../utils/money.js';
import { buildFairnessPayload } from '../fairness/fairness.utils.js';
import { buildLevelProgress, calculateRoundXp, countWonSideBets, levelFromXp } from '../progression/progression.js';
import {
  BLUE_PILL_TRIGGER_DENOMINATOR,
  getPowerPillColor,
  isPowerPillCode,
  RED_PILL_TRIGGER_DENOMINATOR,
  serializeActivePowerup,
  shouldTriggerPowerPill,
  type PowerPillCode,
  type PowerPillColor,
} from '../powerups/power-pills.js';
import type { RoundIdParams, StartRoundInput, SwapCardBody } from './round.schema.js';
import {
  BETCEPTION_COMBO_STEP_KIND,
  calculateBetceptionComboBonus,
  calculateBetceptionOdds,
  estimateBetceptionProbability,
  isInitialCardBetRank,
  isInitialCardBetSuit,
  normalizedBetceptionSelection,
  validateBetceptionStakeCaps,
} from './betception-balance.js';
import { evaluateRoundAchievements } from '../achievements/achievements.service.js';

type RoundWithRelations = Round & {
  hands: (Hand & { cards: Card[]; user: User | null })[];
  mainBets: (MainBet & { user: User; hand: Hand })[];
  sideBets: (SideBet & { user: User; type: SidebetType })[];
};

type DeckCard = { rank: CardRank; suit: CardSuit };

type PreparedSideBet = {
  type: SidebetType;
  amountCents: bigint;
  predictedColor: SideBetColor | null;
  predictedSuit: CardSuit | null;
  predictedRank: CardRank | null;
  targetContext: SideBetTargetContext;
  selectionJson: Record<string, unknown> | null;
  odds: string | null;
};

type HandEvaluation = {
  total: number;
  isSoft: boolean;
  isBlackjack: boolean;
};

type SideBetResolution = {
  status: SideBetStatus;
  multiplier: number;
  isRefund: boolean;
};

type SerializeRoundOptions = {
  xpGained?: number;
};

type DealerActionKind =
  | 'REVEAL_HOLE'
  | 'DRAW_CARD'
  | 'STAND'
  | 'BUST'
  | 'BLACKJACK'
  | 'NONE';

type DealerAction = {
  kind: DealerActionKind;
  cardId: string | null;
  dealerTurnComplete: boolean;
};

type TriggeredPowerupEffect = {
  code: PowerPillCode;
  color: PowerPillColor;
};

type BetceptionSideBetCode =
  | 'CARD_EXACT'
  | 'CARD_SUIT'
  | 'DEALER_BUST'
  | 'PILL_TRIGGER'
  | 'PLAYER_BLACKJACK'
  | 'SPLIT_COUNT';

type SideBetEvaluationContext = {
  rawMainBetStatus: MainBetStatus;
  triggeredPowerupEffect: TriggeredPowerupEffect | null;
};

type BetceptionResolutionStep = {
  id: string;
  kind: 'MAIN_BET' | BetceptionSideBetCode | string;
  status: MainBetStatus | SideBetStatus;
  amount: string;
  payout: string | null;
  multiplier: string | null;
  selection: Record<string, unknown> | null;
};

type BetceptionResolution = {
  depthLevel: number;
  totalPayout: string;
  totalStake: string;
  steps: BetceptionResolutionStep[];
};

const ACTIVE_ROUND_STATUSES = [
  RoundStatus.CREATED,
  RoundStatus.DEALING,
  RoundStatus.IN_PROGRESS,
] as const;

const PAYOUT_BLACKJACK = 2.5;
const PAYOUT_WIN = 2;
const PAYOUT_PUSH = 1;
const PAYOUT_LOSS = 0;

const BETCEPTION_SIDE_BET_CODES = new Set<string>([
  'CARD_EXACT',
  'CARD_SUIT',
  'DEALER_BUST',
  'PILL_TRIGGER',
  'PLAYER_BLACKJACK',
  'SPLIT_COUNT',
]);

const TEN_VALUE_RANKS = new Set([CardRank.KING, CardRank.QUEEN, CardRank.JACK, CardRank.TEN]);

const FULL_DECK: DeckCard[] = buildDeck();

class RoundFlowError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RoundFlowError';
  }
}

export async function startRound(
  req: Request<unknown, unknown, StartRoundInput>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const input = req.body;

    const newRoundId = await AppDataSource.transaction(async (manager) => {
      await ensureNoActiveRound(userId, manager);

      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['activePowerupType'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new RoundFlowError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const betCents = decimalToCents(input.betAmount.toFixed(2));
      if (betCents <= 0n) {
        throw new RoundFlowError(400, 'INVALID_BET', 'Bet amount must be positive');
      }

      const preparedSideBets = await prepareSideBets(input.sideBets ?? [], manager, user);
      const totalSideBetCents = preparedSideBets.reduce(
        (sum, sideBet) => sum + sideBet.amountCents,
        0n,
      );
      const stakeCaps = validateBetceptionStakeCaps(betCents, preparedSideBets);
      if (!stakeCaps.ok) {
        throw new RoundFlowError(400, stakeCaps.code, stakeCaps.message);
      }
      const totalRequired = betCents + totalSideBetCents;
      const currentBalance = decimalToCents(user.balance);
      if (currentBalance < totalRequired) {
        throw new RoundFlowError(400, 'INSUFFICIENT_FUNDS', 'Not enough balance for bets');
      }

      user.balance = centsToDecimal(currentBalance - totalRequired);
      await userRepo.save(user);

      const roundRepo = manager.getRepository(Round);
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const round = roundRepo.create({
        status: RoundStatus.DEALING,
        startedAt: new Date(),
        serverSeed,
        serverSeedHash: crypto.createHash('sha256').update(serverSeed).digest('hex'),
      });
      await roundRepo.save(round);

      const handRepo = manager.getRepository(Hand);
      const dealerHand = handRepo.create({
        round,
        ownerType: HandOwnerType.DEALER,
        status: HandStatus.ACTIVE,
      });
      const playerHand = handRepo.create({
        round,
        ownerType: HandOwnerType.PLAYER,
        status: HandStatus.ACTIVE,
        user,
      });
      await handRepo.save([dealerHand, playerHand]);
      dealerHand.cards = [];
      playerHand.cards = [];

      const usedCards = new Set<string>();
      await dealInitialCards(
        manager,
        playerHand,
        dealerHand,
        usedCards,
        serverSeed,
      );

      const mainBetRepo = manager.getRepository(MainBet);
      const mainBet = mainBetRepo.create({
        round,
        hand: playerHand,
        user,
        amount: centsToDecimal(betCents),
        status: MainBetStatus.PLACED,
      });
      await mainBetRepo.save(mainBet);

      const walletRepo = manager.getRepository(WalletTransaction);
      const betPlacementTxs: WalletTransaction[] = [
        walletRepo.create({
          user,
          kind: WalletTransactionKind.BET_PLACE,
          amount: centsToDecimal(-betCents),
          refTable: 'main_bets',
          refId: mainBet.id,
        }),
      ];

      const sideBetRepo = manager.getRepository(SideBet);
      if (preparedSideBets.length > 0) {
        // Build entities first so TypeORM applies column defaults,
        // then batch-save once (single INSERT statement).
        const sideBetEntities = preparedSideBets.map((prepared) =>
          sideBetRepo.create({
            round,
            user,
            type: prepared.type,
            amount: centsToDecimal(prepared.amountCents),
            predictedColor: prepared.predictedColor,
            predictedSuit: prepared.predictedSuit,
            predictedRank: prepared.predictedRank,
            targetContext: prepared.targetContext,
            selectionJson: prepared.selectionJson,
            odds: prepared.odds,
          }),
        );
        const savedSideBets = await sideBetRepo.save(sideBetEntities);

        for (let i = 0; i < preparedSideBets.length; i++) {
          const insertedId = savedSideBets[i]?.id;
          if (!insertedId) {
            throw new RoundFlowError(500, 'INTERNAL', 'Side bet insert failed');
          }
          betPlacementTxs.push(
            walletRepo.create({
              user,
              kind: WalletTransactionKind.BET_PLACE,
              amount: centsToDecimal(-preparedSideBets[i].amountCents),
              refTable: 'side_bets',
              refId: insertedId,
            }),
          );
        }
      }

      if (betPlacementTxs.length) {
        await walletRepo.save(betPlacementTxs);
      }

      playerHand.cards = playerHand.cards ?? [];
      dealerHand.cards = dealerHand.cards ?? [];
      recalcHand(playerHand);
      recalcHand(dealerHand, { suppressBlackjack: true });
      await handRepo.save([playerHand, dealerHand]);

      round.status = RoundStatus.IN_PROGRESS;
      await roundRepo.save(round);

      return round.id;
    });

    const round = await loadRoundForUser(newRoundId, userId);
    if (!round) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.status(201).json({ round: serializeRound(round, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function hitRound(
  req: Request<RoundIdParams>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not accepting hits');
      }

      const playerHand = getActivePlayerHand(round, userId);
      const dealerHand = getDealerHand(round);
      if (!playerHand) {
        if (getAllPlayerHands(round, userId).length > 0) {
          throw new RoundFlowError(400, 'HAND_LOCKED', 'Cannot draw cards for this hand');
        }
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Player hand not found');
      }
      if (dealerHand?.status === HandStatus.BLACKJACK) {
        throw new RoundFlowError(409, 'ROUND_READY_TO_SETTLE', 'Dealer blackjack must be settled');
      }
      if (playerHand.status !== HandStatus.ACTIVE) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'Cannot draw cards for this hand');
      }

      const usedCards = collectUsedCards(round);
      const newCard = drawCardFromSeed(round.serverSeed, usedCards);
      await addCardToHand(manager, playerHand, newCard);
      const evaluation = recalcHand(playerHand);
      if (evaluation.total > 21) {
        playerHand.status = HandStatus.BUSTED;
      } else if (evaluation.isBlackjack && playerHand.cards.length === 2) {
        playerHand.status = HandStatus.BLACKJACK;
      }
      await manager.getRepository(Hand).save(playerHand);
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.json({ round: serializeRound(updatedRound, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function standRound(
  req: Request<RoundIdParams>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not in progress');
      }

      const playerHand = getActivePlayerHand(round, userId);
      const dealerHand = getDealerHand(round);
      if (!playerHand) {
        if (getAllPlayerHands(round, userId).length > 0) {
          throw new RoundFlowError(400, 'HAND_LOCKED', 'Player hand cannot stand');
        }
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Player hand not found');
      }
      if (!dealerHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Dealer hand not found');
      }
      if (dealerHand.status === HandStatus.BLACKJACK) {
        throw new RoundFlowError(409, 'ROUND_READY_TO_SETTLE', 'Dealer blackjack must be settled');
      }
      if (playerHand.status !== HandStatus.ACTIVE) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'Player hand cannot stand');
      }

      playerHand.status = HandStatus.STOOD;
      await manager.getRepository(Hand).save(playerHand);
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    const playerHands = getAllPlayerHands(updatedRound, userId);
    const dealerTurnReady = !playerHands.some((hand) => hand.status === HandStatus.ACTIVE);
    return res.json({
      round: serializeRound(updatedRound, userId),
      dealerAction: dealerTurnReady
        ? {
            kind: 'REVEAL_HOLE',
            cardId: getDealerHoleCardId(updatedRound),
            dealerTurnComplete: isDealerTurnComplete(getDealerHand(updatedRound)),
          } satisfies DealerAction
        : { kind: 'NONE', cardId: null, dealerTurnComplete: false } satisfies DealerAction,
    });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function dealerStepRound(
  req: Request<RoundIdParams>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;
    let dealerAction: DealerAction = { kind: 'NONE', cardId: null, dealerTurnComplete: true };

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not in progress');
      }

      const playerHands = getAllPlayerHands(round, userId);
      const dealerHand = getDealerHand(round);
      if (!playerHands.length || !dealerHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Hands not found');
      }
      if (playerHands.some((hand) => hand.status === HandStatus.ACTIVE)) {
        throw new RoundFlowError(409, 'PLAYER_TURN_ACTIVE', 'Complete the player turn before dealer steps');
      }
      if (playerHands.every((hand) => hand.status === HandStatus.BUSTED)) {
        dealerAction = { kind: 'NONE', cardId: null, dealerTurnComplete: true };
        return;
      }

      dealerAction = await advanceDealerOneStep(manager, round, dealerHand);
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.json({ round: serializeRound(updatedRound, userId), dealerAction });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function getActiveRound(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const handRepo = AppDataSource.getRepository(Hand);
    const activeHand = await handRepo.findOne({
      where: {
        ownerType: HandOwnerType.PLAYER,
        user: { id: userId },
        round: { status: In(ACTIVE_ROUND_STATUSES) },
      },
      relations: ['round'],
    });
    if (!activeHand?.round) {
      return res.status(404).json({ message: 'No active round' });
    }
    const round = await loadRoundForUser(activeHand.round.id, userId);
    if (!round) {
      return res.status(404).json({ message: 'No active round' });
    }
    return res.json({ round: serializeRound(round, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function getRound(
  req: Request<RoundIdParams>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;
    const round = await loadRoundForUser(roundId, userId);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }
    return res.json({ round: serializeRound(round, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function settleRound(
  req: Request<RoundIdParams>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;

    const settlementProgress = await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status === RoundStatus.SETTLED) {
        throw new RoundFlowError(409, 'ROUND_SETTLED', 'Round already settled');
      }

      const playerHand = getPlayerHand(round, userId);
      const splitHands = getSplitHands(round, userId);
      const allSettleHands = getAllPlayerHands(round, userId);
      const dealerHand = getDealerHand(round);
      if (!playerHand || !dealerHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Hands not found');
      }
      if (dealerHand.status !== HandStatus.BLACKJACK && allSettleHands.some((hand) => hand.status === HandStatus.ACTIVE)) {
        throw new RoundFlowError(409, 'ROUND_ACTIVE', 'Complete your turn before settling');
      }

      if (!canSettleRound(allSettleHands, dealerHand, splitHands.length === 0)) {
        throw new RoundFlowError(409, 'DEALER_TURN_ACTIVE', 'Complete the dealer turn before settling');
      }

      const mainBet = getMainBetForUser(round, userId);
      if (!mainBet) {
        throw new RoundFlowError(404, 'BET_NOT_FOUND', 'Main bet missing');
      }

      const resolution = resolveMainBet(playerHand, dealerHand, { naturalBlackjackAllowed: splitHands.length === 0 });
      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['activePowerupType'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new RoundFlowError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const activePowerupBefore = serializeActivePowerup(user);
      const activePowerupCode = activePowerupBefore?.type.code;
      let finalResolution = { ...resolution };
      let effectiveMultiplier = finalResolution.multiplier;
      let triggeredPowerupEffect: TriggeredPowerupEffect | null = null;
      let expiredPowerup: TriggeredPowerupEffect | null = null;

      if (
        activePowerupCode === 'BLUE_PILL' &&
        finalResolution.status === MainBetStatus.LOST &&
        shouldTriggerPowerPill(BLUE_PILL_TRIGGER_DENOMINATOR)
      ) {
        finalResolution = { status: MainBetStatus.REFUNDED, multiplier: PAYOUT_PUSH };
        effectiveMultiplier = PAYOUT_PUSH;
        triggeredPowerupEffect = { code: activePowerupCode, color: getPowerPillColor(activePowerupCode) };
      }

      if (
        activePowerupCode === 'RED_PILL' &&
        finalResolution.status === MainBetStatus.WON &&
        shouldTriggerPowerPill(RED_PILL_TRIGGER_DENOMINATOR)
      ) {
        effectiveMultiplier = finalResolution.multiplier * 3;
        triggeredPowerupEffect = { code: activePowerupCode, color: getPowerPillColor(activePowerupCode) };
      }

      const settledAmountDecimal = multiplyMoney(mainBet.amount, effectiveMultiplier);
      const settledAmountCents = decimalToCents(settledAmountDecimal);

      mainBet.status = finalResolution.status;
      mainBet.payoutMultiplier = effectiveMultiplier.toFixed(3);
      mainBet.settledAmount = settledAmountDecimal;
      mainBet.settledAt = new Date();
      await manager.getRepository(MainBet).save(mainBet);

      const walletRepo = manager.getRepository(WalletTransaction);

      let pendingCredit = 0n;
      const walletTxs: WalletTransaction[] = [];
      let splitBetStakeTotal = 0n;
      let splitBetPayoutTotal = 0n;
      const splitBetStatuses: MainBetStatus[] = [];
      if (settledAmountCents > 0n) {
        const kind =
          finalResolution.status === MainBetStatus.PUSH ||
          finalResolution.status === MainBetStatus.REFUNDED
            ? WalletTransactionKind.BET_REFUND
            : WalletTransactionKind.BET_WIN;
        walletTxs.push(
          walletRepo.create({
            user,
            kind,
            amount: centsToDecimal(settledAmountCents),
            refTable: 'main_bets',
            refId: mainBet.id,
          }),
        );
        pendingCredit += settledAmountCents;
      }

      for (const splitHand of splitHands) {
        const splitBet = getMainBetForHand(round, splitHand.id);
        if (!splitBet || splitBet.status !== MainBetStatus.PLACED) continue;

        splitBetStakeTotal += decimalToCents(splitBet.amount);
        const splitResolution = resolveMainBet(splitHand, dealerHand, { naturalBlackjackAllowed: false });
        const splitSettledAmount = multiplyMoney(splitBet.amount, splitResolution.multiplier);
        const splitSettledCents = decimalToCents(splitSettledAmount);

        splitBet.status = splitResolution.status;
        splitBetStatuses.push(splitResolution.status);
        splitBet.payoutMultiplier = splitResolution.multiplier.toFixed(3);
        splitBet.settledAmount = splitSettledAmount;
        splitBet.settledAt = new Date();
        await manager.getRepository(MainBet).save(splitBet);

        if (splitSettledCents > 0n) {
          const kind =
            splitResolution.status === MainBetStatus.PUSH ||
            splitResolution.status === MainBetStatus.REFUNDED
              ? WalletTransactionKind.BET_REFUND
              : WalletTransactionKind.BET_WIN;
          walletTxs.push(
            walletRepo.create({
              user,
              kind,
              amount: centsToDecimal(splitSettledCents),
              refTable: 'main_bets',
              refId: splitBet.id,
            }),
          );
          pendingCredit += splitSettledCents;
          splitBetPayoutTotal += splitSettledCents;
        }
      }

      const sideBetRepo = manager.getRepository(SideBet);
      const playerSideBets = (round.sideBets ?? []).filter(
        (sideBet) => sideBet.user.id === userId,
      );
      const settledSideBetStatuses: SideBetStatus[] = [];
      const sideBetResolutionSteps: BetceptionResolutionStep[] = [];
      let sideBetPayoutTotal = 0n;
      for (const sideBet of playerSideBets) {
        if (sideBet.status !== SideBetStatus.PLACED) continue;
        const outcome = evaluateSideBet(sideBet, round, sideBet.user.id, 0, {
          rawMainBetStatus: resolution.status,
          triggeredPowerupEffect,
        });
        settledSideBetStatuses.push(outcome.status);
        const payoutDecimal = multiplyMoney(sideBet.amount, outcome.multiplier);
        const payoutCents = decimalToCents(payoutDecimal);

        sideBet.status = outcome.status;
        sideBet.settledAt = new Date();
        sideBet.settledAmount = payoutDecimal;
        sideBet.odds = sideBet.odds ?? sideBet.type.baseOdds;
        await sideBetRepo.save(sideBet);
        sideBetResolutionSteps.push(buildSideBetResolutionStep(sideBet));

        if (payoutCents > 0n) {
          const kind = outcome.isRefund
            ? WalletTransactionKind.BET_REFUND
            : WalletTransactionKind.BET_WIN;
          walletTxs.push(
            walletRepo.create({
              user,
              kind,
              amount: centsToDecimal(payoutCents),
              refTable: 'side_bets',
              refId: sideBet.id,
            }),
          );
          pendingCredit += payoutCents;
          sideBetPayoutTotal += payoutCents;
        }
      }

      const comboBonus = calculateBetceptionComboBonus(
        sideBetResolutionSteps.map((step) => ({
          kind: step.kind,
          status: String(step.status),
          amountCents: decimalToCents(step.amount),
          payoutCents: decimalToCents(step.payout ?? '0'),
          selection: step.selection,
        })),
      );
      if (comboBonus.bonusCents > 0n) {
        sideBetResolutionSteps.push({
          id: `combo-${round.id}`,
          kind: BETCEPTION_COMBO_STEP_KIND,
          status: SideBetStatus.WON,
          amount: centsToDecimal(0n),
          payout: centsToDecimal(comboBonus.bonusCents),
          multiplier: comboBonus.bonusRate.toFixed(3),
          selection: {
            wonCategories: comboBonus.wonCategories,
            rarityScore: comboBonus.rarityScore,
          },
        });
        walletTxs.push(
          walletRepo.create({
            user,
            kind: WalletTransactionKind.BET_WIN,
            amount: centsToDecimal(comboBonus.bonusCents),
            refTable: 'rounds',
            refId: round.id,
          }),
        );
        pendingCredit += comboBonus.bonusCents;
        sideBetPayoutTotal += comboBonus.bonusCents;
      }

      if (pendingCredit > 0n) {
        const balance = decimalToCents(user.balance);
        user.balance = centsToDecimal(balance + pendingCredit);
      }

      if (isPowerPillCode(activePowerupCode)) {
        user.activePowerupUsesRemaining = Math.max(0, user.activePowerupUsesRemaining - 1);
        if (user.activePowerupUsesRemaining === 0) {
          expiredPowerup = { code: activePowerupCode, color: getPowerPillColor(activePowerupCode) };
          user.activePowerupType = null;
        }
      }

      const betceptionResolution = buildBetceptionResolution({
        mainBet,
        sideBets: playerSideBets,
        sideBetResolutionSteps,
        mainBetPayoutCents: settledAmountCents,
        splitBetStakeTotal,
        splitBetPayoutTotal,
        sideBetPayoutTotal,
      });

      const baseXp = calculateRoundXp({
        mainBetStatus: finalResolution.status,
        playerHandStatus: playerHand.status,
        wonSideBets: countWonSideBets(settledSideBetStatuses),
        splitHandCount: splitHands.length,
        wonSplitHands: splitBetStatuses.filter((status) => status === MainBetStatus.WON).length,
        dealerBust: dealerHand.status === HandStatus.BUSTED,
        triggeredPowerup: triggeredPowerupEffect !== null,
        totalStake: betceptionResolution.totalStake,
        totalPayout: betceptionResolution.totalPayout,
      });
      const hasActiveXpBoost = user.xpBoostExpiresAt instanceof Date && user.xpBoostExpiresAt.getTime() > Date.now();
      const boostedXp = hasActiveXpBoost ? baseXp * 2 : baseXp;
      const oldLevel = Math.max(1, Math.floor(user.level ?? 1));
      user.xp = Math.max(0, Math.floor(user.xp ?? 0)) + boostedXp;
      user.level = Math.max(Math.max(1, Math.floor(user.level ?? 1)), levelFromXp(user.xp));
      if (boostedXp > 0) {
        const xpEventRepo = manager.getRepository(UserXpEvent);
        await xpEventRepo.save(
          xpEventRepo.create({
            user,
            amount: boostedXp,
            refTable: 'rounds',
            refId: round.id,
          }),
        );
      }

      let levelUpCrate: { id: string; tier: number; tierLabel: string; acquiredLevel: number } | null = null;
      if (user.level > oldLevel) {
        const crateRepo = manager.getRepository(UserCrate);
        const tier = getTierForLevel(user.level);
        const TIER_LABELS = ['Common', 'Rare', 'Epic'];
        const crate = crateRepo.create({ user, tier, acquiredLevel: user.level });
        await crateRepo.save(crate);
        levelUpCrate = { id: crate.id, tier, tierLabel: TIER_LABELS[tier - 1] ?? 'Common', acquiredLevel: user.level };
      }

      const unlockedAchievements = await evaluateRoundAchievements(manager, user, {
        mainBetStatus: mainBet.status,
        playerHandStatus: playerHand.status,
        playerCardCount: playerHand.cards?.length ?? 0,
        splitHandCount: splitHands.length,
        splitBetStatuses,
        dealerHandStatus: dealerHand.status,
        sideBetResolutionSteps,
        totalStake: betceptionResolution.totalStake,
        totalPayout: betceptionResolution.totalPayout,
        triggeredPowerupEffect,
      });

      const progress = {
        xpGained: boostedXp,
        progress: buildLevelProgress(user),
        levelUpCrate,
        activePowerup: serializeActivePowerup(user),
        triggeredPowerupEffect,
        expiredPowerup,
        betceptionResolution,
        unlockedAchievements,
      };
      await userRepo.save(user);

      if (walletTxs.length) {
        await walletRepo.save(walletTxs);
      }

      round.status = RoundStatus.SETTLED;
      round.endedAt = new Date();
      await manager.getRepository(Round).save(round);

      return progress;
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.json({
      round: serializeRound(updatedRound, userId, {
        xpGained: settlementProgress.xpGained,
      }),
      levelUpCrate: settlementProgress.levelUpCrate ?? null,
      activePowerup: settlementProgress.activePowerup,
      triggeredPowerupEffect: settlementProgress.triggeredPowerupEffect,
      expiredPowerup: settlementProgress.expiredPowerup,
      betceptionResolution: settlementProgress.betceptionResolution,
      unlockedAchievements: settlementProgress.unlockedAchievements,
    });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function doubleRound(
  req: Request<RoundIdParams>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not in progress');
      }

      const activeHand = getActivePlayerHand(round, userId);
      if (!activeHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Player hand not found');
      }
      if (activeHand.status !== HandStatus.ACTIVE) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'Cannot double on this hand');
      }
      if ((activeHand.cards ?? []).length !== 2) {
        throw new RoundFlowError(400, 'DOUBLE_NOT_ALLOWED', 'Can only double on exactly two cards');
      }

      const doubleBet = getMainBetForHand(round, activeHand.id);
      if (!doubleBet) {
        throw new RoundFlowError(404, 'BET_NOT_FOUND', 'Bet for this hand not found');
      }

      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new RoundFlowError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const extraCents = decimalToCents(doubleBet.amount);
      const currentBalance = decimalToCents(user.balance);
      if (currentBalance < extraCents) {
        throw new RoundFlowError(400, 'INSUFFICIENT_FUNDS', 'Not enough balance to double');
      }

      user.balance = centsToDecimal(currentBalance - extraCents);
      await userRepo.save(user);

      const walletRepo = manager.getRepository(WalletTransaction);
      await walletRepo.save(
        walletRepo.create({
          user,
          kind: WalletTransactionKind.BET_PLACE,
          amount: centsToDecimal(-extraCents),
          refTable: 'main_bets',
          refId: doubleBet.id,
        }),
      );

      doubleBet.amount = centsToDecimal(extraCents * 2n);
      await manager.getRepository(MainBet).save(doubleBet);

      const usedCards = collectUsedCards(round);
      const newCard = drawCardFromSeed(round.serverSeed, usedCards);
      await addCardToHand(manager, activeHand, newCard);
      const evaluation = recalcHand(activeHand);
      activeHand.status = evaluation.total > 21 ? HandStatus.BUSTED : HandStatus.STOOD;
      await manager.getRepository(Hand).save(activeHand);
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.json({ round: serializeRound(updatedRound, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function splitRound(
  req: Request<RoundIdParams>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not in progress');
      }

      if (getAllPlayerHands(round, userId).length >= 4) {
        throw new RoundFlowError(400, 'SPLIT_NOT_ALLOWED', 'Maximum of 4 hands reached');
      }

      const activeHand = getActivePlayerHand(round, userId);
      if (!activeHand) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'No active player hand to split');
      }

      const cards = sortCards(activeHand.cards ?? []);
      if (cards.length !== 2) {
        throw new RoundFlowError(400, 'SPLIT_NOT_ALLOWED', 'Can only split a two-card hand');
      }
      if (cardBlackjackValue(cards[0].rank) !== cardBlackjackValue(cards[1].rank)) {
        throw new RoundFlowError(400, 'SPLIT_NOT_ALLOWED', 'Cards must have equal value to split');
      }

      const mainBet = getMainBetForHand(round, activeHand.id);
      if (!mainBet) {
        throw new RoundFlowError(404, 'BET_NOT_FOUND', 'Bet for this hand not found');
      }

      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new RoundFlowError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const splitBetCents = decimalToCents(mainBet.amount);
      const currentBalance = decimalToCents(user.balance);
      if (currentBalance < splitBetCents) {
        throw new RoundFlowError(400, 'INSUFFICIENT_FUNDS', 'Not enough balance to split');
      }

      user.balance = centsToDecimal(currentBalance - splitBetCents);
      await userRepo.save(user);

      const usedCards = collectUsedCards(round);
      const handRepo = manager.getRepository(Hand);
      const splitHand = handRepo.create({
        round,
        ownerType: HandOwnerType.PLAYER_SPLIT,
        status: HandStatus.ACTIVE,
        user,
      });
      await handRepo.save(splitHand);
      splitHand.cards = [];

      const [keptCard, movedCard] = cards;
      const cardRepo = manager.getRepository(Card);
      movedCard.hand = { id: splitHand.id } as unknown as Hand;
      movedCard.drawOrder = 1;
      await cardRepo.save(movedCard);

      activeHand.cards = [keptCard];
      splitHand.cards = [movedCard];

      const activeDraw = drawCardFromSeed(round.serverSeed, usedCards);
      await addCardToHand(manager, activeHand, activeDraw);
      recalcHand(activeHand);
      await manager.getRepository(Hand).save(activeHand);

      const splitDraw = drawCardFromSeed(round.serverSeed, usedCards);
      await addCardToHand(manager, splitHand, splitDraw);
      recalcHand(splitHand);
      await manager.getRepository(Hand).save(splitHand);

      const mainBetRepo = manager.getRepository(MainBet);
      const splitBet = mainBetRepo.create({
        round,
        hand: splitHand,
        user,
        amount: centsToDecimal(splitBetCents),
        status: MainBetStatus.PLACED,
      });
      await mainBetRepo.save(splitBet);

      const walletRepo = manager.getRepository(WalletTransaction);
      await walletRepo.save(
        walletRepo.create({
          user,
          kind: WalletTransactionKind.BET_PLACE,
          amount: centsToDecimal(-splitBetCents),
          refTable: 'main_bets',
          refId: splitBet.id,
        }),
      );
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.json({ round: serializeRound(updatedRound, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function peekCard(req: Request<RoundIdParams>, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;

    const nextCard = await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not in progress');
      }
      const playerHand = getPlayerHand(round, userId);
      if (!playerHand || playerHand.status !== HandStatus.ACTIVE) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'Cannot peek when hand is not active');
      }
      await consumeRoundPowerupByCode(manager, userId, roundId, 'PEEK_CARD');
      const usedCards = collectUsedCards(round);
      return peekNextCard(round.serverSeed, usedCards);
    });

    return res.json({ rank: nextCard.rank, suit: nextCard.suit });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function swapCard(
  req: Request<RoundIdParams, unknown, SwapCardBody>,
  res: Response,
) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;
    const { cardId } = req.body;

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not in progress');
      }
      const playerHand = getPlayerHand(round, userId);
      if (!playerHand || playerHand.status !== HandStatus.ACTIVE) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'Cannot swap when hand is not active');
      }
      const cardToSwap = (playerHand.cards ?? []).find((c) => c.id === cardId);
      if (!cardToSwap) {
        throw new RoundFlowError(404, 'CARD_NOT_FOUND', 'Card not found in player hand');
      }
      await consumeRoundPowerupByCode(manager, userId, roundId, 'CARD_SWAP');
      const usedCards = collectUsedCards(round);
      const newCard = drawCardFromSeed(round.serverSeed, usedCards);
      cardToSwap.rank = newCard.rank;
      cardToSwap.suit = newCard.suit;
      await manager.getRepository(Card).save(cardToSwap);
      recalcHand(playerHand);
      await manager.getRepository(Hand).save(playerHand);
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.json({ round: serializeRound(updatedRound, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

export async function undoHit(req: Request<RoundIdParams>, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const { roundId } = req.params;

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status !== RoundStatus.IN_PROGRESS) {
        throw new RoundFlowError(409, 'ROUND_NOT_ACTIVE', 'Round is not in progress');
      }
      const playerHand = getPlayerHand(round, userId);
      if (!playerHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Player hand not found');
      }
      const cards = sortCards(playerHand.cards ?? []);
      if (cards.length <= 2) {
        throw new RoundFlowError(400, 'CANNOT_UNDO', 'Cannot undo the initial deal');
      }
      if (playerHand.status !== HandStatus.ACTIVE && playerHand.status !== HandStatus.BUSTED) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'Cannot undo when hand is not active or busted');
      }
      await consumeRoundPowerupByCode(manager, userId, roundId, 'UNDO_HIT');
      const lastCard = cards[cards.length - 1];
      await manager.getRepository(Card).remove(lastCard);
      playerHand.cards = cards.slice(0, -1);
      playerHand.status = HandStatus.ACTIVE;
      recalcHand(playerHand);
      await manager.getRepository(Hand).save(playerHand);
    });

    const updatedRound = await loadRoundForUser(roundId, userId);
    if (!updatedRound) {
      throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
    }
    return res.json({ round: serializeRound(updatedRound, userId) });
  } catch (error) {
    return handleRoundError(res, error);
  }
}

function handleRoundError(res: Response, error: unknown) {
  if (error instanceof RoundFlowError) {
    return res
      .status(error.statusCode)
      .json({ message: error.message, code: error.code });
  }
  throw error;
}

function getUserIdOrThrow(req: Pick<Request, 'user'>): string {
  const userId = req.user?.sub;
  if (!userId) {
    throw new RoundFlowError(401, 'UNAUTHENTICATED', 'Authentication required');
  }
  return String(userId);
}

async function ensureNoActiveRound(userId: string, manager: EntityManager) {
  const handRepo = manager.getRepository(Hand);
  const active = await handRepo.findOne({
    where: {
      ownerType: HandOwnerType.PLAYER,
      user: { id: userId },
      round: { status: In(ACTIVE_ROUND_STATUSES) },
    },
    relations: ['round'],
  });
  if (active?.round) {
    throw new RoundFlowError(
      409,
      'ROUND_IN_PROGRESS',
      'Finish the active round before starting a new one',
    );
  }
}

async function prepareSideBets(
  inputs: StartRoundInput['sideBets'],
  manager: EntityManager,
  user: User,
): Promise<PreparedSideBet[]> {
  if (!inputs.length) return [];

  const typeRepo = manager.getRepository(SidebetType);
  const uniqueIds = [...new Set(inputs.map((item) => item.typeId).filter((id): id is number => typeof id === 'number'))];
  const uniqueCodes = [...new Set(inputs.flatMap((item) => item.typeCode ? [item.typeCode] : []))];
  const where = [
    ...(uniqueIds.length ? [{ id: In(uniqueIds) }] : []),
    ...(uniqueCodes.length ? [{ code: In(uniqueCodes) }] : []),
  ];
  const types = where.length ? await typeRepo.find({ where }) : [];
  const typeMap = new Map(types.map((type) => [type.id, type]));
  const typeCodeMap = new Map(types.map((type) => [type.code, type]));

  return inputs.map((input, index) => {
    const type = typeof input.typeId === 'number'
      ? typeMap.get(input.typeId)
      : input.typeCode
        ? typeCodeMap.get(input.typeCode)
        : undefined;
    if (!type) {
      throw new RoundFlowError(
        400,
        'INVALID_SIDE_BET',
        `Unknown side bet type (index ${index})`,
      );
    }

    const amountCents = decimalToCents(input.amount.toFixed(2));
    if (amountCents <= 0n) {
      throw new RoundFlowError(
        400,
        'INVALID_SIDE_BET',
        'Side bet amount must be positive',
      );
    }

    validateSideBetPayload(type, input, index);
    const selectionJson = buildSideBetSelection(type, input, user);
    const odds = resolvePreparedSideBetOdds(type, user, selectionJson);

    return {
      type,
      amountCents,
      predictedColor: input.predictedColor ?? null,
      predictedSuit: input.predictedSuit ?? null,
      predictedRank: input.predictedRank ?? null,
      targetContext: input.targetContext ?? SideBetTargetContext.FIRST_PLAYER_CARD,
      selectionJson,
      odds,
    };
  });
}

function validateSideBetPayload(
  type: SidebetType,
  input: StartRoundInput['sideBets'][number],
  index: number,
) {
  const code = type.code;
  if (code === 'CARD_EXACT') {
    if (!input.predictedSuit || !input.predictedRank) {
      throw new RoundFlowError(
        400,
        'INVALID_SIDE_BET',
        `predictedSuit and predictedRank missing for side bet ${index + 1}`,
      );
    }
    return;
  }
  if (code === 'CARD_SUIT') {
    if (!input.predictedSuit) {
      throw new RoundFlowError(
        400,
        'INVALID_SIDE_BET',
        `predictedSuit missing for side bet ${index + 1}`,
      );
    }
    return;
  }
  if (code === 'SPLIT_COUNT') {
    const splitCount = readSplitCountSelection(input.selection);
    if (!splitCount || splitCount < 1 || splitCount > 3) {
      throw new RoundFlowError(
        400,
        'INVALID_SIDE_BET',
        `splitCount must be between 1 and 3 for side bet ${index + 1}`,
      );
    }
    return;
  }
  if (
    code === 'DEALER_BUST' ||
    code === 'PILL_TRIGGER' ||
    code === 'PLAYER_BLACKJACK'
  ) {
    return;
  }
  if (code === 'FIRST_CARD_COLOR' && !input.predictedColor) {
    throw new RoundFlowError(
      400,
      'INVALID_SIDE_BET',
      `predictedColor missing for side bet ${index + 1}`,
    );
  }
  if (code === 'FIRST_CARD_SUIT' && !input.predictedSuit) {
    throw new RoundFlowError(
      400,
      'INVALID_SIDE_BET',
      `predictedSuit missing for side bet ${index + 1}`,
    );
  }
  if (code === 'FIRST_CARD_RANK' && !input.predictedRank) {
    throw new RoundFlowError(
      400,
      'INVALID_SIDE_BET',
      `predictedRank missing for side bet ${index + 1}`,
    );
  }
}

function buildSideBetSelection(
  type: SidebetType,
  input: StartRoundInput['sideBets'][number],
  user: User,
): Record<string, unknown> | null {
  if (type.code === 'CARD_EXACT') {
    return {
      suit: input.predictedSuit,
      rank: input.predictedRank,
    };
  }
  if (type.code === 'CARD_SUIT') {
    return {
      suit: input.predictedSuit,
    };
  }
  if (type.code === 'DEALER_BUST') {
    return {
      target: 'DEALER',
      outcome: 'BUST',
    };
  }
  if (type.code === 'PILL_TRIGGER') {
    const code = user.activePowerupType?.code;
    if (!isPowerPillCode(code)) {
      throw new RoundFlowError(
        400,
        'INVALID_SIDE_BET',
        'Pill trigger bet requires an active power pill',
      );
    }
    return {
      powerupCode: code,
      color: getPowerPillColor(code),
    };
  }
  if (type.code === 'PLAYER_BLACKJACK') {
    return {
      target: 'PLAYER',
    };
  }
  if (type.code === 'SPLIT_COUNT') {
    return {
      splitCount: readSplitCountSelection(input.selection),
    };
  }
  return input.selection ?? null;
}

function resolvePreparedSideBetOdds(
  type: SidebetType,
  user: User,
  selectionJson?: Record<string, unknown> | null,
): string | null {
  return calculateBetceptionOdds({
    code: type.code,
    selection: normalizedBetceptionSelection(type.code, selectionJson ?? null),
    activePowerupCode: user.activePowerupType?.code,
    fallbackOdds: type.baseOdds,
  });
}

function readSplitCountSelection(selection: Record<string, unknown> | undefined | null): number | null {
  const value = selection?.['splitCount'];
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isBetceptionSideBetCode(code: string): code is BetceptionSideBetCode {
  return BETCEPTION_SIDE_BET_CODES.has(code);
}

async function loadRoundForUser(
  roundId: string,
  userId: string,
  manager?: EntityManager,
): Promise<RoundWithRelations | null> {
  const repo = manager
    ? manager.getRepository(Round)
    : AppDataSource.getRepository(Round);
  const round = await repo.findOne({
    where: { id: roundId },
    relations: {
      hands: { cards: true, user: true },
      mainBets: { user: true, hand: true },
      sideBets: { user: true, type: true },
    },
    order: {
      hands: {
        cards: {
          drawOrder: 'ASC',
        },
      },
    },
  });
  if (!round) return null;

  const ownsRound = (round.hands ?? []).some(
    (hand) => hand.ownerType === HandOwnerType.PLAYER && hand.user?.id === userId,
  );
  if (!ownsRound) return null;

  for (const hand of round.hands ?? []) {
    hand.cards = sortCards(hand.cards ?? []);
  }
  return round as RoundWithRelations;
}

async function loadRoundOrFail(
  roundId: string,
  userId: string,
  manager: EntityManager,
) {
  const round = await loadRoundForUser(roundId, userId, manager);
  if (!round) {
    throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
  }
  return round;
}

async function consumeRoundPowerupByCode(
  manager: EntityManager,
  userId: string,
  roundId: string,
  powerupCode: string,
): Promise<void> {
  const userPowerupRepo = manager.getRepository(UserPowerup);
  const consumptionRepo = manager.getRepository(PowerupConsumption);
  const userPowerup = await userPowerupRepo.findOne({
    where: { user: { id: userId }, type: { code: powerupCode } },
    relations: ['user', 'type'],
    lock: { mode: 'pessimistic_write' },
  });
  if (!userPowerup) {
    throw new RoundFlowError(404, 'POWERUP_NOT_OWNED', `${powerupCode} not in inventory`);
  }
  if (userPowerup.quantity < 1) {
    throw new RoundFlowError(400, 'INSUFFICIENT_STOCK', `No ${powerupCode} available`);
  }
  if (userPowerup.user.level < userPowerup.type.minLevel) {
    throw new RoundFlowError(403, 'LEVEL_TOO_LOW', 'Player level too low to use this power-up');
  }
  const roundRepo = manager.getRepository(Round);
  const round = await roundRepo.findOne({ where: { id: roundId } });
  if (!round) {
    throw new RoundFlowError(404, 'ROUND_NOT_FOUND', 'Round not found');
  }
  userPowerup.quantity -= 1;
  await userPowerupRepo.save(userPowerup);
  await consumptionRepo.save(
    consumptionRepo.create({ user: userPowerup.user, type: userPowerup.type, round }),
  );
}

function serializeRound(
  round: RoundWithRelations,
  userId: string,
  options: SerializeRoundOptions = {},
) {
  const playerHand = getPlayerHand(round, userId);
  const splitHands = getSplitHands(round, userId);
  const dealerHand = getDealerHand(round);
  const mainBet = getMainBetForUser(round, userId);
  if (!playerHand || !dealerHand || !mainBet) {
    throw new RoundFlowError(500, 'ROUND_INCOMPLETE', 'Round is not properly configured');
  }

  const sideBets = (round.sideBets ?? [])
    .filter((sideBet) => sideBet.user.id === userId)
    .map((sideBet) => ({
      id: sideBet.id,
      type: sideBet.type.code,
      amount: sideBet.amount,
      status: sideBet.status,
      odds: sideBet.odds ?? null,
      predictedColor: sideBet.predictedColor,
      predictedSuit: sideBet.predictedSuit,
      predictedRank: sideBet.predictedRank,
      targetContext: sideBet.targetContext,
      selection: sideBet.selectionJson ?? null,
      settledAmount: sideBet.settledAmount,
      settledAt: sideBet.settledAt ?? null,
    }));

  return {
    id: round.id,
    status: round.status,
    startedAt: round.startedAt,
    endedAt: round.endedAt,
    mainBet: {
      id: mainBet.id,
      amount: mainBet.amount,
      status: mainBet.status,
      payoutMultiplier: mainBet.payoutMultiplier,
      settledAmount: mainBet.settledAmount,
      settledAt: mainBet.settledAt ?? null,
    },
    splitBets: splitHands
      .map((splitHand) => getMainBetForHand(round, splitHand.id))
      .filter((bet): bet is MainBet & { user: User; hand: Hand } => !!bet)
      .map((bet) => ({
        id: bet.id,
        amount: bet.amount,
        status: bet.status,
        payoutMultiplier: bet.payoutMultiplier,
        settledAmount: bet.settledAmount,
        settledAt: bet.settledAt ?? null,
      })),
    playerHand: serializeHand(playerHand),
    splitHands: splitHands.map((splitHand) => serializeHand(splitHand)),
    dealerHand: serializeHand(dealerHand, shouldMaskDealerHole(round, getAllPlayerHands(round, userId))),
    sideBets,
    playerProgress: playerHand.user
      ? {
          ...buildLevelProgress(playerHand.user),
          xpGained: options.xpGained ?? 0,
        }
      : null,
    fairness: buildFairnessPayload(round),
  };
}

function serializeHand(hand: Hand & { cards?: Card[] }, maskHoleCard = false) {
  return {
    id: hand.id,
    ownerType: hand.ownerType,
    status: hand.status,
    handValue: hand.handValue,
    cards: sortCards(hand.cards ?? []).map((card, index) => ({
      id: card.id,
      rank: maskHoleCard && index === 1 ? null : card.rank,
      suit: maskHoleCard && index === 1 ? null : card.suit,
      drawOrder: card.drawOrder,
      createdAt: card.createdAt,
    })),
  };
}

async function dealInitialCards(
  manager: EntityManager,
  playerHand: Hand,
  dealerHand: Hand,
  usedCards: Set<string>,
  serverSeed: string,
): Promise<void> {
  const sequence = [playerHand, dealerHand, playerHand, dealerHand];
  for (const hand of sequence) {
    const card = drawCardFromSeed(serverSeed, usedCards);
    await addCardToHand(manager, hand, card);
  }
}

async function addCardToHand(
  manager: EntityManager,
  hand: Hand,
  card: DeckCard,
): Promise<Card> {
  const cardRepo = manager.getRepository(Card);
  const entity = cardRepo.create({
    hand,
    rank: card.rank,
    suit: card.suit,
    drawOrder: (hand.cards?.length ?? 0) + 1,
  });
  await cardRepo.save(entity);
  if (!hand.cards) hand.cards = [];
  hand.cards.push(entity);
  return entity;
}

function drawCardFromSeed(serverSeed: string | null, used: Set<string>): DeckCard {
  if (!serverSeed) {
    throw new RoundFlowError(500, 'SERVER_SEED_MISSING', 'Round is missing a server seed');
  }
  const orderedDeck = buildSeededDeck(serverSeed);
  for (const card of orderedDeck) {
    const key = cardKey(card);
    if (!used.has(key)) {
      used.add(key);
      return card;
    }
  }
  throw new RoundFlowError(500, 'DECK_EMPTY', 'No cards left in the deck');
}

function peekNextCard(serverSeed: string | null, used: Set<string>): DeckCard {
  if (!serverSeed) {
    throw new RoundFlowError(500, 'SERVER_SEED_MISSING', 'Round is missing a server seed');
  }
  const orderedDeck = buildSeededDeck(serverSeed);
  for (const card of orderedDeck) {
    const key = cardKey(card);
    if (!used.has(key)) {
      return card;
    }
  }
  throw new RoundFlowError(500, 'DECK_EMPTY', 'No cards left in the deck');
}

async function advanceDealerOneStep(
  manager: EntityManager,
  round: RoundWithRelations,
  dealerHand: Hand & { cards?: Card[] },
): Promise<DealerAction> {
  if (isDealerTurnComplete(dealerHand)) {
    return { kind: dealerActionKindForCompleteHand(dealerHand), cardId: null, dealerTurnComplete: true };
  }

  let evaluation = recalcHand(dealerHand, { preserveStanding: true });
  if (evaluation.isBlackjack) {
    dealerHand.status = HandStatus.BLACKJACK;
    await manager.getRepository(Hand).save(dealerHand);
    return { kind: 'BLACKJACK', cardId: null, dealerTurnComplete: true };
  }
  if (isDealerStandingTotal(evaluation)) {
    dealerHand.status = HandStatus.STOOD;
    await manager.getRepository(Hand).save(dealerHand);
    return { kind: 'STAND', cardId: null, dealerTurnComplete: true };
  }

  const usedCards = collectUsedCards(round);
  const card = drawCardFromSeed(round.serverSeed, usedCards);
  const entity = await addCardToHand(manager, dealerHand, card);
  evaluation = recalcHand(dealerHand, { preserveStanding: true });

  if (dealerHand.status === HandStatus.BUSTED) {
    await manager.getRepository(Hand).save(dealerHand);
    return { kind: 'BUST', cardId: entity.id, dealerTurnComplete: true };
  }

  if (isDealerStandingTotal(evaluation)) {
    dealerHand.status = HandStatus.STOOD;
    await manager.getRepository(Hand).save(dealerHand);
    return { kind: 'DRAW_CARD', cardId: entity.id, dealerTurnComplete: true };
  }

  await manager.getRepository(Hand).save(dealerHand);
  return { kind: 'DRAW_CARD', cardId: entity.id, dealerTurnComplete: false };
}

function canSettleRound(
  playerHands: Hand[],
  dealerHand: Hand,
  naturalBlackjackAllowed: boolean,
) {
  return (
    playerHands.every((hand) => hand.status === HandStatus.BUSTED) ||
    (naturalBlackjackAllowed && playerHands.some((hand) => hand.status === HandStatus.BLACKJACK)) ||
    dealerHand.status === HandStatus.BLACKJACK ||
    isDealerTurnComplete(dealerHand)
  );
}

function isDealerTurnComplete(dealerHand: Pick<Hand, 'status'> | undefined | null) {
  return (
    dealerHand?.status === HandStatus.STOOD ||
    dealerHand?.status === HandStatus.BUSTED ||
    dealerHand?.status === HandStatus.BLACKJACK
  );
}

function dealerActionKindForCompleteHand(dealerHand: Pick<Hand, 'status'>): DealerActionKind {
  if (dealerHand.status === HandStatus.BUSTED) return 'BUST';
  if (dealerHand.status === HandStatus.BLACKJACK) return 'BLACKJACK';
  if (dealerHand.status === HandStatus.STOOD) return 'STAND';
  return 'NONE';
}

function isDealerStandingTotal(evaluation: HandEvaluation) {
  return evaluation.total >= 17 && !(evaluation.total === 17 && evaluation.isSoft);
}

function shouldMaskDealerHole(round: RoundWithRelations, playerHands: Hand[]) {
  return (
    ACTIVE_ROUND_STATUSES.includes(round.status as typeof ACTIVE_ROUND_STATUSES[number]) &&
    playerHands.some((hand) => hand.status === HandStatus.ACTIVE)
  );
}

function getDealerHoleCardId(round: RoundWithRelations) {
  const dealerHand = getDealerHand(round);
  return sortCards(dealerHand?.cards ?? [])[1]?.id ?? null;
}

function recalcHand(
  hand: Hand,
  options?: { preserveStanding?: boolean; suppressBlackjack?: boolean },
): HandEvaluation {
  const cards = sortCards(hand.cards ?? []);
  if (!cards.length) {
    hand.handValue = null;
    return { total: 0, isSoft: false, isBlackjack: false };
  }

  const evaluation = evaluateHand(cards);
  hand.handValue = evaluation.total;

  if (evaluation.isBlackjack && !options?.suppressBlackjack) {
    hand.status = HandStatus.BLACKJACK;
    return evaluation;
  }
  if (evaluation.total > 21) {
    hand.status = HandStatus.BUSTED;
    return evaluation;
  }
  if (options?.preserveStanding && hand.status === HandStatus.STOOD) {
    return evaluation;
  }
  if (hand.status !== HandStatus.STOOD) {
    hand.status = HandStatus.ACTIVE;
  }
  return evaluation;
}

function evaluateHand(cards: Card[]): HandEvaluation {
  let total = 0;
  let softAces = 0;
  for (const card of cards) {
    if (card.rank === CardRank.ACE) {
      total += 11;
      softAces += 1;
    } else {
      total += cardBlackjackValue(card.rank);
    }
  }

  while (total > 21 && softAces > 0) {
    total -= 10;
    softAces -= 1;
  }

  const isBlackjack = cards.length === 2 && total === 21;
  return {
    total,
    isSoft: softAces > 0,
    isBlackjack,
  };
}

function cardBlackjackValue(rank: CardRank) {
  if (TEN_VALUE_RANKS.has(rank)) return 10;
  if (rank === CardRank.ACE) return 11;
  return Number(rank);
}

function resolveMainBet(
  playerHand: Hand,
  dealerHand: Hand,
  options: { naturalBlackjackAllowed?: boolean } = {},
): { status: MainBetStatus; multiplier: number } {
  const playerEval = recalcHand(playerHand, { preserveStanding: true });
  const dealerEval = recalcHand(dealerHand, { preserveStanding: true });

  if (playerHand.status === HandStatus.BUSTED) {
    return { status: MainBetStatus.LOST, multiplier: PAYOUT_LOSS };
  }

  if (playerHand.status === HandStatus.BLACKJACK && dealerHand.status !== HandStatus.BLACKJACK) {
    return {
      status: MainBetStatus.WON,
      multiplier: options.naturalBlackjackAllowed === false ? PAYOUT_WIN : PAYOUT_BLACKJACK,
    };
  }
  if (dealerHand.status === HandStatus.BUSTED) {
    return { status: MainBetStatus.WON, multiplier: PAYOUT_WIN };
  }
  if (dealerHand.status === HandStatus.BLACKJACK && playerHand.status !== HandStatus.BLACKJACK) {
    return { status: MainBetStatus.LOST, multiplier: PAYOUT_LOSS };
  }

  if (playerEval.total > dealerEval.total) {
    return { status: MainBetStatus.WON, multiplier: PAYOUT_WIN };
  }
  if (playerEval.total < dealerEval.total) {
    return { status: MainBetStatus.LOST, multiplier: PAYOUT_LOSS };
  }

  return { status: MainBetStatus.PUSH, multiplier: PAYOUT_PUSH };
}

function resolveSideBetOutcome(won: boolean, oddsValue: number): SideBetResolution {
  return won
    ? { status: SideBetStatus.WON, multiplier: oddsValue, isRefund: false }
    : { status: SideBetStatus.LOST, multiplier: 0, isRefund: false };
}

function buildBetceptionResolution(input: {
  mainBet: MainBet;
  sideBets: (SideBet & { type: SidebetType })[];
  sideBetResolutionSteps: BetceptionResolutionStep[];
  mainBetPayoutCents: bigint;
  splitBetStakeTotal: bigint;
  splitBetPayoutTotal: bigint;
  sideBetPayoutTotal: bigint;
}): BetceptionResolution {
  const totalStakeCents = input.sideBets.reduce(
    (sum, sideBet) => sum + decimalToCents(sideBet.amount),
    decimalToCents(input.mainBet.amount) + input.splitBetStakeTotal,
  );
  const totalPayoutCents = input.mainBetPayoutCents + input.splitBetPayoutTotal + input.sideBetPayoutTotal;
  return {
    depthLevel: 1 + countBetceptionCategories(input.sideBets),
    totalPayout: centsToDecimal(totalPayoutCents),
    totalStake: centsToDecimal(totalStakeCents),
    steps: [
      {
        id: `main-${input.mainBet.id}`,
        kind: 'MAIN_BET',
        status: input.mainBet.status,
        amount: input.mainBet.amount,
        payout: input.mainBet.settledAmount,
        multiplier: input.mainBet.payoutMultiplier,
        selection: null,
      },
      ...input.sideBetResolutionSteps,
    ],
  };
}

function buildSideBetResolutionStep(
  sideBet: SideBet & { type: SidebetType },
): BetceptionResolutionStep {
  return {
    id: `side-${sideBet.id}`,
    kind: sideBet.type.code,
    status: sideBet.status,
    amount: sideBet.amount,
    payout: sideBet.settledAmount,
    multiplier: sideBet.odds,
    selection: sideBetSelectionPayload(sideBet),
  };
}

function countBetceptionCategories(sideBets: (SideBet & { type: SidebetType })[]) {
  return new Set(
    sideBets
      .filter((sideBet) => BETCEPTION_SIDE_BET_CODES.has(sideBet.type.code))
      .map((sideBet) =>
        sideBet.type.code === 'CARD_EXACT' || sideBet.type.code === 'CARD_SUIT'
          ? 'CARD'
          : sideBet.type.code,
      ),
  ).size;
}

function sideBetSelectionPayload(sideBet: SideBet): Record<string, unknown> | null {
  if (sideBet.selectionJson) return sideBet.selectionJson;
  const selection: Record<string, unknown> = {};
  if (sideBet.predictedColor) selection['color'] = sideBet.predictedColor;
  if (sideBet.predictedSuit) selection['suit'] = sideBet.predictedSuit;
  if (sideBet.predictedRank) selection['rank'] = sideBet.predictedRank;
  if (sideBet.targetContext) selection['targetContext'] = sideBet.targetContext;
  return Object.keys(selection).length ? selection : null;
}

function evaluateSideBet(
  sideBet: SideBet & { type: SidebetType },
  round: RoundWithRelations,
  userId: string,
  oddsBonus = 0,
  context?: SideBetEvaluationContext,
): SideBetResolution {
  const baseOddsValue = Number(sideBet.odds ?? sideBet.type.baseOdds ?? 0);
  const oddsValue =
    oddsBonus > 0 && Number.isFinite(baseOddsValue) && baseOddsValue > 0
      ? baseOddsValue * (1 + oddsBonus)
      : baseOddsValue;
  if (!Number.isFinite(oddsValue) || oddsValue <= 0) {
    return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
  }

  const code = sideBet.type.code;
  if (code === 'CARD_EXACT') {
    const playerCards = getInitialUserPlayerCards(round, userId);
    const suit = (sideBet.selectionJson?.['suit'] as unknown) ?? sideBet.predictedSuit;
    const rank = (sideBet.selectionJson?.['rank'] as unknown) ?? sideBet.predictedRank;
    if (!isInitialCardBetSuit(suit) || !isInitialCardBetRank(rank)) {
      return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
    }
    const won = playerCards.some(
      (card) => card.rank === rank && card.suit === suit,
    );
    return resolveSideBetOutcome(won, oddsValue);
  }

  if (code === 'CARD_SUIT') {
    const suit = (sideBet.selectionJson?.['suit'] as unknown) ?? sideBet.predictedSuit;
    if (!isInitialCardBetSuit(suit)) {
      return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
    }
    const won = getInitialUserPlayerCards(round, userId).some((card) => card.suit === suit);
    return resolveSideBetOutcome(won, oddsValue);
  }

  if (code === 'DEALER_BUST') {
    const dealer = getDealerHand(round);
    if (!dealer) {
      return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
    }
    return resolveSideBetOutcome(dealer.status === HandStatus.BUSTED, oddsValue);
  }

  if (code === 'PILL_TRIGGER') {
    const expectedCode = sideBet.selectionJson?.['powerupCode'];
    if (typeof expectedCode !== 'string' || !isPowerPillCode(expectedCode) || !context) {
      return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
    }
    return resolveSideBetOutcome(context.triggeredPowerupEffect?.code === expectedCode, oddsValue);
  }

  if (code === 'PLAYER_BLACKJACK') {
    const player = getPlayerHand(round, userId);
    const won = player?.status === HandStatus.BLACKJACK && (player.cards?.length ?? 0) === 2;
    return resolveSideBetOutcome(won, oddsValue);
  }

  if (code === 'SPLIT_COUNT') {
    const expected = readSplitCountSelection(sideBet.selectionJson);
    if (!expected) {
      return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
    }
    return resolveSideBetOutcome(getSplitHands(round, userId).length === expected, oddsValue);
  }

  const targetCard = getTargetCard(round, sideBet.targetContext, userId);
  if (!targetCard) {
    return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
  }

  if (code === 'FIRST_CARD_COLOR') {
    const actualColor =
      targetCard.suit === CardSuit.HEARTS || targetCard.suit === CardSuit.DIAMONDS
        ? SideBetColor.RED
        : SideBetColor.BLACK;
    return resolveSideBetOutcome(sideBet.predictedColor === actualColor, oddsValue);
  }

  if (code === 'FIRST_CARD_SUIT') {
    return resolveSideBetOutcome(sideBet.predictedSuit === targetCard.suit, oddsValue);
  }

  if (code === 'FIRST_CARD_RANK') {
    return resolveSideBetOutcome(sideBet.predictedRank === targetCard.rank, oddsValue);
  }

  return { status: SideBetStatus.VOID, multiplier: 1, isRefund: true };
}

function getTargetCard(
  round: RoundWithRelations,
  context: SideBetTargetContext,
  userId: string,
): Card | null {
  if (context === SideBetTargetContext.FIRST_DEALER_CARD) {
    const dealer = getDealerHand(round);
    if (!dealer || !dealer.cards?.length) return null;
    return sortCards(dealer.cards)[0] ?? null;
  }
  const player = getPlayerHand(round, userId);
  if (!player || !player.cards?.length) return null;
  return sortCards(player.cards)[0] ?? null;
}

function getPlayerHand(round: RoundWithRelations, userId: string) {
  return (round.hands ?? []).find(
    (hand) =>
      hand.ownerType === HandOwnerType.PLAYER && hand.user?.id === userId,
  ) as (Hand & { cards: Card[] }) | undefined;
}

function getDealerHand(round: RoundWithRelations) {
  return (round.hands ?? []).find(
    (hand) => hand.ownerType === HandOwnerType.DEALER,
  ) as (Hand & { cards: Card[] }) | undefined;
}

function getMainBetForUser(round: RoundWithRelations, userId: string) {
  return (round.mainBets ?? []).find(
    (bet) => bet.user.id === userId && bet.hand?.ownerType !== HandOwnerType.PLAYER_SPLIT,
  );
}

function getActivePlayerHand(round: RoundWithRelations, userId: string) {
  const hands = round.hands ?? [];
  const primary = hands.find(
    (hand) =>
      hand.ownerType === HandOwnerType.PLAYER &&
      hand.user?.id === userId &&
      hand.status === HandStatus.ACTIVE,
  );
  if (primary) return primary as Hand & { cards: Card[] };

  const split = getSplitHands(round, userId).find((hand) => hand.status === HandStatus.ACTIVE);
  return (split ?? null) as (Hand & { cards: Card[] }) | null;
}

function getInitialUserPlayerCards(round: RoundWithRelations, userId: string) {
  const player = getPlayerHand(round, userId);
  return player ? sortCards(player.cards ?? []).slice(0, 2) : [];
}

function getSplitHands(round: RoundWithRelations, userId: string) {
  return (round.hands ?? []).filter(
    (hand) => hand.ownerType === HandOwnerType.PLAYER_SPLIT && hand.user?.id === userId,
  ).sort(compareHandOrder) as (Hand & { cards: Card[] })[];
}

function getAllPlayerHands(round: RoundWithRelations, userId: string) {
  return (round.hands ?? []).filter(
    (hand) =>
      (hand.ownerType === HandOwnerType.PLAYER || hand.ownerType === HandOwnerType.PLAYER_SPLIT) &&
      hand.user?.id === userId,
  ).sort((a, b) => {
    if (a.ownerType !== b.ownerType) {
      return a.ownerType === HandOwnerType.PLAYER ? -1 : 1;
    }
    return compareHandOrder(a, b);
  }) as (Hand & { cards: Card[] })[];
}

function getMainBetForHand(round: RoundWithRelations, handId: string) {
  return (round.mainBets ?? []).find((bet) => bet.hand?.id === handId);
}

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.drawOrder - b.drawOrder);
}

function compareHandOrder(a: Hand, b: Hand): number {
  const created = Number(new Date(a.createdAt).getTime()) - Number(new Date(b.createdAt).getTime());
  if (Number.isFinite(created) && created !== 0) return created;
  return Number(a.id) - Number(b.id);
}

function collectUsedCards(round: RoundWithRelations) {
  const set = new Set<string>();
  for (const hand of round.hands ?? []) {
    for (const card of hand.cards ?? []) {
      set.add(cardKey(card));
    }
  }
  return set;
}

function buildDeck(): DeckCard[] {
  const ranks = Object.values(CardRank);
  const suits = Object.values(CardSuit);
  const deck: DeckCard[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit } as DeckCard);
    }
  }
  return deck;
}

function cardKey(card: { rank: CardRank; suit: CardSuit }) {
  return `${card.rank}-${card.suit}`;
}

function buildSeededDeck(serverSeed: string): DeckCard[] {
  const deck = [...FULL_DECK];
  const rng = createSeededRandomIntGenerator(serverSeed);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = rng(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function createSeededRandomIntGenerator(serverSeed: string) {
  let counter = 0;
  return (maxExclusive: number) => {
    if (maxExclusive <= 0) {
      throw new RoundFlowError(500, 'RNG_RANGE_ERROR', 'Random range must be positive');
    }
    const hash = crypto
      .createHash('sha256')
      .update(`${serverSeed}:${counter}`, 'utf8')
      .digest();
    counter += 1;
    return Number(bufferToBigInt(hash) % BigInt(maxExclusive));
  };
}

function bufferToBigInt(buffer: Buffer): bigint {
  return BigInt(`0x${buffer.toString('hex')}`);
}

export const roundTestUtils = {
  buildSeededDeck,
  calculateBetceptionComboBonus,
  calculateBetceptionOdds,
  drawCardFromSeed,
  evaluateHand,
  resolveMainBet,
  evaluateSideBet,
  validateBetceptionStakeCaps,
};
