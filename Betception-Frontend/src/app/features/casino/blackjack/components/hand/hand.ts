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
  private readonly initialCardStepMs = 550;
  private readonly dealerRevealMs = 850;
  private readonly dealerActionPauseMs = 900;
  private readonly dealerDrawAnimationMs = 700;
  private readonly settlementFlipPauseMs = 250;
  private readonly followUpCardStepMs = 600;

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
  renderedDealerCardIndexes = new Set<number>([0]);

  private lastScore: number | null = null;
  private seenCardIds = new Set<string>();
  private cardDelays = new Map<string, number>();
  private dealerSequenceTimers: number[] = [];

  get cards(): RoundCard[] {
    return [...(this.hand?.cards ?? [])].sort((a, b) => a.drawOrder - b.drawOrder);
  }

  get displayCards() {
    const currentCards = this.cards;
    if (!this.isDealer || !this.revealDealerCards) {
      return currentCards.map((card, index) => ({ card, index }));
    }

    return currentCards
      .map((card, index) => ({ card, index }))
      .filter(({ index }) => this.renderedDealerCardIndexes.has(index));
  }

  get displayScore(): string {
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

      const currentCards = [...(this.hand?.cards ?? [])].sort((a, b) => a.drawOrder - b.drawOrder);
      const hasOverlap = currentCards.some(c => this.seenCardIds.has(this.cardId(c)));
      if (!hasOverlap && this.seenCardIds.size > 0) {
        this.seenCardIds.clear();
        this.cardDelays.clear();
        this.dealingCardIds.clear();
        this.clearDealerSequenceTimers();
        this.visibleDealerCardIndexes = new Set();
        this.renderedDealerCardIndexes = new Set();
      }

      const newCards = currentCards.filter(c => !this.seenCardIds.has(this.cardId(c)));
      const isDealerRevealPhase = this.isDealer && this.revealDealerCards;
      const isInitialDeal = currentCards.length === 2 && this.seenCardIds.size === 0 && newCards.length === 2;
      // True only for cards drawn during the settlement phase (not the initial 2-card deal).
      const isSettlementPhase = isDealerRevealPhase && !isInitialDeal;

      this.syncDealerRenderWindow(currentCards);

      newCards.forEach((card, newIdx) => {
        const id = this.cardId(card);
        this.seenCardIds.add(id);

        if (isSettlementPhase) {
          return;
        }

        const index = currentCards.findIndex((currentCard) => this.cardId(currentCard) === id);
        const delay = this.cardDealDelay(index, newIdx, isInitialDeal, false);
        this.cardDelays.set(id, delay);

        this.dealingCardIds.add(id);
        window.setTimeout(() => {
          this.dealingCardIds.delete(id);
          this.cdr.markForCheck();
        }, delay + 700);
      });

      this.syncDealerSequence(currentCards);
    }
  }

  ngOnDestroy() {
    this.clearDealerSequenceTimers();
  }

  trackByCard = (_index: number, item: { card: RoundCard; index: number }) => this.cardId(item.card);

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

  isCardDealing(card: RoundCard) {
    return this.dealingCardIds.has(this.cardId(card));
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

  private cardDealDelay(
    index: number,
    newCardIndex: number,
    isInitialDeal: boolean,
    isSettlementCard: boolean,
  ) {
    if (isInitialDeal) {
      return this.dealOffset + index * this.initialCardStepMs;
    }
    if (isSettlementCard) {
      return 0;
    }
    return newCardIndex * this.followUpCardStepMs;
  }

  private syncDealerRenderWindow(cards: RoundCard[]) {
    if (!this.isDealer) {
      this.renderedDealerCardIndexes = new Set(cards.map((_card, index) => index));
      return;
    }

    if (cards.length === 0) {
      this.renderedDealerCardIndexes = new Set();
      return;
    }

    if (!this.revealDealerCards) {
      this.renderedDealerCardIndexes = new Set(cards.map((_card, index) => index));
      return;
    }

    const nextRenderedIndexes = new Set<number>([0]);
    if (cards.length > 1) {
      nextRenderedIndexes.add(1);
    }
    [...this.renderedDealerCardIndexes]
      .filter((index) => index >= 0 && index < cards.length)
      .forEach((index) => nextRenderedIndexes.add(index));
    this.renderedDealerCardIndexes = nextRenderedIndexes;
  }

  private syncDealerSequence(cards: RoundCard[]) {
    if (!this.isDealer) {
      this.clearDealerSequenceTimers();
      this.visibleDealerCardIndexes.clear();
      return;
    }

    if (cards.length === 0 || !this.revealDealerCards) {
      this.clearDealerSequenceTimers();
      this.visibleDealerCardIndexes = cards.length > 0 ? new Set([0]) : new Set();
      return;
    }

    this.clearDealerSequenceTimers();

    const nextVisibleIndexes = new Set(
      [...this.visibleDealerCardIndexes].filter((index) => index >= 0 && index < cards.length),
    );
    nextVisibleIndexes.add(0);
    this.visibleDealerCardIndexes = nextVisibleIndexes;

    let sequenceDelay = 0;

    if (cards.length > 1 && !this.visibleDealerCardIndexes.has(1)) {
      sequenceDelay += this.dealerRevealMs;
      this.queueDealerAction(sequenceDelay, () => {
        this.visibleDealerCardIndexes = new Set([...this.visibleDealerCardIndexes, 1]);
      });
      sequenceDelay += this.dealerActionPauseMs;
    }

    for (let index = 2; index < cards.length; index += 1) {
      if (!this.renderedDealerCardIndexes.has(index)) {
        const card = cards[index];
        this.queueDealerAction(sequenceDelay, () => this.startDealerSettlementDeal(index, card));
        sequenceDelay += this.dealerDrawAnimationMs;
      }

      if (this.visibleDealerCardIndexes.has(index)) {
        continue;
      }

      sequenceDelay += this.settlementFlipPauseMs;
      this.queueDealerAction(sequenceDelay, () => {
        this.visibleDealerCardIndexes = new Set([...this.visibleDealerCardIndexes, index]);
      });
      sequenceDelay += this.dealerActionPauseMs;
    }
  }

  private startDealerSettlementDeal(index: number, card: RoundCard) {
    const cardId = this.cardId(card);
    this.renderedDealerCardIndexes = new Set([...this.renderedDealerCardIndexes, index]);
    this.cardDelays.set(cardId, 0);
    this.dealingCardIds.add(cardId);

    const landingTimer = window.setTimeout(() => {
      this.dealingCardIds.delete(cardId);
      this.cdr.markForCheck();
    }, this.dealerDrawAnimationMs);

    this.dealerSequenceTimers.push(landingTimer);
    this.cdr.markForCheck();
  }

  private queueDealerAction(delay: number, action: () => void) {
    const timer = window.setTimeout(() => {
      this.dealerSequenceTimers = this.dealerSequenceTimers.filter((activeTimer) => activeTimer !== timer);
      action();
      this.cdr.markForCheck();
    }, delay);
    this.dealerSequenceTimers.push(timer);
  }

  private clearDealerSequenceTimers() {
    this.dealerSequenceTimers.forEach((timer) => window.clearTimeout(timer));
    this.dealerSequenceTimers = [];
  }

  private triggerScorePulse() {
    this.scoreAnimated = true;
    window.setTimeout(() => (this.scoreAnimated = false), 500);
  }
}
