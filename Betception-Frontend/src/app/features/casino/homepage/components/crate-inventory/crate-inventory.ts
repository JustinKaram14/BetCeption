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
import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { CrateReward, UserCrateItem } from '../../../../../core/api/api.types';

const TIER_EMOJIS = ['🟢', '🔵', '🟣', '🟡', '🔴'];

// Strip geometry — must match CSS item width + gap
const ITEM_SLOT_PX = 118; // 110px item + 8px gap
const SPIN_COUNT   = 60;  // total items in the strip
const WINNER_IDX   = 50;  // index of the winning item
const SPIN_MS      = 5200; // animation duration (ms)

// Coin ranges per tier [min, max] — mirrors backend TIER_CONFIG
const TIER_COIN_RANGES: [number, number][] = [
  [50, 400], [200, 1000], [500, 3000], [1000, 6000], [2000, 10000],
];

interface SpinItem {
  kind: 'coins' | 'powerup';
  amount: number; // cents for coins, 0 for powerup
  label: string;
  tier: number;
  isWinner: boolean;
}

type SpinPhase = 'idle' | 'loading' | 'spinning' | 'done';

@Component({
  selector: 'app-crate-inventory',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DecimalPipe],
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

  tierEmoji(tier: number): string {
    return TIER_EMOJIS[(tier - 1)] ?? '🟢';
  }

  get unopenedCrates(): UserCrateItem[] {
    return this.crates.filter(c => !c.opened);
  }

  get openedCrates(): UserCrateItem[] {
    return this.crates.filter(c => c.opened);
  }

  onOpen(crate: UserCrateItem): void {
    if (this.spinPhase !== 'idle') return;
    this.spinTier      = crate.tier;
    this.spinTierLabel = crate.tierLabel;
    this.spinPhase     = 'loading';
    this.error         = null;

    this.api
      .openCrate(crate.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // Update crate list immediately
          const idx = this.crates.findIndex(c => c.id === res.crate.id);
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
          this.error = err?.error?.message ?? 'Fehler beim Öffnen der Kiste';
        },
      });
  }

  onDismissReveal(): void {
    this.clearTimers();
    this.spinPhase    = 'idle';
    this.spinItems    = [];
    this.spinReward   = null;
    this.spinAnimating = false;
  }

  onClose(): void {
    this.clearTimers();
    this.closed.emit();
  }

  private startSpin(reward: CrateReward): void {
    this.spinItems       = this.buildStrip(this.spinTier, reward);
    this.spinTranslateX  = 0;
    this.spinAnimating   = false;
    this.spinPhase       = 'spinning';

    // Give Angular one cycle to render the strip, then trigger the CSS transition
    const t1 = setTimeout(() => {
      const viewportW    = this.spinViewportRef?.nativeElement.offsetWidth ?? 830;
      const winnerCenter = WINNER_IDX * ITEM_SLOT_PX + Math.floor(ITEM_SLOT_PX / 2);
      const jitter       = Math.floor(Math.random() * 40) - 20;
      this.spinTranslateX = -(winnerCenter - Math.floor(viewportW / 2)) + jitter;
      this.spinAnimating  = true;
    }, 80);

    // Switch to done state after the animation finishes
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
          kind:     winner.kind,
          amount:   winner.coins ?? 0,
          label:    winner.kind === 'coins'
                      ? `${(winner.coins ?? 0).toLocaleString('de-DE')} Coins`
                      : (winner.powerup?.title ?? 'Pille'),
          tier,
          isWinner: true,
        };
      }

      if (Math.random() < 0.07) {
        return {
          kind: 'powerup' as const, amount: 0, label: 'Pille',
          tier: Math.max(1, tier - 1), isWinner: false,
        };
      }

      const amt      = Math.floor(Math.random() * (maxC - minC + 1)) + minC;
      const fakeTier = Math.max(1, Math.min(5, tier + Math.floor(Math.random() * 3) - 1));
      return {
        kind: 'coins' as const,
        amount: amt,
        label:  `${amt.toLocaleString('de-DE')} Coins`,
        tier:   fakeTier,
        isWinner: false,
      };
    });
  }

  private clearTimers(): void {
    this.spinTimers.forEach(t => clearTimeout(t));
    this.spinTimers.length = 0;
  }

  private loadCrates(): void {
    this.loading = true;
    this.api
      .listCrates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (res) => { this.crates = res.items; this.loading = false; },
        error: ()    => { this.loading = false; },
      });
  }
}
