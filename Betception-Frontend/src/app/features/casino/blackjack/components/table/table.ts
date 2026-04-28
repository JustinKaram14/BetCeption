import { Component, Input, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { HandOwnerType, RoundHand, HandStatus } from '../../../../../core/api/api.types';
import { Hand } from '../hand/hand';
import { I18n } from '../../../../../core/i18n/i18n';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgIf, Hand],
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class Table {
  readonly i18n = inject(I18n);

  @Input() dealerHand: RoundHand | null = null;
  @Input() playerHand: RoundHand | null = null;
  @Input() activeHand: HandOwnerType | null = null;
  @Input() showBlackjackBanner = false;

  protected readonly HandOwnerType = HandOwnerType;
  protected readonly HandStatus = HandStatus;
}
