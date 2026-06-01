import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { CrateReward, UserCrateItem } from '../../../../../core/api/api.types';
import { I18n } from '../../../../../core/i18n/i18n';
import { CrateNotifications } from '../../../../../core/services/crate-notifications/crate-notifications';

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
  @Input() embedded = false;
  @Input() userId: string | null | undefined = null;

  @Output() closed = new EventEmitter<void>();
  @Output() balanceUpdated = new EventEmitter<number>();
  @Output() unseenCrateCountChange = new EventEmitter<number>();

  @ViewChild('spinViewport') spinViewportRef?: ElementRef<HTMLElement>;

  private readonly api = inject(BetceptionApi);
  private readonly crateNotifications = inject(CrateNotifications);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18n);

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

  tierLabel(tier: number, fallback = ''): string {
    const normalized = Math.max(1, Math.min(3, Math.floor(tier)));
    if (normalized === 1) return this.i18n.t('crate.tier.common');
    if (normalized === 2) return this.i18n.t('crate.tier.rare');
    if (normalized === 3) return this.i18n.t('crate.tier.epic');
    return fallback;
  }

  tierBadgeLabel(tier: number, fallback = ''): string {
    return this.i18n.t('crate.tierBadge', {
      tier: this.tierName(tier),
      label: this.tierLabel(tier, fallback),
    });
  }

  pillLabel(code: string | undefined, fallback = this.i18n.t('crate.pillFallback')): string {
    if (code === 'RED_PILL') return this.i18n.t('powerup.redPill');
    if (code === 'BLUE_PILL') return this.i18n.t('powerup.bluePill');
    if (fallback === 'Red Pill') return this.i18n.t('powerup.redPill');
    if (fallback === 'Blue Pill') return this.i18n.t('powerup.bluePill');
    return fallback;
  }

  rewardLabel(reward: CrateReward | null): string {
    if (!reward) return '';
    if (reward.kind === 'coins') {
      return `${this.formatNumber(reward.coins ?? 0)} ${this.i18n.t('common.coins')}`;
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

  onCrateHover(crate: UserCrateItem): void {
    this.crateNotifications.markCrateAsSeen(this.userId, crate);
    this.emitUnseenCrateCount();
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
          this.emitUnseenCrateCount();
          this.spinReward = res.crate.reward ?? null;
          this.startSpin(res.crate.reward!);
        },
        error: (err) => {
          this.spinPhase = 'idle';
          this.error = this.extractCrateError(err);
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
      const viewport = this.spinViewportRef?.nativeElement;
      const viewportW = viewport?.offsetWidth ?? 830;
      const winnerEl = viewport?.querySelectorAll<HTMLElement>('.spin-item')[WINNER_IDX];
      const winnerCenter = winnerEl
        ? winnerEl.offsetLeft + Math.floor(winnerEl.offsetWidth / 2)
        : Math.floor(viewportW / 2);
      const maxJitter = Math.max(0, Math.min(16, Math.floor((winnerEl?.offsetWidth ?? 0) * 0.14)));
      const jitter = maxJitter > 0 ? Math.floor(Math.random() * (maxJitter * 2 + 1)) - maxJitter : 0;
      this.spinTranslateX = Math.floor(viewportW / 2) - winnerCenter + jitter;
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
            ? `${this.formatNumber(winner.coins ?? 0)} ${this.i18n.t('common.coins')}`
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
        label: `${this.formatNumber(amount)} ${this.i18n.t('common.coins')}`,
        tier: fakeTier,
        isWinner: false,
      };
    });
  }

  private pillRewardLabel(reward: CrateReward): string {
    const label = this.pillLabel(reward.powerup?.code, reward.powerup?.title ?? this.i18n.t('crate.pillFallback'));
    const quantity = Math.max(1, Math.floor(reward.powerup?.quantity ?? 1));
    return quantity > 1 ? `${quantity}x ${label}` : label;
  }

  private formatNumber(value: number): string {
    return value.toLocaleString(this.currentLocale());
  }

  private currentLocale(): string {
    switch (this.i18n.language()) {
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      default: return 'de-DE';
    }
  }

  private extractCrateError(err: unknown): string {
    const code = typeof err === 'object' && err !== null && 'error' in err
      ? (err as { error?: { code?: string } }).error?.code
      : undefined;

    if (code === 'UNAUTHENTICATED') return this.i18n.t('crate.errorUnauthenticated');
    if (code === 'CRATE_NOT_FOUND') return this.i18n.t('crate.errorNotFound');
    if (code === 'ALREADY_OPENED') return this.i18n.t('crate.errorAlreadyOpened');
    return this.i18n.t('crate.openError');
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
          this.crateNotifications.markUnopenedAsSeen(this.userId, this.crates);
          this.emitUnseenCrateCount();
          this.loading = false;
        },
        error: () => {
          this.error = this.i18n.t('crate.loadError');
          this.loading = false;
        },
      });
  }

  private emitUnseenCrateCount(): void {
    this.unseenCrateCountChange.emit(
      this.crateNotifications.unseenUnopenedCount(this.userId, this.crates),
    );
  }
}
