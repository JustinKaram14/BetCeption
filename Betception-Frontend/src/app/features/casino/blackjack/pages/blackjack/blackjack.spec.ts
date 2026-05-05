import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Blackjack } from './blackjack';
import { HandOwnerType, HandStatus, MainBetStatus, RoundStatus, type LevelProgress } from '../../../../../core/api/api.types';
import { Rng } from '../../../../../core/services/rng/rng';
import { Wallet } from '../../../../../core/services/wallet/wallet';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';

describe('Blackjack', () => {
  let component: Blackjack;
  let fixture: ComponentFixture<Blackjack>;
  const rngMock = jasmine.createSpyObj<Rng>(
    'Rng',
    ['startRound', 'getActiveRound', 'hit', 'stand', 'settle'],
  );
  const walletMock = jasmine.createSpyObj<Wallet>('Wallet', ['getSummary']);
  const apiMock = jasmine.createSpyObj<BetceptionApi>(
    'BetceptionApi',
    ['purchasePowerup', 'consumePowerup', 'listInventory', 'listPowerups'],
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
    apiMock.listInventory.and.returnValue(of({ items: [] }));
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
      component.roundOutcome = { headline: 'Win!', detail: null, won: true, lost: false, push: false, dealerInfo: null };
      component.round = makeRoundState(RoundStatus.SETTLED, HandStatus.SETTLED);
      component.onNextRound();
      expect(component.showRoundOverlay).toBeFalse();
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

  describe('powerup interactions', () => {
    let powerupComponent: Blackjack;
    let powerupFixture: ComponentFixture<Blackjack>;
    const apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'purchasePowerup', 'consumePowerup', 'listInventory', 'listPowerups',
      'peekCard', 'undoHit', 'swapCard',
    ]);
    const rngPowerupMock = jasmine.createSpyObj<Rng>(
      'Rng', ['startRound', 'getActiveRound', 'hit', 'stand', 'settle'],
    );
    const walletPowerupMock = jasmine.createSpyObj<Wallet>('Wallet', ['getSummary']);

    const abortedRound = {
      id: 'round-1',
      status: RoundStatus.ABORTED,
      startedAt: null,
      endedAt: null,
      mainBet: { id: 'bet-1', amount: '10', status: MainBetStatus.VOID, payoutMultiplier: null, settledAmount: null, settledAt: null },
      playerHand: { id: 'hand-p', ownerType: HandOwnerType.PLAYER, status: HandStatus.SETTLED, handValue: 0, cards: [] },
      dealerHand: { id: 'hand-d', ownerType: HandOwnerType.DEALER, status: HandStatus.SETTLED, handValue: 0, cards: [] },
      sideBets: [],
      playerProgress: null,
      fairness:{ roundId: 'round-1', status: RoundStatus.ABORTED, createdAt: new Date().toISOString(), startedAt: null, endedAt: null, serverSeedHash: null, serverSeed: null, revealedAt: null },
    };

    beforeEach(async () => {
      TestBed.resetTestingModule();
      walletPowerupMock.getSummary.and.returnValue(
        of({ id: 'u1', username: 'neo', balance: 500, xp: 0, level: 3, lastDailyRewardAt: null, levelProgress }),
      );
      rngPowerupMock.getActiveRound.and.returnValue(of({ round: abortedRound }));
      apiMock.listInventory.and.returnValue(of({ items: [] }));
      apiMock.listPowerups.and.returnValue(of({ items: [] }));

      await TestBed.configureTestingModule({
        imports: [Blackjack],
        providers: [
          provideRouter([]),
          { provide: Rng, useValue: rngPowerupMock },
          { provide: Wallet, useValue: walletPowerupMock },
          { provide: BetceptionApi, useValue: apiMock },
        ],
      }).compileComponents();

      powerupFixture = TestBed.createComponent(Blackjack);
      powerupComponent = powerupFixture.componentInstance;
      powerupFixture.detectChanges();

      apiMock.purchasePowerup.calls.reset();
      apiMock.consumePowerup.calls.reset();
      apiMock.listInventory.calls.reset();
      apiMock.listPowerups.calls.reset();
      apiMock.peekCard.calls.reset();
      apiMock.undoHit.calls.reset();
      apiMock.swapCard.calls.reset();
    });

    it('onOpenPowerupMenu shows the menu and loads inventory', () => {
      apiMock.listInventory.and.returnValue(of({ items: [] }));
      apiMock.listPowerups.and.returnValue(of({ items: [] }));

      expect(powerupComponent.showPowerupMenu).toBeFalse();
      powerupComponent.onOpenPowerupMenu();

      expect(powerupComponent.showPowerupMenu).toBeTrue();
      expect(apiMock.listInventory).toHaveBeenCalledTimes(1);
      expect(apiMock.listPowerups).toHaveBeenCalledTimes(1);
    });

    it('onClosePowerupMenu hides the powerup menu', () => {
      powerupComponent.showPowerupMenu = true;
      powerupComponent.onClosePowerupMenu();
      expect(powerupComponent.showPowerupMenu).toBeFalse();
    });

    it('onPurchasePowerup updates balance and reloads inventory on success', () => {
      apiMock.purchasePowerup.and.returnValue(of({ message: 'OK', balance: 450, quantity: 2 } as any));
      apiMock.listInventory.and.returnValue(of({ items: [] }));
      apiMock.listPowerups.and.returnValue(of({ items: [] }));

      powerupComponent.onPurchasePowerup({ typeId: 1, quantity: 2 });

      expect(powerupComponent.balance).toBe(450);
      expect(apiMock.listInventory).toHaveBeenCalledTimes(1);
    });

    it('onPurchasePowerup stores error message on failure', () => {
      apiMock.purchasePowerup.and.returnValue(throwError(() => ({ error: { message: 'Insufficient funds' } })));

      powerupComponent.onPurchasePowerup({ typeId: 1, quantity: 1 });

      expect(powerupComponent.error).toBe('Insufficient funds');
    });

    it('onPeekCard calls api.peekCard and stores the peeked card', () => {
      apiMock.peekCard.and.returnValue(of({ rank: 'K', suit: '♠' }));
      apiMock.listInventory.and.returnValue(of({ items: [] }));
      apiMock.listPowerups.and.returnValue(of({ items: [] }));

      powerupComponent.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      powerupComponent.onPeekCard();

      expect(apiMock.peekCard).toHaveBeenCalledOnceWith('round-1');
      expect(powerupComponent.peekCard).toEqual({ rank: 'K', suit: '♠' });
      expect(apiMock.listInventory).toHaveBeenCalledTimes(1);
    });

    it('onUndoHit calls api.undoHit and updates the round', () => {
      const updatedRound = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      apiMock.undoHit.and.returnValue(of({ round: updatedRound }));
      apiMock.listInventory.and.returnValue(of({ items: [] }));
      apiMock.listPowerups.and.returnValue(of({ items: [] }));

      powerupComponent.round = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      powerupComponent.onUndoHit();

      expect(apiMock.undoHit).toHaveBeenCalledOnceWith('round-1');
      expect(powerupComponent.round?.status).toBe(RoundStatus.IN_PROGRESS);
      expect(apiMock.listInventory).toHaveBeenCalledTimes(1);
    });

    it('onSwapLastCard calls api.swapCard with the last card id and updates the round', () => {
      const updatedRound = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      apiMock.swapCard.and.returnValue(of({ round: updatedRound }));
      apiMock.listInventory.and.returnValue(of({ items: [] }));
      apiMock.listPowerups.and.returnValue(of({ items: [] }));

      const roundWith3Cards = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      (roundWith3Cards.playerHand as any).cards = [
        { id: 'c1', rank: 'TEN', suit: 'SPADES', drawOrder: 1, createdAt: new Date().toISOString() },
        { id: 'c2', rank: 'FIVE', suit: 'HEARTS', drawOrder: 2, createdAt: new Date().toISOString() },
        { id: 'c3', rank: 'THREE', suit: 'CLUBS', drawOrder: 3, createdAt: new Date().toISOString() },
      ];
      powerupComponent.round = roundWith3Cards as any;
      powerupComponent.onSwapLastCard();

      expect(apiMock.swapCard).toHaveBeenCalledOnceWith('round-1', 'c3');
      expect(powerupComponent.round?.status).toBe(RoundStatus.IN_PROGRESS);
      expect(apiMock.listInventory).toHaveBeenCalledTimes(1);
    });

    it('onToggleQueue adds a typeId to pendingPowerupTypeIds', () => {
      powerupComponent.onToggleQueue(5);
      expect(powerupComponent.pendingPowerupTypeIds).toContain(5);
    });

    it('onToggleQueue removes the typeId when toggled again', () => {
      powerupComponent.pendingPowerupTypeIds = [3, 5];
      powerupComponent.onToggleQueue(3);
      expect(powerupComponent.pendingPowerupTypeIds).not.toContain(3);
      expect(powerupComponent.pendingPowerupTypeIds).toContain(5);
    });

    it('onNextRound clears pendingPowerupTypeIds', () => {
      powerupComponent.pendingPowerupTypeIds = [1, 2, 3];
      powerupComponent.onNextRound();
      expect(powerupComponent.pendingPowerupTypeIds).toEqual([]);
    });

    it('onDeal consumes pending powerups after round starts', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      rngPowerupMock.startRound.and.returnValue(of({ round: inProgress }));
      apiMock.consumePowerup.and.returnValue(of({
        message: 'OK', consumed: 1, remaining: 2,
        powerup: { id: 1, code: 'MULTI_PLUS', title: 'Multiplikator-Pille', effect: null },
        roundId: 'round-1',
      } as any));
      apiMock.listInventory.and.returnValue(of({ items: [] }));
      apiMock.listPowerups.and.returnValue(of({ items: [] }));

      powerupComponent.betAmount = 10;
      powerupComponent.pendingPowerupTypeIds = [1, 2];
      powerupComponent.onDeal();
      tick(1000);

      expect(apiMock.consumePowerup).toHaveBeenCalledTimes(2);
      expect(apiMock.consumePowerup).toHaveBeenCalledWith({ typeId: 1, quantity: 1, roundId: 'round-1' });
      expect(apiMock.consumePowerup).toHaveBeenCalledWith({ typeId: 2, quantity: 1, roundId: 'round-1' });
      expect(powerupComponent.pendingPowerupTypeIds).toEqual([]);
    }));

    it('onDeal skips consumePendingQueue when queue is empty', fakeAsync(() => {
      const inProgress = makeRoundState(RoundStatus.IN_PROGRESS, HandStatus.ACTIVE);
      rngPowerupMock.startRound.and.returnValue(of({ round: inProgress }));

      powerupComponent.betAmount = 10;
      powerupComponent.pendingPowerupTypeIds = [];
      powerupComponent.onDeal();
      tick(1000);

      expect(apiMock.consumePowerup).not.toHaveBeenCalled();
    }));
  });
});
