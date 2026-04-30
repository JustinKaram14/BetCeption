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
});
