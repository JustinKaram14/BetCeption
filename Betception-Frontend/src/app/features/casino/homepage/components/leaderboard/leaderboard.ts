import { Component, DestroyRef, inject } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, DecimalPipe } from '@angular/common';
import { map, Observable, Subscription } from 'rxjs';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { I18n } from '../../../../../core/i18n/i18n';
import {
  BalanceLeaderboardItem,
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
  private readonly api = inject(BetceptionApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18n);
  private readonly pageSize = 100;
  private requestSub: Subscription | null = null;
  private activeCategoryId: LeaderboardCategoryId = 'balance';

  get categories() {
    return [
      {
        id: 'balance' as LeaderboardCategoryId,
        label: this.i18n.t('controls.balance'),
        description: this.i18n.t('leaderboard.balanceDescription'),
        columns: [{ key: 'balance', label: this.i18n.t('controls.balance'), format: 'currency' }] as LeaderboardColumn[],
      },
      {
        id: 'level' as LeaderboardCategoryId,
        label: 'Level',
        description: this.i18n.t('leaderboard.levelDescription'),
        columns: [
          { key: 'level', label: 'Level', format: 'number' },
          { key: 'xp', label: 'XP', format: 'number' },
        ] as LeaderboardColumn[],
      },
      {
        id: 'winnings' as LeaderboardCategoryId,
        label: this.i18n.t('leaderboard.winnings'),
        description: this.i18n.t('leaderboard.winningsDescription'),
        columns: [{ key: 'netWinnings7d', label: this.i18n.t('leaderboard.netWinnings'), format: 'currency' }] as LeaderboardColumn[],
      },
    ];
  }

  get activeCategory() {
    return this.categories.find((category) => category.id === this.activeCategoryId) ?? this.categories[0];
  }

  loading = false;
  error: string | null = null;
  rows: LeaderboardRow[] = [];
  currentUserRank: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.requestSub?.unsubscribe());
    this.loadCategory(this.activeCategory.id);
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

  trackRow(_index: number, row: LeaderboardRow) {
    return `${row.rank}-${row.username}`;
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
        .getBalanceLeaderboard({ limit: this.pageSize })
        .pipe(map((response) => this.mapBalanceResponse(response)));
    }
    if (id === 'level') {
      return this.api
        .getLevelLeaderboard({ limit: this.pageSize })
        .pipe(map((response) => this.mapLevelResponse(response)));
    }
    return this.api
      .getWinningsLeaderboard({ limit: this.pageSize })
      .pipe(map((response) => this.mapWinningsResponse(response)));
  }

  private mapBalanceResponse(response: LeaderboardResponse<BalanceLeaderboardItem>): LeaderboardState {
    return {
      rows: response.items.map((item) => ({
        rank: item.rank,
        username: item.username,
        metrics: { balance: item.balance },
      })),
      currentUserRank: response.currentUserRank,
    };
  }

  private mapLevelResponse(response: LeaderboardResponse<LevelLeaderboardItem>): LeaderboardState {
    return {
      rows: response.items.map((item) => ({
        rank: item.rank,
        username: item.username,
        metrics: {
          level: item.level,
          xp: item.xp,
        },
      })),
      currentUserRank: response.currentUserRank,
    };
  }

  private mapWinningsResponse(response: LeaderboardResponse<WinningsLeaderboardItem>): LeaderboardState {
    return {
      rows: response.items.map((item) => ({
        rank: item.rank,
        username: item.username,
        metrics: {
          netWinnings7d: item.netWinnings7d,
        },
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
