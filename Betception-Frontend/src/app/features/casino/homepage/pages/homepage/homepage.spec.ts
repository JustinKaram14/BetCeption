import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomepageComponent } from './homepage';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard';
import { AuthPanelComponent } from '../../components/auth-panel/auth-panel';
import { CtaPanelComponent } from '../../components/cta-panel/cta-panel';
import { HowToPlayModalComponent } from '../../components/how-to-play-modal/how-to-play-modal';
import { DailyRewardModalComponent } from '../../components/daily-reward-modal/daily-reward-modal';
import { HeroComponent } from '../../components/hero/hero';
import { NeonCardComponent } from '../../components/neon-card/neon-card';
import { AuthFacade } from '../../../../auth/services/auth-facade';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { Wallet } from '../../../../../core/services/wallet/wallet';

describe('HomepageComponent', () => {
  let fixture: ComponentFixture<HomepageComponent>;
  let component: HomepageComponent;
  const authFacadeMock = jasmine.createSpyObj<AuthFacade>(
    'AuthFacade',
    ['login', 'register', 'logout', 'isAuthenticated'],
    {
      isAuthenticated$: of(false),
      user$: of(null),
    },
  );
  const walletMock = jasmine.createSpyObj<Wallet>('Wallet', ['claimDailyReward']);
  let routerNavigateSpy: jasmine.Spy;
  const apiMock = jasmine.createSpyObj<BetceptionApi>(
    'BetceptionApi',
    ['getBalanceLeaderboard', 'getLevelLeaderboard', 'getWinningsLeaderboard'],
  );

  beforeEach(async () => {
    authFacadeMock.login.and.returnValue(of(null));
    authFacadeMock.register.and.returnValue(of({ message: 'ok' } as any));
    authFacadeMock.logout.and.returnValue(of(undefined));
    authFacadeMock.isAuthenticated.and.returnValue(false);
    walletMock.claimDailyReward.and.returnValue(
      of({
        claimedAmount: 100,
        balance: 1000,
        eligibleAt: new Date().toISOString(),
      }),
    );
    apiMock.getBalanceLeaderboard.and.returnValue(
      of({ items: [], currentUserRank: null, total: 0, limit: 10, offset: 0 }),
    );
    apiMock.getLevelLeaderboard.and.returnValue(
      of({ items: [], currentUserRank: null, total: 0, limit: 10, offset: 0 }),
    );
    apiMock.getWinningsLeaderboard.and.returnValue(
      of({ items: [], currentUserRank: null, total: 0, limit: 10, offset: 0 }),
    );

    await TestBed.configureTestingModule({
      imports: [HomepageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: BetceptionApi, useValue: apiMock },
        { provide: Wallet, useValue: walletMock },
      ],
    }).compileComponents();

    routerNavigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    authFacadeMock.login.calls.reset();
    authFacadeMock.register.calls.reset();
    authFacadeMock.logout.calls.reset();
    authFacadeMock.isAuthenticated.calls.reset();
    apiMock.getBalanceLeaderboard.calls.reset();
    apiMock.getLevelLeaderboard.calls.reset();
    apiMock.getWinningsLeaderboard.calls.reset();
    walletMock.claimDailyReward.calls.reset();
    routerNavigateSpy.calls.reset();

    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders hero + cards', () => {
    const hero = fixture.debugElement.query(By.directive(HeroComponent));
    expect(hero).withContext('Hero should exist').toBeTruthy();

    const cards = fixture.debugElement.queryAll(By.directive(NeonCardComponent));
    expect(cards.length).withContext('Neon cards should render').toBeGreaterThan(0);

    const lb = fixture.debugElement.query(By.directive(LeaderboardComponent));
    expect(lb).withContext('Leaderboard should exist').toBeTruthy();

    const auth = fixture.debugElement.query(By.directive(AuthPanelComponent));
    expect(auth).withContext('Auth panel should exist').toBeTruthy();

    const cta = fixture.debugElement.query(By.directive(CtaPanelComponent));
    expect(cta).withContext('CTA panel should exist').toBeTruthy();
  });

  it('handles login/register events from auth panel', () => {
    const authDe = fixture.debugElement.query(By.directive(AuthPanelComponent));
    const auth = authDe.componentInstance as AuthPanelComponent;

    const loginSpy = spyOn(component, 'onLogin');
    const registerSpy = spyOn(component, 'onRegister');

    const loginPayload = { email: 'neo@matrix.io', password: 'matrix' };
    const registerPayload = { email: 'neo@matrix.io', username: 'neo', password: 'matrix' };

    auth.login.emit(loginPayload);
    expect(loginSpy).toHaveBeenCalledWith(loginPayload);

    auth.register.emit(registerPayload);
    expect(registerSpy).toHaveBeenCalledWith(registerPayload);
  });

  it('handles CTA events', () => {
    const ctaDe = fixture.debugElement.query(By.directive(CtaPanelComponent));
    const cta = ctaDe.componentInstance as CtaPanelComponent;

    const enterSpy = spyOn(component, 'onEnter');
    const rewardsSpy = spyOn(component, 'onRewards');

    cta.enter.emit();
    expect(enterSpy).toHaveBeenCalled();

    cta.rewards.emit();
    expect(rewardsSpy).toHaveBeenCalled();
  });

  it('opens and closes the how-to-play modal from the DOM', () => {
    const openButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="how-to-play-button"]');

    openButton.click();
    fixture.detectChanges();

    const modalDe = fixture.debugElement.query(By.directive(HowToPlayModalComponent));
    expect(modalDe).toBeTruthy();

    (modalDe.componentInstance as HowToPlayModalComponent).closed.emit();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(HowToPlayModalComponent))).toBeNull();
  });

  it('opens the daily reward modal for authenticated users', () => {
    authFacadeMock.isAuthenticated.and.returnValue(true);
    fixture.detectChanges();

    const rewardsButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="daily-rewards-button"]');
    rewardsButton.click();
    fixture.detectChanges();

    expect(walletMock.claimDailyReward).toHaveBeenCalled();
    expect(fixture.debugElement.query(By.directive(DailyRewardModalComponent))).toBeTruthy();
  });

  it('switches to the stacked layout on narrow viewports', (done) => {
    const mainContent: HTMLElement = fixture.nativeElement.querySelector('[data-testid="homepage-main-content"]');
    const originalWidth = window.outerWidth;

    Object.defineProperty(window, 'outerWidth', { get: () => 560, configurable: true });
    fixture.detectChanges();

    window.requestAnimationFrame(() => {
      expect(getComputedStyle(mainContent).flexDirection).toBe('column');
      Object.defineProperty(window, 'outerWidth', { get: () => originalWidth, configurable: true });
      done();
    });
  });
});
