// src/app/features/homepage/components/cta-panel/cta-panel.ts
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-cta-panel',
  standalone: true,
  templateUrl: './cta-panel.html',
  styleUrls: ['./cta-panel.css']
})
export class CtaPanelComponent {
  @Output() enter = new EventEmitter<void>();
  @Output() rewards = new EventEmitter<void>();
}
