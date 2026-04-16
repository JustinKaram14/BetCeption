import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
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
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() label = '';
  @Input() hand: RoundHand | null = null;
  @Input() isActive = false;
  @Input() isDealer = false;
  @Input() revealDealerCards = false;
  /** Offset in ms before the first card of this hand animates in (for cross-hand stagger). */
  @Input() dealOffset = 0;

  scoreAnimated = false;
  dealingCardIds = new Set<string>();

  private lastScore: number | null = null;
  private seenCardIds = new Set<string>();
  private cardDelays = new Map<string, number>();

  get cards(): RoundCard[] {
    return [...(this.hand?.cards ?? [])].sort((a, b) => a.drawOrder - b.drawOrder);
  }

  get displayScore(): string {
    // Hide dealer's score until cards are revealed
    if (this.isDealer && !this.revealDealerCards && this.hand?.cards.length === 2) {
      return '--';
    }
    if (!this.hand || this.hand.handValue === null) {
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

      // Staggered deal animation
      const currentCards = [...(this.hand?.cards ?? [])].sort((a, b) => a.drawOrder - b.drawOrder);
      const hasOverlap = currentCards.some(c => this.seenCardIds.has(this.cardId(c)));
      if (!hasOverlap && this.seenCardIds.size > 0) {
        // New round: clear stale state
        this.seenCardIds.clear();
        this.cardDelays.clear();
        this.dealingCardIds.clear();
      }

      const newCards = currentCards.filter(c => !this.seenCardIds.has(this.cardId(c)));
      newCards.forEach((card, newIdx) => {
        const id = this.cardId(card);
        const delay = this.dealOffset + newIdx * 350;
        this.seenCardIds.add(id);
        this.cardDelays.set(id, delay);
        this.dealingCardIds.add(id);

        // Remove the deal animation class once the animation has finished
        window.setTimeout(() => {
          this.dealingCardIds.delete(id);
          this.cdr.markForCheck();
        }, delay + 700);
      });
    }
  }

  trackByCard(_index: number, card: RoundCard) {
    return card.id ?? `${card.rank}-${card.suit}-${card.drawOrder}`;
  }

  cardClasses(card: RoundCard, index: number) {
    const isRed = card.suit === CardSuit.HEARTS || card.suit === CardSuit.DIAMONDS;

    // The second card of the dealer is hidden if it's the initial deal (2 cards)
    // and the reveal flag is not set.
    const isDealerHoleCard = this.isDealer && index === 1 && this.hand?.cards.length === 2;
    const isDealerSecondCardHidden = isDealerHoleCard && !this.revealDealerCards;

    return {
      card: true,
      red: isRed,
      black: !isRed,
      visible: !isDealerSecondCardHidden,
      back: isDealerSecondCardHidden,
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

  cardDelay(card: RoundCard): string {
    return `${this.cardDelays.get(this.cardId(card)) ?? 0}ms`;
  }

  private cardId(card: RoundCard): string {
    return card.id ?? `${card.rank}-${card.suit}-${card.drawOrder}`;
  }

  private triggerScorePulse() {
    this.scoreAnimated = true;
    window.setTimeout(() => (this.scoreAnimated = false), 500);
  }
}
