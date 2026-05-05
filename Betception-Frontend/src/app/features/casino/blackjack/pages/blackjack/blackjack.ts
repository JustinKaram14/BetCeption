import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivePowerup,
  HandOwnerType,
  HandStatus,
  InventoryPowerup,
  LevelProgress,
  LevelUpCrate,
  MainBetStatus,
  PowerPillCode,
  PowerPillColor,
  PowerupType,
  RoundState,
  RoundStatus,
} from '../../../../../core/api/api.types';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { Rng } from '../../../../../core/services/rng/rng';
import { Wallet } from '../../../../../core/services/wallet/wallet';
import { Table } from '../../components/table/table';
import { Controls } from '../../components/controls/controls';
import { PowerupMenu } from '../../components/powerup-menu/powerup-menu';
import { I18n } from '../../../../../core/i18n/i18n';
import { LevelProgressComponent } from '../../../../../shared/ui/level-progress/level-progress';

type ActionKind = 'deal' | 'hit' | 'stand' | 'settle';

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [NgIf, RouterLink, Table, Controls, PowerupMenu, LevelProgressComponent],
  templateUrl: './blackjack.html',
  styleUrl: './blackjack.css'
})
export class Blackjack implements OnInit {
  private readonly rng = inject(Rng);
  private readonly wallet = inject(Wallet);
  private readonly api = inject(BetceptionApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18n);
  private readonly dealerRevealMs = 620;
  private readonly dealerFollowUpCardStepMs = 360;
  private readonly cardAnimationMs = 650;
  private readonly resultPauseMs = 250;

  round: RoundState | null = null;
  betAmount = 0;
  balance: number | null = null;
  levelProgress: LevelProgress | null = null;
  busyAction: ActionKind | null = null;
  error: string | null = null;
  info: string | null = null;
  showBlackjackBanner = false;
  showRoundOverlay = false;
  roundOutcome: { headline: string; detail: string | null; won: boolean; lost: boolean; push: boolean; dealerInfo: string | null } | null = null;
  showPowerupMenu = false;
  inventory: InventoryPowerup[] = [];
  availablePowerups: PowerupType[] = [];
  activePowerup: ActivePowerup | null = null;
  pillPulse: PowerPillColor | null = null;
  pillExpiredCode: PowerPillCode | null = null;
  userLevel = 1;
  levelUpCrate: LevelUpCrate | null = null;
  private inventoryLoaded = false;
  private bannerTimer: number | null = null;
  private resultOverlayTimer: number | null = null;
  private walletRefreshTimer: number | null = null;
  private pillPulseTimer: number | null = null;
  private pillPopTimer: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.bannerTimer) {
        window.clearTimeout(this.bannerTimer);
      }
      this.clearResultOverlayTimer();
      this.clearWalletRefreshTimer();
      this.clearPillTimers();
    });
  }

  ngOnInit() {
    this.loadBalance();
    this.loadInventory();
    this.resumeActiveRoundIfAny();
  }

  get playerHandStatus(): HandStatus | null {
    return this.round?.playerHand?.status ?? null;
  }

  get activeHand(): HandOwnerType | null {
    if (this.round?.status === RoundStatus.IN_PROGRESS) {
      return HandOwnerType.PLAYER;
    }
    return null;
  }

  onPlaceBet(amount: number) {
    if (this.isRoundActive) return;
    const updated = Math.max(0, Math.round((this.betAmount + amount) * 100) / 100);
    this.betAmount = this.balance !== null ? Math.min(updated, this.balance) : updated;
  }

  onResetBet() {
    if (this.isRoundActive) return;
    this.betAmount = 0;
  }

  onDeal() {
    if (this.busyAction || this.betAmount <= 0) {
      this.error = this.betAmount <= 0 ? this.i18n.t('blackjack.setBetError') : this.error;
      return;
    }
    this.runAction('deal', this.rng.startRound({ betAmount: this.betAmount }));
  }

  onHit() {
    if (!this.round || this.busyAction) return;
    this.runAction('hit', this.rng.hit(this.round.id));
  }

  onStand() {
    if (!this.round || this.busyAction) return;
    this.runAction('stand', this.rng.stand(this.round.id));
  }

  onSettle() {
    if (!this.round || this.busyAction) return;
    this.runAction('settle', this.rng.settle(this.round.id));
  }

  get isRoundActive() {
    const status = this.round?.status;
    return (
      status === RoundStatus.CREATED ||
      status === RoundStatus.DEALING ||
      status === RoundStatus.IN_PROGRESS
    );
  }

  private runAction(kind: ActionKind, request$: ReturnType<Rng['startRound']>) {
    this.busyAction = kind;
    this.error = null;
    this.info = null;
    this.clearResultOverlayTimer();

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const { round } = response;
          const previousRound = this.round;
          this.round = round;
          this.applyPowerupResponse(response);
          if (round.playerProgress) {
            this.levelProgress = round.playerProgress;
          }
          this.triggerBanner(round);
          if (kind === 'deal') {
            this.loadBalance();
          }
          if (kind === 'settle') {
            if (response.levelUpCrate) {
              this.levelUpCrate = response.levelUpCrate;
            }
            this.scheduleRoundOverlay(previousRound, round);
            this.walletRefreshTimer = window.setTimeout(() => {
              this.loadBalance(true);
              this.walletRefreshTimer = null;
            }, 1500);
          }
          this.busyAction = null;

          // Auto-settle when the player's turn is over (bust, stand, blackjack)
          if (
            kind !== 'settle' &&
            round.status !== RoundStatus.SETTLED &&
            round.status !== RoundStatus.ABORTED &&
            round.playerHand?.status !== HandStatus.ACTIVE
          ) {
            window.setTimeout(() => {
              if (this.round?.id === round.id && !this.busyAction) {
                this.runAction('settle', this.rng.settle(round.id));
              }
            }, 850);
          }
        },
        error: (err) => {
          this.error = this.extractError(err);
          this.busyAction = null;
        },
      });
  }

  private loadBalance(preserveXpGain = false) {
    this.wallet
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ balance, level, levelProgress }) => {
          this.balance = balance;
          this.userLevel = level;
          const xpGained =
            preserveXpGain && this.levelProgress?.xp === levelProgress.xp
              ? this.levelProgress.xpGained
              : 0;
          this.levelProgress = { ...levelProgress, xpGained };
        },
        error: () => null,
      });
  }

  private resumeActiveRoundIfAny() {
    this.rng
      .getActiveRound()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ round }) => {
          this.round = round;
        },
        error: () => null, // 404 = no active round, nothing to resume
      });
  }

  private triggerBanner(round: RoundState) {
    const isBlackjack =
      round.playerHand?.status === HandStatus.BLACKJACK &&
      round.status !== RoundStatus.SETTLED;
    if (!isBlackjack) {
      this.showBlackjackBanner = false;
      return;
    }
    this.showBlackjackBanner = true;
    if (this.bannerTimer) {
      window.clearTimeout(this.bannerTimer);
    }
    this.bannerTimer = window.setTimeout(() => {
      this.showBlackjackBanner = false;
    }, 1500);
  }

  private buildOutcomeText(round: RoundState) {
    const status = round.mainBet?.status;
    const amount = round.mainBet?.settledAmount ?? null;
    if (!status) return this.i18n.t('blackjack.completed');

    const formattedAmount =
      amount !== null ? Number(amount).toFixed(2) : null;

    if (status === MainBetStatus.WON) {
      return formattedAmount
        ? this.i18n.t('blackjack.wonPayout', { amount: formattedAmount })
        : this.i18n.t('blackjack.won');
    }
    if (status === MainBetStatus.PUSH) {
      return this.i18n.t('blackjack.pushBetBack');
    }
    if (status === MainBetStatus.REFUNDED) {
      return this.i18n.t('blackjack.refunded');
    }
    if (status === MainBetStatus.LOST) {
      return this.i18n.t('blackjack.lostNewRound');
    }
    return this.i18n.t('blackjack.completed');
  }

  onNextRound() {
    this.clearResultOverlayTimer();
    this.showRoundOverlay = false;
    this.roundOutcome = null;
    this.round = null;
    this.info = null;
    this.levelUpCrate = null;
    if (this.balance !== null && this.betAmount > this.balance) {
      this.betAmount = this.balance;
    }
  }

  onDismissLevelUpCrate() {
    this.levelUpCrate = null;
  }

  onOpenPowerupMenu() {
    if (this.activePowerup) return;
    this.showPowerupMenu = true;
    if (!this.inventoryLoaded) {
      this.loadInventory();
    }
  }

  onClosePowerupMenu() {
    this.showPowerupMenu = false;
  }

  onPurchasePowerup(payload: { typeId: number; quantity: number }) {
    this.api
      .purchasePowerup(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.balance = res.balance;
          this.activePowerup = res.activePowerup;
          this.loadInventory();
          this.showPowerupMenu = false;
        },
        error: (err) => {
          this.error = this.extractError(err);
        },
      });
  }

  onEquipPowerup(payload: { typeId: number }) {
    this.api
      .equipPowerup(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.activePowerup = res.activePowerup;
          this.loadInventory();
          this.showPowerupMenu = false;
        },
        error: (err) => {
          this.error = this.extractError(err);
        },
      });
  }

  private loadInventory() {
    this.api
      .listInventory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.inventory = res.items;
          this.activePowerup = res.activePowerup;
          this.inventoryLoaded = true;
        },
        error: () => null,
      });
    this.api
      .listPowerups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.availablePowerups = res.items;
        },
        error: () => null,
      });
  }

  private buildRoundOutcome(round: RoundState): typeof this.roundOutcome {
    const status = round.mainBet?.status;
    const displayAmount =
      status === MainBetStatus.LOST
        ? round.mainBet?.amount
        : round.mainBet?.settledAmount;
    const formatted =
      displayAmount !== null && typeof displayAmount !== 'undefined'
        ? `${Number(displayAmount).toFixed(0)} Coins`
        : null;

    const dealer = round.dealerHand;
    let dealerInfo: string | null = null;
    if (dealer) {
      const val = dealer.handValue;
      if (dealer.status === HandStatus.STOOD) {
        dealerInfo = this.i18n.t('blackjack.dealerStands', { value: val ?? '--' });
      } else if (dealer.status === HandStatus.BUSTED) {
        dealerInfo = this.i18n.t('blackjack.dealerBust', { value: val ?? '--' });
      } else if (dealer.status === HandStatus.BLACKJACK) {
        dealerInfo = this.i18n.t('blackjack.dealerBlackjack');
      }
    }

    if (status === MainBetStatus.WON) {
      return { headline: this.i18n.t('blackjack.wonHeadline'), detail: formatted ? `+${formatted}` : null, won: true, lost: false, push: false, dealerInfo };
    }
    if (status === MainBetStatus.PUSH || status === MainBetStatus.REFUNDED) {
      return { headline: this.i18n.t('blackjack.pushHeadline'), detail: this.i18n.t('blackjack.pushBetBack'), won: false, lost: false, push: true, dealerInfo };
    }
    if (status === MainBetStatus.LOST) {
      return { headline: this.i18n.t('blackjack.lostHeadline'), detail: formatted ? `-${formatted}` : null, won: false, lost: true, push: false, dealerInfo };
    }
    return { headline: this.i18n.t('blackjack.finishedHeadline'), detail: null, won: false, lost: false, push: false, dealerInfo };
  }

  private scheduleRoundOverlay(previousRound: RoundState | null, settledRound: RoundState) {
    const info = this.buildOutcomeText(settledRound);
    const outcome = this.buildRoundOutcome(settledRound);
    const delay = this.settlementAnimationDelay(previousRound, settledRound);

    this.resultOverlayTimer = window.setTimeout(() => {
      if (this.round?.id !== settledRound.id) {
        return;
      }
      this.info = info;
      this.roundOutcome = outcome;
      this.showRoundOverlay = true;
      this.resultOverlayTimer = null;
    }, delay);
  }

  private settlementAnimationDelay(previousRound: RoundState | null, settledRound: RoundState) {
    const previousDealerCards = previousRound?.dealerHand?.cards ?? [];
    const settledDealerCards = settledRound.dealerHand?.cards ?? [];
    const previousDealerCardIds = new Set(previousDealerCards.map((card) => card.id));
    const newDealerCardCount = settledDealerCards.filter((card) => !previousDealerCardIds.has(card.id)).length;
    const hadHiddenDealerCard = previousDealerCards.some(
      (card, index) =>
        card.rank === null ||
        card.suit === null ||
        (index === 1 && previousDealerCards.length === 2),
    );

    const sequentialRevealCount = hadHiddenDealerCard ? Math.max(0, settledDealerCards.length - 1) : 0;
    const revealDuration =
      sequentialRevealCount > 0
        ? this.dealerRevealMs + (sequentialRevealCount - 1) * this.dealerFollowUpCardStepMs
        : 0;
    const drawDuration =
      newDealerCardCount > 0
        ? revealDuration + this.cardAnimationMs
        : revealDuration;

    return Math.max(this.cardAnimationMs, drawDuration + this.resultPauseMs);
  }

  private applyPowerupResponse(response: {
    activePowerup?: ActivePowerup | null;
    triggeredPowerupEffect?: { color: PowerPillColor } | null;
    expiredPowerup?: { code: PowerPillCode } | null;
  }) {
    if ('activePowerup' in response) {
      this.activePowerup = response.activePowerup ?? null;
    }
    if (response.triggeredPowerupEffect) {
      this.triggerPillPulse(response.triggeredPowerupEffect.color);
    }
    if (response.expiredPowerup) {
      this.triggerPillPop(response.expiredPowerup.code);
    }
  }

  private triggerPillPulse(color: PowerPillColor) {
    if (this.pillPulseTimer) {
      window.clearTimeout(this.pillPulseTimer);
    }
    this.pillPulse = color;
    this.pillPulseTimer = window.setTimeout(() => {
      this.pillPulse = null;
      this.pillPulseTimer = null;
    }, 760);
  }

  private triggerPillPop(code: PowerPillCode) {
    if (this.pillPopTimer) {
      window.clearTimeout(this.pillPopTimer);
    }
    this.pillExpiredCode = code;
    this.pillPopTimer = window.setTimeout(() => {
      this.pillExpiredCode = null;
      this.pillPopTimer = null;
    }, 560);
  }

  private clearResultOverlayTimer() {
    if (!this.resultOverlayTimer) {
      return;
    }
    window.clearTimeout(this.resultOverlayTimer);
    this.resultOverlayTimer = null;
  }

  private clearWalletRefreshTimer() {
    if (!this.walletRefreshTimer) {
      return;
    }
    window.clearTimeout(this.walletRefreshTimer);
    this.walletRefreshTimer = null;
  }

  private clearPillTimers() {
    if (this.pillPulseTimer) {
      window.clearTimeout(this.pillPulseTimer);
      this.pillPulseTimer = null;
    }
    if (this.pillPopTimer) {
      window.clearTimeout(this.pillPopTimer);
      this.pillPopTimer = null;
    }
  }

  private extractError(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const payload = (error as any).error;
      if (payload && typeof payload === 'object' && 'message' in payload) {
        return String(payload.message);
      }
      if (typeof payload === 'string') return payload;
      if ('message' in (error as any)) {
        return String((error as any).message);
      }
    }
    return this.i18n.t('blackjack.actionFailed');
  }
}
