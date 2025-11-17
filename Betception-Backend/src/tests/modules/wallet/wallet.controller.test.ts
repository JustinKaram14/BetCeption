import {
  getWalletSummary,
  getWalletTransactions,
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
