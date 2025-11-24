import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { CardSuit, HandStatus, RoundCard, RoundHand } from '../../../../../core/api/api.types';

@Component({
  selector: 'app-hand',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './hand.html',
  styleUrl: './hand.css'
})
export class Hand implements OnChanges {
  @Input() label = '';
  @Input() hand: RoundHand | null = null;
  @Input() isActive = false;

  scoreAnimated = false;
  private lastScore: number | null = null;

  get cards(): RoundCard[] {
    return [...(this.hand?.cards ?? [])].sort((a, b) => a.drawOrder - b.drawOrder);
  }

  get displayScore(): string {
    if (!this.hand || this.hand.handValue === null || this.hand.handValue === undefined) {
      return '--';
    }
    return String(this.hand.handValue);
  }

  get statusLabel(): string | null {
    switch (this.hand?.status) {
      case HandStatus.ACTIVE:
        return 'Aktiv';
      case HandStatus.STOOD:
        return 'Stand';
      case HandStatus.BUSTED:
        return 'Busted';
      case HandStatus.BLACKJACK:
        return 'Blackjack';
      case HandStatus.SURRENDERED:
        return 'Surrender';
      default:
        return null;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hand']) {
      const currentScore = this.hand?.handValue ?? null;
      if (currentScore !== this.lastScore && this.lastScore !== null) {
        this.triggerScorePulse();
      }
      this.lastScore = currentScore;
    }
  }

  trackByCard(_index: number, card: RoundCard) {
    return card.id ?? `${card.rank}-${card.suit}-${card.drawOrder}`;
  }

  cardClasses(card: RoundCard) {
    const isRed = card.suit === CardSuit.HEARTS || card.suit === CardSuit.DIAMONDS;
    return {
      card: true,
      red: isRed,
      black: !isRed,
      visible: true,
      'active-hand-card': this.isActive,
    };
  }

  suitSymbol(suit: CardSuit) {
    switch (suit) {
      case CardSuit.HEARTS:
        return '♥';
      case CardSuit.DIAMONDS:
        return '♦';
      case CardSuit.CLUBS:
        return '♣';
      case CardSuit.SPADES:
      default:
        return '♠';
    }
  }

  private triggerScorePulse() {
    this.scoreAnimated = true;
    window.setTimeout(() => (this.scoreAnimated = false), 500);
  }
}
