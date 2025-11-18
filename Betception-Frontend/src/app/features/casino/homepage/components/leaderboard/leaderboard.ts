import { Component, DestroyRef, inject } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, DecimalPipe, CurrencyPipe } from '@angular/common';
import { map, Observable, Subscription } from 'rxjs';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
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
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, DecimalPipe, CurrencyPipe],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.css'],
})
export class LeaderboardComponent {
  private readonly api = inject(BetceptionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageSize = 10;
  private requestSub: Subscription | null = null;

  readonly categories = [
    {
      id: 'balance' as LeaderboardCategoryId,
      label: 'Balance',
      description: 'Top Kontostaende - wer hat die meisten Coins auf der Wallet?',
      columns: [{ key: 'balance', label: 'Balance', format: 'currency' }] as LeaderboardColumn[],
    },
    {
      id: 'level' as LeaderboardCategoryId,
      label: 'Level',
      description: 'Highest level + XP progress.',
      columns: [
        { key: 'level', label: 'Level', format: 'number' },
        { key: 'xp', label: 'XP', format: 'number' },
      ] as LeaderboardColumn[],
    },
    {
      id: 'winnings' as LeaderboardCategoryId,
      label: 'Winnings',
      description: 'Net winnings of the last 7 days.',
      columns: [{ key: 'netWinnings7d', label: 'Net Winnings (7d)', format: 'currency' }] as LeaderboardColumn[],
    },
  ];

  activeCategory = this.categories[0];

  loading = false;
  error: string | null = null;
  rows: LeaderboardRow[] = [];
  currentUserRank: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.requestSub?.unsubscribe());
    this.loadCategory(this.activeCategory.id);
  }

  selectCategory(id: LeaderboardCategoryId) {
    if (this.activeCategory.id === id) return;
    const next = this.categories.find((category) => category.id === id);
    if (!next) {
      return;
    }
    this.activeCategory = next;
    this.loadCategory(id);
  }

  trackRow(_index: number, row: LeaderboardRow) {
    return `${row.rank}-${row.username}`;
  }

  private loadCategory(id: LeaderboardCategoryId) {
    this.loading = true;
    this.error = null;
    this.requestSub?.unsubscribe();
    this.requestSub = this.createRequest(id).subscribe({
      next: (state) => {
        this.rows = state.rows;
        this.currentUserRank = state.currentUserRank;
        this.loading = false;
      },
      error: (err) => {
        this.rows = [];
        this.currentUserRank = null;
        this.error = this.extractMessage(err);
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
        username: `User #${item.userId}`,
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
    return 'Leaderboard konnte nicht geladen werden.';
  }
}
