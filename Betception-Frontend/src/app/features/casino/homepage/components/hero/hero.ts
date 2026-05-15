// src/app/features/homepage/components/hero/hero.ts
import { Component, inject } from '@angular/core';
import { I18n } from '../../../../../core/i18n/i18n';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class HeroComponent {
  readonly i18n = inject(I18n);
}
