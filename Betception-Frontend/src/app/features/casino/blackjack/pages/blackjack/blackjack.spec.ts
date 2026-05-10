import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Blackjack } from './blackjack';
import {
  CardRank,
  CardSuit,
  HandOwnerType,
  HandStatus,
  MainBetStatus,
  RoundStatus,
  SideBetStatus,
  type ActivePowerup,
  type BetceptionResolution,
  type LevelProgress,
} from '../../../../../core/api/api.types';
import { Rng } from '../../../../../core/services/rng/rng';
import { Wallet } from '../../../../../core/services/wallet/wallet';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';

describe('Blackjack', () => {
  let component: Blackjack;
  let fixture: ComponentFixture<Blackjack>;
  const rngMock = jasmine.createSpyObj<Rng>(
    'Rng',
    ['startRound', 'getActiveRound', 'hit', 'stand', 'dealerStep', 'settle', 'double', 'split'],
  );
  const walletMock = jasmine.createSpyObj<Wallet>('Wallet', ['getSummary']);
  const apiMock = jasmine.createSpyObj<BetceptionApi>(
    'BetceptionApi',
    ['purchasePowerup', 'equipPowerup', 'listInventory', 'listPowerups'],
  );
  const levelProgress: LevelProgress = {
    level: 1,
    xp: 0,
    currentLevelXp: 0,
    nextLevelXp: 500,
    xpIntoLevel: 0,
    xpToNextLevel: 500,
    progressPercent: 0,
  };

  beforeEach(async () => {
    apiMock.listInventory.and.returnValue(of({ items: [], activePowerup: null }));
    apiMock.listPowerups.and.returnValue(of({ items: [] }));
    walletMock.getSummary.and.returnValue(
      of({
        id: 'user-1',
        username: 'neo',
        balance: 1000,
        xp: 0,
        level: 1,
        levelProgress,
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
          splitBets: [],
          playerHand: {
            id: 'hand-player-1',
            ownerType: HandOwnerType.PLAYER,
            status: HandStatus.SETTLED,
            handValue: 0,
            cards: [],
          },
          splitHands: [],
          dealerHand: {
            id: 'hand-dealer-1',
            ownerType: HandOwnerType.DEALER,
            status: HandStatus.SETTLED,
            handValue: 0,
            cards: [],
          },
          sideBets: [],
          playerProgress: null,
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
        { provide: BetceptionApi, useValue: apiMock },
      ],
    })
    .compileComponents();

    walletMock.getSummary.calls.reset();
    rngMock.getActiveRound.calls.reset();
    apiMock.listInventory.calls.reset();
    apiMock.listPowerups.calls.reset();

    fixture = TestBed.createComponent(Blackjack);
    component = fixture.componentInstance;
    fixture.detectChanges();

    rngMock.startRound.calls.reset();
    rngMock.hit.calls.reset();
    rngMock.stand.calls.reset();
    rngMock.dealerStep.calls.reset();
    rngMock.settle.calls.reset();
    rngMock.double.calls.reset();
    rngMock.split.calls.reset();
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
      splitBets: [],
      playerHand: {
        id: 'hand-p',
        ownerType: HandOwnerType.PLAYER,
        status: playerStatus,
        handValue: 14,
        cards: [],
      },
      splitHands: [],
      dealerHand: {
        id: 'hand-d',
        ownerType: HandOwnerType.DEALER,
        status: settled ? HandStatus.STOOD : HandStatus.ACTIVE,
        handValue: settled ? 18 : 10,
        cards: [],
      },
      sideBets: [],
      playerProgress: levelProgress,
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

  describe('guard conditions', () => {
    it('onPlaceBet is a no-op when a round is active', () => {
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.betAmount = 50;
      component.onPlaceBet(25);
      expect(component.betAmount).toBe(50);
    });

    it('onPlaceBet places the bet without cap when balance is null', () => {
      component.balance = null;
      component.round = null;
      component.betAmount = 0;
      component.onPlaceBet(100);
      expect(component.betAmount).toBe(100);
    });

    it('onResetBet is a no-op when a round is active', () => {
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.betAmount = 50;
      component.onResetBet();
      expect(component.betAmount).toBe(50);
    });

    it('onDeal is a no-op when busyAction is already set', () => {
      component.busyAction = 'hit';
      component.betAmount = 25;
      component.onDeal();
      expect(rngMock.startRound).not.toHaveBeenCalled();
    });

    it('onDeal is a no-op while round resolution is active', () => {
      component.roundResolutionActive = true;
      component.betAmount = 25;
      component.onDeal();
      expect(component.showBetceptionMenu).toBeFalse();
      expect(rngMock.startRound).not.toHaveBeenCalled();
    });

    it('onDeal is a no-op while the round overlay is visible', () => {
      component.showRoundOverlay = true;
      component.betAmount = 25;
      component.onDeal();
      expect(component.showBetceptionMenu).toBeFalse();
      expect(rngMock.startRound).not.toHaveBeenCalled();
    });

    it('onDeal sets error when betAmount is 0', () => {
      component.betAmount = 0;
      component.onDeal();
      expect(component.error).toBeTruthy();
      expect(rngMock.startRound).not.toHaveBeenCalled();
    });

    it('onHit is a no-op when round is null', () => {
      component.round = null;
      component.onHit();
      expect(rngMock.hit).not.toHaveBeenCalled();
    });

    it('onHit is a no-op when busyAction is set', () => {
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.busyAction = 'deal';
      component.onHit();
      expect(rngMock.hit).not.toHaveBeenCalled();
    });

    it('onStand is a no-op when round is null', () => {
      component.round = null;
      component.onStand();
      expect(rngMock.stand).not.toHaveBeenCalled();
    });

    it('onSettle is a no-op when round is null', () => {
      component.round = null;
      component.onSettle();
      expect(rngMock.settle).not.toHaveBeenCalled();
    });
  });

  describe('isRoundActive getter', () => {
    it('returns true for CREATED status', () => {
      component.round = makeRoundState(RoundStatus.CREATED, HandStatus.ACTIVE);
      expect(component.isRoundActive).toBeTrue();
    });

    it('returns true for DEALING status', () => {
      component.round = makeRoundState(RoundStatus.DEALING, HandStatus.ACTIVE);
      expect(component.isRoundActive).toBeTrue();
    });

    it('returns false for ABORTED status', () => {
      component.round = makeRoundState(RoundStatus.ABORTED, HandStatus.SETTLED);
      expect(component.isRoundActive).toBeFalse();
    });
  });

  describe('onNextRound', () => {
    it('resets round-related state', () => {
      component.showRoundOverlay = true;
      component.roundResolutionActive = true;
      component.roundOutcome = { headline: 'Win!', detail: null, won: true, lost: false, push: false, dealerInfo: null };
      component.round = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED);
      component.onNextRound();
      expect(component.showRoundOverlay).toBeFalse();
      expect(component.roundResolutionActive).toBeFalse();
      expect(component.round).toBeNull();
      expect(component.roundOutcome).toBeNull();
    });

    it('caps betAmount to balance when it exceeds the balance', () => {
      component.balance = 20;
      component.betAmount = 50;
      component.onNextRound();
      expect(component.betAmount).toBe(20);
    });

    it('does not modify betAmount when balance is null', () => {
      component.balance = null;
      component.betAmount = 50;
      component.onNextRound();
      expect(component.betAmount).toBe(50);
    });
  });

  describe('round outcomes', () => {
    it('shows a PUSH outcome after settling with PUSH status', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.PUSH);
      rngMock.settle.and.returnValue(of({ round: settled }));
      component.round = stood;
      component.onSettle();
      tick(650);
      expect(component.roundOutcome?.push).toBeTrue();
    }));

    it('shows a WON outcome with payout detail when settledAmount is available', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.WON);
      settled.mainBet = { ...settled.mainBet, settledAmount: '50.00' };
      rngMock.settle.and.returnValue(of({ round: settled }));
      component.round = stood;
      component.onSettle();
      tick(650);
      expect(component.roundOutcome?.won).toBeTrue();
      expect(component.roundOutcome?.detail).toContain('50');
    }));

    it('shows a WON outcome without detail when settledAmount is null', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.WON);
      rngMock.settle.and.returnValue(of({ round: settled }));
      component.round = stood;
      component.onSettle();
      tick(650);
      expect(component.roundOutcome?.won).toBeTrue();
      expect(component.roundOutcome?.detail).toBeNull();
    }));

    it('shows dealer BUSTED info in round outcome', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.WON);
      settled.dealerHand = { ...settled.dealerHand, status: HandStatus.BUSTED, handValue: 23 };
      rngMock.settle.and.returnValue(of({ round: settled }));
      component.round = stood;
      component.onSettle();
      tick(650);
      expect(component.roundOutcome?.dealerInfo).toBeTruthy();
    }));

    it('shows dealer BLACKJACK info in round outcome', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.LOST);
      settled.dealerHand = { ...settled.dealerHand, status: HandStatus.BLACKJACK, handValue: 21 };
      rngMock.settle.and.returnValue(of({ round: settled }));
      component.round = stood;
      component.onSettle();
      tick(650);
      expect(component.roundOutcome?.dealerInfo).toBeTruthy();
    }));

    it('shows a REFUNDED outcome as push', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.REFUNDED);
      rngMock.settle.and.returnValue(of({ round: settled }));
      component.round = stood;
      component.onSettle();
      tick(650);
      expect(component.roundOutcome?.push).toBeTrue();
    }));
  });

  describe('triggerBanner', () => {
    it('shows the blackjack banner when player has blackjack and hides it after 1500 ms', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      const blackjack = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.BLACKJACK);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.WON);
      rngMock.hit.and.returnValue(of({ round: blackjack }));
      rngMock.settle.and.returnValue(of({ round: settled }));
      component.round = inProgress;
      component.onHit();
      expect(component.showBlackjackBanner).toBeTrue();
      tick(1500);
      expect(component.showBlackjackBanner).toBeFalse();
    }));

    it('does not show banner for non-blackjack hand after a hit', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      const afterHit = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      rngMock.hit.and.returnValue(of({ round: afterHit }));
      component.round = inProgress;
      component.onHit();
      expect(component.showBlackjackBanner).toBeFalse();
      tick(1000);
    }));
  });

  describe('error handling', () => {
    it('stores the error message when hit fails (error.error.message)', fakeAsync(() => {
      rngMock.hit.and.returnValue(throwError(() => ({ error: { message: 'Hand locked' } })));
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.onHit();
      expect(component.error).toBe('Hand locked');
    }));

    it('extracts error.error string payload', fakeAsync(() => {
      rngMock.hit.and.returnValue(throwError(() => ({ error: 'Too many requests' })));
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.onHit();
      expect(component.error).toBe('Too many requests');
    }));

    it('extracts error.message when no error.error exists', fakeAsync(() => {
      rngMock.hit.and.returnValue(throwError(() => ({ message: 'Connection failed' })));
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.onHit();
      expect(component.error).toBe('Connection failed');
    }));

    it('stores a fallback error for unknown error shapes', fakeAsync(() => {
      rngMock.hit.and.returnValue(throwError(() => ({ unknownProp: true })));
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.onHit();
      expect(component.error).toBeTruthy();
    }));

    it('stores a string error message directly', fakeAsync(() => {
      rngMock.stand.and.returnValue(throwError(() => 'Network error'));
      component.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      component.onStand();
      expect(component.error).toBe('Network error');
    }));
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
    it('opens the betception menu before starting the round', () => {
      component.betAmount = 25;
      component.round = null;

      component.onDeal();

      expect(component.showBetceptionMenu).toBeTrue();
      expect(rngMock.startRound).not.toHaveBeenCalled();
    });

    it('starts the round after confirming betception bets', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      rngMock.startRound.and.returnValue(of({ round: inProgress }));

      component.betAmount = 25;
      component.round = null;
      component.onDeal();
      component.onConfirmBetception();

      expect(rngMock.startRound).toHaveBeenCalledOnceWith({ betAmount: 25, sideBets: [] });
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
      component.onConfirmBetception();

      expect(component.error).toBe('Insufficient balance');
      expect(component.busyAction).toBeNull();
    }));
  });

  describe('Betception side bets', () => {
    const activeRedPill: ActivePowerup = {
      type: {
        id: 1,
        code: 'RED_PILL',
        title: 'Red Pill',
        description: null,
        minLevel: 1,
        price: 300,
        effect: null,
      },
      usesRemaining: 3,
    };

    it('sends card, dealer bust, pill, and blackjack side bets when confirming', () => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      rngMock.startRound.and.returnValue(of({ round: inProgress }));

      component.balance = 1000;
      component.betAmount = 100;
      component.activePowerup = activeRedPill;
      component.onSelectCardSuit(CardSuit.HEARTS);
      component.onSelectCardRank(CardRank.JACK);
      component.onAddCardBet(25);
      component.onAddDealerBustBet(50);
      component.onAddPillTriggerBet(5);
      component.onAddBlackjackBet(10);

      component.onConfirmBetception();

      expect(rngMock.startRound).toHaveBeenCalledOnceWith({
        betAmount: 100,
        sideBets: [
          {
            typeCode: 'CARD_EXACT',
            amount: 25,
            predictedSuit: CardSuit.HEARTS,
            predictedRank: CardRank.JACK,
            selection: { suit: CardSuit.HEARTS, rank: CardRank.JACK },
          },
          {
            typeCode: 'DEALER_BUST',
            amount: 50,
            selection: { target: 'DEALER', outcome: 'BUST' },
          },
          {
            typeCode: 'PILL_TRIGGER',
            amount: 5,
            selection: { powerupCode: 'RED_PILL' },
          },
          {
            typeCode: 'PLAYER_BLACKJACK',
            amount: 10,
            selection: { target: 'PLAYER' },
          },
        ],
      });
    });

    it('keeps the pill trigger unavailable without an active pill', () => {
      component.balance = 1000;
      component.betAmount = 100;
      component.activePowerup = null;

      component.onAddPillTriggerBet(25);
      component.onDeal();
      fixture.detectChanges();

      const pillTile: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.betception-tile')[2];
      expect(component.pillTriggerBetAmount).toBe(0);
      expect(pillTile.disabled).toBeTrue();
      expect(pillTile.classList.contains('is-unavailable')).toBeTrue();
    });

    it('reveals Betception settlement rows one step at a time', fakeAsync(() => {
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.WON);
      const resolution: BetceptionResolution = {
        depthLevel: 4,
        totalStake: '100',
        totalPayout: '1200',
        steps: [
          { id: 'main', kind: 'MAIN_BET', status: MainBetStatus.WON, amount: '50', payout: '100', multiplier: '2.000', selection: null },
          { id: 'card', kind: 'CARD_EXACT', status: SideBetStatus.WON, amount: '25', payout: '300', multiplier: '12.000', selection: { suit: CardSuit.HEARTS, rank: CardRank.JACK } },
          { id: 'dealer-bust', kind: 'DEALER_BUST', status: SideBetStatus.LOST, amount: '25', payout: '0', multiplier: '3.000', selection: { target: 'DEALER', outcome: 'BUST' } },
        ],
      };
      rngMock.settle.and.returnValue(of({ round: settled, betceptionResolution: resolution }));

      component.round = stood;
      component.onSettle();

      expect(component.betceptionResolution).toBe(resolution);
      expect(component.revealedResolutionStepCount).toBe(0);
      tick(649);
      expect(component.revealedResolutionStepCount).toBe(0);
      tick(1);
      expect(component.revealedResolutionStepCount).toBe(1);
      tick(620);
      expect(component.revealedResolutionStepCount).toBe(2);
      tick(620);
      expect(component.revealedResolutionStepCount).toBe(3);
    }));

    it('classifies win animations relative to total stake', () => {
      component.finalStakeAmount = 100;

      component.finalPayoutAmount = 150;
      expect(component.finalPayoutTier).toBe('win');

      component.finalPayoutAmount = 300;
      expect(component.finalPayoutTier).toBe('big');

      component.finalPayoutAmount = 600;
      expect(component.finalPayoutTier).toBe('super');

      component.finalPayoutAmount = 1000;
      expect(component.finalPayoutTier).toBe('mega');
    });
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
    it('calls rng.stand, runs one dealer step, then settles and shows the round overlay', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      const stood = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      const dealerComplete = {
        ...stood,
        dealerHand: { ...stood.dealerHand, status: HandStatus.STOOD, handValue: 18 },
      };
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED, MainBetStatus.LOST);

      rngMock.stand.and.returnValue(of({ round: stood }));
      rngMock.dealerStep.and.returnValue(of({
        round: dealerComplete,
        dealerAction: { kind: 'STAND', cardId: null, dealerTurnComplete: true },
      }));
      rngMock.settle.and.returnValue(of({ round: settled }));

      component.round = inProgress;
      component.onStand();

      expect(rngMock.stand).toHaveBeenCalledOnceWith('round-1');
      expect(component.round?.playerHand?.status).toBe(HandStatus.STOOD);

      tick(620);
      expect(rngMock.dealerStep).toHaveBeenCalledOnceWith('round-1');
      expect(component.round?.dealerHand?.status).toBe(HandStatus.STOOD);

      tick(650);
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
      expect(component.isBusy).toBeTrue();

      tick(650);
      expect(component.showRoundOverlay).toBeTrue();
      expect(component.roundOutcome?.won).toBeTrue();
    }));
  });

  describe('power pill interactions', () => {
    let powerupComponent: Blackjack;
    let powerupFixture: ComponentFixture<Blackjack>;
    const pillApiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'purchasePowerup', 'equipPowerup', 'listInventory', 'listPowerups',
    ]);
    const rngPowerupMock = jasmine.createSpyObj<Rng>(
      'Rng', ['startRound', 'getActiveRound', 'hit', 'stand', 'dealerStep', 'settle', 'double', 'split'],
    );
    const walletPowerupMock = jasmine.createSpyObj<Wallet>('Wallet', ['getSummary']);

    const activeRedPill: ActivePowerup = {
      type: {
        id: 1,
        code: 'RED_PILL',
        title: 'Red Pill',
        description: null,
        minLevel: 1,
        price: 300,
        effect: null,
      },
      usesRemaining: 3,
    };

    const abortedRound = {
      id: 'round-1',
      status: RoundStatus.ABORTED,
      startedAt: null,
      endedAt: null,
      mainBet: { id: 'bet-1', amount: '10', status: MainBetStatus.VOID, payoutMultiplier: null, settledAmount: null, settledAt: null },
      splitBets: [],
      playerHand: { id: 'hand-p', ownerType: HandOwnerType.PLAYER, status: HandStatus.SETTLED, handValue: 0, cards: [] },
      splitHands: [],
      dealerHand: { id: 'hand-d', ownerType: HandOwnerType.DEALER, status: HandStatus.SETTLED, handValue: 0, cards: [] },
      sideBets: [],
      playerProgress: null,
      fairness: { roundId: 'round-1', status: RoundStatus.ABORTED, createdAt: new Date().toISOString(), startedAt: null, endedAt: null, serverSeedHash: null, serverSeed: null, revealedAt: null },
    };

    beforeEach(async () => {
      TestBed.resetTestingModule();
      walletPowerupMock.getSummary.and.returnValue(
        of({ id: 'u1', username: 'neo', balance: 500, xp: 0, level: 3, lastDailyRewardAt: null, levelProgress }),
      );
      rngPowerupMock.getActiveRound.and.returnValue(of({ round: abortedRound }));
      pillApiMock.listInventory.and.returnValue(of({ items: [], activePowerup: null }));
      pillApiMock.listPowerups.and.returnValue(of({ items: [] }));

      await TestBed.configureTestingModule({
        imports: [Blackjack],
        providers: [
          provideRouter([]),
          { provide: Rng, useValue: rngPowerupMock },
          { provide: Wallet, useValue: walletPowerupMock },
          { provide: BetceptionApi, useValue: pillApiMock },
        ],
      }).compileComponents();

      powerupFixture = TestBed.createComponent(Blackjack);
      powerupComponent = powerupFixture.componentInstance;
      powerupFixture.detectChanges();

      pillApiMock.purchasePowerup.calls.reset();
      pillApiMock.equipPowerup.calls.reset();
      pillApiMock.listInventory.calls.reset();
      pillApiMock.listPowerups.calls.reset();
    });

    it('opens the pill menu and loads inventory when the slot is empty', () => {
      (powerupComponent as any).inventoryLoaded = false;

      expect(powerupComponent.showPowerupMenu).toBeFalse();
      powerupComponent.onOpenPowerupMenu();

      expect(powerupComponent.showPowerupMenu).toBeTrue();
      expect(pillApiMock.listInventory).toHaveBeenCalledTimes(1);
      expect(pillApiMock.listPowerups).toHaveBeenCalledTimes(1);
    });

    it('does not open the pill menu when a pill is active', () => {
      powerupComponent.activePowerup = activeRedPill;

      powerupComponent.onOpenPowerupMenu();

      expect(powerupComponent.showPowerupMenu).toBeFalse();
    });

    it('purchase equips the active pill, updates balance, and closes the menu', () => {
      pillApiMock.purchasePowerup.and.returnValue(of({
        message: 'OK',
        balance: 200,
        quantity: 0,
        activePowerup: activeRedPill,
      }));
      pillApiMock.listInventory.and.returnValue(of({ items: [], activePowerup: activeRedPill }));

      powerupComponent.showPowerupMenu = true;
      powerupComponent.onPurchasePowerup({ typeId: 1, quantity: 1 });

      expect(powerupComponent.balance).toBe(200);
      expect(powerupComponent.activePowerup).toEqual(activeRedPill);
      expect(powerupComponent.showPowerupMenu).toBeFalse();
      expect(pillApiMock.listInventory).toHaveBeenCalledTimes(1);
    });

    it('equip uses an inventory pill and closes the menu', () => {
      pillApiMock.equipPowerup.and.returnValue(of({
        message: 'Power pill equipped',
        quantity: 0,
        activePowerup: activeRedPill,
      }));
      pillApiMock.listInventory.and.returnValue(of({ items: [], activePowerup: activeRedPill }));

      powerupComponent.showPowerupMenu = true;
      powerupComponent.onEquipPowerup({ typeId: 1 });

      expect(pillApiMock.equipPowerup).toHaveBeenCalledOnceWith({ typeId: 1 });
      expect(powerupComponent.activePowerup).toEqual(activeRedPill);
      expect(powerupComponent.showPowerupMenu).toBeFalse();
    });

    it('settle response triggers pill pulse and updates remaining uses', fakeAsync(() => {
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.STOOD, MainBetStatus.WON);
      rngPowerupMock.settle.and.returnValue(of({
        round: settled,
        activePowerup: { ...activeRedPill, usesRemaining: 2 },
        triggeredPowerupEffect: { code: 'RED_PILL', color: 'red' },
        expiredPowerup: null,
      }));

      powerupComponent.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      powerupComponent.onSettle();

      expect(powerupComponent.pillPulse).toBe('red');
      expect(powerupComponent.activePowerup?.usesRemaining).toBe(2);
      tick(760);
      expect(powerupComponent.pillPulse).toBeNull();
    }));

    it('expired pill response plays the pop state and clears it', fakeAsync(() => {
      const settled = makeRoundState(RoundStatus.SETTLED, HandStatus.STOOD, MainBetStatus.LOST);
      rngPowerupMock.settle.and.returnValue(of({
        round: settled,
        activePowerup: null,
        triggeredPowerupEffect: null,
        expiredPowerup: { code: 'BLUE_PILL', color: 'blue' },
      }));

      powerupComponent.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.STOOD);
      powerupComponent.onSettle();

      expect(powerupComponent.activePowerup).toBeNull();
      expect(powerupComponent.pillExpiredCode).toBe('BLUE_PILL');
      tick(560);
      expect(powerupComponent.pillExpiredCode).toBeNull();
    }));
  });
});
