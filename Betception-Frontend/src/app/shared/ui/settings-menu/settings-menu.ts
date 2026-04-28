import { Component, ElementRef, HostListener, inject } from '@angular/core';
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
  open = false;

  toggle() {
    this.open = !this.open;
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

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent) {
    if (!this.open || this.elementRef.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.open = false;
  }

  private changeLanguageBy(offset: number) {
    const languages = this.i18n.languages;
    const currentIndex = languages.findIndex((language) => language.code === this.i18n.language());
    const nextIndex = (currentIndex + offset + languages.length) % languages.length;
    this.i18n.setLanguage(languages[nextIndex].code as LanguageCode);
  }
}
