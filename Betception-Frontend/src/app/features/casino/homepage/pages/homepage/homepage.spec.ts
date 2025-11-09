import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HomepageComponent } from './homepage';

// Child components, damit wir sie im Test typisieren können:
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard';
import { AuthPanelComponent } from '../../components/auth-panel/auth-panel';
import { CtaPanelComponent } from '../../components/cta-panel/cta-panel';
import { HeroComponent } from '../../components/hero/hero';
import { NeonCardComponent } from '../../components/neon-card/neon-card';

describe('HomepageComponent', () => {
  let fixture: ComponentFixture<HomepageComponent>;
  let component: HomepageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Bei Standalone Components reicht es, die Page zu importieren.
      imports: [HomepageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders hero + cards', () => {
    // Hero vorhanden?
    const hero = fixture.debugElement.query(By.directive(HeroComponent));
    expect(hero).withContext('Hero should exist').toBeTruthy();

    // Mindestens eine Neon-Card-Hülle?
    const cards = fixture.debugElement.queryAll(By.directive(NeonCardComponent));
    expect(cards.length).withContext('Neon cards should render').toBeGreaterThan(0);

    // Leaderboard vorhanden?
    const lb = fixture.debugElement.query(By.directive(LeaderboardComponent));
    expect(lb).withContext('Leaderboard should exist').toBeTruthy();

    // Auth-Panel vorhanden?
    const auth = fixture.debugElement.query(By.directive(AuthPanelComponent));
    expect(auth).withContext('Auth panel should exist').toBeTruthy();

    // CTA-Panel vorhanden?
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

    const payload = { username: 'neo', password: 'matrix' };

    auth.login.emit(payload);
    expect(loginSpy).toHaveBeenCalledWith(payload);

    auth.register.emit(payload);
    expect(registerSpy).toHaveBeenCalledWith(payload);
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
