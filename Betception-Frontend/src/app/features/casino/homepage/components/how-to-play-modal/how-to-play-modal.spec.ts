import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HowToPlayModalComponent } from './how-to-play-modal';
import { I18n, LanguageCode } from '../../../../../core/i18n/i18n';

describe('HowToPlayModalComponent', () => {
  let component: HowToPlayModalComponent;
  let fixture: ComponentFixture<HowToPlayModalComponent>;
  let i18n: I18n;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowToPlayModalComponent],
    }).compileComponents();

    i18n = TestBed.inject(I18n);
    i18n.setLanguage('de');

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

  it('starts with the blackjack basics category and card-table preview', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(component.activeCategory).toBe('blackjack');
    expect(text).toContain('Blackjack Basics');
    expect(text).toContain('Schlage den Dealer');
    expect(fixture.nativeElement.querySelector('.mini-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.depth-preview')).toBeNull();
  });

  it('switches to Betception, resets progress, and renders the depth-panel preview', () => {
    component.activeIndex = 3;
    fixture.detectChanges();

    const categoryButtons = fixture.nativeElement.querySelectorAll('.tutorial-category') as NodeListOf<HTMLButtonElement>;
    const betceptionButton = Array.from(categoryButtons).find((button) => button.textContent?.includes('Betception'));

    betceptionButton?.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(component.activeCategory).toBe('betception');
    expect(component.activeIndex).toBe(0);
    expect(text).toContain('Blackjack, aber du wettest auf die Wetten');
    expect(text).toContain('Depth Level: 1');
    expect(text).toContain('Main Bet');
    expect(text).toContain('Auszahlung');
    expect(fixture.nativeElement.querySelector('.depth-preview')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.mini-card')).toBeNull();
  });

  it('keeps Betception tutorial content final in all supported languages', () => {
    const forbiddenCopy: Record<LanguageCode, string[]> = {
      de: [`Wird noch ${'geändert'}`],
      en: [`Subject to ${'change'}`],
      es: [`Se ${'cambiará'}`],
      fr: [`Sera ${'modifié'}`],
    };

    (Object.keys(forbiddenCopy) as LanguageCode[]).forEach((language) => {
      i18n.setLanguage(language);
      component.selectCategory('betception');
      fixture.detectChanges();

      const copy = component.steps.map((step) => `${step.copy} ${step.hint}`).join(' ');
      forbiddenCopy[language].forEach((placeholder) => {
        expect(copy).not.toContain(placeholder);
      });
      expect(component.steps.length).toBe(7);
    });
  });

  it('uses the current Betception payout values in the German sidebet tutorial', () => {
    component.selectCategory('betception');

    const copy = component.steps.map((step) => step.copy).join(' ');

    expect(copy).toContain('Exakte Karten zahlen ca. 24:1, Farben ca. 2:1.');
    expect(copy).toContain('Die Auszahlung beträgt ca. 3,8:1.');
    expect(copy).toContain('Die rote Pille zahlt 10,5:1, die blaue Pille 14:1.');
    expect(copy).toContain('Die Auszahlung beträgt ca. 19:1.');
    expect(copy).toContain('1x zahlt ca. 6:1, 2x ca. 29:1 und 3x ca. 144:1.');
  });
});
