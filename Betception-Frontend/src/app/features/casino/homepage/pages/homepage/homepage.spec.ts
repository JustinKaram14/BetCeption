import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { HomepageComponent } from './homepage';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard';
import { AuthPanelComponent } from '../../components/auth-panel/auth-panel';
import { CtaPanelComponent } from '../../components/cta-panel/cta-panel';
import { HeroComponent } from '../../components/hero/hero';
import { NeonCardComponent } from '../../components/neon-card/neon-card';
import { AuthFacade } from '../../../../auth/services/auth-facade';

describe('HomepageComponent', () => {
  let fixture: ComponentFixture<HomepageComponent>;
  let component: HomepageComponent;
  const authFacadeMock = {
    login: jasmine.createSpy('login').and.returnValue(of(null)),
    register: jasmine.createSpy('register').and.returnValue(of({ message: 'ok' })),
  } as Partial<AuthFacade>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomepageComponent],
      providers: [{ provide: AuthFacade, useValue: authFacadeMock }],
    }).compileComponents();

    authFacadeMock.login!.calls.reset();
    authFacadeMock.register!.calls.reset();

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

  it('passes entries to leaderboard', () => {
    const lbDe = fixture.debugElement.query(By.directive(LeaderboardComponent));
    const lbInstance = lbDe.componentInstance as LeaderboardComponent;
    expect(lbInstance.entries?.length).toBe(component.entries.length);
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
});
