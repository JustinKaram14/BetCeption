import { Injectable, inject } from '@angular/core';
import {
  BalanceLeaderboardItem,
  ConsumePowerupRequest,
  ConsumePowerupResponse,
  PeekCardResponse,
  SwapCardRequest,
  CrateListResponse,
  CurrentUserResponse,
  DailyRewardResponse,
  DailyRewardStatusResponse,
  FairnessHistoryQuery,
  FairnessHistoryResponse,
  FairnessRoundResponse,
  EquipPowerupRequest,
  EquipPowerupResponse,
  InventoryResponse,
  LeaderboardQuery,
  LeaderboardResponse,
  LevelLeaderboardItem,
  OpenCrateResponse,
  OwnProfileResponse,
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
  WalletTransactionsSummaryQuery,
  WalletTransactionsSummaryResponse,
  WinningsLeaderboardItem,
  ChangeOwnPasswordRequest,
  ChangeOwnPasswordResponse,
  UpdateOwnProfileRequest,
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

  getOwnProfile() {
    return this.http.get<OwnProfileResponse>('/users/me/profile');
  }

  updateOwnProfile(payload: UpdateOwnProfileRequest) {
    return this.http.patch<OwnProfileResponse>('/users/me/profile', payload);
  }

  changeOwnPassword(payload: ChangeOwnPasswordRequest) {
    return this.http.patch<ChangeOwnPasswordResponse>('/users/me/password', payload);
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

  getWalletTransactionsSummary(query: WalletTransactionsSummaryQuery = {}) {
    return this.http.get<WalletTransactionsSummaryResponse>(
      '/wallet/transactions/summary',
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

  getDailyRewardStatus() {
    return this.http.get<DailyRewardStatusResponse>('/rewards/daily/status');
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

  equipPowerup(payload: EquipPowerupRequest) {
    return this.http.post<EquipPowerupResponse>(
      '/inventory/powerups/equip',
      payload,
    );
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

  getActiveRound() {
    return this.http.get<RoundResponse>('/round/active');
  }

  hitRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/hit/${roundId}`);
  }

  standRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/stand/${roundId}`);
  }

  dealerStepRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/dealer-step/${roundId}`);
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

  peekCard(roundId: string) {
    return this.http.get<PeekCardResponse>(`/round/peek/${roundId}`);
  }

  swapCard(roundId: string, cardId: string) {
    return this.http.post<RoundResponse>(`/round/swap-card/${roundId}`, { cardId } as SwapCardRequest);
  }

  undoHit(roundId: string) {
    return this.http.post<RoundResponse>(`/round/undo/${roundId}`);
  }

  doubleRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/double/${roundId}`);
  }

  splitRound(roundId: string) {
    return this.http.post<RoundResponse>(`/round/split/${roundId}`);
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

  listCrates() {
    return this.http.get<CrateListResponse>('/crates');
  }

  openCrate(crateId: string) {
    return this.http.post<OpenCrateResponse>(`/crates/${crateId}/open`);
  }
}
