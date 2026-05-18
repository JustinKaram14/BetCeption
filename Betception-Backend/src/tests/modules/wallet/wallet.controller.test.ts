import {
  getWalletSummary,
  getWalletTransactions,
  getWalletTransactionsSummary,
  depositFunds,
  withdrawFunds,
} from '../../../modules/wallet/wallet.controller.js';
import { User } from '../../../entity/User.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import {
  createMockRequest,
  createMockResponse,
  createMockRepository,
  mockAppDataSourceRepositories,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';
import {
  WalletTransactionsDateRangeQuerySchema,
  WalletTransactionsQuerySchema,
} from '../../../modules/wallet/wallet.schema.js';

describe('wallet.controller', () => {
  describe('getWalletSummary', () => {
    it('returns wallet data for the authenticated user', async () => {
      const user = {
        id: '1',
        username: 'player',
        balance: '123.45',
        xp: 10,
        level: 2,
        lastDailyRewardAt: '2025-01-01',
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await getWalletSummary(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: '1',
        username: 'player',
        balance: 123.45,
        xp: 10,
        level: 2,
        levelProgress: {
          level: 2,
          xp: 10,
          currentLevelXp: 500,
          nextLevelXp: 1175,
          xpIntoLevel: 0,
          xpToNextLevel: 1165,
          progressPercent: 0,
        },
        lastDailyRewardAt: '2025-01-01',
      });
    });

    it('returns 404 when the user is missing', async () => {
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({ user: { sub: '99' } as any });
      const res = createMockResponse();

      await getWalletSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('getWalletTransactions', () => {
    it('returns paginated transactions for the user', async () => {
      const transactions = [
        {
          id: 'tx-1',
          kind: 'deposit',
          amount: '50.00',
          refTable: 'table',
          refId: '1',
          createdAt: new Date('2025-01-01T00:00:00Z'),
        },
      ] as unknown as WalletTransaction[];
      const walletRepo = createMockRepository<WalletTransaction>({
        findAndCount: jest.fn().mockResolvedValue([transactions, 1]),
      });
      mockAppDataSourceRepositories(new Map([[WalletTransaction, walletRepo]]));

      const req = createMockRequest({
        user: { sub: '1' } as any,
        query: { limit: 20, page: 1 } as any,
      });
      const res = createMockResponse();

      await getWalletTransactions(req as any, res);

      expect(walletRepo.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: '1' } },
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 0,
      });
      expect(res.json).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        total: 1,
        items: [
          {
            id: 'tx-1',
            kind: 'deposit',
            amount: 50,
            refTable: 'table',
            refId: '1',
            createdAt: new Date('2025-01-01T00:00:00Z'),
          },
        ],
      });
    });

    it('applies from and to filters to the authenticated user query', async () => {
      const walletRepo = createMockRepository<WalletTransaction>({
        findAndCount: jest.fn().mockResolvedValue([[], 0]),
      });
      mockAppDataSourceRepositories(new Map([[WalletTransaction, walletRepo]]));

      const from = new Date('2026-01-01T00:00:00.000Z');
      const to = new Date('2026-01-31T23:59:59.999Z');
      const req = createMockRequest({
        user: { sub: '1' } as any,
        query: { limit: 20, page: 1, from, to } as any,
      });
      const res = createMockResponse();

      await getWalletTransactions(req as any, res);

      expect(walletRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: { id: '1' },
            createdAt: expect.any(Object),
          }),
          order: { createdAt: 'DESC' },
          take: 20,
          skip: 0,
        }),
      );
    });

    it('validates date filter query values', () => {
      expect(
        WalletTransactionsQuerySchema.safeParse({
          page: '1',
          limit: '20',
          from: '2026-01-01T00:00:00.000Z',
        }).success,
      ).toBe(true);
      expect(
        WalletTransactionsQuerySchema.safeParse({
          page: '1',
          limit: '20',
          from: 'not-a-date',
        }).success,
      ).toBe(false);
      expect(
        WalletTransactionsQuerySchema.safeParse({
          page: '1',
          limit: '20',
          from: '2026-02-01T00:00:00.000Z',
          to: '2026-01-01T00:00:00.000Z',
        }).success,
      ).toBe(false);
    });
  });

  describe('getWalletTransactionsSummary', () => {
    it('summarizes only transactions queried for the authenticated user', async () => {
      const transactions = [
        { amount: '100.25' },
        { amount: '-35.10' },
        { amount: '10.00' },
        { amount: '-5.15' },
      ] as WalletTransaction[];
      const walletRepo = createMockRepository<WalletTransaction>({
        find: jest.fn().mockResolvedValue(transactions),
      });
      mockAppDataSourceRepositories(new Map([[WalletTransaction, walletRepo]]));

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await getWalletTransactionsSummary(req, res);

      expect(walletRepo.find).toHaveBeenCalledWith({
        where: { user: { id: '1' } },
        select: ['amount'],
      });
      expect(res.json).toHaveBeenCalledWith({
        totalWins: 110.25,
        totalLossesOrBets: 40.25,
        netTotal: 70,
        transactionCount: 4,
      });
    });

    it('summarizes transactions within the requested date range', async () => {
      const transactions = [{ amount: '10.00' }, { amount: '-3.00' }] as WalletTransaction[];
      const walletRepo = createMockRepository<WalletTransaction>({
        find: jest.fn().mockResolvedValue(transactions),
      });
      mockAppDataSourceRepositories(new Map([[WalletTransaction, walletRepo]]));

      const from = new Date('2026-01-01T00:00:00.000Z');
      const to = new Date('2026-01-31T23:59:59.999Z');
      const req = createMockRequest({ user: { sub: '1' } as any, query: { from, to } as any });
      const res = createMockResponse();

      await getWalletTransactionsSummary(req, res);

      expect(walletRepo.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user: { id: '1' },
          createdAt: expect.any(Object),
        }),
        select: ['amount'],
      });
      expect(res.json).toHaveBeenCalledWith({
        totalWins: 10,
        totalLossesOrBets: 3,
        netTotal: 7,
        transactionCount: 2,
      });
    });

    it('validates summary date filter query values', () => {
      expect(
        WalletTransactionsDateRangeQuerySchema.safeParse({
          to: '2026-01-31T23:59:59.999Z',
        }).success,
      ).toBe(true);
      expect(
        WalletTransactionsDateRangeQuerySchema.safeParse({
          to: '2026-99-31T23:59:59.999Z',
        }).success,
      ).toBe(false);
    });
  });

  describe('depositFunds', () => {
    it('credits balance and records a deposit transaction', async () => {
      const user = {
        id: '1',
        balance: '100.00',
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((payload) => ({ id: 'tx-1', ...payload })),
        save: jest.fn().mockResolvedValue(undefined),
      });

      const repos = new Map<any, any>();
      repos.set(User, userRepo);
      repos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(repos);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { amount: 25.5 } as any,
      });
      const res = createMockResponse();

      await depositFunds(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ balance: '125.50' }));
      expect(walletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'deposit',
          amount: '25.50',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Deposit recorded',
        balance: 125.5,
        transactionId: 'tx-1',
      });
    });
  });

  describe('withdrawFunds', () => {
    it('debits balance when funds are sufficient', async () => {
      const user = {
        id: '1',
        balance: '100.00',
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((payload) => ({ id: 'tx-2', ...payload })),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const repos = new Map<any, any>();
      repos.set(User, userRepo);
      repos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(repos);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { amount: 40 } as any,
      });
      const res = createMockResponse();

      await withdrawFunds(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ balance: '60.00' }));
      expect(walletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'withdraw',
          amount: '-40.00',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Withdrawal recorded',
        balance: 60,
        transactionId: 'tx-2',
      });
    });

    it('returns 400 when balance is insufficient', async () => {
      const user = {
        id: '1',
        balance: '10.00',
      } as User;

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const walletRepo = createMockRepository<WalletTransaction>();

      const repos = new Map<any, any>();
      repos.set(User, userRepo);
      repos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(repos);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { amount: 25 } as any,
      });
      const res = createMockResponse();

      await withdrawFunds(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Insufficient balance',
        code: 'INSUFFICIENT_FUNDS',
      });
    });
  });
});
