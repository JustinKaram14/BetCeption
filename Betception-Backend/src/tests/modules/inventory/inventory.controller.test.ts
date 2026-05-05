import { equipPowerup, listInventory } from '../../../modules/inventory/inventory.controller.js';
import { PowerupType } from '../../../entity/PowerupType.js';
import { User } from '../../../entity/User.js';
import { UserPowerup } from '../../../entity/UserPowerup.js';
import {
  createMockRepository,
  createMockRequest,
  createMockResponse,
  mockAppDataSourceRepositories,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';

describe('inventory.controller', () => {
  it('returns the user inventory with power-pill type details and active slot', async () => {
    const userPowerups = [
      {
        id: '1',
        quantity: 3,
        acquiredAt: new Date('2025-01-01T00:00:00Z'),
        type: {
          id: 1,
          code: 'RED_PILL',
          title: 'Red Pill',
          description: '1:5 chance to trigger x3 payout on main wins.',
          minLevel: 1,
          price: '300.00',
          effectJson: { color: 'red', uses: 3 },
        },
      },
    ] as unknown as UserPowerup[];
    const activeType = {
      id: 2,
      code: 'BLUE_PILL',
      title: 'Blue Pill',
      description: '1:8 chance to trigger safe-round protection (no loss).',
      minLevel: 1,
      price: '300.00',
      effectJson: { color: 'blue', uses: 3 },
    } as PowerupType;
    const user = {
      id: '1',
      activePowerupType: activeType,
      activePowerupUsesRemaining: 2,
    } as User;

    const inventoryRepo = createMockRepository<UserPowerup>({
      find: jest.fn().mockResolvedValue(userPowerups),
    });
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
    });
    mockAppDataSourceRepositories(new Map<any, any>([[UserPowerup, inventoryRepo], [User, userRepo]]));

    const req = createMockRequest({ user: { sub: '1' } as any });
    const res = createMockResponse();

    await listInventory(req as any, res);

    expect(res.json).toHaveBeenCalledWith({
      items: [
        {
          id: '1',
          quantity: 3,
          acquiredAt: new Date('2025-01-01T00:00:00Z'),
          type: {
            id: 1,
            code: 'RED_PILL',
            title: 'Red Pill',
            description: '1:5 chance to trigger x3 payout on main wins.',
            minLevel: 1,
            price: 300,
            effect: { color: 'red', uses: 3 },
          },
        },
      ],
      activePowerup: {
        type: {
          id: 2,
          code: 'BLUE_PILL',
          title: 'Blue Pill',
          description: '1:8 chance to trigger safe-round protection (no loss).',
          minLevel: 1,
          price: 300,
          effect: { color: 'blue', uses: 3 },
        },
        usesRemaining: 2,
      },
    });
  });

  it('equips an owned power pill and consumes one inventory item', async () => {
    const type = {
      id: 1,
      code: 'RED_PILL',
      title: 'Red Pill',
      description: '1:5 chance to trigger x3 payout on main wins.',
      minLevel: 1,
      price: '300.00',
      effectJson: { color: 'red', uses: 3 },
    } as PowerupType;
    const user = {
      id: '1',
      activePowerupType: null,
      activePowerupUsesRemaining: 0,
    } as User;
    const inventory = {
      id: 'inv-1',
      quantity: 2,
      type,
    } as UserPowerup;

    const typeRepo = createMockRepository<PowerupType>({ findOne: jest.fn().mockResolvedValue(type) });
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockResolvedValue(undefined),
    });
    const inventoryRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(inventory),
      save: jest.fn().mockResolvedValue(undefined),
    });
    mockAppDataSourceTransaction(new Map<any, any>([
      [PowerupType, typeRepo],
      [User, userRepo],
      [UserPowerup, inventoryRepo],
    ]));

    const req = createMockRequest({ user: { sub: '1' } as any, body: { typeId: 1 } });
    const res = createMockResponse();

    await equipPowerup(req as any, res);

    expect(inventoryRepo.save).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }));
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        activePowerupType: type,
        activePowerupUsesRemaining: 3,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Power pill equipped',
      quantity: 1,
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
});
