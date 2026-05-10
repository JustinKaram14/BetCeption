import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hand } from './hand';
import { CardRank, CardSuit, HandOwnerType, HandStatus, RoundCard, RoundHand } from '../../../../../core/api/api.types';

function makeHand(overrides: Partial<RoundHand> = {}): RoundHand {
  return {
    id: 'h1',
    ownerType: HandOwnerType.PLAYER,
    status: HandStatus.ACTIVE,
    handValue: 17,
    cards: [],
    ...overrides,
  };
}

function makeCard(
  id: string,
  suit: CardSuit | null,
  rank: CardRank | null = null,
  drawOrder = 1,
): RoundCard {
  return {
    id,
    rank,
    suit,
    drawOrder,
    createdAt: '',
  };
}

describe('Hand', () => {
  let component: Hand;
  let fixture: ComponentFixture<Hand>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hand],
    }).compileComponents();

    fixture = TestBed.createComponent(Hand);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('displayScore', () => {
    it('returns "--" when hand is null', () => {
      component.hand = null;
      expect(component.displayScore).toBe('--');
    });

    it('returns the hand value as a string when a hand is set', () => {
      component.hand = makeHand({ handValue: 21 });
      expect(component.displayScore).toBe('21');
    });

    it('hides dealer score while the backend masks the hole card', () => {
      component.isDealer = true;
      component.hand = makeHand({
        handValue: 18,
        cards: [
          makeCard('c1', CardSuit.CLUBS, CardRank.TEN, 1),
          makeCard('c2', null, null, 2),
        ],
      });

      expect(component.displayScore).toBe('--');
    });

    it('shows dealer score once the backend returns an unmasked hole card', () => {
      component.isDealer = true;
      component.hand = makeHand({
        handValue: 18,
        cards: [
          makeCard('c1', CardSuit.CLUBS, CardRank.TEN, 1),
          makeCard('c2', CardSuit.SPADES, CardRank.EIGHT, 2),
        ],
      });

      expect(component.displayScore).toBe('18');
    });

    it('hides dealer score while any dealer card is still masked', () => {
      component.isDealer = true;
      component.hand = makeHand({
        handValue: 22,
        cards: [
          makeCard('c1', CardSuit.CLUBS, CardRank.TEN, 1),
          makeCard('c2', CardSuit.SPADES, CardRank.EIGHT, 2),
          makeCard('c3', null, null, 3),
        ],
      });

      expect(component.displayScore).toBe('--');
    });
  });

  describe('statusLabel', () => {
    const cases = [
      [HandStatus.ACTIVE, 'hand.status.active'],
      [HandStatus.STOOD, 'hand.status.stood'],
      [HandStatus.BUSTED, 'hand.status.busted'],
      [HandStatus.BLACKJACK, 'hand.status.blackjack'],
      [HandStatus.SURRENDERED, 'hand.status.surrendered'],
      [HandStatus.SETTLED, null],
      [undefined, null],
    ] as const;

    for (const [status, expectedKey] of cases) {
      it(`returns the translated label for status "${status}"`, () => {
        component.hand = status ? makeHand({ status }) : null;
        expect(component.statusLabel).toBe(expectedKey ? component.i18n.t(expectedKey) : null);
      });
    }

    it('hides dealer status while the backend masks a card', () => {
      component.isDealer = true;
      component.hand = makeHand({
        status: HandStatus.ACTIVE,
        cards: [
          makeCard('c1', CardSuit.CLUBS, CardRank.TEN, 1),
          makeCard('c2', null, null, 2),
        ],
      });

      expect(component.statusLabel).toBeNull();
    });
  });

  describe('suitSymbol', () => {
    it('returns correct symbols for all suits', () => {
      expect(component.suitSymbol(CardSuit.HEARTS)).toBe('♥');
      expect(component.suitSymbol(CardSuit.DIAMONDS)).toBe('♦');
      expect(component.suitSymbol(CardSuit.CLUBS)).toBe('♣');
      expect(component.suitSymbol(CardSuit.SPADES)).toBe('♠');
    });

    it('returns empty string for a null suit (face-down card)', () => {
      expect(component.suitSymbol(null)).toBe('');
    });
  });

  describe('cards getter', () => {
    it('returns cards sorted by drawOrder', () => {
      const c1 = makeCard('c1', null, null, 3);
      const c2 = makeCard('c2', null, null, 1);
      const c3 = makeCard('c3', null, null, 2);
      component.hand = makeHand({ cards: [c1, c2, c3] });

      const sorted = component.cards;
      expect(sorted.map((c) => c.id)).toEqual(['c2', 'c3', 'c1']);
    });

    it('returns an empty array when hand is null', () => {
      component.hand = null;
      expect(component.cards).toEqual([]);
    });
  });

  describe('cardClasses', () => {
    it('marks hearts and diamonds cards as red', () => {
      expect(component.cardClasses(makeCard('c1', CardSuit.HEARTS), 0).red).toBeTrue();
      expect(component.cardClasses(makeCard('c2', CardSuit.DIAMONDS), 0).red).toBeTrue();
    });

    it('marks clubs and spades cards as black', () => {
      expect(component.cardClasses(makeCard('c1', CardSuit.CLUBS), 0).black).toBeTrue();
      expect(component.cardClasses(makeCard('c2', CardSuit.SPADES), 0).black).toBeTrue();
    });

    it('renders a backend-masked dealer card as the card back', () => {
      const upcard = makeCard('c1', CardSuit.CLUBS, CardRank.TEN, 1);
      const holeCard = makeCard('c2', null, null, 2);
      component.isDealer = true;
      component.hand = makeHand({ cards: [upcard, holeCard] });

      const classes = component.cardClasses(holeCard, 1);
      expect(classes['back']).toBeTrue();
      expect(classes['visible']).toBeFalse();
    });

    it('shows the same dealer card when the backend unmasks it', () => {
      const upcard = makeCard('c1', CardSuit.CLUBS, CardRank.TEN, 1);
      const revealedHoleCard = makeCard('c2', CardSuit.SPADES, CardRank.ACE, 2);
      component.isDealer = true;
      component.hand = makeHand({ cards: [upcard, revealedHoleCard] });

      const classes = component.cardClasses(revealedHoleCard, 1);
      expect(classes['visible']).toBeTrue();
      expect(classes['back']).toBeFalse();
    });

    it('does not hide later dealer cards when the backend sends real card values', () => {
      const drawnCard = makeCard('c3', CardSuit.HEARTS, CardRank.FIVE, 3);
      component.isDealer = true;
      component.hand = makeHand({
        cards: [
          makeCard('c1', CardSuit.CLUBS, CardRank.TEN, 1),
          makeCard('c2', CardSuit.SPADES, CardRank.ACE, 2),
          drawnCard,
        ],
      });

      const classes = component.cardClasses(drawnCard, 2);
      expect(classes['visible']).toBeTrue();
      expect(classes['back']).toBeFalse();
    });
  });
});
