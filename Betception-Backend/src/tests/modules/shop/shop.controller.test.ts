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
    it('returns only public power pills', async () => {
      const powerups = [
        {
          id: 1,
          code: 'RED_PILL',
          title: 'Red Pill',
          description: '1:5 chance to trigger x3 payout on main wins.',
          minLevel: 1,
          price: '300.00',
          effectJson: { color: 'red', uses: 3 },
        },
        {
          id: 2,
          code: 'BLUE_PILL',
          title: 'Blue Pill',
          description: '1:8 chance to trigger safe-round protection (no loss).',
          minLevel: 1,
          price: '300.00',
          effectJson: { color: 'blue', uses: 3 },
        },
      ] as PowerupType[];
      const powerupRepo = createMockRepository<PowerupType>({
        find: jest.fn().mockResolvedValue(powerups),
      });
      mockAppDataSourceRepositories(new Map([[PowerupType, powerupRepo]]));

      const req = createMockRequest();
      const res = createMockResponse();

      await listPowerups(req as any, res);

      expect(powerupRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ code: expect.any(Object) }),
        }),
      );
      expect(res.json).toHaveBeenCalledWith({
        items: [
          {
            id: 1,
            code: 'RED_PILL',
            title: 'Red Pill',
            description: '1:5 chance to trigger x3 payout on main wins.',
            minLevel: 1,
            price: 300,
            effect: { color: 'red', uses: 3 },
          },
          {
            id: 2,
            code: 'BLUE_PILL',
            title: 'Blue Pill',
            description: '1:8 chance to trigger safe-round protection (no loss).',
            minLevel: 1,
            price: 300,
            effect: { color: 'blue', uses: 3 },
          },
        ],
      });
    });
  });

  describe('purchasePowerup', () => {
    it('deducts balance, equips the pill, and logs wallet transaction', async () => {
      const powerupType = {
        id: 1,
        code: 'RED_PILL',
        title: 'Red Pill',
        description: '1:5 chance to trigger x3 payout on main wins.',
        price: '300.00',
        minLevel: 1,
        effectJson: { color: 'red', uses: 3 },
      } as PowerupType;
      const user = {
        id: '1',
        level: 5,
        balance: '500.00',
        activePowerupType: null,
        activePowerupUsesRemaining: 0,
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

      const transactionRepos = new Map<any, any>();
      transactionRepos.set(PowerupType, typeRepo);
      transactionRepos.set(User, userRepo);
      transactionRepos.set(WalletTransaction, walletRepo);
      mockAppDataSourceTransaction(transactionRepos);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { typeId: 1, quantity: 1 },
      });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: '200.00',
          activePowerupType: powerupType,
          activePowerupUsesRemaining: 3,
        }),
      );
      expect(walletRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ amount: '-300.00', kind: WalletTransactionKind.ADJUSTMENT }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Power-up purchased',
        balance: 200,
        quantity: 0,
        activePowerup: {
          type: {
            id: 1,
            code: 'RED_PILL',
            title: 'Red Pill',
            description: '1:5 chance to trigger x3 payout on main wins.',
            minLevel: 1,
            price: 300,
            effect: { color: 'red', uses: 3 },
          },
          usesRemaining: 3,
        },
      });
    });

    it('returns 400 when user does not have enough funds', async () => {
      const powerupType = {
        id: 1,
        code: 'BLUE_PILL',
        title: 'Blue Pill',
        description: null,
        price: '300.00',
        minLevel: 1,
        effectJson: { color: 'blue', uses: 3 },
      } as PowerupType;
      const user = {
        id: '1',
        level: 5,
        balance: '10.00',
        activePowerupType: null,
        activePowerupUsesRemaining: 0,
      } as User;

      const typeRepo = createMockRepository<PowerupType>({
        findOne: jest.fn().mockResolvedValue(powerupType),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const walletRepo = createMockRepository<WalletTransaction>();

      const transactionRepos = new Map<any, any>();
      transactionRepos.set(PowerupType, typeRepo);
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
      mockAppDataSourceTransaction(new Map<any, any>([[PowerupType, typeRepo]]));

      const req = createMockRequest({
        body: { typeId: 99, quantity: 1 },
      });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Power-up not found',
        code: 'POWERUP_NOT_FOUND',
      });
    });

    it('returns 403 when user level is too low', async () => {
      const powerupType = {
        id: 1,
        code: 'RED_PILL',
        title: 'Red Pill',
        description: null,
        price: '300.00',
        minLevel: 10,
        effectJson: { color: 'red', uses: 3 },
      } as PowerupType;
      const user = { id: '1', level: 3, balance: '500.00', activePowerupType: null, activePowerupUsesRemaining: 0 } as User;

      const typeRepo = createMockRepository<PowerupType>({ findOne: jest.fn().mockResolvedValue(powerupType) });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user) });
      const walletRepo = createMockRepository<WalletTransaction>();

      mockAppDataSourceTransaction(new Map<any, any>([[PowerupType, typeRepo], [User, userRepo], [WalletTransaction, walletRepo]]));

      const req = createMockRequest({ user: { sub: '1' } as any, body: { typeId: 1, quantity: 1 } });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Power-up locked for your current level', code: 'LEVEL_TOO_LOW' });
    });

    it('returns 409 when another pill is already active', async () => {
      const powerupType = {
        id: 1,
        code: 'RED_PILL',
        title: 'Red Pill',
        description: null,
        price: '300.00',
        minLevel: 1,
        effectJson: { color: 'red', uses: 3 },
      } as PowerupType;
      const user = {
        id: '1',
        level: 5,
        balance: '500.00',
        activePowerupType: powerupType,
        activePowerupUsesRemaining: 2,
      } as User;

      const typeRepo = createMockRepository<PowerupType>({ findOne: jest.fn().mockResolvedValue(powerupType) });
      const userRepo = createMockRepository<User>({ findOne: jest.fn().mockResolvedValue(user) });
      const walletRepo = createMockRepository<WalletTransaction>();

      mockAppDataSourceTransaction(new Map<any, any>([[PowerupType, typeRepo], [User, userRepo], [WalletTransaction, walletRepo]]));

      const req = createMockRequest({ user: { sub: '1' } as any, body: { typeId: 1, quantity: 1 } });
      const res = createMockResponse();

      await purchasePowerup(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'A power pill is already active',
        code: 'ACTIVE_POWERUP_SLOT_OCCUPIED',
      });
    });
  });
});
