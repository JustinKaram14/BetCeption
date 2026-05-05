import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { CrateReward, UserCrateItem } from '../../../../../core/api/api.types';

const ITEM_SLOT_PX = 118;
const SPIN_COUNT = 60;
const WINNER_IDX = 50;
const SPIN_MS = 5200;

const TIER_COIN_RANGES: [number, number][] = [
  [50, 400],
  [200, 1000],
  [500, 3000],
];

interface SpinItem {
  kind: 'coins' | 'powerup';
  amount: number;
  label: string;
  pillCode?: 'RED_PILL' | 'BLUE_PILL';
  tier: number;
  isWinner: boolean;
}

type SpinPhase = 'idle' | 'loading' | 'spinning' | 'done';

@Component({
  selector: 'app-crate-inventory',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './crate-inventory.html',
  styleUrl: './crate-inventory.css',
})
export class CrateInventoryComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() balanceUpdated = new EventEmitter<number>();

  @ViewChild('spinViewport') spinViewportRef?: ElementRef<HTMLElement>;

  private readonly api = inject(BetceptionApi);
  private readonly destroyRef = inject(DestroyRef);

  crates: UserCrateItem[] = [];
  loading = true;
  error: string | null = null;

  spinPhase: SpinPhase = 'idle';
  spinItems: SpinItem[] = [];
  spinTranslateX = 0;
  spinAnimating = false;
  spinReward: CrateReward | null = null;
  spinTier = 1;
  spinTierLabel = '';

  private readonly spinTimers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.loadCrates();
  }

  tierName(tier: number): string {
    return `T${Math.max(1, Math.min(3, tier))}`;
  }

  pillLabel(code: string | undefined, fallback = 'Pille'): string {
    if (code === 'RED_PILL') return 'Rote Pille';
    if (code === 'BLUE_PILL') return 'Blaue Pille';
    if (fallback === 'Red Pill') return 'Rote Pille';
    if (fallback === 'Blue Pill') return 'Blaue Pille';
    return fallback;
  }

  rewardLabel(reward: CrateReward | null): string {
    if (!reward) return '';
    if (reward.kind === 'coins') {
      return `${(reward.coins ?? 0).toLocaleString('de-DE')} Coins`;
    }
    return this.pillRewardLabel(reward);
  }

  rewardKind(reward: CrateReward | null): 'coins' | 'powerup' | 'empty' {
    return reward?.kind ?? 'empty';
  }

  get unopenedCrates(): UserCrateItem[] {
    return this.crates.filter((crate) => !crate.opened);
  }

  get openedCrates(): UserCrateItem[] {
    return this.crates.filter((crate) => crate.opened);
  }

  onOpen(crate: UserCrateItem): void {
    if (this.spinPhase !== 'idle') return;
    this.spinTier = crate.tier;
    this.spinTierLabel = crate.tierLabel;
    this.spinPhase = 'loading';
    this.error = null;

    this.api
      .openCrate(crate.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const idx = this.crates.findIndex((item) => item.id === res.crate.id);
          if (idx >= 0) {
            this.crates = [
              ...this.crates.slice(0, idx),
              res.crate,
              ...this.crates.slice(idx + 1),
            ];
          }
          this.balanceUpdated.emit(res.balance);
          this.spinReward = res.crate.reward ?? null;
          this.startSpin(res.crate.reward!);
        },
        error: (err) => {
          this.spinPhase = 'idle';
          this.error = err?.error?.message ?? 'Fehler beim Oeffnen der Kiste';
        },
      });
  }

  onDismissReveal(): void {
    this.clearTimers();
    this.spinPhase = 'idle';
    this.spinItems = [];
    this.spinReward = null;
    this.spinAnimating = false;
  }

  onClose(): void {
    this.clearTimers();
    this.closed.emit();
  }

  private startSpin(reward: CrateReward): void {
    this.spinItems = this.buildStrip(this.spinTier, reward);
    this.spinTranslateX = 0;
    this.spinAnimating = false;
    this.spinPhase = 'spinning';

    const t1 = setTimeout(() => {
      const viewportW = this.spinViewportRef?.nativeElement.offsetWidth ?? 830;
      const winnerCenter = WINNER_IDX * ITEM_SLOT_PX + Math.floor(ITEM_SLOT_PX / 2);
      const jitter = Math.floor(Math.random() * 40) - 20;
      this.spinTranslateX = -(winnerCenter - Math.floor(viewportW / 2)) + jitter;
      this.spinAnimating = true;
    }, 80);

    const t2 = setTimeout(() => {
      this.spinPhase = 'done';
    }, SPIN_MS + 80 + 350);

    this.spinTimers.push(t1, t2);
  }

  private buildStrip(tier: number, winner: CrateReward): SpinItem[] {
    const [minC, maxC] = TIER_COIN_RANGES[tier - 1] ?? TIER_COIN_RANGES[0];

    return Array.from({ length: SPIN_COUNT }, (_, i) => {
      if (i === WINNER_IDX) {
        return {
          kind: winner.kind,
          amount: winner.coins ?? 0,
          label: winner.kind === 'coins'
            ? `${(winner.coins ?? 0).toLocaleString('de-DE')} Coins`
            : this.pillRewardLabel(winner),
          pillCode: winner.powerup?.code === 'RED_PILL' || winner.powerup?.code === 'BLUE_PILL'
            ? winner.powerup.code
            : undefined,
          tier,
          isWinner: true,
        };
      }

      if (Math.random() < 0.07) {
        const pillCode = Math.random() < 0.5 ? 'RED_PILL' : 'BLUE_PILL';
        return {
          kind: 'powerup',
          amount: 0,
          label: this.pillLabel(pillCode),
          pillCode,
          tier: Math.max(1, tier - 1),
          isWinner: false,
        };
      }

      const amount = Math.floor(Math.random() * (maxC - minC + 1)) + minC;
      const fakeTier = Math.max(1, Math.min(3, tier + Math.floor(Math.random() * 3) - 1));
      return {
        kind: 'coins',
        amount,
        label: `${amount.toLocaleString('de-DE')} Coins`,
        tier: fakeTier,
        isWinner: false,
      };
    });
  }

  private pillRewardLabel(reward: CrateReward): string {
    const label = this.pillLabel(reward.powerup?.code, reward.powerup?.title ?? 'Pille');
    const quantity = Math.max(1, Math.floor(reward.powerup?.quantity ?? 1));
    return quantity > 1 ? `${quantity}x ${label}` : label;
  }

  private clearTimers(): void {
    this.spinTimers.forEach((timer) => clearTimeout(timer));
    this.spinTimers.length = 0;
  }

  private loadCrates(): void {
    this.loading = true;
    this.api
      .listCrates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.crates = res.items;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
