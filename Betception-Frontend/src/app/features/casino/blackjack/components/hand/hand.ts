import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { CardSuit, HandStatus, RoundCard, RoundHand } from '../../../../../core/api/api.types';
import { I18n } from '../../../../../core/i18n/i18n';

@Component({
  selector: 'app-hand',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './hand.html',
  styleUrl: './hand.css'
})
export class Hand implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly i18n = inject(I18n);
  private readonly initialCardStepMs = 360;
  private readonly dealerRevealMs = 560;
  private readonly followUpCardStepMs = 360;

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
  private hiddenCardIds = new Set<string>();
  private cardDelays = new Map<string, number>();

  get cards(): RoundCard[] {
    return [...(this.hand?.cards ?? [])].sort((a, b) => a.drawOrder - b.drawOrder);
  }

  get displayScore(): string {
    // Hide dealer's score until cards are revealed
    if (this.isDealer && this.cards.some((card, index) => this.isDealerCardHidden(card, index, this.cards))) {
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
        return this.i18n.t('hand.status.active');
      case HandStatus.STOOD:
        return this.i18n.t('hand.status.stood');
      case HandStatus.BUSTED:
        return this.i18n.t('hand.status.busted');
      case HandStatus.BLACKJACK:
        return this.i18n.t('hand.status.blackjack');
      case HandStatus.SURRENDERED:
        return this.i18n.t('hand.status.surrendered');
      default:
        return null;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hand'] || changes['revealDealerCards']) {
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
      const currentHiddenCardIds = this.getHiddenCardIds(currentCards);
      const isDealerRevealPhase =
        this.isDealer &&
        currentCards.some((card) => this.hiddenCardIds.has(this.cardId(card)) && !currentHiddenCardIds.has(this.cardId(card)));
      const isInitialDeal = currentCards.length === 2 && this.seenCardIds.size === 0 && newCards.length === 2;

      newCards.forEach((card, newIdx) => {
        const id = this.cardId(card);
        const index = currentCards.findIndex((currentCard) => this.cardId(currentCard) === id);
        const delay = this.cardDealDelay(index, newIdx, isInitialDeal, isDealerRevealPhase);
        this.seenCardIds.add(id);
        this.cardDelays.set(id, delay);
        this.dealingCardIds.add(id);

        // Remove the deal animation class once the animation has finished
        window.setTimeout(() => {
          this.dealingCardIds.delete(id);
          this.cdr.markForCheck();
        }, delay + 700);
      });

      this.hiddenCardIds = currentHiddenCardIds;
    }
  }

  trackByCard(_index: number, card: RoundCard) {
    return card.id ?? `${card.rank}-${card.suit}-${card.drawOrder}`;
  }

  cardClasses(card: RoundCard, index: number) {
    const isRed = card.suit !== null && (card.suit === CardSuit.HEARTS || card.suit === CardSuit.DIAMONDS);
    const isHiddenDealerCard = this.isDealerCardHidden(card, index, this.cards);

    return {
      card: true,
      red: isRed,
      black: !isRed,
      visible: !isHiddenDealerCard,
      back: isHiddenDealerCard,
      'active-hand-card': this.isActive,
    };
  }

  suitSymbol(suit: CardSuit | null) {
    switch (suit) {
      case CardSuit.HEARTS:
        return '♥';
      case CardSuit.DIAMONDS:
        return '♦';
      case CardSuit.CLUBS:
        return '♣';
      case CardSuit.SPADES:
        return '♠';
      default:
        return '';
    }
  }

  cardDelay(card: RoundCard): string {
    return `${this.cardDelays.get(this.cardId(card)) ?? 0}ms`;
  }

  private cardId(card: RoundCard): string {
    return card.id ?? `${card.rank}-${card.suit}-${card.drawOrder}`;
  }

  private isDealerCardHidden(card: RoundCard, index: number, cards: RoundCard[]) {
    if (!this.isDealer || this.revealDealerCards) {
      return false;
    }

    const isMaskedCard = card.rank === null || card.suit === null;
    const isInitialHoleCard = index === 1 && cards.length === 2;
    return isMaskedCard || isInitialHoleCard;
  }

  private getHiddenCardIds(cards: RoundCard[]) {
    return new Set(
      cards
        .filter((card, index) => this.isDealerCardHidden(card, index, cards))
        .map((card) => this.cardId(card)),
    );
  }

  private cardDealDelay(
    index: number,
    newCardIndex: number,
    isInitialDeal: boolean,
    isDealerRevealPhase: boolean,
  ) {
    if (isInitialDeal) {
      return this.dealOffset + index * this.initialCardStepMs;
    }
    if (isDealerRevealPhase) {
      return this.dealerRevealMs + newCardIndex * this.followUpCardStepMs;
    }
    return newCardIndex * this.followUpCardStepMs;
  }

  private triggerScorePulse() {
    this.scoreAnimated = true;
    window.setTimeout(() => (this.scoreAnimated = false), 500);
  }
}
