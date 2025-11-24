import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgFor, NgIf, DecimalPipe, CurrencyPipe } from '@angular/common';
import { HandStatus, RoundStatus } from '../../../../../core/api/api.types';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DecimalPipe, CurrencyPipe],
  templateUrl: './controls.html',
  styleUrl: './controls.css'
})
export class Controls {
  @Input() betAmount = 0;
  @Input() balance: number | null = null;
  @Input() roundStatus: RoundStatus | null = null;
  @Input() playerHandStatus: HandStatus | null = null;
  @Input() busy = false;

  @Output() placeBet = new EventEmitter<number>();
  @Output() resetBet = new EventEmitter<void>();
  @Output() deal = new EventEmitter<void>();
  @Output() hit = new EventEmitter<void>();
  @Output() stand = new EventEmitter<void>();
  @Output() settle = new EventEmitter<void>();

  readonly chips = [1, 5, 25, 100, 500];

  get roundLabel(): string {
    switch (this.roundStatus) {
      case RoundStatus.IN_PROGRESS:
        return 'Läuft';
      case RoundStatus.DEALING:
        return 'Dealing';
      case RoundStatus.CREATED:
        return 'Gestartet';
      case RoundStatus.SETTLED:
        return 'Abgeschlossen';
      case RoundStatus.ABORTED:
        return 'Abgebrochen';
      default:
        return 'Bereit';
    }
  }

  get canDeal() {
    return !this.isRoundActive && this.betAmount > 0 && !this.busy;
  }

  get canHit() {
    return this.roundStatus === RoundStatus.IN_PROGRESS && this.playerHandStatus === HandStatus.ACTIVE && !this.busy;
  }

  get canStand() {
    return this.roundStatus === RoundStatus.IN_PROGRESS && this.playerHandStatus === HandStatus.ACTIVE && !this.busy;
  }

  get canSettle() {
    const roundOpen =
      this.roundStatus &&
      this.roundStatus !== RoundStatus.SETTLED &&
      this.roundStatus !== RoundStatus.ABORTED;
    const playerDone = this.playerHandStatus && this.playerHandStatus !== HandStatus.ACTIVE;
    return !!roundOpen && !!playerDone && !this.busy;
  }

  get isRoundActive() {
    return (
      this.roundStatus === RoundStatus.IN_PROGRESS ||
      this.roundStatus === RoundStatus.DEALING ||
      this.roundStatus === RoundStatus.CREATED
    );
  }

  onChip(amount: number) {
    if (this.isRoundActive || this.busy) return;
    this.placeBet.emit(amount);
  }
}
