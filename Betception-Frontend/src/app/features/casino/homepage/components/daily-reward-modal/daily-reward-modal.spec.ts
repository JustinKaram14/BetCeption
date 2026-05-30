import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NEVER, throwError } from 'rxjs';

import { DailyRewardModalComponent } from './daily-reward-modal';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';

describe('DailyRewardModalComponent', () => {
  let component: DailyRewardModalComponent;
  let fixture: ComponentFixture<DailyRewardModalComponent>;
  let clearIntervalSpy: jasmine.Spy;
  let apiMock: jasmine.SpyObj<BetceptionApi>;

  beforeEach(async () => {
    localStorage.clear();
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'getDailyRewardStatus',
      'claimDailyReward',
    ]);
    apiMock.getDailyRewardStatus.and.returnValue(NEVER as any);
    apiMock.claimDailyReward.and.returnValue(NEVER as any);

    await TestBed.configureTestingModule({
      imports: [DailyRewardModalComponent],
      providers: [{ provide: BetceptionApi, useValue: apiMock }],
    }).compileComponents();

    spyOn(window, 'setInterval').and.returnValue(123 as any);
    clearIntervalSpy = spyOn(window, 'clearInterval');

    fixture = TestBed.createComponent(DailyRewardModalComponent);
    component = fixture.componentInstance;
  });

  it('shows a formatted countdown for success state', () => {
    component.now = new Date('2026-04-28T10:00:00.000Z').getTime();
    fixture.detectChanges();
    component.loading = false;
    component.isEligible = false;
    component.eligibleAt = '2026-04-28T11:30:00.000Z';
    fixture.detectChanges();

    expect(component.countdownText).toBe('1h 30m');
    expect(fixture.nativeElement.textContent).toContain('1h 30m');
  });

  it('shows immediate availability when the cooldown has expired', () => {
    component.now = new Date('2026-04-28T12:00:00.000Z').getTime();
    fixture.detectChanges();
    component.loading = false;
    component.eligibleAt = '2026-04-28T11:59:00.000Z';
    fixture.detectChanges();

    expect(component.countdownText.startsWith('Jetzt')).toBeTrue();
  });

  it('localizes pill reward labels through the shared language service', () => {
    const redPillReward = {
      day: 7,
      kind: 'powerup' as const,
      powerupCode: 'RED_PILL',
      isMilestone: true,
      label: 'Red Pill',
      icon: 'pill',
    };

    component.i18n.setLanguage('en');
    expect(component.rewardKindLabel(redPillReward)).toBe('Pill');
    expect(component.rewardLabel(redPillReward)).toBe('Red Pill');

    component.i18n.setLanguage('de');
    expect(component.rewardKindLabel(redPillReward)).toBe('Pille');
    expect(component.rewardLabel(redPillReward)).toBe('Rote Pille');
  });

  it('localizes unrevealed daily pill labels instead of using API labels', () => {
    const unrevealedPillReward = {
      day: 3,
      kind: 'powerup' as const,
      powerupLabel: 'Rote/Blaue Pille',
      isMilestone: false,
      label: 'Rote/Blaue Pille',
      icon: 'PILL',
    };

    component.i18n.setLanguage('en');
    expect(component.rewardLabel(unrevealedPillReward)).toBe('Red or blue pill');

    component.i18n.setLanguage('de');
    expect(component.rewardLabel(unrevealedPillReward)).toBe('Rote oder blaue Pille');
  });

  it('localizes daily claim errors instead of rendering backend messages', () => {
    apiMock.claimDailyReward.and.returnValue(
      throwError(() => ({ error: { message: 'Reward already claimed for today' } })) as any,
    );
    component.i18n.setLanguage('de');
    component.loading = false;
    component.isEligible = true;

    component.onClaim();

    expect(component.error).toBe('Du hast deine tägliche Belohnung heute schon abgeholt.');
  });

  it('renders dialog with correct ARIA attributes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const dialog: HTMLDivElement = fixture.nativeElement.querySelector('.dr-card');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  }));

  it('returns an empty countdown when in loading state', () => {
    fixture.detectChanges();
    // loading = true is set by ngOnInit → loadStatus() before NEVER resolves
    expect(component.loading).toBeTrue();
    expect(component.countdownText).toBe('');
  });

  it('emits closed when the overlay itself is clicked', () => {
    spyOn(component.closed, 'emit');
    fixture.detectChanges();

    const overlay = fixture.debugElement.query(By.css('.dr-overlay'));
    overlay.triggerEventHandler('click', {
      target: {
        classList: {
          contains: (value: string) => value === 'dr-overlay',
        },
      },
    });

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('does not emit closed when clicking inside the modal card', () => {
    spyOn(component.closed, 'emit');
    fixture.detectChanges();

    const overlay = fixture.debugElement.query(By.css('.dr-overlay'));
    overlay.triggerEventHandler('click', {
      target: {
        classList: {
          contains: () => false,
        },
      },
    });

    expect(component.closed.emit).not.toHaveBeenCalled();
  });

  it('emits closed when escape is pressed', () => {
    spyOn(component.closed, 'emit');
    fixture.detectChanges();
    component.error = 'Oops';
    component.loading = false;
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('clears the refresh interval on destroy', () => {
    fixture.detectChanges();
    fixture.destroy();

    expect(clearIntervalSpy).toHaveBeenCalledWith(123 as any);
  });
});
