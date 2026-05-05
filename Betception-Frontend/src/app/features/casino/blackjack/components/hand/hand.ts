import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
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
export class Hand implements OnChanges, OnDestroy {
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
  visibleDealerCardIndexes = new Set<number>([0]);

  private lastScore: number | null = null;
  private seenCardIds = new Set<string>();
  private hiddenCardIds = new Set<string>();
  private cardDelays = new Map<string, number>();
  private dealerRevealTimers: number[] = [];

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
      const isDealerRevealPhase = this.isDealer && this.revealDealerCards;
      const isInitialDeal = currentCards.length === 2 && this.seenCardIds.size === 0 && newCards.length === 2;

      this.syncDealerRevealQueue(currentCards);

      newCards.forEach((card, newIdx) => {
        const id = this.cardId(card);
        const index = currentCards.findIndex((currentCard) => this.cardId(currentCard) === id);
        const delay = this.cardDealDelay(index, newIdx, isInitialDeal, isDealerRevealPhase);
        this.seenCardIds.add(id);
        this.cardDelays.set(id, delay);

        if (isDealerRevealPhase) {
          return;
        }

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

  ngOnDestroy() {
    this.clearDealerRevealTimers();
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
    if (!this.isDealer) {
      return false;
    }

    if (this.revealDealerCards) {
      return !this.visibleDealerCardIndexes.has(index);
    }

    const isMaskedCard = card.rank === null || card.suit === null;
    const isHoleOrLaterCard = index > 0;
    return isMaskedCard || isHoleOrLaterCard;
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

  private syncDealerRevealQueue(cards: RoundCard[]) {
    if (!this.isDealer) {
      this.clearDealerRevealTimers();
      this.visibleDealerCardIndexes.clear();
      return;
    }

    if (cards.length === 0 || !this.revealDealerCards) {
      this.clearDealerRevealTimers();
      this.visibleDealerCardIndexes = cards.length > 0 ? new Set([0]) : new Set();
      return;
    }

    const allIndexes = cards.map((_card, index) => index);
    const missingIndexes = allIndexes.filter((index) => !this.visibleDealerCardIndexes.has(index));
    if (missingIndexes.length === 0 || this.dealerRevealTimers.length > 0) {
      return;
    }

    missingIndexes
      .sort((a, b) => a - b)
      .forEach((index, revealOrder) => {
        const delay = this.dealerRevealMs + revealOrder * this.followUpCardStepMs;
        const timer = window.setTimeout(() => {
          this.visibleDealerCardIndexes = new Set([...this.visibleDealerCardIndexes, index]);
          this.dealerRevealTimers = this.dealerRevealTimers.filter((activeTimer) => activeTimer !== timer);
          this.cdr.markForCheck();
        }, delay);
        this.dealerRevealTimers.push(timer);
      });
  }

  private clearDealerRevealTimers() {
    this.dealerRevealTimers.forEach((timer) => window.clearTimeout(timer));
    this.dealerRevealTimers = [];
  }

  private triggerScorePulse() {
    this.scoreAnimated = true;
    window.setTimeout(() => (this.scoreAnimated = false), 500);
  }
}
