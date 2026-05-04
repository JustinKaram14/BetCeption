import { listPowerups, purchasePowerup } from '../../../modules/shop/shop.controller.js';
import { PowerupType } from '../../../entity/PowerupType.js';
import { User } from '../../../entity/User.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import { WalletTransactionKind } from '../../../entity/enums.js';
import {
  createMockRepository,
  createMockRequest,
  createMockResponse,
  mockAppDataSourceRepositories,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';

describe('shop.controller', () => {
  describe('listPowerups', () => {
    it('returns available power-ups ordered by level and price', async () => {
      const powerups = [
        { id: 1, code: 'BOOST', title: 'XP Boost', description: null, minLevel: 1, price: '10.00', effectJson: { xp: 10 } },
      ] as PowerupType[];
      const powerupRepo = createMockRepository<PowerupType>({
        find: jest.fn().mockResolvedValue(powerups),
      });
      mockAppDataSourceRepositories(new Map([[PowerupType, powerupRepo]]));

      const req = createMockRequest();
      const res = createMockResponse();

      await listPowerups(req as any, res);

      expect(res.json).toHaveBeenCalledWith({
        items: [
          {
            id: 1,
            code: 'BOOST',
            title: 'XP Boost',
            description: null,
            minLevel: 1,
            price: 10,
            effect: { xp: 10 },
          },
        ],
      });
    });
  });

  describe('purchasePowerup', () => {
    it('deducts balance, updates inventory, and logs wallet transaction', async () => {
      const powerupType = {
        id: 1,
        price: '25.00',
        minLevel: 1,
      } as PowerupType;
      const user = {
        id: '1',
        level: 5,
        balance: '100.00',
      } as User;

      const typeRepo = createMockRepository<PowerupType>({
        findOne: jest.fn().mockResolvedValue(powerupType),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue(undefined),
      });

      mockAppDataSourceRepositories(new Map([[PowerupType, typeRepo]]));
      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      transactionRepos.set(WalletTransaction, walletRepo);

      // query mock: first call = INSERT upsert, second call = SELECT quantity
      const queryMock = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([{ quantity: 3 }]);
      mockAppDataSourceTransaction(transactionRepos, { query: queryMock });

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { typeId: 1, quantity: 2 },
      });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ balance: '50.00' }),
      );
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('ON DUPLICATE KEY UPDATE'),
        ['1', 1, 2],
      );
      expect(walletRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ amount: '-50.00', kind: WalletTransactionKind.ADJUSTMENT }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Power-up purchased',
        balance: 50,
        quantity: 3,
      });
    });

    it('returns 400 when user does not have enough funds', async () => {
      const powerupType = {
        id: 1,
        price: '50.00',
        minLevel: 1,
      } as PowerupType;
      const user = {
        id: '1',
        level: 5,
        balance: '10.00',
      } as User;

      const typeRepo = createMockRepository<PowerupType>({
        findOne: jest.fn().mockResolvedValue(powerupType),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const walletRepo = createMockRepository<WalletTransaction>();

      mockAppDataSourceRepositories(new Map([[PowerupType, typeRepo]]));
      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      transactionRepos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { typeId: 1, quantity: 1 },
      });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Insufficient balance',
        code: 'INSUFFICIENT_FUNDS',
      });
    });

    it('returns 404 when the power-up type is missing', async () => {
      const typeRepo = createMockRepository<PowerupType>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[PowerupType, typeRepo]]));

      const req = createMockRequest({
        body: { typeId: 99, quantity: 1 },
      });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Power-up not found' });
    });

    it('returns 403 when user level is too low', async () => {
      const powerupType = { id: 1, price: '10.00', minLevel: 10 } as PowerupType;
      const user = { id: '1', level: 3, balance: '100.00' } as User;

      const typeRepo = createMockRepository<PowerupType>({ findOne: jest.fn().mockResolvedValue(powerupType) });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user) });
      const walletRepo = createMockRepository<WalletTransaction>();

      mockAppDataSourceRepositories(new Map([[PowerupType, typeRepo]]));
      mockAppDataSourceTransaction(new Map<any, any>([[User, userRepo], [WalletTransaction, walletRepo]]));

      const req = createMockRequest({ user: { sub: '1' } as any, body: { typeId: 1, quantity: 1 } });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Power-up locked for your current level', code: 'LEVEL_TOO_LOW' });
    });
  });
});
