import { Injectable, inject } from '@angular/core';
import { WalletAdjustmentRequest, WalletTransactionsQuery } from '../../api/api.types';
import { BetceptionApi } from '../../api/betception-api.service';

@Injectable({
  providedIn: 'root',
})
export class Wallet {
  private readonly api = inject(BetceptionApi);

  getSummary() {
    return this.api.getWalletSummary();
  }

  getTransactions(query: WalletTransactionsQuery = {}) {
    return this.api.getWalletTransactions(query);
  }

  deposit(payload: WalletAdjustmentRequest) {
    return this.api.depositFunds(payload);
  }

  withdraw(payload: WalletAdjustmentRequest) {
    return this.api.withdrawFunds(payload);
  }

  claimDailyReward() {
    return this.api.claimDailyReward();
  }
}
