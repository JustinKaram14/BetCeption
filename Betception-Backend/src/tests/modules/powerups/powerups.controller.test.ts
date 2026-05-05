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
  const baseUser = { id: '1', level: 1 } as User;
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
      xpBoostExpiresAt: null,
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

  it('returns 404 when the power-up is not in the user inventory', async () => {
    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>();

    const repos = new Map<any, any>();
    repos.set(UserPowerup, userPowerupRepo);
    repos.set(PowerupConsumption, consumptionRepo);
    mockAppDataSourceTransaction(repos);

    const req = createMockRequest({
      user: { sub: '1' } as any,
      body: { typeId: 99, quantity: 1 },
    });
    const res = createMockResponse();

    await consumePowerup(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Power-up not found in inventory',
      code: 'POWERUP_NOT_OWNED',
    });
  });

  it('returns 404 when the specified round does not exist', async () => {
    const userPowerup = {
      id: 'up-1',
      quantity: 1,
      user: baseUser,
      type: baseType,
    } as UserPowerup;

    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(userPowerup),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>();
    const roundRepo = createMockRepository<Round>({
      findOne: jest.fn().mockResolvedValue(null),
    });

    const repos = new Map<any, any>();
    repos.set(UserPowerup, userPowerupRepo);
    repos.set(PowerupConsumption, consumptionRepo);
    repos.set(Round, roundRepo);
    mockAppDataSourceTransaction(repos);

    const req = createMockRequest({
      user: { sub: '1' } as any,
      body: { typeId: 1, quantity: 1, roundId: 'missing-round' },
    });
    const res = createMockResponse();

    await consumePowerup(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Round not found',
      code: 'ROUND_NOT_FOUND',
    });
  });

  it('returns 409 when the round is already settled', async () => {
    const userPowerup = {
      id: 'up-1',
      quantity: 1,
      user: baseUser,
      type: baseType,
    } as UserPowerup;
    const settledRound = {
      id: 'round-1',
      status: RoundStatus.SETTLED,
      hands: [{ ownerType: HandOwnerType.PLAYER, user: { id: '1' } }],
    } as unknown as Round;

    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(userPowerup),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>();
    const roundRepo = createMockRepository<Round>({
      findOne: jest.fn().mockResolvedValue(settledRound),
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

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cannot attach power-ups to inactive rounds',
      code: 'ROUND_INACTIVE',
    });
  });

  it('returns 403 when the player level is too low', async () => {
    const lowLevelUser = { id: '1', level: 0 } as User;
    const highLevelType = { ...baseType, minLevel: 5 } as PowerupType;
    const userPowerup = {
      id: 'up-1',
      quantity: 1,
      user: lowLevelUser,
      type: highLevelType,
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

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Player level too low to use this power-up',
      code: 'LEVEL_TOO_LOW',
    });
  });

  it('re-throws unexpected errors from the transaction', async () => {
    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockRejectedValue(new Error('DB connection lost')),
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

    await expect(consumePowerup(req as any, res)).rejects.toThrow('DB connection lost');
  });

  it('succeeds and returns null roundId when no roundId is provided', async () => {
    const userPowerup = {
      id: 'up-1',
      quantity: 1,
      user: baseUser,
      type: baseType,
    } as UserPowerup;

    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(userPowerup),
      save: jest.fn().mockResolvedValue(undefined),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>({
      create: jest.fn().mockImplementation((payload) => ({ id: 'pc-1', ...payload })),
      save: jest.fn().mockResolvedValue(undefined),
    });

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

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ roundId: null }));
  });

  it('treats null round.hands as empty array when checking ownership', async () => {
    const userPowerup = {
      id: 'up-1',
      quantity: 1,
      user: baseUser,
      type: baseType,
    } as UserPowerup;
    const roundWithNullHands = {
      id: 'round-1',
      status: RoundStatus.IN_PROGRESS,
      hands: null,
    } as unknown as Round;

    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(userPowerup),
    });
    const consumptionRepo = createMockRepository<PowerupConsumption>();
    const roundRepo = createMockRepository<Round>({
      findOne: jest.fn().mockResolvedValue(roundWithNullHands),
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

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Round does not belong to the user',
      code: 'ROUND_NOT_OWNED',
    });
  });
});
