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
      'settleRound',
      'getRound',
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
});
