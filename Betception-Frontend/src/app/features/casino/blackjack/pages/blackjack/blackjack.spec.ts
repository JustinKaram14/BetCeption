import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Blackjack } from './blackjack';
import { HandOwnerType, HandStatus, MainBetStatus, RoundStatus } from '../../../../../core/api/api.types';
import { Rng } from '../../../../../core/services/rng/rng';
import { Wallet } from '../../../../../core/services/wallet/wallet';

describe('Blackjack', () => {
  let component: Blackjack;
  let fixture: ComponentFixture<Blackjack>;
  const rngMock = jasmine.createSpyObj<Rng>(
    'Rng',
    ['startRound', 'getActiveRound', 'hit', 'stand', 'settle'],
  );
  const walletMock = jasmine.createSpyObj<Wallet>('Wallet', ['getSummary']);

  beforeEach(async () => {
    walletMock.getSummary.and.returnValue(
      of({
        id: 'user-1',
        username: 'neo',
        balance: 1000,
        xp: 0,
        level: 1,
        lastDailyRewardAt: null,
      }),
    );
    rngMock.getActiveRound.and.returnValue(
      of({
        round: {
          id: 'round-1',
          status: RoundStatus.ABORTED,
          startedAt: null,
          endedAt: null,
          mainBet: {
            id: 'bet-1',
            amount: '10',
            status: MainBetStatus.VOID,
            payoutMultiplier: null,
            settledAmount: null,
            settledAt: null,
          },
          playerHand: {
            id: 'hand-player-1',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.SETTLED,
            handValue: 0,
            cards: [],
          },
          dealerHand: {
            id: 'hand-dealer-1',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.SETTLED,
            handValue: 0,
            cards: [],
          },
          sideBets: [],
          fairness: {
            roundId: 'round-1',
            status: RoundStatus.ABORTED,
            createdAt: new Date().toISOString(),
            startedAt: null,
            endedAt: null,
            serverSeedHash: null,
            serverSeed: null,
            revealedAt: null,
          },
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [Blackjack],
      providers: [
        provideRouter([]),
        { provide: Rng, useValue: rngMock },
        { provide: Wallet, useValue: walletMock },
      ],
    })
    .compileComponents();

    walletMock.getSummary.calls.reset();
    rngMock.getActiveRound.calls.reset();

    fixture = TestBed.createComponent(Blackjack);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
