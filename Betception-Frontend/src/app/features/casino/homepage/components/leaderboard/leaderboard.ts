import { Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, DecimalPipe } from '@angular/common';
import { map, Observable, Subscription } from 'rxjs';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { I18n } from '../../../../../core/i18n/i18n';
import {
  BalanceLeaderboardItem,
  LeaderboardPeriod,
  LeaderboardResponse,
  LevelLeaderboardItem,
  WinningsLeaderboardItem,
} from '../../../../../core/api/api.types';

type LeaderboardCategoryId = 'balance' | 'level' | 'winnings';

type LeaderboardColumn = {
  key: string;
  label: string;
  format: 'currency' | 'number';
};

type LeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  metrics: Partial<Record<string, number>>;
};

type LeaderboardState = {
  rows: LeaderboardRow[];
  currentUserRank: number | null;
};

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, DecimalPipe],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.css'],
})
export class LeaderboardComponent {
  @Input() canViewProfiles = false;
  @Output() userProfileRequested = new EventEmitter<string>();

  private readonly api = inject(BetceptionApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18n);
  private readonly pageSize = 100;
  private requestSub: Subscription | null = null;
  private activeCategoryId: LeaderboardCategoryId = 'balance';
  activePeriod: LeaderboardPeriod = 'alltime';

  get categories() {
    const isWeekly = this.activePeriod === 'seven_days';
    return [
      {
        id: 'balance' as LeaderboardCategoryId,
        label: this.i18n.t('controls.balance'),
        description: this.i18n.t(isWeekly ? 'leaderboard.balanceWeeklyDescription' : 'leaderboard.balanceDescription'),
        columns: [
          {
            key: isWeekly ? 'balance7d' : 'balance',
            label: this.i18n.t(isWeekly ? 'leaderboard.balance7d' : 'controls.balance'),
            format: 'currency',
          },
        ] as LeaderboardColumn[],
      },
      {
        id: 'level' as LeaderboardCategoryId,
        label: 'Level',
        description: this.i18n.t(isWeekly ? 'leaderboard.levelWeeklyDescription' : 'leaderboard.levelDescription'),
        columns: isWeekly
          ? [{ key: 'xp7d', label: this.i18n.t('leaderboard.xp7d'), format: 'number' }] as LeaderboardColumn[]
          : [
            { key: 'level', label: 'Level', format: 'number' },
            { key: 'xp', label: 'XP', format: 'number' },
          ] as LeaderboardColumn[],
      },
      {
        id: 'winnings' as LeaderboardCategoryId,
        label: this.i18n.t('leaderboard.winnings'),
        description: this.i18n.t(isWeekly ? 'leaderboard.winningsWeeklyDescription' : 'leaderboard.winningsDescription'),
        columns: [
          {
            key: isWeekly ? 'netWinnings7d' : 'netWinnings',
            label: this.i18n.t(isWeekly ? 'leaderboard.netWinnings7d' : 'leaderboard.netWinnings'),
            format: 'currency',
          },
        ] as LeaderboardColumn[],
      },
    ];
  }

  get activeCategory() {
    return this.categories.find((category) => category.id === this.activeCategoryId) ?? this.categories[0];
  }

  get activePeriodLabel() {
    return this.i18n.t(this.activePeriod === 'seven_days'
      ? 'leaderboard.periodSevenDays'
      : 'leaderboard.periodAlltime');
  }

  loading = false;
  error: string | null = null;
  rows: LeaderboardRow[] = [];
  currentUserRank: number | null = null;
  searchTerm = '';

  constructor() {
    this.destroyRef.onDestroy(() => this.requestSub?.unsubscribe());
    this.loadCategory(this.activeCategory.id);
  }

  get filteredRows() {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return this.rows;
    }
    return this.rows.filter((row) => row.username.toLowerCase().includes(normalizedSearch));
  }

  selectCategory(id: LeaderboardCategoryId) {
    if (this.activeCategoryId === id) return;
    const next = this.categories.find((category) => category.id === id);
    if (!next) {
      return;
    }
    this.activeCategoryId = next.id;
    this.loadCategory(id);
  }

  selectPeriod(period: LeaderboardPeriod) {
    if (this.activePeriod === period) return;
    this.activePeriod = period;
    this.loadCategory(this.activeCategory.id);
  }

  togglePeriod() {
    this.selectPeriod(this.activePeriod === 'alltime' ? 'seven_days' : 'alltime');
  }

  updateSearch(value: string) {
    this.searchTerm = value;
  }

  clearSearch() {
    this.searchTerm = '';
  }

  trackRow(_index: number, row: LeaderboardRow) {
    return `${row.rank}-${row.userId}`;
  }

  openPublicProfile(row: LeaderboardRow) {
    if (!this.canViewProfiles) return;
    this.userProfileRequested.emit(row.userId);
  }

  private loadCategory(id: LeaderboardCategoryId) {
    this.loading = true;
    this.requestSub?.unsubscribe();
    this.requestSub = this.createRequest(id).subscribe({
      next: (state) => {
        this.rows = state.rows;
        this.currentUserRank = state.currentUserRank;
        this.error = null;
        this.loading = false;
      },
      error: (err) => {
        this.rows = [];
        this.currentUserRank = null;
        this.error = this.extractMessage(err);
        this.toast.error(this.error);
        this.loading = false;
      },
    });
  }

  private createRequest(id: LeaderboardCategoryId): Observable<LeaderboardState> {
    if (id === 'balance') {
      return this.api
        .getBalanceLeaderboard({ limit: this.pageSize, period: this.activePeriod })
        .pipe(map((response) => this.mapBalanceResponse(response)));
    }
    if (id === 'level') {
      return this.api
        .getLevelLeaderboard({ limit: this.pageSize, period: this.activePeriod })
        .pipe(map((response) => this.mapLevelResponse(response)));
    }
    return this.api
      .getWinningsLeaderboard({ limit: this.pageSize, period: this.activePeriod })
      .pipe(map((response) => this.mapWinningsResponse(response)));
  }

  private mapBalanceResponse(response: LeaderboardResponse<BalanceLeaderboardItem>): LeaderboardState {
    return {
      rows: response.items.map((item) => ({
        rank: item.rank,
        userId: item.userId,
        username: item.username,
        metrics: this.activePeriod === 'seven_days'
          ? { balance7d: item.balance7d ?? 0 }
          : { balance: item.balance ?? 0 },
      })),
      currentUserRank: response.currentUserRank,
    };
  }

  private mapLevelResponse(response: LeaderboardResponse<LevelLeaderboardItem>): LeaderboardState {
    return {
      rows: response.items.map((item) => ({
        rank: item.rank,
        userId: item.userId,
        username: item.username,
        metrics: this.activePeriod === 'seven_days'
          ? { xp7d: item.xp7d ?? 0 }
          : {
            level: item.level ?? 0,
            xp: item.xp ?? 0,
          },
      })),
      currentUserRank: response.currentUserRank,
    };
  }

  private mapWinningsResponse(response: LeaderboardResponse<WinningsLeaderboardItem>): LeaderboardState {
    return {
      rows: response.items.map((item) => ({
        rank: item.rank,
        userId: item.userId,
        username: item.username,
        metrics: this.activePeriod === 'seven_days'
          ? { netWinnings7d: item.netWinnings7d ?? 0 }
          : { netWinnings: item.netWinnings ?? 0 },
      })),
      currentUserRank: response.currentUserRank,
    };
  }

  private extractMessage(error: unknown) {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const payload = (error as any).error;
      if (payload && typeof payload === 'object' && 'message' in payload) {
        return String(payload.message);
      }
      if ('message' in (error as any)) {
        return String((error as any).message);
      }
    }
    return this.i18n.t('home.toast.actionFailed');
  }
}
