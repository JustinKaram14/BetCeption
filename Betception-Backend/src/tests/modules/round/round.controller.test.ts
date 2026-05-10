import {
  getActiveRound,
  getRound,
  dealerStepRound,
  hitRound,
  peekCard,
  settleRound,
  standRound,
  startRound,
  swapCard,
  undoHit,
} from '../../../modules/round/round.controller.js';
import crypto from 'crypto';
import { Card } from '../../../entity/Card.js';
import { Hand } from '../../../entity/Hand.js';
import { MainBet } from '../../../entity/MainBet.js';
import { PowerupConsumption } from '../../../entity/PowerupConsumption.js';
import { PowerupType } from '../../../entity/PowerupType.js';
import { Round } from '../../../entity/Round.js';
import { SideBet } from '../../../entity/SideBet.js';
import { SidebetType } from '../../../entity/SidebetType.js';
import { User } from '../../../entity/User.js';
import { UserCrate } from '../../../entity/UserCrate.js';
import { UserPowerup } from '../../../entity/UserPowerup.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import {
  CardRank,
  CardSuit,
  HandOwnerType,
  HandStatus,
  MainBetStatus,
  RoundStatus,
  WalletTransactionKind,
} from '../../../entity/enums.js';
import {
  createMockRepository,
  createMockRequest,
  createMockResponse,
  mockAppDataSourceRepositories,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';

function createCard(
  id: string,
  rank: CardRank,
  suit: CardSuit,
  drawOrder: number,
) {
  return {
    id,
    rank,
    suit,
    drawOrder,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  } as Card;
}

function createRoundFixture(overrides: Partial<any> = {}) {
  const playerUser = { id: 'user-1' } as User;
  const round = {
    id: 'round-1',
    status: RoundStatus.IN_PROGRESS,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    startedAt: new Date('2025-01-01T00:00:00Z'),
    endedAt: null,
    serverSeed: 'seed-123',
    serverSeedHash: 'hash-123',
    hands: [
      {
        id: 'dealer-hand',
        ownerType: HandOwnerType.DEALER,
        status: HandStatus.ACTIVE,
        handValue: 17,
        cards: [
          createCard('dealer-1', CardRank.TEN, CardSuit.HEARTS, 1),
          createCard('dealer-2', CardRank.SEVEN, CardSuit.CLUBS, 2),
        ],
        user: null,
      },
      {
        id: 'player-hand',
        ownerType: HandOwnerType.PLAYER,
        status: HandStatus.ACTIVE,
        handValue: 18,
        cards: [
          createCard('player-1', CardRank.TEN, CardSuit.SPADES, 1),
          createCard('player-2', CardRank.EIGHT, CardSuit.DIAMONDS, 2),
        ],
        user: playerUser,
      },
    ],
    mainBets: [
      {
        id: 'bet-1',
        amount: '10.00',
        status: MainBetStatus.PLACED,
        payoutMultiplier: null,
        settledAmount: null,
        settledAt: null,
        user: playerUser,
        hand: { id: 'player-hand' },
      },
    ],
    sideBets: [],
    ...overrides,
  } as any;

  return round;
}

describe('round.controller', () => {
  describe('startRound', () => {
    it('returns 401 when the user is not authenticated', async () => {
      const req = createMockRequest({
        body: { betAmount: 10 },
      });
      const res = createMockResponse();

      await startRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
      });
    });

    it('creates a round, debits the wallet, and returns the serialized round', async () => {
      const user = {
        id: 'user-1',
        username: 'neo',
        balance: '100.00',
      } as User;

      const handRepo = createMockRepository<Hand>({
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data) => ({ id: `${data.ownerType}-id`, ...data })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const roundRepo = createMockRepository<Round>({
        create: jest.fn().mockImplementation((data) => ({ id: 'round-1', createdAt: new Date('2025-01-01T00:00:00Z'), ...data })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const cardRepo = createMockRepository<Card>({
        create: jest.fn().mockImplementation((data) => ({
          id: `card-${data.hand.ownerType}-${data.drawOrder}`,
          createdAt: new Date('2025-01-01T00:00:00Z'),
          ...data,
        })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const mainBetRepo = createMockRepository<MainBet>({
        create: jest.fn().mockImplementation((data) => ({ id: 'bet-1', ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((data) => ({ id: `tx-${walletRepo.create.mock.calls.length + 1}`, ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const sideBetRepo = createMockRepository<SideBet>();
      const sidebetTypeRepo = createMockRepository<SidebetType>({
        findBy: jest.fn().mockResolvedValue([]),
      } as any);

      const txRepos = new Map<any, any>([
        [Hand, handRepo],
        [User, userRepo],
        [Round, roundRepo],
        [Card, cardRepo],
        [MainBet, mainBetRepo],
        [WalletTransaction, walletRepo],
        [SideBet, sideBetRepo],
        [SidebetType, sidebetTypeRepo],
      ]);
      mockAppDataSourceTransaction(txRepos);

      const loadedRoundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(createRoundFixture()),
      });
      mockAppDataSourceRepositories(new Map([[Round, loadedRoundRepo]]));

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        body: { betAmount: 10 },
      });
      const res = createMockResponse();

      await startRound(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ balance: '90.00' }),
      );
      expect(mainBetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '10.00',
          status: MainBetStatus.PLACED,
        }),
      );
      expect(walletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: WalletTransactionKind.BET_PLACE,
          amount: '-10.00',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({
            id: 'round-1',
            status: RoundStatus.IN_PROGRESS,
          }),
        }),
      );
    });

    it('creates Betception side bets and debits the combined stake', async () => {
      const user = {
        id: 'user-1',
        username: 'neo',
        balance: '500.00',
        activePowerupType: { code: 'RED_PILL' },
      } as unknown as User;

      const handRepo = createMockRepository<Hand>({
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data) => ({ id: `${data.ownerType}-id`, ...data })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const roundRepo = createMockRepository<Round>({
        create: jest.fn().mockImplementation((data) => ({ id: 'round-1', createdAt: new Date('2025-01-01T00:00:00Z'), ...data })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const cardRepo = createMockRepository<Card>({
        create: jest.fn().mockImplementation((data) => ({
          id: `card-${data.hand.ownerType}-${data.drawOrder}`,
          createdAt: new Date('2025-01-01T00:00:00Z'),
          ...data,
        })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const mainBetRepo = createMockRepository<MainBet>({
        create: jest.fn().mockImplementation((data) => ({ id: 'bet-1', ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((data) => ({ id: `tx-${walletRepo.create.mock.calls.length + 1}`, ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      let sideBetId = 0;
      const sideBetRepo = createMockRepository<SideBet>({
        create: jest.fn().mockImplementation((data) => ({ id: `side-${++sideBetId}`, ...data })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const sidebetTypeRepo = createMockRepository<SidebetType>({
        find: jest.fn().mockResolvedValue([
          { id: 1, code: 'CARD_EXACT', baseOdds: '12.000' },
          { id: 2, code: 'DEALER_BUST', baseOdds: '3.000' },
          { id: 3, code: 'PILL_TRIGGER', baseOdds: '5.000' },
          { id: 4, code: 'PLAYER_BLACKJACK', baseOdds: '12.000' },
        ]),
      } as any);

      const txRepos = new Map<any, any>([
        [Hand, handRepo],
        [User, userRepo],
        [Round, roundRepo],
        [Card, cardRepo],
        [MainBet, mainBetRepo],
        [WalletTransaction, walletRepo],
        [SideBet, sideBetRepo],
        [SidebetType, sidebetTypeRepo],
      ]);
      mockAppDataSourceTransaction(txRepos);

      const loadedRoundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(createRoundFixture()),
      });
      mockAppDataSourceRepositories(new Map([[Round, loadedRoundRepo]]));

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        body: {
          betAmount: 100,
          sideBets: [
            { typeCode: 'CARD_EXACT', amount: 25, predictedSuit: CardSuit.HEARTS, predictedRank: CardRank.JACK },
            { typeCode: 'DEALER_BUST', amount: 10 },
            { typeCode: 'PILL_TRIGGER', amount: 5 },
            { typeCode: 'PLAYER_BLACKJACK', amount: 15 },
          ],
        },
      });
      const res = createMockResponse();

      await startRound(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ balance: '345.00' }),
      );
      expect(sideBetRepo.save).toHaveBeenCalledTimes(4);
      expect(sideBetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '25.00',
          predictedSuit: CardSuit.HEARTS,
          predictedRank: CardRank.JACK,
          selectionJson: { suit: CardSuit.HEARTS, rank: CardRank.JACK },
          odds: '12.000',
        }),
      );
      expect(sideBetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '10.00',
          selectionJson: { target: 'DEALER', outcome: 'BUST' },
          odds: '3.000',
        }),
      );
      expect(sideBetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '5.00',
          selectionJson: { powerupCode: 'RED_PILL', color: 'red' },
          odds: '5.000',
        }),
      );
      expect(walletRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ refTable: 'main_bets', amount: '-100.00' }),
          expect.objectContaining({ refTable: 'side_bets', amount: '-25.00' }),
          expect.objectContaining({ refTable: 'side_bets', amount: '-10.00' }),
          expect.objectContaining({ refTable: 'side_bets', amount: '-5.00' }),
          expect.objectContaining({ refTable: 'side_bets', amount: '-15.00' }),
        ]),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 404 when user is not found in the transaction', async () => {
      const handRepo = createMockRepository<Hand>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Hand, handRepo],
          [User, userRepo],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        body: { betAmount: 10 },
      });
      const res = createMockResponse();

      await startRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found', code: 'USER_NOT_FOUND' });
    });

    it('returns 400 when the bet amount is zero', async () => {
      const handRepo = createMockRepository<Hand>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      const user = { id: 'user-1', balance: '100.00' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const sidebetTypeRepo = createMockRepository<SidebetType>({
        findBy: jest.fn().mockResolvedValue([]),
      } as any);

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Hand, handRepo],
          [User, userRepo],
          [SidebetType, sidebetTypeRepo],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        body: { betAmount: 0 },
      });
      const res = createMockResponse();

      await startRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bet amount must be positive',
        code: 'INVALID_BET',
      });
    });

    it('returns 400 when the balance is insufficient for the bet', async () => {
      const handRepo = createMockRepository<Hand>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      const user = { id: 'user-1', balance: '5.00' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const sidebetTypeRepo = createMockRepository<SidebetType>({
        findBy: jest.fn().mockResolvedValue([]),
      } as any);

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Hand, handRepo],
          [User, userRepo],
          [SidebetType, sidebetTypeRepo],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        body: { betAmount: 10 },
      });
      const res = createMockResponse();

      await startRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not enough balance for bets',
        code: 'INSUFFICIENT_FUNDS',
      });
    });
  });

  describe('hitRound', () => {
    it('returns 409 when the round is not in progress', async () => {
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(
          createRoundFixture({ status: RoundStatus.SETTLED }),
        ),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, createMockRepository<Hand>()],
          [Card, createMockRepository<Card>()],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await hitRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Round is not accepting hits',
        code: 'ROUND_NOT_ACTIVE',
      });
    });

    it('returns 400 when the player hand is locked (stood)', async () => {
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: 17,
            cards: [],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 18,
            cards: [],
            user: { id: 'user-1' },
          },
        ],
      });
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, createMockRepository<Hand>()],
          [Card, createMockRepository<Card>()],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await hitRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot draw cards for this hand',
        code: 'HAND_LOCKED',
      });
    });
  });

  describe('standRound', () => {
    it('marks the player hand as stood and returns the updated round', async () => {
      const round = createRoundFixture();
      const handRepo = createMockRepository<Hand>({
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const cardRepo = createMockRepository<Card>({
        create: jest.fn(),
      });
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, handRepo],
          [Card, cardRepo],
        ]),
      );
      mockAppDataSourceRepositories(
        new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await standRound(req as any, res);

      expect(handRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player-hand',
          status: HandStatus.STOOD,
        }),
      );
      expect(cardRepo.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({
            id: 'round-1',
          }),
          dealerAction: expect.objectContaining({
            kind: 'REVEAL_HOLE',
            cardId: 'dealer-2',
            dealerTurnComplete: false,
          }),
        }),
      );
    });

    it('returns 409 when the round is not in progress', async () => {
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(createRoundFixture({ status: RoundStatus.SETTLED })),
      });
      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, createMockRepository<Hand>()],
          [Card, createMockRepository<Card>()],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await standRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Round is not in progress',
        code: 'ROUND_NOT_ACTIVE',
      });
    });

    it('returns 400 when the player hand is locked', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 17, cards: [], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.BUSTED, handValue: 22, cards: [], user: { id: 'user-1' } },
        ],
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, createMockRepository<Hand>()],
          [Card, createMockRepository<Card>()],
        ]),
      );

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await standRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Player hand cannot stand', code: 'HAND_LOCKED' });
    });
  });

  describe('getActiveRound', () => {
    it('returns 401 when the user is not authenticated', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      await getActiveRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
      });
    });

    it('returns 404 when the user has no active round', async () => {
      const handRepo = createMockRepository<Hand>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[Hand, handRepo]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any });
      const res = createMockResponse();

      await getActiveRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No active round' });
    });
  });

  describe('settleRound', () => {
    it('returns 409 when the player turn is still active', async () => {
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(createRoundFixture()),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, createMockRepository<Hand>()],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Complete your turn before settling',
        code: 'ROUND_ACTIVE',
      });
    });

    it('returns 409 when the dealer turn is not finished yet', async () => {
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: 17,
            cards: [
              createCard('dealer-1', CardRank.TEN, CardSuit.HEARTS, 1),
              createCard('dealer-2', CardRank.SEVEN, CardSuit.CLUBS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 20,
            cards: [
              createCard('player-1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('player-2', CardRank.KING, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, createMockRepository<Hand>()],
        ]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Complete the dealer turn before settling',
        code: 'DEALER_TURN_ACTIVE',
      });
    });

    it('settles a winning round and credits the player wallet', async () => {
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.STOOD,
            handValue: 17,
            cards: [
              createCard('dealer-1', CardRank.TEN, CardSuit.HEARTS, 1),
              createCard('dealer-2', CardRank.SEVEN, CardSuit.CLUBS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 20,
            cards: [
              createCard('player-1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('player-2', CardRank.KING, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const user = {
        id: 'user-1',
        balance: '90.00',
      } as User;

      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({
        save: jest.fn().mockResolvedValue(undefined),
      });
      const mainBetRepo = createMockRepository<MainBet>({
        save: jest.fn().mockResolvedValue(undefined),
      });
      const sideBetRepo = createMockRepository<SideBet>({
        save: jest.fn().mockResolvedValue(undefined),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((data) => ({ id: 'tx-win', ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, handRepo],
          [MainBet, mainBetRepo],
          [SideBet, sideBetRepo],
          [WalletTransaction, walletRepo],
          [User, userRepo],
          [Card, createMockRepository<Card>()],
        ]),
      );
      mockAppDataSourceRepositories(
        new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]),
      );

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MainBetStatus.WON,
          payoutMultiplier: '2.000',
          settledAmount: '20.00',
        }),
      );
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ balance: '110.00' }),
      );
      expect(walletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: WalletTransactionKind.BET_WIN,
          amount: '20.00',
          refTable: 'main_bets',
          refId: 'bet-1',
        }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({
            id: 'round-1',
            status: RoundStatus.SETTLED,
          }),
        }),
      );
    });

    it('returns 409 when the round is already settled', async () => {
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(createRoundFixture({ status: RoundStatus.SETTLED })),
      });
      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, createMockRepository<Hand>()],
        ]),
      );
      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Round already settled', code: 'ROUND_SETTLED' });
    });

    it('settles a losing round and does not credit the player', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.STOOD, handValue: 20, cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.KING, CardSuit.CLUBS, 2)], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.STOOD, handValue: 16, cards: [createCard('p1', CardRank.TEN, CardSuit.SPADES, 1), createCard('p2', CardRank.SIX, CardSuit.DIAMONDS, 2)], user: { id: 'user-1' } },
        ],
      });
      const user = { id: 'user-1', balance: '90.00' } as User;
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({ create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })), save: jest.fn().mockResolvedValue(undefined) });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([[Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo], [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo], [Card, createMockRepository<Card>()]]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(mainBetRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: MainBetStatus.LOST }));
      expect(userRepo.save).not.toHaveBeenCalledWith(expect.objectContaining({ balance: '110.00' }));
    });

    it('settles a push and refunds the bet amount', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.STOOD, handValue: 17, cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2)], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.STOOD, handValue: 17, cards: [createCard('p1', CardRank.TEN, CardSuit.SPADES, 1), createCard('p2', CardRank.SEVEN, CardSuit.DIAMONDS, 2)], user: { id: 'user-1' } },
        ],
      });
      const user = { id: 'user-1', balance: '90.00' } as User;
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({ create: jest.fn().mockImplementation((d) => ({ id: 'tx-push', ...d })), save: jest.fn().mockResolvedValue(undefined) });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([[Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo], [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo], [Card, createMockRepository<Card>()]]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(mainBetRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: MainBetStatus.PUSH }));
      expect(walletRepo.create).toHaveBeenCalledWith(expect.objectContaining({ kind: WalletTransactionKind.BET_REFUND }));
    });
  });

  describe('getRound', () => {
    it('returns 401 when the user is not authenticated', async () => {
      const req = createMockRequest({ params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await getRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required', code: 'UNAUTHENTICATED' });
    });

    it('returns 404 when the round does not exist', async () => {
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(null) });
      mockAppDataSourceRepositories(new Map([[Round, roundRepo]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-999' } });
      const res = createMockResponse();

      await getRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Round not found' });
    });

    it('returns the round when found', async () => {
      const round = createRoundFixture();
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });
      mockAppDataSourceRepositories(new Map([[Round, roundRepo]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await getRound(req as any, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }));
    });
  });

  describe('hitRound (additional)', () => {
    it('draws a card and returns the updated round (happy path)', async () => {
      // Player: FIVE(S) + THREE(C) = 8 - safe, cannot bust on any single draw
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: 17,
            cards: [
              createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1),
              createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.ACTIVE,
            handValue: 8,
            cards: [
              createCard('p1', CardRank.FIVE, CardSuit.SPADES, 1),
              createCard('p2', CardRank.THREE, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });

      const cardRepo = createMockRepository<Card>({
        create: jest.fn().mockImplementation((data) => ({ id: 'card-new', ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({
        save: jest.fn().mockResolvedValue(undefined),
      });
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [Hand, handRepo],
        [Card, cardRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      })]]));

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
      });
      const res = createMockResponse();

      await hitRound(req as any, res);

      expect(cardRepo.create).toHaveBeenCalled();
      expect(handRepo.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({ id: 'round-1' }),
        }),
      );
    });

    it('returns 404 when the round does not belong to the user', async () => {
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: 17,
            cards: [],
            user: null,
          },
          // no player hand for user-1
          {
            id: 'player-hand-other',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.ACTIVE,
            handValue: 15,
            cards: [],
            user: { id: 'user-99' },
          },
        ],
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [Hand, createMockRepository<Hand>()],
        [Card, createMockRepository<Card>()],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await hitRound(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Round not found', code: 'ROUND_NOT_FOUND' });
    });
  });

  describe('settleRound (additional)', () => {
    it('dealer-step draws one card when dealer has soft 17', async () => {
      // Dealer: ACE(C) + SIX(H) = soft 17 → must draw per soft-17 rule
      // Player: TEN(S) + QUEEN(D) = 20, STOOD
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: 17,
            cards: [
              createCard('d1', CardRank.ACE, CardSuit.CLUBS, 1),
              createCard('d2', CardRank.SIX, CardSuit.HEARTS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 20,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.QUEEN, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const user = { id: 'user-1', balance: '90.00' } as User;

      const cardRepo = createMockRepository<Card>({
        create: jest.fn().mockImplementation((data) => ({ id: `card-${Date.now()}`, ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo], [Card, cardRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await dealerStepRound(req as any, res);

      // Dealer drew at least one card (soft 17 forces a draw)
      expect(cardRepo.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({ id: 'round-1' }),
          dealerAction: expect.objectContaining({ kind: 'DRAW_CARD', dealerTurnComplete: expect.any(Boolean) }),
        }),
      );
    });

    it('dealer already has blackjack — skips draw loop, no new card dealt', async () => {
      // Dealer: ACE + TEN = BJ (status BLACKJACK) → isTerminalHandStatus true → save & return
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.BLACKJACK,
            handValue: 21,
            cards: [
              createCard('d1', CardRank.ACE, CardSuit.CLUBS, 1),
              createCard('d2', CardRank.TEN, CardSuit.HEARTS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 18,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.EIGHT, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const user = { id: 'user-1', balance: '90.00' } as User;

      const cardRepo = createMockRepository<Card>({
        create: jest.fn().mockImplementation((data) => ({ id: `card-${Date.now()}`, ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo], [Card, cardRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(cardRepo.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
      );
    });

    it('player is busted — dealer stands immediately without drawing', async () => {
      // Player bust → completeDealerHand sets dealer STOOD and returns without entering draw loop
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: 17,
            cards: [
              createCard('d1', CardRank.TEN, CardSuit.CLUBS, 1),
              createCard('d2', CardRank.SEVEN, CardSuit.HEARTS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.BUSTED,
            handValue: 24,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.NINE, CardSuit.DIAMONDS, 2),
              createCard('p3', CardRank.FIVE, CardSuit.CLUBS, 3),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const user = { id: 'user-1', balance: '90.00' } as User;

      const cardRepo = createMockRepository<Card>({
        create: jest.fn().mockImplementation((data) => ({ id: `card-${Date.now()}`, ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo], [Card, cardRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(cardRepo.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
      );
    });

    it('dealer has no cards initially — draws until hard 17+, covers empty-hand recalcHand path', async () => {
      // Empty dealer hand → recalcHand returns {total:0} hitting the null-card branch, then draw loop runs
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: null,
            cards: [],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 18,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.EIGHT, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const user = { id: 'user-1', balance: '90.00' } as User;

      const cardRepo = createMockRepository<Card>({
        create: jest.fn().mockImplementation((data) => ({ id: `card-${Date.now()}`, ...data })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo], [Card, cardRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await dealerStepRound(req as any, res);

      expect(cardRepo.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({ id: 'round-1' }),
          dealerAction: expect.objectContaining({ kind: 'DRAW_CARD', dealerTurnComplete: expect.any(Boolean) }),
        }),
      );
    });

    it('dealer-step stands on hard 17 without drawing', async () => {
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.ACTIVE,
            handValue: 17,
            cards: [
              createCard('d1', CardRank.TEN, CardSuit.CLUBS, 1),
              createCard('d2', CardRank.SEVEN, CardSuit.HEARTS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 20,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.QUEEN, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const cardRepo = createMockRepository<Card>({
        create: jest.fn(),
      });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [Hand, handRepo],
        [Card, cardRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await dealerStepRound(req as any, res);

      expect(cardRepo.create).not.toHaveBeenCalled();
      expect(handRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'dealer-hand', status: HandStatus.STOOD }));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({ id: 'round-1' }),
          dealerAction: { kind: 'STAND', cardId: null, dealerTurnComplete: true },
        }),
      );
    });
  });

  describe('settleRound - legacy BET_BOOST powerups', () => {
    function buildWinRound() {
      return createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.STOOD,
            handValue: 17,
            cards: [
              createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1),
              createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 20,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.KING, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
    }

    function buildSettleRepos(round: any, consumptions: any[]) {
      const user = { id: 'user-1', balance: '90.00' } as User;
      const consumptionRepo = createMockRepository<PowerupConsumption>({
        find: jest.fn().mockResolvedValue(consumptions),
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });

      return { consumptionRepo, roundRepo, handRepo, mainBetRepo, sideBetRepo, walletRepo, userRepo };
    }

    it('ignores BET_BOOST_30 during settlement', async () => {
      const round = buildWinRound();
      const consumption = {
        type: { effectJson: { main_multiplier: 0.3 } } as unknown as PowerupType,
      } as unknown as PowerupConsumption;
      const { consumptionRepo, roundRepo, handRepo, mainBetRepo, sideBetRepo, walletRepo, userRepo } =
        buildSettleRepos(round, [consumption]);

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo],
        [Card, createMockRepository<Card>()], [PowerupConsumption, consumptionRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      // Legacy BET_BOOST consumptions no longer affect the main-bet payout.
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ payoutMultiplier: '2.000', settledAmount: '20.00' }),
      );
    });

    it('ignores BET_BOOST_100 during settlement', async () => {
      const round = buildWinRound();
      const consumption = {
        type: { effectJson: { main_multiplier: 1.0 } } as unknown as PowerupType,
      } as unknown as PowerupConsumption;
      const { consumptionRepo, roundRepo, handRepo, mainBetRepo, sideBetRepo, walletRepo, userRepo } =
        buildSettleRepos(round, [consumption]);

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo],
        [Card, createMockRepository<Card>()], [PowerupConsumption, consumptionRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      // Legacy BET_BOOST consumptions no longer affect the main-bet payout.
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ payoutMultiplier: '2.000', settledAmount: '20.00' }),
      );
    });

    it('BET_BOOST is ignored on a losing round (no extra payout)', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.STOOD, handValue: 20, cards: [createCard('d1', CardRank.KING, CardSuit.HEARTS, 1), createCard('d2', CardRank.KING, CardSuit.CLUBS, 2)], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.STOOD, handValue: 16, cards: [createCard('p1', CardRank.TEN, CardSuit.SPADES, 1), createCard('p2', CardRank.SIX, CardSuit.DIAMONDS, 2)], user: { id: 'user-1' } },
        ],
      });
      const consumption = {
        type: { effectJson: { main_multiplier: 1.0 } } as unknown as PowerupType,
      } as unknown as PowerupConsumption;
      const { consumptionRepo, roundRepo, handRepo, mainBetRepo, sideBetRepo, walletRepo, userRepo } =
        buildSettleRepos(round, [consumption]);

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo],
        [Card, createMockRepository<Card>()], [PowerupConsumption, consumptionRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      // Loss: multiplier stays 0, no extra payout from boost
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: MainBetStatus.LOST, payoutMultiplier: '0.000' }),
      );
    });

    it('does not stack legacy BET_BOOST consumptions', async () => {
      const round = buildWinRound();
      const consumptions = [
        { type: { effectJson: { main_multiplier: 0.3 } } as unknown as PowerupType } as unknown as PowerupConsumption,
        { type: { effectJson: { main_multiplier: 1.0 } } as unknown as PowerupType } as unknown as PowerupConsumption,
      ];
      const { consumptionRepo, roundRepo, handRepo, mainBetRepo, sideBetRepo, walletRepo, userRepo } =
        buildSettleRepos(round, consumptions);

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo],
        [Card, createMockRepository<Card>()], [PowerupConsumption, consumptionRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      // Legacy BET_BOOST consumptions no longer affect the main-bet payout.
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ payoutMultiplier: '2.000', settledAmount: '20.00' }),
      );
    });

    it('BET_BOOST is ignored on a push (bet=10 → settled=10 refund)', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.STOOD, handValue: 20, cards: [createCard('d1', CardRank.KING, CardSuit.HEARTS, 1), createCard('d2', CardRank.KING, CardSuit.CLUBS, 2)], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.STOOD, handValue: 20, cards: [createCard('p1', CardRank.KING, CardSuit.SPADES, 1), createCard('p2', CardRank.KING, CardSuit.DIAMONDS, 2)], user: { id: 'user-1' } },
        ],
      });
      const consumption = { type: { effectJson: { main_multiplier: 1.0 } } as unknown as PowerupType } as unknown as PowerupConsumption;
      const { consumptionRepo, roundRepo, handRepo, mainBetRepo, sideBetRepo, walletRepo, userRepo } =
        buildSettleRepos(round, [consumption]);

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo],
        [Card, createMockRepository<Card>()], [PowerupConsumption, consumptionRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      // Push: multiplier=1.0 (refund), boost NOT applied → payoutMultiplier stays '1.000'
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: MainBetStatus.PUSH, payoutMultiplier: '1.000' }),
      );
    });
  });

  describe('settleRound - power pills', () => {
    const redPillType = {
      id: 1,
      code: 'RED_PILL',
      title: 'Red Pill',
      description: '1:5 chance to trigger x3 payout on main wins.',
      minLevel: 1,
      price: '300.00',
      effectJson: { color: 'red', uses: 3 },
    } as PowerupType;
    const bluePillType = {
      id: 2,
      code: 'BLUE_PILL',
      title: 'Blue Pill',
      description: '1:8 chance to trigger safe-round protection (no loss).',
      minLevel: 1,
      price: '300.00',
      effectJson: { color: 'blue', uses: 3 },
    } as PowerupType;

    function buildWinRound() {
      return createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.STOOD,
            handValue: 17,
            cards: [
              createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1),
              createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 20,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.KING, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
    }

    function buildLossRound() {
      return createRoundFixture({
        hands: [
          {
            id: 'dealer-hand',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.STOOD,
            handValue: 20,
            cards: [
              createCard('d1', CardRank.KING, CardSuit.HEARTS, 1),
              createCard('d2', CardRank.KING, CardSuit.CLUBS, 2),
            ],
            user: null,
          },
          {
            id: 'player-hand',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.STOOD,
            handValue: 16,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.SIX, CardSuit.DIAMONDS, 2),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
    }

    function buildSettleRepos(round: any, userOverrides: Partial<User>) {
      const user = {
        id: 'user-1',
        balance: '90.00',
        xp: 0,
        level: 1,
        activePowerupType: null,
        activePowerupUsesRemaining: 0,
        ...userOverrides,
      } as User;
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });

      return { roundRepo, handRepo, mainBetRepo, sideBetRepo, walletRepo, userRepo };
    }

    function registerSettleRepos(round: any, repos: ReturnType<typeof buildSettleRepos>) {
      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, repos.roundRepo],
        [Hand, repos.handRepo],
        [MainBet, repos.mainBetRepo],
        [SideBet, repos.sideBetRepo],
        [WalletTransaction, repos.walletRepo],
        [User, repos.userRepo],
        [Card, createMockRepository<Card>()],
      ]));
      mockAppDataSourceRepositories(new Map([
        [Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })],
      ]));
    }

    it('triggers Red Pill on a main-bet win and multiplies payout by 3', async () => {
      jest.spyOn(crypto, 'randomInt').mockReturnValue(0 as never);
      const round = buildWinRound();
      const repos = buildSettleRepos(round, {
        activePowerupType: redPillType,
        activePowerupUsesRemaining: 3,
      });
      registerSettleRepos(round, repos);

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(repos.mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MainBetStatus.WON,
          payoutMultiplier: '6.000',
          settledAmount: '60.00',
        }),
      );
      expect(repos.userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: '150.00',
          activePowerupType: redPillType,
          activePowerupUsesRemaining: 2,
        }),
      );
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.triggeredPowerupEffect).toEqual({ code: 'RED_PILL', color: 'red' });
      expect(json.activePowerup).toMatchObject({ type: { code: 'RED_PILL' }, usesRemaining: 2 });
    });

    it('triggers Blue Pill on a main-bet loss and refunds the bet', async () => {
      jest.spyOn(crypto, 'randomInt').mockReturnValue(0 as never);
      const round = buildLossRound();
      const repos = buildSettleRepos(round, {
        activePowerupType: bluePillType,
        activePowerupUsesRemaining: 3,
      });
      registerSettleRepos(round, repos);

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(repos.mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MainBetStatus.REFUNDED,
          payoutMultiplier: '1.000',
          settledAmount: '10.00',
        }),
      );
      expect(repos.walletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: WalletTransactionKind.BET_REFUND,
          amount: '10.00',
        }),
      );
      expect(repos.userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: '100.00',
          activePowerupType: bluePillType,
          activePowerupUsesRemaining: 2,
        }),
      );
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.triggeredPowerupEffect).toEqual({ code: 'BLUE_PILL', color: 'blue' });
      expect(json.activePowerup).toMatchObject({ type: { code: 'BLUE_PILL' }, usesRemaining: 2 });
    });

    it('decrements uses on every settlement and clears the slot at zero', async () => {
      const round = buildLossRound();
      const repos = buildSettleRepos(round, {
        activePowerupType: redPillType,
        activePowerupUsesRemaining: 1,
      });
      registerSettleRepos(round, repos);

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(repos.mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MainBetStatus.LOST,
          payoutMultiplier: '0.000',
        }),
      );
      expect(repos.userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          activePowerupType: null,
          activePowerupUsesRemaining: 0,
        }),
      );
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.triggeredPowerupEffect).toBeNull();
      expect(json.expiredPowerup).toEqual({ code: 'RED_PILL', color: 'red' });
      expect(json.activePowerup).toBeNull();
    });
  });

  describe('settleRound — level-up crate', () => {
    it('creates a UserCrate when the player levels up during settlement', async () => {
      // Player: TEN + KING = 20 (STOOD), Dealer: TEN + SEVEN = 17 → PLAYER WINS → XP awarded
      // User starts at level 1 with xp=490 (just 10 XP below level 2 threshold of 500).
      // A win awards 85 XP base (25 base + 60 win), which pushes xp to 575 → level 2.
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.STOOD, handValue: 17,
            cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2)], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.STOOD, handValue: 20,
            cards: [createCard('p1', CardRank.TEN, CardSuit.SPADES, 1), createCard('p2', CardRank.KING, CardSuit.DIAMONDS, 2)], user: { id: 'user-1' } },
        ],
      });
      // xp=490, level=1 — one win (85 XP) pushes to 575 → level 2
      const user = { id: 'user-1', balance: '90.00', xp: 490, level: 1 } as User;

      const crateRepo = createMockRepository<UserCrate>({
        create: jest.fn().mockImplementation((d) => ({ id: 'crate-new', ...d })),
        save: jest.fn().mockImplementation(async (c) => c),
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo],
        [Card, createMockRepository<Card>()], [UserCrate, crateRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      // A crate should have been created for tier 1 (level 2 → tier 1)
      expect(crateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 1, acquiredLevel: 2 }),
      );
      expect(crateRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 1, acquiredLevel: 2 }),
      );

      // Response should include levelUpCrate
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.levelUpCrate).not.toBeNull();
      expect(json.levelUpCrate).toMatchObject({ tier: 1, tierLabel: 'Common', acquiredLevel: 2 });
    });

    it('does not create a crate when the player does not level up', async () => {
      // Player: TEN + SIX = 16 (STOOD), Dealer: TEN + KING = 20 → PLAYER LOSES → small XP
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.STOOD, handValue: 20,
            cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.KING, CardSuit.CLUBS, 2)], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.STOOD, handValue: 16,
            cards: [createCard('p1', CardRank.TEN, CardSuit.SPADES, 1), createCard('p2', CardRank.SIX, CardSuit.DIAMONDS, 2)], user: { id: 'user-1' } },
        ],
      });
      // xp=0, level=1 — a loss awards only 25 XP, not enough to reach level 2 (needs 500)
      const user = { id: 'user-1', balance: '90.00', xp: 0, level: 1 } as User;

      const crateRepo = createMockRepository<UserCrate>({
        create: jest.fn().mockImplementation((d) => ({ id: 'crate-new', ...d })),
        save: jest.fn().mockImplementation(async (c) => c),
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round), save: jest.fn().mockResolvedValue(undefined) });
      const handRepo = createMockRepository<Hand>({ save: jest.fn().mockResolvedValue(undefined) });
      const mainBetRepo = createMockRepository<MainBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const sideBetRepo = createMockRepository<SideBet>({ save: jest.fn().mockResolvedValue(undefined) });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo], [Hand, handRepo], [MainBet, mainBetRepo],
        [SideBet, sideBetRepo], [WalletTransaction, walletRepo], [User, userRepo],
        [Card, createMockRepository<Card>()], [UserCrate, crateRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await settleRound(req as any, res);

      expect(crateRepo.create).not.toHaveBeenCalled();
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.levelUpCrate).toBeNull();
    });
  });

  describe('getActiveRound (additional)', () => {
    it('returns the active round when one exists', async () => {
      const round = createRoundFixture();
      const activeHand = {
        id: 'player-hand',
        round: { id: 'round-1' },
      };
      const handRepo = createMockRepository<Hand>({
        findOne: jest.fn().mockResolvedValue(activeHand),
      });
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      });
      mockAppDataSourceRepositories(new Map<any, any>([
        [Hand, handRepo],
        [Round, roundRepo],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any });
      const res = createMockResponse();

      await getActiveRound(req as any, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
      );
    });
  });

  describe('peekCard', () => {
    it('returns the peeked card on success', async () => {
      const round = createRoundFixture();
      const mockUserPowerup = {
        id: 'up-1', quantity: 1,
        user: { id: 'user-1', level: 5 },
        type: { code: 'PEEK_CARD', minLevel: 1 },
      } as unknown as UserPowerup;
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });
      const userPowerupRepo = createMockRepository<UserPowerup>({
        findOne: jest.fn().mockResolvedValue(mockUserPowerup),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const consumptionRepo = createMockRepository<PowerupConsumption>({
        create: jest.fn().mockImplementation((d) => ({ id: 'cons-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, userPowerupRepo],
        [PowerupConsumption, consumptionRepo],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await peekCard(req as any, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ rank: expect.any(String), suit: expect.any(String) }),
      );
    });

    it('returns 409 when round is not IN_PROGRESS', async () => {
      const round = createRoundFixture({ status: RoundStatus.SETTLED });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, createMockRepository<UserPowerup>()],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await peekCard(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Round is not in progress', code: 'ROUND_NOT_ACTIVE' });
    });

    it('returns 400 when player hand is locked (stood)', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 17, cards: [], user: null },
          { id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.STOOD, handValue: 18, cards: [], user: { id: 'user-1' } },
        ],
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, createMockRepository<UserPowerup>()],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await peekCard(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot peek when hand is not active', code: 'HAND_LOCKED' });
    });

    it('returns 404 when PEEK_CARD powerup is not in inventory', async () => {
      const round = createRoundFixture();
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });
      const userPowerupRepo = createMockRepository<UserPowerup>({
        findOne: jest.fn().mockResolvedValue(null),
      });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, userPowerupRepo],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await peekCard(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'PEEK_CARD not in inventory', code: 'POWERUP_NOT_OWNED' });
    });
  });

  describe('undoHit', () => {
    it('removes the last player card and returns the updated round', async () => {
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 17,
            cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2)],
            user: null,
          },
          {
            id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.ACTIVE, handValue: 18,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.FIVE, CardSuit.DIAMONDS, 2),
              createCard('p3', CardRank.THREE, CardSuit.CLUBS, 3),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const mockUserPowerup = {
        id: 'up-1', quantity: 1,
        user: { id: 'user-1', level: 5 },
        type: { code: 'UNDO_HIT', minLevel: 1 },
      } as unknown as UserPowerup;

      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });
      const userPowerupRepo = createMockRepository<UserPowerup>({
        findOne: jest.fn().mockResolvedValue(mockUserPowerup),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const consumptionRepo = createMockRepository<PowerupConsumption>({
        create: jest.fn().mockImplementation((d) => ({ id: 'cons-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const cardRepo = createMockRepository<Card>({
        remove: jest.fn().mockResolvedValue(undefined),
      });
      const handRepo = createMockRepository<Hand>({
        save: jest.fn().mockResolvedValue(undefined),
      });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, userPowerupRepo],
        [PowerupConsumption, consumptionRepo],
        [Card, cardRepo],
        [Hand, handRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await undoHit(req as any, res);

      expect(cardRepo.remove).toHaveBeenCalled();
      expect(handRepo.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
      );
    });

    it('returns 409 when round is not IN_PROGRESS', async () => {
      const round = createRoundFixture({ status: RoundStatus.SETTLED });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, createMockRepository<UserPowerup>()],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
        [Card, createMockRepository<Card>()],
        [Hand, createMockRepository<Hand>()],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await undoHit(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Round is not in progress', code: 'ROUND_NOT_ACTIVE' });
    });

    it('returns 400 when player hand has 2 or fewer cards (cannot undo initial deal)', async () => {
      const round = createRoundFixture();
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, createMockRepository<UserPowerup>()],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
        [Card, createMockRepository<Card>()],
        [Hand, createMockRepository<Hand>()],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await undoHit(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot undo the initial deal', code: 'CANNOT_UNDO' });
    });

    it('returns 404 when UNDO_HIT powerup is not in inventory', async () => {
      const round = createRoundFixture({
        hands: [
          {
            id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 17,
            cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2)],
            user: null,
          },
          {
            id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.ACTIVE, handValue: 18,
            cards: [
              createCard('p1', CardRank.TEN, CardSuit.SPADES, 1),
              createCard('p2', CardRank.FIVE, CardSuit.DIAMONDS, 2),
              createCard('p3', CardRank.THREE, CardSuit.CLUBS, 3),
            ],
            user: { id: 'user-1' },
          },
        ],
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });
      const userPowerupRepo = createMockRepository<UserPowerup>({ findOne: jest.fn().mockResolvedValue(null) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, userPowerupRepo],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
        [Card, createMockRepository<Card>()],
        [Hand, createMockRepository<Hand>()],
      ]));

      const req = createMockRequest({ user: { sub: 'user-1' } as any, params: { roundId: 'round-1' } });
      const res = createMockResponse();

      await undoHit(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'UNDO_HIT not in inventory', code: 'POWERUP_NOT_OWNED' });
    });
  });

  describe('swapCard', () => {
    it('swaps the specified card and returns the updated round', async () => {
      const round = createRoundFixture();
      const mockUserPowerup = {
        id: 'up-1', quantity: 1,
        user: { id: 'user-1', level: 5 },
        type: { code: 'CARD_SWAP', minLevel: 1 },
      } as unknown as UserPowerup;

      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });
      const userPowerupRepo = createMockRepository<UserPowerup>({
        findOne: jest.fn().mockResolvedValue(mockUserPowerup),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const consumptionRepo = createMockRepository<PowerupConsumption>({
        create: jest.fn().mockImplementation((d) => ({ id: 'cons-1', ...d })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const cardRepo = createMockRepository<Card>({
        save: jest.fn().mockImplementation(async (entity) => entity),
      });
      const handRepo = createMockRepository<Hand>({
        save: jest.fn().mockResolvedValue(undefined),
      });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, userPowerupRepo],
        [PowerupConsumption, consumptionRepo],
        [Card, cardRepo],
        [Hand, handRepo],
      ]));
      mockAppDataSourceRepositories(new Map([[Round, createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) })]]));

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
        body: { cardId: 'player-1' },
      });
      const res = createMockResponse();

      await swapCard(req as any, res);

      expect(cardRepo.save).toHaveBeenCalled();
      expect(handRepo.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
      );
    });

    it('returns 409 when round is not IN_PROGRESS', async () => {
      const round = createRoundFixture({ status: RoundStatus.SETTLED });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, createMockRepository<UserPowerup>()],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
        [Card, createMockRepository<Card>()],
        [Hand, createMockRepository<Hand>()],
      ]));

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
        body: { cardId: 'player-1' },
      });
      const res = createMockResponse();

      await swapCard(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Round is not in progress', code: 'ROUND_NOT_ACTIVE' });
    });

    it('returns 400 when player hand is locked (busted)', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 17, cards: [], user: null },
          {
            id: 'player-hand', ownerType: HandOwnerType.PLAYER, status: HandStatus.BUSTED, handValue: 22,
            cards: [createCard('player-1', CardRank.TEN, CardSuit.SPADES, 1), createCard('player-2', CardRank.EIGHT, CardSuit.DIAMONDS, 2)],
            user: { id: 'user-1' },
          },
        ],
      });
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, createMockRepository<UserPowerup>()],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
        [Card, createMockRepository<Card>()],
        [Hand, createMockRepository<Hand>()],
      ]));

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
        body: { cardId: 'player-1' },
      });
      const res = createMockResponse();

      await swapCard(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot swap when hand is not active', code: 'HAND_LOCKED' });
    });

    it('returns 404 when CARD_SWAP powerup is not in inventory', async () => {
      const round = createRoundFixture();
      const roundRepo = createMockRepository<Round>({ findOne: jest.fn().mockResolvedValue(round) });
      const userPowerupRepo = createMockRepository<UserPowerup>({ findOne: jest.fn().mockResolvedValue(null) });

      mockAppDataSourceTransaction(new Map<any, any>([
        [Round, roundRepo],
        [UserPowerup, userPowerupRepo],
        [PowerupConsumption, createMockRepository<PowerupConsumption>()],
        [Card, createMockRepository<Card>()],
        [Hand, createMockRepository<Hand>()],
      ]));

      const req = createMockRequest({
        user: { sub: 'user-1' } as any,
        params: { roundId: 'round-1' },
        body: { cardId: 'player-1' },
      });
      const res = createMockResponse();

      await swapCard(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'CARD_SWAP not in inventory', code: 'POWERUP_NOT_OWNED' });
    });
  });
});
