import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  HandOwnerType,
  HandStatus,
  MainBetStatus,
  RoundState,
  RoundStatus,
} from '../../../../../core/api/api.types';
import { Rng } from '../../../../../core/services/rng/rng';
import { Wallet } from '../../../../../core/services/wallet/wallet';
import { Table } from '../../components/table/table';
import { Controls } from '../../components/controls/controls';
import { I18n } from '../../../../../core/i18n/i18n';

type ActionKind = 'deal' | 'hit' | 'stand' | 'settle';

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [NgIf, RouterLink, Table, Controls],
  templateUrl: './blackjack.html',
  styleUrl: './blackjack.css'
})
export class Blackjack implements OnInit {
  private readonly rng = inject(Rng);
  private readonly wallet = inject(Wallet);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18n);
  private readonly dealerRevealMs = 620;
  private readonly dealerFollowUpCardStepMs = 360;
  private readonly cardAnimationMs = 650;
  private readonly resultPauseMs = 250;

  round: RoundState | null = null;
  betAmount = 10;
  balance: number | null = null;
  busyAction: ActionKind | null = null;
  error: string | null = null;
  info: string | null = null;
  showBlackjackBanner = false;
  showRoundOverlay = false;
  roundOutcome: { headline: string; detail: string | null; won: boolean; lost: boolean; push: boolean; dealerInfo: string | null } | null = null;
  private bannerTimer: number | null = null;
  private resultOverlayTimer: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.bannerTimer) {
        window.clearTimeout(this.bannerTimer);
      }
      this.clearResultOverlayTimer();
    });
  }

  ngOnInit() {
    this.loadBalance();
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
        next: ({ round }) => {
          const previousRound = this.round;
          this.round = round;
          this.triggerBanner(round);
          if (kind === 'deal' || kind === 'settle') {
            this.loadBalance();
          }
          if (kind === 'settle') {
            this.scheduleRoundOverlay(previousRound, round);
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

  private loadBalance() {
    this.wallet
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ balance }) => (this.balance = balance),
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
    if (this.balance !== null && this.betAmount > this.balance) {
      this.betAmount = this.balance;
    }
  }

  private buildRoundOutcome(round: RoundState): typeof this.roundOutcome {
    const status = round.mainBet?.status;
    const amount = round.mainBet?.settledAmount ?? null;
    const formatted = amount !== null ? `${Number(amount).toFixed(0)} Coins` : null;

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

    const revealDuration = hadHiddenDealerCard ? this.dealerRevealMs : 0;
    const drawDuration =
      newDealerCardCount > 0
        ? revealDuration + (newDealerCardCount - 1) * this.dealerFollowUpCardStepMs + this.cardAnimationMs
        : revealDuration;

    return Math.max(this.cardAnimationMs, drawDuration + this.resultPauseMs);
  }

  private clearResultOverlayTimer() {
    if (!this.resultOverlayTimer) {
      return;
    }
    window.clearTimeout(this.resultOverlayTimer);
    this.resultOverlayTimer = null;
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
