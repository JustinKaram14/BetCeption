import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DailyRewardModalComponent } from './daily-reward-modal';

describe('DailyRewardModalComponent', () => {
  let component: DailyRewardModalComponent;
  let fixture: ComponentFixture<DailyRewardModalComponent>;
  let clearIntervalSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyRewardModalComponent],
    }).compileComponents();

    spyOn(window, 'setInterval').and.returnValue(123 as any);
    clearIntervalSpy = spyOn(window, 'clearInterval');

    fixture = TestBed.createComponent(DailyRewardModalComponent);
    component = fixture.componentInstance;
  });

  it('shows a formatted countdown for success state', () => {
    component.now = new Date('2026-04-28T10:00:00.000Z').getTime();
    component.state = {
      kind: 'success',
      claimedAmount: 250,
      balance: 1000,
      eligibleAt: '2026-04-28T11:30:00.000Z',
    };

    fixture.detectChanges();

    expect(component.countdownText).toBe('1h 30m');
    expect(fixture.nativeElement.textContent).toContain('1h 30m');
  });

  it('shows immediate availability when the cooldown has expired', () => {
    component.now = new Date('2026-04-28T12:00:00.000Z').getTime();
    component.state = {
      kind: 'already-claimed',
      eligibleAt: '2026-04-28T11:59:00.000Z',
    };

    fixture.detectChanges();

    expect(component.countdownText.startsWith('Jetzt')).toBeTrue();
  });

  it('returns an empty countdown for non-cooldown states', () => {
    component.state = { kind: 'loading' };

    fixture.detectChanges();

    expect(component.countdownText).toBe('');
  });

  it('emits closed when the overlay itself is clicked', () => {
    spyOn(component.closed, 'emit');
    fixture.detectChanges();

    const overlay = fixture.debugElement.query(By.css('.modal-overlay'));
    overlay.triggerEventHandler('click', {
      target: {
        classList: {
          contains: (value: string) => value === 'modal-overlay',
        },
      },
    });

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('does not emit closed when clicking inside the modal card', () => {
    spyOn(component.closed, 'emit');
    fixture.detectChanges();

    const overlay = fixture.debugElement.query(By.css('.modal-overlay'));
    overlay.triggerEventHandler('click', {
      target: {
        classList: {
          contains: () => false,
        },
      },
    });

    expect(component.closed.emit).not.toHaveBeenCalled();
  });

  it('clears the refresh interval on destroy', () => {
    fixture.detectChanges();
    fixture.destroy();

    expect(clearIntervalSpy).toHaveBeenCalledWith(123 as any);
  });
});
