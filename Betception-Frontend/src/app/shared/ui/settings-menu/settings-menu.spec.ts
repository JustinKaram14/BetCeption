import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { I18n } from '../../../core/i18n/i18n';
import { SettingsMenuComponent } from './settings-menu';

describe('SettingsMenuComponent', () => {
  let component: SettingsMenuComponent;
  let fixture: ComponentFixture<SettingsMenuComponent>;
  let i18n: I18n;

  beforeEach(async () => {
    window.localStorage.removeItem('betception-language');

    await TestBed.configureTestingModule({
      imports: [SettingsMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsMenuComponent);
    component = fixture.componentInstance;
    i18n = TestBed.inject(I18n);
    i18n.setLanguage('de');
    fixture.detectChanges();
  });

  it('opens from the trigger keyboard shortcut and focuses the first language control', fakeAsync(() => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="settings-button"]');

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    tick();

    const previousButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="settings-language-previous"]');

    expect(component.open).toBeTrue();
    expect(document.activeElement).toBe(previousButton);
  }));

  it('changes the language with arrow keys while the popover is open', () => {
    component.open = true;
    fixture.detectChanges();

    const popover: HTMLDivElement = fixture.nativeElement.querySelector('[data-testid="settings-popover"]');
    popover.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(i18n.language()).toBe('en');

    popover.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(i18n.language()).toBe('de');
  });

  it('closes on escape and restores focus to the trigger', fakeAsync(() => {
    component.toggle();
    fixture.detectChanges();
    tick();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="settings-button"]');
    const popover: HTMLDivElement = fixture.nativeElement.querySelector('[data-testid="settings-popover"]');

    popover.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    tick();

    expect(component.open).toBeFalse();
    expect(document.activeElement).toBe(trigger);
  }));

  it('closes when clicking outside the component', () => {
    component.open = true;
    fixture.detectChanges();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.open).toBeFalse();
  });
});
