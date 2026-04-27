// src/app/features/homepage/components/cta-panel/cta-panel.ts
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { I18n } from '../../../../../core/i18n/i18n';

@Component({
  selector: 'app-cta-panel',
  standalone: true,
  templateUrl: './cta-panel.html',
  styleUrls: ['./cta-panel.css']
})
export class CtaPanelComponent {
  readonly i18n = inject(I18n);

  @Output() enter = new EventEmitter<void>();
  @Output() rewards = new EventEmitter<void>();
}
