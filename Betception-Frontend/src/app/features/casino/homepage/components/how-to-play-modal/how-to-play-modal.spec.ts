import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HowToPlayModalComponent } from './how-to-play-modal';

describe('HowToPlayModalComponent', () => {
  let component: HowToPlayModalComponent;
  let fixture: ComponentFixture<HowToPlayModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowToPlayModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HowToPlayModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('focuses the close button when the modal opens', () => {
    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="how-to-play-close"]');

    expect(document.activeElement).toBe(closeButton);
  });

  it('emits closed when escape is pressed', () => {
    spyOn(component.closed, 'emit');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('emits closed when the overlay is clicked', () => {
    spyOn(component.closed, 'emit');

    const overlay = fixture.debugElement.query(By.css('[data-testid="how-to-play-overlay"]'));
    overlay.triggerEventHandler('click', {
      target: {
        classList: {
          contains: (value: string) => value === 'tutorial-overlay',
        },
      },
    });

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('does not emit closed when clicking inside the modal card', () => {
    spyOn(component.closed, 'emit');

    const overlay = fixture.debugElement.query(By.css('[data-testid="how-to-play-overlay"]'));
    overlay.triggerEventHandler('click', {
      target: {
        classList: {
          contains: () => false,
        },
      },
    });

    expect(component.closed.emit).not.toHaveBeenCalled();
  });
});
