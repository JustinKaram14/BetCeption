import { Round } from '../../entity/Round.js';
import { RoundStatus } from '../../entity/enums.js';

export type FairnessPayload = {
  roundId: string;
  status: RoundStatus;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  serverSeedHash: string | null;
  serverSeed: string | null;
  revealedAt: Date | null;
};

export function buildFairnessPayload(round: Pick<
  Round,
  'id' | 'status' | 'createdAt' | 'startedAt' | 'endedAt' | 'serverSeedHash' | 'serverSeed'
>): FairnessPayload {
  const isRevealed = round.status === RoundStatus.SETTLED && !!round.serverSeed;
  return {
    roundId: round.id,
    status: round.status,
    createdAt: round.createdAt,
    startedAt: round.startedAt ?? null,
    endedAt: round.endedAt ?? null,
    serverSeedHash: round.serverSeedHash ?? null,
    serverSeed: isRevealed ? round.serverSeed : null,
    revealedAt: isRevealed ? round.endedAt ?? null : null,
  };
}
