import {
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import type { DayRewardScheduleItem } from '../../../../../core/api/api.types';

/** Kept for backward-compat with any external consumers; no longer used internally. */
export type DailyRewardState =
  | { kind: 'loading' }
  | { kind: 'success'; claimedAmount: number; balance: number; eligibleAt: string }
  | { kind: 'already-claimed'; eligibleAt: string }
  | { kind: 'not-logged-in' }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-daily-reward-modal',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './daily-reward-modal.html',
  styleUrls: ['./daily-reward-modal.css'],
})
export class DailyRewardModalComponent implements OnInit, OnDestroy {
  private readonly api = inject(BetceptionApi);
  private readonly destroyRef = inject(DestroyRef);

  @Output() closed = new EventEmitter<void>();
  @Output() claimed = new EventEmitter<number>();

  loading = true;
  claiming = false;
  error: string | null = null;

  schedule: DayRewardScheduleItem[] = [];
  loginStreak = 0;
  currentDay = 1;
  isEligible = false;
  eligibleAt: string | null = null;
  streakWasReset = false;

  justClaimedDay: number | null = null;
  justClaimedReward: DayRewardScheduleItem | null = null;

  now = Date.now();
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadStatus();
    this.tickInterval = setInterval(() => { this.now = Date.now(); }, 30_000);
  }

  ngOnDestroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  getDayState(day: number): 'claimed' | 'current' | 'upcoming' {
    const effective = this.justClaimedDay ?? this.currentDay - 1;
    if (day <= effective) return 'claimed';
    if (day === (this.justClaimedDay !== null ? this.currentDay : this.currentDay)) {
      if (day === this.currentDay && this.justClaimedDay === null) return 'current';
    }
    return day < this.currentDay ? 'claimed' : day === this.currentDay ? 'current' : 'upcoming';
  }

  get countdownText(): string {
    if (this.loading) return '';
    if (!this.eligibleAt) return 'Jetzt verfügbar';
    const diff = new Date(this.eligibleAt).getTime() - this.now;
    if (diff <= 0) return 'Jetzt verfügbar';
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    return `${hours}h ${minutes}m`;
  }

  rewardKindLabel(item: DayRewardScheduleItem): string {
    return item.kind === 'powerup' ? 'Pille' : 'Coins';
  }

  rewardLabel(item: DayRewardScheduleItem): string {
    if (item.kind === 'coins') {
      return `${item.coins?.toLocaleString('de-DE') ?? item.label} Coins`;
    }
    return item.powerupLabel ?? item.label;
  }

  rewardTone(item: DayRewardScheduleItem): 'coin' | 'pill-red' | 'pill-blue' | 'pill-mixed' {
    if (item.kind === 'coins') return 'coin';
    if (item.powerupCode === 'RED_PILL') return 'pill-red';
    if (item.powerupCode === 'BLUE_PILL') return 'pill-blue';
    return 'pill-mixed';
  }

  onClaim() {
    if (!this.isEligible || this.claiming) return;
    this.claiming = true;
    this.error = null;
    this.api.claimDailyReward()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.claiming = false;
          this.justClaimedDay = res.claimedDay;
          this.justClaimedReward = res.reward;
          this.loginStreak = res.loginStreak;
          this.currentDay = (res.loginStreak % 30) + 1;
          this.isEligible = false;
          this.eligibleAt = res.eligibleAt;
          this.claimed.emit(res.balance);
        },
        error: (err) => {
          this.claiming = false;
          this.error = err?.error?.message ?? 'Fehler beim Abholen';
        },
      });
  }

  onClose() { this.closed.emit(); }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dr-overlay')) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    event.preventDefault();
    this.closed.emit();
  }

  private loadStatus() {
    this.loading = true;
    this.api.getDailyRewardStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.schedule = res.schedule;
          this.loginStreak = res.loginStreak;
          this.currentDay = res.currentDay;
          this.isEligible = res.isEligible;
          this.eligibleAt = res.eligibleAt;
          this.streakWasReset = res.streakReset;
        },
        error: () => {
          this.loading = false;
          this.error = 'Status konnte nicht geladen werden';
        },
      });
  }
}

