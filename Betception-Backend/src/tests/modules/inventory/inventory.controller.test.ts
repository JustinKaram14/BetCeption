import { listInventory } from '../../../modules/inventory/inventory.controller.js';
import { UserPowerup } from '../../../entity/UserPowerup.js';
import { createMockRepository, createMockRequest, createMockResponse, mockAppDataSourceRepositories } from '../../test-utils.js';

describe('inventory.controller', () => {
  it('returns the user inventory with power-up type details', async () => {
    const userPowerups = [
      {
        id: '1',
        quantity: 3,
        acquiredAt: new Date('2025-01-01T00:00:00Z'),
        type: {
          id: 1,
          code: 'BOOST',
          title: 'Boost',
          description: 'desc',
          minLevel: 1,
          price: '10.00',
          effectJson: { xp: 10 },
        },
      },
    ] as unknown as UserPowerup[];

    const repo = createMockRepository<UserPowerup>({
      find: jest.fn().mockResolvedValue(userPowerups),
    });
    mockAppDataSourceRepositories(new Map([[UserPowerup, repo]]));

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
            code: 'BOOST',
            title: 'Boost',
            description: 'desc',
            minLevel: 1,
            price: 10,
            effect: { xp: 10 },
          },
        },
      ],
    });
  });
});
