import { Component, Input, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { HandStatus, RoundHand } from '../../../../../core/api/api.types';
import { Hand } from '../hand/hand';
import { I18n } from '../../../../../core/i18n/i18n';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, Hand],
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class Table {
  readonly i18n = inject(I18n);

  @Input() dealerHand: RoundHand | null = null;
  @Input() playerHand: RoundHand | null = null;
  @Input() splitHands: RoundHand[] = [];
  @Input() activeHandId: string | null = null;
  @Input() showBlackjackBanner = false;

  protected readonly HandStatus = HandStatus;

  get playerHandCount() {
    return (this.playerHand ? 1 : 0) + this.splitHands.length;
  }

  trackSplitHand(_index: number, hand: RoundHand) {
    return hand.id;
  }
}
