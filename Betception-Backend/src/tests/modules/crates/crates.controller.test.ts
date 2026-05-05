import crypto from 'crypto';
import { listCrates, openCrate, getTierForLevel, getPowerupRewardQuantityForTier } from '../../../modules/crates/crates.controller.js';
import { UserCrate } from '../../../entity/UserCrate.js';
import { UserPowerup } from '../../../entity/UserPowerup.js';
import { PowerupType } from '../../../entity/PowerupType.js';
import { User } from '../../../entity/User.js';
import { WalletTransaction } from '../../../entity/WalletTransaction.js';
import {
  createMockRepository,
  createMockRequest,
  createMockResponse,
  mockAppDataSourceRepositories,
  mockAppDataSourceTransaction,
} from '../../test-utils.js';

// ─── getTierForLevel ──────────────────────────────────────────────────────────

describe('getTierForLevel', () => {
  it.each([
    [1, 1], [5, 1],
    [6, 2], [10, 2],
    [11, 3], [20, 3],
    [21, 3], [35, 3],
    [36, 3], [100, 3],
  ])('level %i → tier %i', (level, expectedTier) => {
    expect(getTierForLevel(level)).toBe(expectedTier);
  });
});

// ─── listCrates ───────────────────────────────────────────────────────────────

describe('getPowerupRewardQuantityForTier', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 3],
    [5, 3],
  ])('tier %i yields %i pill(s)', (tier, expectedCount) => {
    expect(getPowerupRewardQuantityForTier(tier)).toBe(expectedCount);
  });
});

describe('listCrates', () => {
  it('returns 401 when the user is not authenticated', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();

    await listCrates(req as any, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UNAUTHENTICATED' }),
    );
  });

  it('returns an empty list when the user has no crates', async () => {
    const crateRepo = createMockRepository<UserCrate>({
      find: jest.fn().mockResolvedValue([]),
    });
    mockAppDataSourceRepositories(new Map([[UserCrate, crateRepo]]));

    const req = createMockRequest({ user: { sub: 'user-1' } as any });
    const res = createMockResponse();

    await listCrates(req as any, res);

    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('returns a serialised unopened crate', async () => {
    const crate: Partial<UserCrate> = {
      id: 'crate-1',
      tier: 2,
      acquiredLevel: 7,
      acquiredAt: new Date('2025-01-01T00:00:00Z'),
      opened: false,
      openedAt: null,
      rewardKind: null,
      rewardCoins: null,
      rewardPowerupType: null,
    };
    const crateRepo = createMockRepository<UserCrate>({
      find: jest.fn().mockResolvedValue([crate]),
    });
    mockAppDataSourceRepositories(new Map([[UserCrate, crateRepo]]));

    const req = createMockRequest({ user: { sub: 'user-1' } as any });
    const res = createMockResponse();

    await listCrates(req as any, res);

    expect(res.json).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({
          id: 'crate-1',
          tier: 2,
          tierLabel: 'Rare',
          acquiredLevel: 7,
          opened: false,
          reward: null,
        }),
      ],
    });
  });

  it('returns an opened crate with coin reward serialised', async () => {
    const crate: Partial<UserCrate> = {
      id: 'crate-2',
      tier: 1,
      acquiredLevel: 3,
      acquiredAt: new Date('2025-06-01T00:00:00Z'),
      opened: true,
      openedAt: new Date('2025-06-02T00:00:00Z'),
      rewardKind: 'coins',
      rewardCoins: '120.00',
      rewardPowerupType: null,
    };
    const crateRepo = createMockRepository<UserCrate>({
      find: jest.fn().mockResolvedValue([crate]),
    });
    mockAppDataSourceRepositories(new Map([[UserCrate, crateRepo]]));

    const req = createMockRequest({ user: { sub: 'user-1' } as any });
    const res = createMockResponse();

    await listCrates(req as any, res);

    const { items } = (res.json as jest.Mock).mock.calls[0][0];
    expect(items[0].opened).toBe(true);
    expect(items[0].reward?.kind).toBe('coins');
    expect(items[0].reward?.coins).toBe(120);
  });

  it('returns an opened crate with powerup reward serialised', async () => {
    const powerup = { id: 3, code: 'JOKER_CARD', title: 'Joker' } as PowerupType;
    const crate: Partial<UserCrate> = {
      id: 'crate-3',
      tier: 3,
      acquiredLevel: 15,
      acquiredAt: new Date('2025-07-01T00:00:00Z'),
      opened: true,
      openedAt: new Date('2025-07-02T00:00:00Z'),
      rewardKind: 'powerup',
      rewardCoins: null,
      rewardPowerupType: powerup as any,
    };
    const crateRepo = createMockRepository<UserCrate>({
      find: jest.fn().mockResolvedValue([crate]),
    });
    mockAppDataSourceRepositories(new Map([[UserCrate, crateRepo]]));

    const req = createMockRequest({ user: { sub: 'user-1' } as any });
    const res = createMockResponse();

    await listCrates(req as any, res);

    const { items } = (res.json as jest.Mock).mock.calls[0][0];
    expect(items[0].reward?.kind).toBe('powerup');
    expect(items[0].reward?.powerup?.code).toBe('JOKER_CARD');
    expect(items[0].reward?.powerup?.quantity).toBe(3);
  });
});

// ─── openCrate ────────────────────────────────────────────────────────────────

describe('openCrate', () => {
  it('returns 401 when the user is not authenticated', async () => {
    const req = createMockRequest({ params: { crateId: 'crate-1' } });
    const res = createMockResponse();

    await openCrate(req as any, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when the crate is not found', async () => {
    const crateRepo = createMockRepository<UserCrate>({
      findOne: jest.fn().mockResolvedValue(null),
    });
    mockAppDataSourceTransaction(new Map([[UserCrate, crateRepo]]));

    const req = createMockRequest({
      user: { sub: 'user-1' } as any,
      params: { crateId: 'crate-999' },
    });
    const res = createMockResponse();

    await openCrate(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CRATE_NOT_FOUND' }),
    );
  });

  it('returns 409 when the crate is already opened', async () => {
    const crate: Partial<UserCrate> = {
      id: 'crate-1',
      tier: 1,
      acquiredLevel: 2,
      opened: true,
      rewardKind: 'coins',
      rewardCoins: '100.00',
      rewardPowerupType: null,
      user: { id: 'user-1' } as User,
    };
    const crateRepo = createMockRepository<UserCrate>({
      findOne: jest.fn().mockResolvedValue(crate),
    });
    mockAppDataSourceTransaction(new Map([[UserCrate, crateRepo]]));

    const req = createMockRequest({
      user: { sub: 'user-1' } as any,
      params: { crateId: 'crate-1' },
    });
    const res = createMockResponse();

    await openCrate(req as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ALREADY_OPENED' }),
    );
  });

  it('returns 404 when the user row is missing in the transaction', async () => {
    const crate: Partial<UserCrate> = {
      id: 'crate-1',
      tier: 1,
      acquiredLevel: 2,
      opened: false,
      openedAt: null,
      rewardKind: null,
      rewardCoins: null,
      rewardPowerupType: null,
      user: { id: 'user-1' } as User,
    };
    const crateRepo = createMockRepository<UserCrate>({
      findOne: jest.fn().mockResolvedValue(crate),
    });
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(null),
    });
    mockAppDataSourceTransaction(
      new Map<any, any>([[UserCrate, crateRepo], [User, userRepo]]),
    );

    const req = createMockRequest({
      user: { sub: 'user-1' } as any,
      params: { crateId: 'crate-1' },
    });
    const res = createMockResponse();

    await openCrate(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'USER_NOT_FOUND' }),
    );
  });

  it('marks the crate as opened and returns a balance', async () => {
    const crate: Partial<UserCrate> = {
      id: 'crate-1',
      tier: 1,
      acquiredLevel: 3,
      opened: false,
      openedAt: null,
      rewardKind: null,
      rewardCoins: null,
      rewardPowerupType: null,
      user: { id: 'user-1' } as User,
    };
    const user = { id: 'user-1', balance: '500.00', level: 3 } as User;

    const crateRepo = createMockRepository<UserCrate>({
      findOne: jest.fn().mockResolvedValue(crate),
      save: jest.fn().mockImplementation(async (c) => c),
    });
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockImplementation(async (u) => u),
    });
    const walletRepo = createMockRepository<WalletTransaction>({
      create: jest.fn().mockImplementation((d) => ({ id: 'tx-1', ...d })),
      save: jest.fn().mockResolvedValue(undefined),
    });
    // PowerupType query builder mock
    const powerupRepo = createMockRepository<PowerupType>({
      find: jest.fn().mockResolvedValue([]),
    });

    mockAppDataSourceTransaction(
      new Map<any, any>([
        [UserCrate, crateRepo],
        [User, userRepo],
        [WalletTransaction, walletRepo],
        [PowerupType, powerupRepo],
      ]),
    );

    const req = createMockRequest({
      user: { sub: 'user-1' } as any,
      params: { crateId: 'crate-1' },
    });
    const res = createMockResponse();

    await openCrate(req as any, res);

    expect(crateRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        crate: expect.objectContaining({ opened: true }),
        balance: expect.any(Number),
      }),
    );
  });

  it('adds three pills for a tier 3 powerup reward', async () => {
    jest.spyOn(crypto, 'randomInt').mockReturnValue(0 as never);

    const powerup = { id: 1, code: 'RED_PILL', title: 'Red Pill' } as PowerupType;
    const existingPowerup = {
      id: 'user-powerup-1',
      quantity: 2,
      user: { id: 'user-1' } as User,
      type: powerup,
    } as UserPowerup;
    const crate: Partial<UserCrate> = {
      id: 'crate-3',
      tier: 3,
      acquiredLevel: 12,
      opened: false,
      openedAt: null,
      rewardKind: null,
      rewardCoins: null,
      rewardPowerupType: null,
      user: { id: 'user-1' } as User,
    };
    const user = { id: 'user-1', balance: '500.00', level: 12 } as User;

    const crateRepo = createMockRepository<UserCrate>({
      findOne: jest.fn().mockResolvedValue(crate),
      save: jest.fn().mockImplementation(async (c) => c),
    });
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
    });
    const walletRepo = createMockRepository<WalletTransaction>();
    const powerupRepo = createMockRepository<PowerupType>({
      findOne: jest.fn().mockResolvedValue(powerup),
    });
    const userPowerupRepo = createMockRepository<UserPowerup>({
      findOne: jest.fn().mockResolvedValue(existingPowerup),
      save: jest.fn().mockImplementation(async (up) => up),
    });

    mockAppDataSourceTransaction(
      new Map<any, any>([
        [UserCrate, crateRepo],
        [User, userRepo],
        [WalletTransaction, walletRepo],
        [PowerupType, powerupRepo],
        [UserPowerup, userPowerupRepo],
      ]),
    );

    const req = createMockRequest({
      user: { sub: 'user-1' } as any,
      params: { crateId: 'crate-3' },
    });
    const res = createMockResponse();

    await openCrate(req as any, res);

    expect(existingPowerup.quantity).toBe(5);
    expect(userPowerupRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 5 }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        crate: expect.objectContaining({
          tier: 3,
          reward: expect.objectContaining({
            kind: 'powerup',
            powerup: expect.objectContaining({ code: 'RED_PILL', quantity: 3 }),
          }),
        }),
      }),
    );
  });
});
