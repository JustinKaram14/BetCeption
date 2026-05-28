import {
  activateOwnBetceptionPreset,
  deleteOwnBetceptionPreset,
  getOwnBetceptionPreset,
  upsertOwnBetceptionPreset,
} from '../../../modules/betception-presets/betception-presets.controller.js';
import { UpsertBetceptionPresetSchema } from '../../../modules/betception-presets/betception-presets.schema.js';
import { BetceptionPreset } from '../../../entity/BetceptionPreset.js';
import { User } from '../../../entity/User.js';
import { CardRank, CardSuit } from '../../../entity/enums.js';
import {
  createMockRequest,
  createMockResponse,
  createMockRepository,
  mockAppDataSourceRepositories,
} from '../../test-utils.js';

describe('betception-presets.controller', () => {
  it('returns the saved preset for the current user', async () => {
    const preset = {
      id: '7',
      name: 'Dealer Trap',
      stakeMode: 'fixed',
      configJson: {
        items: [{ typeCode: 'DEALER_BUST', amount: 25 }],
      },
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    } as unknown as BetceptionPreset;
    const presetRepo = createMockRepository<BetceptionPreset>({
      find: jest.fn().mockResolvedValue([preset]),
    } as any);
    mockAppDataSourceRepositories(new Map([[BetceptionPreset, presetRepo]]));

    const req = createMockRequest({ user: { sub: '1' } as any });
    const res = createMockResponse();

    await getOwnBetceptionPreset(req, res);

    expect(presetRepo.find).toHaveBeenCalledWith({
      where: { user: { id: '1' } },
      order: { isActive: 'DESC', updatedAt: 'DESC', id: 'DESC' },
    } as any);
    expect(res.json).toHaveBeenCalledWith({
      preset: expect.objectContaining({
        id: '7',
        name: 'Dealer Trap',
        stakeMode: 'fixed',
        items: [{ typeCode: 'DEALER_BUST', amount: 25 }],
        isActive: true,
      }),
      presets: [expect.objectContaining({ id: '7', isActive: true })],
      activePresetId: '7',
    });
  });

  it('creates a preset when none exists', async () => {
    const user = { id: '1' } as User;
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
    });
    const presetRepo = createMockRepository<BetceptionPreset>({
      find: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{
          id: '10',
          name: 'Percent Run',
          stakeMode: 'percentage',
          configJson: {
            items: [
              { typeCode: 'CARD_SUIT', predictedSuit: CardSuit.HEARTS, percent: 10 },
              { typeCode: 'SPLIT_COUNT', selection: { splitCount: 2 }, percent: 5 },
            ],
          },
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        }]),
      create: jest.fn((data) => data as BetceptionPreset),
      save: jest.fn().mockImplementation(async (preset) => ({
        id: '10',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        ...preset,
      })),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      }),
    } as any);
    mockAppDataSourceRepositories(new Map<any, any>([
      [User, userRepo],
      [BetceptionPreset, presetRepo],
    ]));

    const req = createMockRequest({
      user: { sub: '1' } as any,
      body: {
        name: 'Percent Run',
        stakeMode: 'percentage',
        items: [
          { typeCode: 'CARD_SUIT', predictedSuit: CardSuit.HEARTS, percent: 10 },
          { typeCode: 'SPLIT_COUNT', selection: { splitCount: 2 }, percent: 5 },
        ],
      },
    });
    const res = createMockResponse();

    await upsertOwnBetceptionPreset(req as any, res);

    expect(presetRepo.create).toHaveBeenCalledWith(expect.objectContaining({ user }));
    expect(presetRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Percent Run',
      stakeMode: 'percentage',
      isActive: true,
      configJson: {
        items: [
          { typeCode: 'CARD_SUIT', predictedSuit: CardSuit.HEARTS, percent: 10 },
          { typeCode: 'SPLIT_COUNT', selection: { splitCount: 2 }, percent: 5 },
        ],
      },
    }));
    expect(res.json.mock.calls[0][0].preset.name).toBe('Percent Run');
    expect(res.json.mock.calls[0][0].activePresetId).toBe('10');
  });

  it('activates a preset for the current user', async () => {
    const preset = {
      id: '20',
      name: 'Card Trap',
      stakeMode: 'fixed',
      configJson: { items: [{ typeCode: 'CARD_EXACT', predictedSuit: CardSuit.SPADES, predictedRank: CardRank.ACE, amount: 25 }] },
      isActive: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as unknown as BetceptionPreset;
    const presetRepo = createMockRepository<BetceptionPreset>({
      findOne: jest.fn().mockResolvedValue(preset),
      find: jest.fn().mockResolvedValue([{ ...preset, isActive: true }]),
      save: jest.fn().mockImplementation(async (entity) => entity),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    } as any);
    mockAppDataSourceRepositories(new Map([[BetceptionPreset, presetRepo]]));

    const req = createMockRequest({ user: { sub: '1' } as any, params: { presetId: '20' } });
    const res = createMockResponse();

    await activateOwnBetceptionPreset(req as any, res);

    expect(presetRepo.findOne).toHaveBeenCalledWith({ where: { id: '20', user: { id: '1' } } });
    expect(presetRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: '20', isActive: true }));
    expect(res.json.mock.calls[0][0].activePresetId).toBe('20');
  });

  it('deletes the current user preset', async () => {
    const preset = {
      id: '7',
      name: 'Dealer Trap',
      stakeMode: 'fixed',
      configJson: { items: [] },
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as unknown as BetceptionPreset;
    const presetRepo = createMockRepository<BetceptionPreset>({
      find: jest.fn().mockResolvedValueOnce([preset]).mockResolvedValueOnce([]).mockResolvedValueOnce([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    });
    mockAppDataSourceRepositories(new Map([[BetceptionPreset, presetRepo]]));

    const req = createMockRequest({ user: { sub: '1' } as any, params: { presetId: '7' } });
    const res = createMockResponse();

    await deleteOwnBetceptionPreset(req, res);

    expect(presetRepo.delete).toHaveBeenCalledWith({ id: '7', user: { id: '1' } });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      preset: null,
      presets: [],
      activePresetId: null,
    });
  });

  it('validates preset selections and percentage caps', () => {
    const invalid = UpsertBetceptionPresetSchema.safeParse({
      name: 'Broken',
      stakeMode: 'percentage',
      items: [
        { typeCode: 'CARD_EXACT', predictedSuit: CardSuit.SPADES, percent: 80 },
        { typeCode: 'CARD_SUIT', predictedSuit: CardSuit.HEARTS, percent: 30 },
        { typeCode: 'SPLIT_COUNT', selection: { splitCount: 4 }, percent: 10 },
      ],
    });

    expect(invalid.success).toBe(false);
    expect(invalid.error?.issues.some((issue) => issue.message.includes('CARD percent'))).toBe(true);
    expect(invalid.error?.issues.some((issue) => issue.path.includes('splitCount'))).toBe(true);

    const valid = UpsertBetceptionPresetSchema.safeParse({
      name: 'Clean',
      stakeMode: 'fixed',
      items: [
        {
          typeCode: 'CARD_EXACT',
          predictedSuit: CardSuit.SPADES,
          predictedRank: CardRank.ACE,
          amount: 25,
        },
      ],
    });

    expect(valid.success).toBe(true);
  });
});
