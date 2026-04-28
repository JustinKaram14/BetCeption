import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../../../core/i18n/i18n';

@Component({
  selector: 'app-disclaimer-footer',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './disclaimer-footer.html',
  styleUrl: './disclaimer-footer.css',
})
export class DisclaimerFooterComponent {
  readonly i18n = inject(I18n);
  readonly year = new Date().getFullYear();
}
