import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { HandOwnerType, RoundHand } from '../../../../../core/api/api.types';
import { Hand } from '../hand/hand';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgIf, Hand],
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class Table {
  @Input() dealerHand: RoundHand | null = null;
  @Input() playerHand: RoundHand | null = null;
  @Input() activeHand: HandOwnerType | null = null;
  @Input() showBlackjackBanner = false;

  protected readonly HandOwnerType = HandOwnerType;
}
