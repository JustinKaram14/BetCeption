import { buildFairnessPayload } from '../../modules/fairness/fairness.utils.js';
import { RoundStatus } from '../../entity/enums.js';

describe('buildFairnessPayload', () => {
  const BASE = {
    id: 'round-1',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    startedAt: new Date('2025-01-01T00:05:00Z'),
    endedAt: new Date('2025-01-01T00:10:00Z'),
    serverSeedHash: 'abc123hash',
    serverSeed: 'secret-seed',
  };

  it('reveals the server seed when the round is SETTLED and a seed exists', () => {
    const round = { ...BASE, status: RoundStatus.SETTLED };
    const payload = buildFairnessPayload(round);

    expect(payload.serverSeed).toBe('secret-seed');
    expect(payload.revealedAt).toEqual(round.endedAt);
    expect(payload.serverSeedHash).toBe('abc123hash');
    expect(payload.status).toBe(RoundStatus.SETTLED);
  });

  it('hides the server seed when the round is SETTLED but serverSeed is null', () => {
    const round = { ...BASE, status: RoundStatus.SETTLED, serverSeed: null };
    const payload = buildFairnessPayload(round);

    expect(payload.serverSeed).toBeNull();
    expect(payload.revealedAt).toBeNull();
  });

  it('hides the server seed when the round is IN_PROGRESS (not yet settled)', () => {
    const round = { ...BASE, status: RoundStatus.IN_PROGRESS, endedAt: null };
    const payload = buildFairnessPayload(round);

    expect(payload.serverSeed).toBeNull();
    expect(payload.revealedAt).toBeNull();
    expect(payload.serverSeedHash).toBe('abc123hash');
  });

  it('returns null for startedAt and endedAt when the round has not started', () => {
    const round = {
      ...BASE,
      status: RoundStatus.CREATED,
      startedAt: null,
      endedAt: null,
      serverSeed: null,
    };
    const payload = buildFairnessPayload(round);

    expect(payload.startedAt).toBeNull();
    expect(payload.endedAt).toBeNull();
    expect(payload.roundId).toBe('round-1');
  });
});
