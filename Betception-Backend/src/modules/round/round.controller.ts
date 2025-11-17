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
import type { RoundIdParams, StartRoundInput } from './round.schema.js';

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

const ACTIVE_ROUND_STATUSES = [
  RoundStatus.CREATED,
  RoundStatus.DEALING,
  RoundStatus.IN_PROGRESS,
] as const;

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
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new RoundFlowError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const betCents = decimalToCents(input.betAmount.toFixed(2));
      if (betCents <= 0n) {
        throw new RoundFlowError(400, 'INVALID_BET', 'Bet amount must be positive');
      }

      const preparedSideBets = await prepareSideBets(input.sideBets ?? [], manager);
      const totalSideBetCents = preparedSideBets.reduce(
        (sum, sideBet) => sum + sideBet.amountCents,
        0n,
      );
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
      const savedSideBets: SideBet[] = [];
      for (const prepared of preparedSideBets) {
        const sideBet = sideBetRepo.create({
          round,
          user,
          type: prepared.type,
          amount: centsToDecimal(prepared.amountCents),
          predictedColor: prepared.predictedColor,
          predictedSuit: prepared.predictedSuit,
          predictedRank: prepared.predictedRank,
          targetContext: prepared.targetContext,
          odds: prepared.type.baseOdds,
        });
        await sideBetRepo.save(sideBet);
        savedSideBets.push(sideBet);

        betPlacementTxs.push(
          walletRepo.create({
            user,
            kind: WalletTransactionKind.BET_PLACE,
            amount: centsToDecimal(-prepared.amountCents),
            refTable: 'side_bets',
            refId: sideBet.id,
          }),
        );
      }

      if (betPlacementTxs.length) {
        await walletRepo.save(betPlacementTxs);
      }

      playerHand.cards = playerHand.cards ?? [];
      dealerHand.cards = dealerHand.cards ?? [];
      recalcHand(playerHand);
      recalcHand(dealerHand);
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

      const playerHand = getPlayerHand(round, userId);
      if (!playerHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Player hand not found');
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

      const playerHand = getPlayerHand(round, userId);
      if (!playerHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Player hand not found');
      }
      if (playerHand.status !== HandStatus.ACTIVE) {
        throw new RoundFlowError(400, 'HAND_LOCKED', 'Player hand cannot stand');
      }

      playerHand.status = HandStatus.STOOD;
      await manager.getRepository(Hand).save(playerHand);

      const usedCards = collectUsedCards(round);
      await completeDealerHand(manager, round, usedCards, playerHand);
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

    await AppDataSource.transaction(async (manager) => {
      const round = await loadRoundOrFail(roundId, userId, manager);
      if (round.status === RoundStatus.SETTLED) {
        throw new RoundFlowError(409, 'ROUND_SETTLED', 'Round already settled');
      }

      const playerHand = getPlayerHand(round, userId);
      const dealerHand = getDealerHand(round);
      if (!playerHand || !dealerHand) {
        throw new RoundFlowError(404, 'HAND_NOT_FOUND', 'Hands not found');
      }
      if (playerHand.status === HandStatus.ACTIVE) {
        throw new RoundFlowError(409, 'ROUND_ACTIVE', 'Complete your turn before settling');
      }

      const usedCards = collectUsedCards(round);
      await completeDealerHand(manager, round, usedCards, playerHand);

      const mainBet = getMainBetForUser(round, userId);
      if (!mainBet) {
        throw new RoundFlowError(404, 'BET_NOT_FOUND', 'Main bet missing');
      }

      const resolution = resolveMainBet(playerHand, dealerHand);
      const settledAmountDecimal = multiplyMoney(mainBet.amount, resolution.multiplier);
      const settledAmountCents = decimalToCents(settledAmountDecimal);

      mainBet.status = resolution.status;
      mainBet.payoutMultiplier = resolution.multiplier.toFixed(3);
      mainBet.settledAmount = settledAmountDecimal;
      mainBet.settledAt = new Date();
      await manager.getRepository(MainBet).save(mainBet);

      const walletRepo = manager.getRepository(WalletTransaction);
      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new RoundFlowError(404, 'USER_NOT_FOUND', 'User not found');
      }

      let pendingCredit = 0n;
      const walletTxs: WalletTransaction[] = [];
      if (settledAmountCents > 0n) {
        const kind =
          resolution.status === MainBetStatus.PUSH ||
          resolution.status === MainBetStatus.REFUNDED
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

      const sideBetRepo = manager.getRepository(SideBet);
      const playerSideBets = (round.sideBets ?? []).filter(
        (sideBet) => sideBet.user.id === userId,
      );
      for (const sideBet of playerSideBets) {
        if (sideBet.status !== SideBetStatus.PLACED) continue;
        const outcome = evaluateSideBet(sideBet, round, sideBet.user.id);
        const payoutDecimal = multiplyMoney(sideBet.amount, outcome.multiplier);
        const payoutCents = decimalToCents(payoutDecimal);

        sideBet.status = outcome.status;
        sideBet.settledAt = new Date();
        sideBet.settledAmount = payoutDecimal;
        sideBet.odds = sideBet.odds ?? sideBet.type.baseOdds;
        await sideBetRepo.save(sideBet);

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
        }
      }

      if (pendingCredit > 0n) {
        const balance = decimalToCents(user.balance);
        user.balance = centsToDecimal(balance + pendingCredit);
        await userRepo.save(user);
      }
      if (walletTxs.length) {
        await walletRepo.save(walletTxs);
      }

      round.status = RoundStatus.SETTLED;
      round.endedAt = new Date();
      await manager.getRepository(Round).save(round);
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
): Promise<PreparedSideBet[]> {
  if (!inputs.length) return [];

  const typeRepo = manager.getRepository(SidebetType);
  const uniqueIds = [...new Set(inputs.map((item) => item.typeId))];
  const types = await typeRepo.findBy({ id: In(uniqueIds) });
  const typeMap = new Map(types.map((type) => [type.id, type]));

  return inputs.map((input, index) => {
    const type = typeMap.get(input.typeId);
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

    return {
      type,
      amountCents,
      predictedColor: input.predictedColor ?? null,
      predictedSuit: input.predictedSuit ?? null,
      predictedRank: input.predictedRank ?? null,
      targetContext: input.targetContext ?? SideBetTargetContext.FIRST_PLAYER_CARD,
    };
  });
}

function validateSideBetPayload(
  type: SidebetType,
  input: StartRoundInput['sideBets'][number],
  index: number,
) {
  const code = type.code;
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

function serializeRound(round: RoundWithRelations, userId: string) {
  const playerHand = getPlayerHand(round, userId);
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
    playerHand: serializeHand(playerHand),
    dealerHand: serializeHand(dealerHand),
    sideBets,
    fairness: buildFairnessPayload(round),
  };
}

function serializeHand(hand: Hand & { cards?: Card[] }) {
  return {
    id: hand.id,
    ownerType: hand.ownerType,
    status: hand.status,
    handValue: hand.handValue,
    cards: sortCards(hand.cards ?? []).map((card) => ({
      id: card.id,
      rank: card.rank,
      suit: card.suit,
      drawOrder: card.drawOrder,
      createdAt: card.createdAt,
    })),
  };
}

function dealInitialCards(
  manager: EntityManager,
  playerHand: Hand,
  dealerHand: Hand,
  usedCards: Set<string>,
  serverSeed: string,
) {
  const sequence = [playerHand, dealerHand, playerHand, dealerHand];
  return sequence.reduce<Promise<void>>(async (prev, hand) => {
    await prev;
    const card = drawCardFromSeed(serverSeed, usedCards);
    await addCardToHand(manager, hand, card);
  }, Promise.resolve());
}

async function addCardToHand(
  manager: EntityManager,
  hand: Hand,
  card: DeckCard,
) {
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

async function completeDealerHand(
  manager: EntityManager,
  round: RoundWithRelations,
  usedCards: Set<string>,
  playerHand: Hand,
) {
  const dealerHand = getDealerHand(round);
  if (!dealerHand) return;

  let evaluation = recalcHand(dealerHand, { preserveStanding: true });
  if (isTerminalHandStatus(dealerHand.status)) {
    await manager.getRepository(Hand).save(dealerHand);
    return;
  }
  if (playerHand.status === HandStatus.BUSTED) {
    dealerHand.status = HandStatus.STOOD;
    await manager.getRepository(Hand).save(dealerHand);
    return;
  }

  while (
    evaluation.total < 17 ||
    (evaluation.total === 17 && evaluation.isSoft)
  ) {
    const card = drawCardFromSeed(round.serverSeed, usedCards);
    await addCardToHand(manager, dealerHand, card);
    evaluation = recalcHand(dealerHand, { preserveStanding: true });
    if (isHandBusted(dealerHand)) break;
  }

  if (!isTerminalHandStatus(dealerHand.status)) {
    dealerHand.status = HandStatus.STOOD;
  }

  await manager.getRepository(Hand).save(dealerHand);
}

function recalcHand(
  hand: Hand,
  options?: { preserveStanding?: boolean },
): HandEvaluation {
  const cards = sortCards(hand.cards ?? []);
  if (!cards.length) {
    hand.handValue = null;
    return { total: 0, isSoft: false, isBlackjack: false };
  }

  const evaluation = evaluateHand(cards);
  hand.handValue = evaluation.total;

  if (evaluation.isBlackjack) {
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
    } else if (
      card.rank === CardRank.KING ||
      card.rank === CardRank.QUEEN ||
      card.rank === CardRank.JACK ||
      card.rank === CardRank.TEN
    ) {
      total += 10;
    } else {
      total += Number(card.rank);
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

function resolveMainBet(
  playerHand: Hand,
  dealerHand: Hand,
): { status: MainBetStatus; multiplier: number } {
  const playerEval = recalcHand(playerHand, { preserveStanding: true });
  const dealerEval = recalcHand(dealerHand, { preserveStanding: true });

  if (playerHand.status === HandStatus.BUSTED) {
    return { status: MainBetStatus.LOST, multiplier: 0 };
  }

  if (playerHand.status === HandStatus.BLACKJACK && dealerHand.status !== HandStatus.BLACKJACK) {
    return { status: MainBetStatus.WON, multiplier: 2.5 };
  }
  if (dealerHand.status === HandStatus.BUSTED) {
    return { status: MainBetStatus.WON, multiplier: 2 };
  }
  if (dealerHand.status === HandStatus.BLACKJACK && playerHand.status !== HandStatus.BLACKJACK) {
    return { status: MainBetStatus.LOST, multiplier: 0 };
  }

  if (playerEval.total > dealerEval.total) {
    return { status: MainBetStatus.WON, multiplier: 2 };
  }
  if (playerEval.total < dealerEval.total) {
    return { status: MainBetStatus.LOST, multiplier: 0 };
  }

  return { status: MainBetStatus.PUSH, multiplier: 1 };
}

function evaluateSideBet(
  sideBet: SideBet & { type: SidebetType },
  round: RoundWithRelations,
  userId: string,
): SideBetResolution {
  const oddsValue = Number(sideBet.odds ?? sideBet.type.baseOdds ?? 0);
  if (!Number.isFinite(oddsValue) || oddsValue <= 0) {
    return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
  }

  const targetCard = getTargetCard(round, sideBet.targetContext, userId);
  if (!targetCard) {
    return { status: SideBetStatus.REFUNDED, multiplier: 1, isRefund: true };
  }

  const code = sideBet.type.code;
  if (code === 'FIRST_CARD_COLOR') {
    const actualColor =
      targetCard.suit === CardSuit.HEARTS || targetCard.suit === CardSuit.DIAMONDS
        ? SideBetColor.RED
        : SideBetColor.BLACK;
    if (sideBet.predictedColor === actualColor) {
      return { status: SideBetStatus.WON, multiplier: oddsValue, isRefund: false };
    }
    return { status: SideBetStatus.LOST, multiplier: 0, isRefund: false };
  }

  if (code === 'FIRST_CARD_SUIT') {
    if (sideBet.predictedSuit === targetCard.suit) {
      return { status: SideBetStatus.WON, multiplier: oddsValue, isRefund: false };
    }
    return { status: SideBetStatus.LOST, multiplier: 0, isRefund: false };
  }

  if (code === 'FIRST_CARD_RANK') {
    if (sideBet.predictedRank === targetCard.rank) {
      return { status: SideBetStatus.WON, multiplier: oddsValue, isRefund: false };
    }
    return { status: SideBetStatus.LOST, multiplier: 0, isRefund: false };
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
    (bet) => bet.user.id === userId,
  );
}

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.drawOrder - b.drawOrder);
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
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
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
  drawCardFromSeed,
};

function isTerminalHandStatus(status: HandStatus) {
  return status === HandStatus.BLACKJACK || status === HandStatus.BUSTED;
}

function isHandBusted(hand: Hand) {
  return hand.status === HandStatus.BUSTED;
}
