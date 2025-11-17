import { getRoundFairness, listFairnessHistory } from '../../../modules/fairness/fairness.controller.js';
import { Round } from '../../../entity/Round.js';
import { RoundStatus } from '../../../entity/enums.js';
import {
  createMockRequest,
  createMockResponse,
  createMockRepository,
  mockAppDataSourceRepositories,
} from '../../test-utils.js';

describe('fairness.controller', () => {
  describe('getRoundFairness', () => {
    it('returns hash while round is active', async () => {
      const round = {
        id: '1',
        status: RoundStatus.IN_PROGRESS,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        startedAt: new Date('2025-01-01T00:05:00Z'),
        endedAt: null,
        serverSeedHash: 'abc',
        serverSeed: 'secret',
      } as Round;

      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(round),
      });
      mockAppDataSourceRepositories(new Map([[Round, roundRepo]]));

      const req = createMockRequest({ params: { roundId: '1' } as any });
      const res = createMockResponse();

      await getRoundFairness(req as any, res);

      expect(res.json).toHaveBeenCalledWith({
        round: {
          roundId: '1',
          status: RoundStatus.IN_PROGRESS,
          createdAt: round.createdAt,
          startedAt: round.startedAt,
          endedAt: null,
          serverSeedHash: 'abc',
          serverSeed: null,
          revealedAt: null,
        },
      });
    });

    it('returns 404 when round is missing', async () => {
      const roundRepo = createMockRepository<Round>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[Round, roundRepo]]));

      const req = createMockRequest({ params: { roundId: '99' } as any });
      const res = createMockResponse();

      await getRoundFairness(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Round not found' });
    });
  });

  describe('listFairnessHistory', () => {
    it('lists settled rounds with revealed seeds', async () => {
      const settled = {
        id: '2',
        status: RoundStatus.SETTLED,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        startedAt: new Date('2025-01-01T00:05:00Z'),
        endedAt: new Date('2025-01-01T00:10:00Z'),
        serverSeedHash: 'hash-2',
        serverSeed: 'seed-2',
      } as Round;

      const roundRepo = createMockRepository<Round>({
        findAndCount: jest.fn().mockResolvedValue([[settled], 1]),
      });
      mockAppDataSourceRepositories(new Map([[Round, roundRepo]]));

      const req = createMockRequest({ query: { limit: 20, page: 1 } as any });
      const res = createMockResponse();

      await listFairnessHistory(req as any, res);

      expect(res.json).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        total: 1,
        items: [
          {
            roundId: '2',
            status: RoundStatus.SETTLED,
            createdAt: settled.createdAt,
            startedAt: settled.startedAt,
            endedAt: settled.endedAt,
            serverSeedHash: 'hash-2',
            serverSeed: 'seed-2',
            revealedAt: settled.endedAt,
          },
        ],
      });
    });
  });
});
