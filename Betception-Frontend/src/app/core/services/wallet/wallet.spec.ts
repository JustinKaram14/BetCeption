import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Wallet } from './wallet';
import { BetceptionApi } from '../../api/betception-api.service';

describe('Wallet', () => {
  let service: Wallet;
  let apiMock: jasmine.SpyObj<BetceptionApi>;

  beforeEach(() => {
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'getWalletSummary',
      'getWalletTransactions',
      'depositFunds',
      'withdrawFunds',
      'claimDailyReward',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: BetceptionApi, useValue: apiMock }],
    });

    service = TestBed.inject(Wallet);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSummary delegates to api.getWalletSummary', () => {
    const summary = { id: 'u1', username: 'neo', balance: 1000, xp: 0, level: 1, lastDailyRewardAt: null };
    apiMock.getWalletSummary.and.returnValue(of(summary as any));

    let result: any;
    service.getSummary().subscribe((r) => (result = r));

    expect(apiMock.getWalletSummary).toHaveBeenCalled();
    expect(result).toEqual(summary);
  });

  it('claimDailyReward delegates to api.claimDailyReward', () => {
    const reward = { claimedAmount: 100, balance: 1100, eligibleAt: '' };
    apiMock.claimDailyReward.and.returnValue(of(reward));

    let result: any;
    service.claimDailyReward().subscribe((r) => (result = r));

    expect(apiMock.claimDailyReward).toHaveBeenCalled();
    expect(result).toEqual(reward);
  });
});
