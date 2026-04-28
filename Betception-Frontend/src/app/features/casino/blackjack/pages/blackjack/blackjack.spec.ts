import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

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

    rngMock.startRound.calls.reset();
    rngMock.hit.calls.reset();
    rngMock.stand.calls.reset();
    rngMock.settle.calls.reset();
  });

  function makeRoundState(
    status: RoundStatus,
    playerStatus: HandStatus,
    mainBetStatus = MainBetStatus.PLACED,
  ) {
    const settled = status === RoundStatus.SETTLED;
    return {
      id: 'round-1',
      status,
      startedAt: new Date().toISOString(),
      endedAt: settled ? new Date().toISOString() : null,
      mainBet: {
        id: 'bet-1',
        amount: '25',
        status: mainBetStatus,
        payoutMultiplier: mainBetStatus === MainBetStatus.LOST ? '0' : null,
        settledAmount: mainBetStatus === MainBetStatus.LOST ? '0' : null,
        settledAt: settled ? new Date().toISOString() : null,
      },
      playerHand: {
        id: 'hand-p',
        ownerType: HandOwnerType.PLAYER,
        status: playerStatus,
        handValue: 14,
        cards: [],
      },
      dealerHand: {
        id: 'hand-d',
        ownerType: HandOwnerType.DEALER,
        status: settled ? HandStatus.STOOD : HandStatus.ACTIVE,
        handValue: settled ? 18 : 10,
        cards: [],
      },
      sideBets: [],
      fairness: {
        roundId: 'round-1',
        status,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        endedAt: null,
        serverSeedHash: 'abc',
        serverSeed: null,
        revealedAt: null,
      },
    };
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the wallet balance on init', () => {
    expect(walletMock.getSummary).toHaveBeenCalledTimes(1);
    expect(component.balance).toBe(1000);
  });

  describe('onPlaceBet', () => {
    it('accumulates bets within the available balance', () => {
      component.betAmount = 0;
      component.balance = 1000;

      component.onPlaceBet(25);
      expect(component.betAmount).toBe(25);

      component.onPlaceBet(100);
      expect(component.betAmount).toBe(125);
    });

    it('caps the bet at the current balance', () => {
      component.balance = 30;
      component.betAmount = 0;

      component.onPlaceBet(100);
      expect(component.betAmount).toBe(30);
    });
  });

  describe('onResetBet', () => {
    it('sets betAmount to zero when no round is active', () => {
      component.betAmount = 50;
      component.round = null;

      component.onResetBet();
      expect(component.betAmount).toBe(0);
    });
  });

  describe('onDeal', () => {
    it('calls rng.startRound and stores the returned round', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      rngMock.startRound.and.returnValue(of({ round: inProgress }));

      component.betAmount = 25;
      component.round = null;
      component.onDeal();

      expect(rngMock.startRound).toHaveBeenCalledOnceWith({ betAmount: 25 });
      expect(component.round!.status).toBe(RoundStatus.IN_PROGRESS);
      expect(component.busyAction).toBeNull();

      // ACTIVE player hand → no auto-settle pending
      tick(1000);
      expect(rngMock.settle).not.toHaveBeenCalled();
    }));

    it('does nothing when betAmount is 0', () => {
      component.betAmount = 0;
      component.onDeal();

      expect(rngMock.startRound).not.toHaveBeenCalled();
    });

    it('stores the error message when the API call fails', fakeAsync(() => {
      rngMock.startRound.and.returnValue(
        throwError(() => ({ error: { message: 'Insufficient balance' } })),
      );

      component.betAmount = 25;
      component.onDeal();

      expect(component.error).toBe('Insufficient balance');
      expect(component.busyAction).toBeNull();
    }));
  });

  describe('onHit', () => {
    it('calls rng.hit with the active round id', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      const afterHit = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      rngMock.hit.and.returnValue(of({ round: afterHit }));

      component.round = inProgress;
      component.onHit();

      expect(rngMock.hit).toHaveBeenCalledOnceWith('round-1');
      expect(component.busyAction).toBeNull();

      tick(1000);
    }));
  });

  describe('onStand', () => {
    it('calls rng.stand, then auto-settles after 850 ms and shows the round overlay', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.LOST);

      rngMock.stand.and.returnValue(of({ round: stood }));
      rngMock.settle.and.returnValue(of({ round: settled }));

      component.round = inProgress;
      component.onStand();

      expect(rngMock.stand).toHaveBeenCalledOnceWith('round-1');
      expect(component.round?.playerHand?.status).toBe(HandStatus.STOOD);

      // auto-settle fires at 850 ms
      tick(850);
      expect(rngMock.settle).toHaveBeenCalledOnceWith('round-1');
      expect(component.round?.status).toBe(RoundStatus.SETTLED);

      // result overlay fires at settlementAnimationDelay (650 ms with empty cards)
      tick(650);
      expect(component.showRoundOverlay).toBeTrue();
      expect(component.roundOutcome?.lost).toBeTrue();
    }));
  });

  describe('onSettle', () => {
    it('calls rng.settle and shows the round overlay after the animation delay', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.WON);

      rngMock.settle.and.returnValue(of({ round: settled }));

      component.round = stood;
      component.onSettle();

      expect(rngMock.settle).toHaveBeenCalledOnceWith('round-1');
      expect(component.round?.status).toBe(RoundStatus.SETTLED);

      tick(650);
      expect(component.showRoundOverlay).toBeTrue();
      expect(component.roundOutcome?.won).toBeTrue();
    }));
  });
});
