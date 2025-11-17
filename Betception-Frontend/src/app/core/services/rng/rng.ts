import { Injectable, inject } from '@angular/core';
import { ConsumePowerupRequest, FairnessHistoryQuery, StartRoundRequest } from '../../api/api.types';
import { BetceptionApi } from '../../api/betception-api.service';

@Injectable({
  providedIn: 'root',
})
export class Rng {
  private readonly api = inject(BetceptionApi);

  startRound(payload: StartRoundRequest) {
    return this.api.startRound(payload);
  }

  hit(roundId: string) {
    return this.api.hitRound(roundId);
  }

  stand(roundId: string) {
    return this.api.standRound(roundId);
  }

  settle(roundId: string) {
    return this.api.settleRound(roundId);
  }

  getRound(roundId: string) {
    return this.api.getRound(roundId);
  }

  consumePowerup(payload: ConsumePowerupRequest) {
    return this.api.consumePowerup(payload);
  }

  getFairness(roundId: string) {
    return this.api.getFairnessRound(roundId);
  }

  listFairnessHistory(query: FairnessHistoryQuery = {}) {
    return this.api.listFairnessHistory(query);
  }
}
