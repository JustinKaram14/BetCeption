import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Rng } from './rng';
import { BetceptionApi } from '../../api/betception-api.service';

describe('Rng', () => {
  let service: Rng;
  let apiMock: jasmine.SpyObj<BetceptionApi>;

  beforeEach(() => {
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'startRound',
      'getActiveRound',
      'hitRound',
      'standRound',
      'dealerStepRound',
      'settleRound',
      'doubleRound',
      'splitRound',
      'getRound',
      'consumePowerup',
      'getFairnessRound',
      'listFairnessHistory',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: BetceptionApi, useValue: apiMock }],
    });

    service = TestBed.inject(Rng);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('startRound delegates to api.startRound', () => {
    apiMock.startRound.and.returnValue(of({ round: {} } as any));
    service.startRound({ betAmount: 10 }).subscribe();
    expect(apiMock.startRound).toHaveBeenCalledWith({ betAmount: 10 });
  });

  it('hit delegates to api.hitRound', () => {
    apiMock.hitRound.and.returnValue(of({ round: {} } as any));
    service.hit('round-1').subscribe();
    expect(apiMock.hitRound).toHaveBeenCalledWith('round-1');
  });

  it('stand delegates to api.standRound', () => {
    apiMock.standRound.and.returnValue(of({ round: {} } as any));
    service.stand('round-1').subscribe();
    expect(apiMock.standRound).toHaveBeenCalledWith('round-1');
  });

  it('delegates the remaining round actions to BetceptionApi', () => {
    apiMock.getActiveRound.and.returnValue(of({ round: {} } as any));
    apiMock.dealerStepRound.and.returnValue(of({ round: {} } as any));
    apiMock.settleRound.and.returnValue(of({ round: {} } as any));
    apiMock.doubleRound.and.returnValue(of({ round: {} } as any));
    apiMock.splitRound.and.returnValue(of({ round: {} } as any));
    apiMock.getRound.and.returnValue(of({ round: {} } as any));

    service.getActiveRound().subscribe();
    service.dealerStep('round-1').subscribe();
    service.settle('round-1').subscribe();
    service.double('round-1').subscribe();
    service.split('round-1').subscribe();
    service.getRound('round-1').subscribe();

    expect(apiMock.getActiveRound).toHaveBeenCalled();
    expect(apiMock.dealerStepRound).toHaveBeenCalledWith('round-1');
    expect(apiMock.settleRound).toHaveBeenCalledWith('round-1');
    expect(apiMock.doubleRound).toHaveBeenCalledWith('round-1');
    expect(apiMock.splitRound).toHaveBeenCalledWith('round-1');
    expect(apiMock.getRound).toHaveBeenCalledWith('round-1');
  });

  it('delegates powerup and fairness calls to BetceptionApi', () => {
    const consumePayload = { roundId: 'round-1', inventoryId: 'powerup-1' } as any;
    const historyQuery = { page: 2, limit: 5 };
    apiMock.consumePowerup.and.returnValue(of({ round: {} } as any));
    apiMock.getFairnessRound.and.returnValue(of({} as any));
    apiMock.listFairnessHistory.and.returnValue(of({ items: [] } as any));

    service.consumePowerup(consumePayload).subscribe();
    service.getFairness('round-1').subscribe();
    service.listFairnessHistory(historyQuery).subscribe();
    service.listFairnessHistory().subscribe();

    expect(apiMock.consumePowerup).toHaveBeenCalledWith(consumePayload);
    expect(apiMock.getFairnessRound).toHaveBeenCalledWith('round-1');
    expect(apiMock.listFairnessHistory).toHaveBeenCalledWith(historyQuery);
    expect(apiMock.listFairnessHistory).toHaveBeenCalledWith({});
  });
});
