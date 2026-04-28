import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { I18n, LanguageCode } from '../../../core/i18n/i18n';

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  imports: [NgIf],
  templateUrl: './settings-menu.html',
  styleUrl: './settings-menu.css',
})
export class SettingsMenuComponent {
  readonly i18n = inject(I18n);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  @ViewChild('settingsButton') private settingsButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('previousLanguageButton') private previousLanguageButton?: ElementRef<HTMLButtonElement>;
  open = false;

  toggle() {
    if (this.open) {
      this.close(true);
      return;
    }

    this.open = true;
    window.setTimeout(() => this.previousLanguageButton?.nativeElement.focus());
  }

  get currentLanguage() {
    return this.i18n.languages.find((language) => language.code === this.i18n.language()) ?? this.i18n.languages[0];
  }

  previousLanguage() {
    this.changeLanguageBy(-1);
  }

  nextLanguage() {
    this.changeLanguageBy(1);
  }

  onTriggerKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    if (!this.open) {
      this.open = true;
      window.setTimeout(() => this.previousLanguageButton?.nativeElement.focus());
    }
  }

  onMenuKeydown(event: KeyboardEvent) {
    if (!this.open) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previousLanguage();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextLanguage();
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent) {
    if (!this.open || this.elementRef.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.close();
  }

  private changeLanguageBy(offset: number) {
    const languages = this.i18n.languages;
    const currentIndex = languages.findIndex((language) => language.code === this.i18n.language());
    const nextIndex = (currentIndex + offset + languages.length) % languages.length;
    this.i18n.setLanguage(languages[nextIndex].code as LanguageCode);
  }

  private close(restoreFocus = false) {
    this.open = false;
    if (restoreFocus) {
      window.setTimeout(() => this.settingsButton?.nativeElement.focus());
    }
  }
}
