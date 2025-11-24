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

  round: RoundState | null = null;
  betAmount = 10;
  balance: number | null = null;
  busyAction: ActionKind | null = null;
  error: string | null = null;
  info: string | null = null;
  showBlackjackBanner = false;
  private bannerTimer: number | null = null;

  ngOnInit() {
    this.loadBalance();
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
      this.error = this.betAmount <= 0 ? 'Setze einen Einsatz, um zu starten.' : this.error;
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

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ round }) => {
          this.round = round;
          this.triggerBanner(round);
          if (kind === 'deal' || kind === 'settle') {
            this.loadBalance();
          }
          if (kind === 'settle') {
            this.info = this.buildOutcomeText(round);
          }
          this.busyAction = null;
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
    if (!status) return 'Runde abgeschlossen.';

    const formattedAmount =
      amount !== null ? Number(amount).toFixed(2) : null;

    if (status === MainBetStatus.WON) {
      return formattedAmount
        ? `Gewonnen! Auszahlung ${formattedAmount}`
        : 'Gewonnen!';
    }
    if (status === MainBetStatus.PUSH) {
      return 'Push – Einsatz zurück.';
    }
    if (status === MainBetStatus.REFUNDED) {
      return 'Einsatz erstattet.';
    }
    if (status === MainBetStatus.LOST) {
      return 'Verloren. Neue Runde?';
    }
    return 'Runde abgeschlossen.';
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
    return 'Aktion fehlgeschlagen. Bitte versuche es erneut.';
  }
}
