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
      'getWalletTransactionsSummary',
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
    const reward = { claimedAmount: 100, balance: 1100, eligibleAt: '' } as any;
    apiMock.claimDailyReward.and.returnValue(of(reward));

    let result: any;
    service.claimDailyReward().subscribe((r) => (result = r));

    expect(apiMock.claimDailyReward).toHaveBeenCalled();
    expect(result).toEqual(reward);
  });

  it('getTransactions delegates to api.getWalletTransactions', () => {
    const transactions = { page: 1, pageSize: 10, total: 0, items: [] };
    apiMock.getWalletTransactions.and.returnValue(of(transactions as any));

    let result: any;
    service.getTransactions().subscribe((r) => (result = r));

    expect(apiMock.getWalletTransactions).toHaveBeenCalled();
    expect(result).toEqual(transactions);
  });

  it('getTransactionsSummary delegates to api.getWalletTransactionsSummary', () => {
    const summary = { totalWins: 100, totalLossesOrBets: 20, netTotal: 80, transactionCount: 3 };
    apiMock.getWalletTransactionsSummary.and.returnValue(of(summary));

    let result: any;
    service.getTransactionsSummary().subscribe((r) => (result = r));

    expect(apiMock.getWalletTransactionsSummary).toHaveBeenCalled();
    expect(result).toEqual(summary);
  });

  it('deposit delegates to api.depositFunds', () => {
    const response = { message: 'ok', balance: 200, transactionId: 'tx-1' };
    apiMock.depositFunds.and.returnValue(of(response));

    let result: any;
    service.deposit({ amount: 100 }).subscribe((r) => (result = r));

    expect(apiMock.depositFunds).toHaveBeenCalledWith({ amount: 100 });
    expect(result).toEqual(response);
  });

  it('withdraw delegates to api.withdrawFunds', () => {
    const response = { message: 'ok', balance: 50, transactionId: 'tx-2' };
    apiMock.withdrawFunds.and.returnValue(of(response));

    let result: any;
    service.withdraw({ amount: 50 }).subscribe((r) => (result = r));

    expect(apiMock.withdrawFunds).toHaveBeenCalledWith({ amount: 50 });
    expect(result).toEqual(response);
  });
});
