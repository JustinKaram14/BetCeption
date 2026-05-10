import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of, throwError, NEVER } from 'rxjs';
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
import { I18n } from '../../../../../core/i18n/i18n';

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
    ['getBalanceLeaderboard', 'getLevelLeaderboard', 'getWinningsLeaderboard', 'getDailyRewardStatus', 'claimDailyReward'],
  );

  beforeEach(async () => {
    window.localStorage.setItem('betception-language', 'de');
    authFacadeMock.login.and.returnValue(of(null));
    authFacadeMock.register.and.returnValue(of({ message: 'ok' } as any));
    authFacadeMock.logout.and.returnValue(of(undefined));
    authFacadeMock.isAuthenticated.and.returnValue(false);
    walletMock.claimDailyReward.and.returnValue(
      of({
        claimedAmount: 100,
        balance: 1000,
        eligibleAt: new Date().toISOString(),
      } as any),
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
    apiMock.getDailyRewardStatus.and.returnValue(NEVER as any);
    apiMock.claimDailyReward.and.returnValue(NEVER as any);

    await TestBed.configureTestingModule({
      imports: [HomepageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: BetceptionApi, useValue: apiMock },
        { provide: Wallet, useValue: walletMock },
      ],
    }).compileComponents();

    TestBed.inject(I18n).setLanguage('de');
    routerNavigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    authFacadeMock.login.calls.reset();
    authFacadeMock.register.calls.reset();
    authFacadeMock.logout.calls.reset();
    authFacadeMock.isAuthenticated.calls.reset();
    apiMock.getBalanceLeaderboard.calls.reset();
    apiMock.getLevelLeaderboard.calls.reset();
    apiMock.getWinningsLeaderboard.calls.reset();
    apiMock.getDailyRewardStatus.calls.reset();
    apiMock.claimDailyReward.calls.reset();
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

    expect(fixture.debugElement.query(By.directive(DailyRewardModalComponent))).toBeTruthy();
  });

  it('returns true for isNarrow when outerWidth is narrow', () => {
    const originalWidth = window.outerWidth;
    Object.defineProperty(window, 'outerWidth', { get: () => 560, configurable: true });
    expect(component.isNarrow).toBeTrue();
    Object.defineProperty(window, 'outerWidth', { get: () => originalWidth, configurable: true });
  });

  it('onWindowResize can be called without error', () => {
    expect(() => component.onWindowResize()).not.toThrow();
  });

  it('shows a success toast on successful login', () => {
    const toastSpy = spyOn((component as any).toast, 'success');
    authFacadeMock.login.and.returnValue(of({ sub: 'u1', email: 't@t.com', username: 'tester' } as any));
    component.onLogin({ email: 't@t.com', password: 'pw' });
    expect(toastSpy).toHaveBeenCalled();
  });

  it('shows an error toast on login failure (string error)', () => {
    const toastSpy = spyOn((component as any).toast, 'error');
    authFacadeMock.login.and.returnValue(throwError(() => 'Login failed'));
    component.onLogin({ email: 't@t.com', password: 'pw' });
    expect(toastSpy).toHaveBeenCalledWith('Login failed');
  });

  it('shows an error toast on login failure (error.error.message)', () => {
    const toastSpy = spyOn((component as any).toast, 'error');
    authFacadeMock.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    component.onLogin({ email: 't@t.com', password: 'pw' });
    expect(toastSpy).toHaveBeenCalledWith('Invalid credentials');
  });

  it('shows an error toast on login failure (error.error as string)', () => {
    const toastSpy = spyOn((component as any).toast, 'error');
    authFacadeMock.login.and.returnValue(throwError(() => ({ error: 'Unauthorized' })));
    component.onLogin({ email: 't@t.com', password: 'pw' });
    expect(toastSpy).toHaveBeenCalledWith('Unauthorized');
  });

  it('shows an error toast on login failure (error.message)', () => {
    const toastSpy = spyOn((component as any).toast, 'error');
    authFacadeMock.login.and.returnValue(throwError(() => ({ message: 'Network error' })));
    component.onLogin({ email: 't@t.com', password: 'pw' });
    expect(toastSpy).toHaveBeenCalled();
  });

  it('shows a fallback error toast on login failure (unknown shape)', () => {
    const toastSpy = spyOn((component as any).toast, 'error');
    authFacadeMock.login.and.returnValue(throwError(() => ({ unknownProp: true })));
    component.onLogin({ email: 't@t.com', password: 'pw' });
    expect(toastSpy).toHaveBeenCalled();
  });

  it('shows a success toast on successful register', () => {
    const toastSpy = spyOn((component as any).toast, 'success');
    authFacadeMock.register.and.returnValue(of({ message: 'ok' } as any));
    authFacadeMock.login.and.returnValue(of({ sub: 'u1', email: 't@t.com', username: 'new' } as any));
    component.onRegister({ email: 't@t.com', username: 'new', password: 'pw' });
    expect(toastSpy).toHaveBeenCalled();
  });

  it('translates backend email validation errors on register', () => {
    const toastSpy = spyOn((component as any).toast, 'error');
    authFacadeMock.register.and.returnValue(throwError(() => ({
      error: {
        code: 'EMAIL_DISPOSABLE',
        message: 'Disposable email addresses are not allowed.',
      },
    })));

    component.onRegister({ email: 't@mailinator.com', username: 'new', password: 'pw' });

    expect(toastSpy.calls.mostRecent().args[0]).toContain('Wegwerf-Adressen');
    expect(authFacadeMock.login).not.toHaveBeenCalled();
  });

  it('calls logout on authFacade and does not throw on success', () => {
    authFacadeMock.logout.and.returnValue(of(undefined));
    expect(() => component.onLogout()).not.toThrow();
  });

  it('shows an error toast on logout failure', () => {
    const toastSpy = spyOn((component as any).toast, 'error');
    authFacadeMock.logout.and.returnValue(throwError(() => new Error('Network error')));
    component.onLogout();
    expect(toastSpy).toHaveBeenCalled();
  });

  it('navigates to /blackjack when entering as authenticated user', () => {
    authFacadeMock.isAuthenticated.and.returnValue(true);
    component.onEnter();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/blackjack']);
  });

  it('shows a toast when entering as unauthenticated user', () => {
    authFacadeMock.isAuthenticated.and.returnValue(false);
    const toastSpy = spyOn((component as any).toast, 'error');
    component.onEnter();
    expect(toastSpy).toHaveBeenCalled();
    expect(routerNavigateSpy).not.toHaveBeenCalled();
  });

  it('shows a toast when claiming rewards while unauthenticated', () => {
    authFacadeMock.isAuthenticated.and.returnValue(false);
    const toastSpy = spyOn((component as any).toast, 'error');
    component.onRewards();
    expect(toastSpy).toHaveBeenCalled();
    expect(component.showRewardModal).toBeFalse();
  });

  it('sets showRewardModal to true when authenticated user calls onRewards', () => {
    authFacadeMock.isAuthenticated.and.returnValue(true);
    component.onRewards();
    expect(component.showRewardModal).toBeTrue();
  });

  it('closes reward modal via closeRewardModal', () => {
    component.showRewardModal = true;
    component.closeRewardModal();
    expect(component.showRewardModal).toBeFalse();
  });

  it('closeRewardModal sets showRewardModal to false', () => {
    component.showRewardModal = true;
    component.closeRewardModal();
    expect(component.showRewardModal).toBeFalse();
  });
});
