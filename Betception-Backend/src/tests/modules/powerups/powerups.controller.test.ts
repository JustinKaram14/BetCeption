import { consumePowerup } from '../../../modules/powerups/powerups.controller.js';
import { UserPowerup } from '../../../entity/UserPowerup.js';
import { PowerupConsumption } from '../../../entity/PowerupConsumption.js';
import { Round } from '../../../entity/Round.js';
import { HandOwnerType, RoundStatus } from '../../../entity/enums.js';
import {
  createMockRequest,
  createMockResponse,
  createMockRepository,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';
import { User } from '../../../entity/User.js';
import { PowerupType } from '../../../entity/PowerupType.js';

describe('powerups.controller', () => {
  const baseUser = { id: '1' } as User;
  const baseType = {
    id: 1,
    code: 'BOOST',
    title: 'Boost',
    description: 'Demo',
    minLevel: 1,
    price: '100.00',
    effectJson: { multiplier: 0.2 },
  } as PowerupType;

  it('consumes a power-up and links it to a round', async () => {
    const userPowerup = {
      id: 'up-1',
      quantity: 2,
      user: baseUser,
      type: baseType,
    } as UserPowerup;
    const round = {
      id: 'round-1',
      status: RoundStatus.IN_PROGRESS,
      hands: [{ ownerType: HandOwnerType.PLAYER, user: { id: '1' } }],
    } as unknown as Round;

    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(userPowerup),
      save: jest.fn().mockResolvedValue(undefined),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>({
      create: jest.fn().mockImplementation((payload) => ({ id: 'pc-1', ...payload })),
      save: jest.fn().mockResolvedValue(undefined),
    });
    const roundRepo = createMockRepository<Round>({
      findOne: jest.fn().mockResolvedValue(round),
    });

    const repos = new Map<any, any>();
    repos.set(UserPowerup, userPowerupRepo);
    repos.set(PowerupConsumption, consumptionRepo);
    repos.set(Round, roundRepo);
    mockAppDataSourceTransaction(repos);

    const req = createMockRequest({
      user: { sub: '1' } as any,
      body: { typeId: 1, quantity: 1, roundId: 'round-1' },
    });
    const res = createMockResponse();

    await consumePowerup(req as any, res);

    expect(userPowerupRepo.save).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }));
    expect(consumptionRepo.save).toHaveBeenCalledWith(expect.any(Array));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Power-up activated',
      consumed: 1,
      remaining: 1,
      powerup: {
        id: 1,
        code: 'BOOST',
        title: 'Boost',
        effect: { multiplier: 0.2 },
      },
      roundId: 'round-1',
    });
  });

  it('returns 400 when inventory is insufficient', async () => {
    const userPowerup = {
      id: 'up-1',
      quantity: 0,
      user: baseUser,
      type: baseType,
    } as UserPowerup;

    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(userPowerup),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>();

    const repos = new Map<any, any>();
    repos.set(UserPowerup, userPowerupRepo);
    repos.set(PowerupConsumption, consumptionRepo);
    mockAppDataSourceTransaction(repos);

    const req = createMockRequest({
      user: { sub: '1' } as any,
      body: { typeId: 1, quantity: 1 },
    });
    const res = createMockResponse();

    await consumePowerup(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Not enough power-ups available',
      code: 'INSUFFICIENT_STOCK',
    });
  });

  it('rejects linking to a round not owned by the user', async () => {
    const userPowerup = {
      id: 'up-1',
      quantity: 1,
      user: baseUser,
      type: baseType,
    } as UserPowerup;
    const round = {
      id: 'round-2',
      status: RoundStatus.IN_PROGRESS,
      hands: [{ ownerType: HandOwnerType.PLAYER, user: { id: '2' } }],
    } as unknown as Round;

    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(userPowerup),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>();
    const roundRepo = createMockRepository<Round>({
      findOne: jest.fn().mockResolvedValue(round),
    });

    const repos = new Map<any, any>();
    repos.set(UserPowerup, userPowerupRepo);
    repos.set(PowerupConsumption, consumptionRepo);
    repos.set(Round, roundRepo);
    mockAppDataSourceTransaction(repos);

    const req = createMockRequest({
      user: { sub: '1' } as any,
      body: { typeId: 1, quantity: 1, roundId: 'round-2' },
    });
    const res = createMockResponse();

    await consumePowerup(req as any, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Round does not belong to the user',
      code: 'ROUND_NOT_OWNED',
    });
  });
});
