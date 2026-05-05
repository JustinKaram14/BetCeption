import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgClass, NgFor, NgIf, DecimalPipe } from '@angular/common';
import {
  ActivePowerup,
  HandStatus,
  PowerPillCode,
  PowerPillColor,
  RoundStatus,
} from '../../../../../core/api/api.types';
import { I18n } from '../../../../../core/i18n/i18n';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DecimalPipe],
  templateUrl: './controls.html',
  styleUrl: './controls.css'
})
export class Controls {
  readonly i18n = inject(I18n);

  @Input() betAmount = 0;
  @Input() balance: number | null = null;
  @Input() roundStatus: RoundStatus | null = null;
  @Input() playerHandStatus: HandStatus | null = null;
  @Input() busy = false;
  @Input() activePowerup: ActivePowerup | null = null;
  @Input() pillPulse: PowerPillColor | null = null;
  @Input() pillExpiredCode: PowerPillCode | null = null;

  @Output() placeBet = new EventEmitter<number>();
  @Output() resetBet = new EventEmitter<void>();
  @Output() deal = new EventEmitter<void>();
  @Output() hit = new EventEmitter<void>();
  @Output() stand = new EventEmitter<void>();
  @Output() openPowerupMenu = new EventEmitter<void>();

  readonly chips = [1, 5, 25, 100, 500];

  get roundLabel(): string {
    switch (this.roundStatus) {
      case RoundStatus.IN_PROGRESS:
        return this.i18n.t('round.inProgress');
      case RoundStatus.DEALING:
        return this.i18n.t('round.dealing');
      case RoundStatus.CREATED:
        return this.i18n.t('round.created');
      case RoundStatus.SETTLED:
        return this.i18n.t('round.settled');
      case RoundStatus.ABORTED:
        return this.i18n.t('round.aborted');
      default:
        return this.i18n.t('round.ready');
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
    return this.roundStatus === RoundStatus.IN_PROGRESS && this.playerHandStatus !== HandStatus.ACTIVE && !this.busy;
  }

  get isRoundActive() {
    return (
      this.roundStatus === RoundStatus.IN_PROGRESS ||
      this.roundStatus === RoundStatus.DEALING ||
      this.roundStatus === RoundStatus.CREATED
    );
  }

  get pillCode(): PowerPillCode | null {
    return this.activePowerup?.type.code ?? this.pillExpiredCode ?? null;
  }

  get pillSlotClasses(): Record<string, boolean> {
    const code = this.pillCode;
    return {
      'pill-slot--empty': !this.activePowerup && !this.pillExpiredCode,
      'pill-slot--active': !!this.activePowerup,
      'pill-slot--red': code === 'RED_PILL',
      'pill-slot--blue': code === 'BLUE_PILL',
      'pill-slot--pulse-red': this.pillPulse === 'red',
      'pill-slot--pulse-blue': this.pillPulse === 'blue',
      'pill-slot--pop': !!this.pillExpiredCode,
    };
  }

  get pillUses(): number | null {
    return this.activePowerup?.usesRemaining ?? null;
  }

  get pillAriaLabel(): string {
    if (!this.activePowerup) return 'Open power pill shop';
    return `${this.activePillTitle}: ${this.activePillDescription}`;
  }

  get activePillTitle(): string {
    return this.activePowerup?.type.code === 'BLUE_PILL'
      ? this.i18n.t('powerup.bluePill')
      : this.i18n.t('powerup.redPill');
  }

  get activePillDescription(): string {
    return this.activePowerup?.type.code === 'BLUE_PILL'
      ? this.i18n.t('powerup.bluePillDescription')
      : this.i18n.t('powerup.redPillDescription');
  }

  onChip(amount: number) {
    if (this.isRoundActive || this.busy) return;
    this.placeBet.emit(amount);
  }

  onPillSlot() {
    if (this.activePowerup || this.busy) return;
    this.openPowerupMenu.emit();
  }
}
