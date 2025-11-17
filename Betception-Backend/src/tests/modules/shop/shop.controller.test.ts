import { listPowerups, purchasePowerup } from '../../../modules/shop/shop.controller.js';
import { PowerupType } from '../../../entity/PowerupType.js';
import { User } from '../../../entity/User.js';
import { UserPowerup } from '../../../entity/UserPowerup.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
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
      const userPowerup = {
        id: 'up-1',
        quantity: 1,
        user,
        type: powerupType,
      } as UserPowerup;

      const typeRepo = createMockRepository<PowerupType>({
        findOne: jest.fn().mockResolvedValue(powerupType),
      });

      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockResolvedValue(undefined),
      });

      const userPowerupRepo = createMockRepository<UserPowerup>({
        findOne: jest.fn().mockResolvedValue(userPowerup),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const walletRepo = createMockRepository<WalletTransaction>({
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue(undefined),
      });

      mockAppDataSourceRepositories(new Map([[PowerupType, typeRepo]]));
      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      transactionRepos.set(UserPowerup, userPowerupRepo);
      transactionRepos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { typeId: 1, quantity: 2 },
      });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(userRepo.save).toHaveBeenCalled();
      expect(userPowerupRepo.save).toHaveBeenCalledWith(expect.objectContaining({ quantity: 3 }));
      expect(walletRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Power-up purchased',
        balance: expect.any(Number),
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
      const userPowerupRepo = createMockRepository<UserPowerup>({
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data) => data),
      });
      const walletRepo = createMockRepository<WalletTransaction>();

      mockAppDataSourceRepositories(new Map([[PowerupType, typeRepo]]));
      const transactionRepos = new Map<any, any>();
      transactionRepos.set(User, userRepo);
      transactionRepos.set(UserPowerup, userPowerupRepo);
      transactionRepos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { typeId: 1, quantity: 1 },
      });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient balance' });
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
  });
});
