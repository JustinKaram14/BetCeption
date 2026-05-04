import {
  getActiveRound,
  getRound,
  hitRound,
  settleRound,
  standRound,
  startRound,
} from '../../../modules/round/round.controller.js';
import { Card } from '../../../entity/Card.js';
import { Hand } from '../../../entity/Hand.js';
import { MainBet } from '../../../entity/MainBet.js';
import { PowerupConsumption } from '../../../entity/PowerupConsumption.js';
import { PowerupType } from '../../../entity/PowerupType.js';
import { Round } from '../../../entity/Round.js';
import { SideBet } from '../../../entity/SideBet.js';
import { SidebetType } from '../../../entity/SidebetType.js';
import { User } from '../../../entity/User.js';
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
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      });

      mockAppDataSourceTransaction(
        new Map<any, any>([
          [Round, roundRepo],
          [Hand, handRepo],
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

      await standRound(req as any, res);

      expect(handRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player-hand',
          status: HandStatus.STOOD,
        }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          round: expect.objectContaining({
            id: 'round-1',
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

    it('settles a winning round and credits the player wallet', async () => {
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
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 20, cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.KING, CardSuit.CLUBS, 2)], user: null },
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
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 17, cards: [createCard('d1', CardRank.TEN, CardSuit.HEARTS, 1), createCard('d2', CardRank.SEVEN, CardSuit.CLUBS, 2)], user: null },
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
      // Player: FIVE(S) + THREE(C) = 8 — safe, cannot bust on any single draw
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
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
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
    it('triggers dealer to draw when dealer has soft 17', async () => {
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

      await settleRound(req as any, res);

      // Dealer drew at least one card (soft 17 forces a draw)
      expect(cardRepo.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
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
      expect(handRepo.save).toHaveBeenCalled();
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

      await settleRound(req as any, res);

      expect(cardRepo.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ round: expect.objectContaining({ id: 'round-1' }) }),
      );
    });
  });

  describe('settleRound — BET_BOOST powerups', () => {
    function buildWinRound() {
      return createRoundFixture({
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

    it('BET_BOOST_30: adds +30% to win payout (bet=10 → settled=23)', async () => {
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

      // bet=10, base multiplier=2.0, boost=+0.3 → effective=2.3 → settled=23.00
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ payoutMultiplier: '2.300', settledAmount: '23.00' }),
      );
    });

    it('BET_BOOST_100: doubles win payout (bet=10 → settled=30)', async () => {
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

      // bet=10, base multiplier=2.0, boost=+1.0 → effective=3.0 → settled=30.00
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ payoutMultiplier: '3.000', settledAmount: '30.00' }),
      );
    });

    it('BET_BOOST is ignored on a losing round (no extra payout)', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 20, cards: [createCard('d1', CardRank.KING, CardSuit.HEARTS, 1), createCard('d2', CardRank.KING, CardSuit.CLUBS, 2)], user: null },
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

    it('BET_BOOST stacks additively when two boosts are consumed (bet=10 → settled=33)', async () => {
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

      // bet=10, base=2.0, BET_BOOST_30(+0.3) + BET_BOOST_100(+1.0) = effective 3.3 → settled=33.00
      expect(mainBetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ payoutMultiplier: '3.300', settledAmount: '33.00' }),
      );
    });

    it('BET_BOOST is ignored on a push (bet=10 → settled=10 refund)', async () => {
      const round = createRoundFixture({
        hands: [
          { id: 'dealer-hand', ownerType: HandOwnerType.DEALER, status: HandStatus.ACTIVE, handValue: 20, cards: [createCard('d1', CardRank.KING, CardSuit.HEARTS, 1), createCard('d2', CardRank.KING, CardSuit.CLUBS, 2)], user: null },
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
});
