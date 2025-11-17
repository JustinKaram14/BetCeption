import { Injectable, inject } from '@angular/core';
import {
  BalanceLeaderboardItem,
  ConsumePowerupRequest,
  ConsumePowerupResponse,
  CurrentUserResponse,
  DailyRewardResponse,
  FairnessHistoryQuery,
  FairnessHistoryResponse,
  FairnessRoundResponse,
  InventoryResponse,
  LeaderboardQuery,
  LeaderboardResponse,
  LevelLeaderboardItem,
  PurchasePowerupRequest,
  PurchasePowerupResponse,
  PowerupListResponse,
  RoundResponse,
  StartRoundRequest,
  WalletAdjustmentRequest,
  WalletAdjustmentResponse,
  WalletSummaryResponse,
  WalletTransactionsQuery,
  WalletTransactionsResponse,
  WinningsLeaderboardItem,
  UserResponse,
} from './api.types';
import { HttpClient } from './http-client';

@Injectable({
  providedIn: 'root',
})
export class BetceptionApi {
  private readonly http = inject(HttpClient);

  getCurrentUser() {
    return this.http.get<CurrentUserResponse>('/users/me');
  }

  getUserById(userId: string) {
    return this.http.get<UserResponse>(`/users/${userId}`);
  }

  getWalletSummary() {
    return this.http.get<WalletSummaryResponse>('/wallet');
  }

  getWalletTransactions(query: WalletTransactionsQuery = {}) {
    return this.http.get<WalletTransactionsResponse>(
      '/wallet/transactions',
      { params: query },
    );
  }

  depositFunds(payload: WalletAdjustmentRequest) {
    return this.http.post<WalletAdjustmentResponse>(
      '/wallet/deposit',
      payload,
    );
  }

  withdrawFunds(payload: WalletAdjustmentRequest) {
    return this.http.post<WalletAdjustmentResponse>(
      '/wallet/withdraw',
      payload,
    );
  }

  claimDailyReward() {
    return this.http.post<DailyRewardResponse>('/rewards/daily/claim');
  }

  listPowerups() {
    return this.http.get<PowerupListResponse>('/shop/powerups');
  }

  purchasePowerup(payload: PurchasePowerupRequest) {
    return this.http.post<PurchasePowerupResponse>(
      '/shop/powerups/purchase',
      payload,
    );
  }

  listInventory() {
    return this.http.get<InventoryResponse>('/inventory/powerups');
  }

  getBalanceLeaderboard(query: LeaderboardQuery = {}) {
    return this.http.get<LeaderboardResponse<BalanceLeaderboardItem>>(
      '/leaderboard/balance',
      { params: query },
    );
  }

  getLevelLeaderboard(query: LeaderboardQuery = {}) {
    return this.http.get<LeaderboardResponse<LevelLeaderboardItem>>(
      '/leaderboard/level',
      { params: query },
    );
  }

  getWinningsLeaderboard(query: LeaderboardQuery = {}) {
    return this.http.get<LeaderboardResponse<WinningsLeaderboardItem>>(
      '/leaderboard/winnings',
      { params: query },
    );
  }

  startRound(payload: StartRoundRequest) {
    return this.http.post<RoundResponse>('/round/start', payload);
  }

  hitRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/hit/${roundId}`);
  }

  standRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/stand/${roundId}`);
  }

  getRound(roundId: string) {
    return this.http.get<RoundResponse>(`/round/${roundId}`);
  }

  settleRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/settle/${roundId}`);
  }

  consumePowerup(payload: ConsumePowerupRequest) {
    return this.http.post<ConsumePowerupResponse>(
      '/powerups/consume',
      payload,
    );
  }

  getFairnessRound(roundId: string) {
    return this.http.get<FairnessRoundResponse>(`/fairness/rounds/${roundId}`);
  }

  listFairnessHistory(query: FairnessHistoryQuery = {}) {
    return this.http.get<FairnessHistoryResponse>(
      '/fairness/rounds/history',
      { params: query },
    );
  }
}
