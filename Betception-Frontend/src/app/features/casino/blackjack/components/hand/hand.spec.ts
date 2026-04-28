import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hand } from './hand';
import { CardRank, CardSuit, HandOwnerType, HandStatus, RoundHand } from '../../../../../core/api/api.types';

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

    it('hides dealer score ("--") when there are exactly 2 cards and not yet revealed', () => {
      component.isDealer = true;
      component.revealDealerCards = false;
      component.hand = makeHand({ handValue: 18, cards: [{} as any, {} as any] });
      expect(component.displayScore).toBe('--');
    });

    it('shows dealer score when revealDealerCards is true', () => {
      component.isDealer = true;
      component.revealDealerCards = true;
      component.hand = makeHand({ handValue: 18, cards: [{} as any, {} as any] });
      expect(component.displayScore).toBe('18');
    });

    it('shows dealer score normally when the dealer has more than 2 cards', () => {
      component.isDealer = true;
      component.revealDealerCards = false;
      component.hand = makeHand({ handValue: 22, cards: [{} as any, {} as any, {} as any] });
      expect(component.displayScore).toBe('22');
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
      const c1 = { id: 'c1', drawOrder: 3, rank: null, suit: null, createdAt: '' };
      const c2 = { id: 'c2', drawOrder: 1, rank: null, suit: null, createdAt: '' };
      const c3 = { id: 'c3', drawOrder: 2, rank: null, suit: null, createdAt: '' };
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
    const makeCard = (suit: CardSuit | null, rank: CardRank | null = null) => ({
      id: 'c1',
      rank,
      suit,
      drawOrder: 0,
      createdAt: '',
    });

    it('marks hearts and diamonds cards as red', () => {
      expect(component.cardClasses(makeCard(CardSuit.HEARTS), 0).red).toBeTrue();
      expect(component.cardClasses(makeCard(CardSuit.DIAMONDS), 0).red).toBeTrue();
    });

    it('marks clubs and spades cards as black', () => {
      expect(component.cardClasses(makeCard(CardSuit.CLUBS), 0).black).toBeTrue();
      expect(component.cardClasses(makeCard(CardSuit.SPADES), 0).black).toBeTrue();
    });

    it('hides the dealer hole card (index 1 of a 2-card hand) when not revealed', () => {
      component.isDealer = true;
      component.revealDealerCards = false;
      component.hand = makeHand({ cards: [makeCard(null), makeCard(null)] });

      const classes = component.cardClasses(makeCard(null), 1);
      expect(classes['back']).toBeTrue();
      expect(classes['visible']).toBeFalse();
    });

    it('shows the hole card when revealDealerCards is true', () => {
      component.isDealer = true;
      component.revealDealerCards = true;
      component.hand = makeHand({
        cards: [
          makeCard(CardSuit.CLUBS, CardRank.TEN),
          makeCard(CardSuit.SPADES, CardRank.ACE),
        ],
      });

      const classes = component.cardClasses(makeCard(CardSuit.SPADES, CardRank.ACE), 1);
      expect(classes['visible']).toBeTrue();
      expect(classes['back']).toBeFalse();
    });
  });
});
