import { Component, Input } from '@angular/core';
import { NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import type { AchievementIcon } from '../../../core/api/api.types';

@Component({
  selector: 'app-achievement-icon',
  standalone: true,
  imports: [NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault],
  template: `
    <span class="achievement-icon" [ngClass]="{ locked }">
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" [ngSwitch]="icon">
        <path *ngSwitchCase="'chip'" d="M32 7a25 25 0 1 0 0 50 25 25 0 0 0 0-50Zm0 8a17 17 0 1 1 0 34 17 17 0 0 1 0-34Zm0 8a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-3-13h6v8h-6v-8Zm0 36h6v8h-6v-8ZM10 29h8v6h-8v-6Zm36 0h8v6h-8v-6ZM16 14l6-4 4 7-6 4-4-7Zm22 33 6-4 4 7-6 4-4-7Zm10-33-4-4-6 7 6 4 4-7ZM16 50l4 4 6-7-6-4-4 7Z" />
        <path *ngSwitchCase="'trophy'" d="M18 10h28v8h8c0 10-5 17-15 18-1 4-3 7-7 8v6h10v6H22v-6h10v-6c-4-1-6-4-7-8-10-1-15-8-15-18h8v-8Zm0 7h-3c1 6 4 10 9 12-3-4-5-8-6-12Zm31 0h-3c-1 4-3 8-6 12 5-2 8-6 9-12Z" />
        <path *ngSwitchCase="'medal'" d="M19 6h10l3 11 3-11h10l-7 17a17 17 0 1 1-12 0L19 6Zm13 24a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />
        <path *ngSwitchCase="'ace'" d="M16 8h32c4 0 7 3 7 7v34c0 4-3 7-7 7H16c-4 0-7-3-7-7V15c0-4 3-7 7-7Zm16 12 10 26h-7l-2-6h-9l-2 6h-7l10-26h7Zm-6 14h5l-2-7-3 7Z" />
        <path *ngSwitchCase="'cards'" d="M18 14h24c4 0 6 2 6 6v28c0 4-2 6-6 6H18c-4 0-6-2-6-6V20c0-4 2-6 6-6Zm8 8v9h9v-9h-9Zm10 17v7h7v-7h-7Zm-2-11 12 12 5-5-12-12-5 5Z" />
        <path *ngSwitchCase="'target'" d="M32 6a26 26 0 1 0 0 52 26 26 0 0 0 0-52Zm0 8a18 18 0 1 1 0 36 18 18 0 0 1 0-36Zm0 8a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
        <path *ngSwitchCase="'crosshair'" d="M29 5h6v8a20 20 0 0 1 16 16h8v6h-8a20 20 0 0 1-16 16v8h-6v-8a20 20 0 0 1-16-16H5v-6h8a20 20 0 0 1 16-16V5Zm3 15a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
        <path *ngSwitchCase="'calendar'" d="M18 7h6v7h16V7h6v7h5c4 0 7 3 7 7v28c0 4-3 7-7 7H13c-4 0-7-3-7-7V21c0-4 3-7 7-7h5V7Zm-5 20v21c0 1 1 2 2 2h34c1 0 2-1 2-2V27H13Zm5 7h8v7h-8v-7Zm13 0h8v7h-8v-7Zm13 0h5v7h-5v-7Z" />
        <path *ngSwitchCase="'spark'" d="M33 4l6 17 17 6-17 6-6 27-6-27-19-6 19-6 6-17Zm-18 35 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Zm35-1 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />
        <path *ngSwitchCase="'signal'" d="M10 48h7v8h-7v-8Zm12-11h7v19h-7V37Zm12-12h7v31h-7V25Zm12-13h8v44h-8V12ZM8 16c12-9 28-9 40 0l-5 6c-9-6-21-6-30 0l-5-6Z" />
        <path *ngSwitchCase="'skull'" d="M32 6c13 0 23 9 23 21 0 8-4 14-10 18v9c0 3-2 5-5 5H24c-3 0-5-2-5-5v-9C13 41 9 35 9 27 9 15 19 6 32 6Zm-9 21a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm18 0a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM28 45v7h4v-7h-4Zm8 0v7h4v-7h-4Z" />
        <path *ngSwitchCase="'vault'" d="M11 16c0-5 4-9 9-9h24c5 0 9 4 9 9v32c0 5-4 9-9 9H20c-5 0-9-4-9-9V16Zm8 3v26h26V19H19Zm13 4a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm12-17h-5v5h5v-5Z" />
        <path *ngSwitchCase="'gem'" d="M14 10h36l9 15-27 32L5 25l9-15Zm7 7-5 8 16 19 16-19-5-8H21Zm8 0 3 15 3-15h-6Z" />
        <path *ngSwitchCase="'shield'" d="M32 5 54 14v15c0 14-9 24-22 30C19 53 10 43 10 29V14L32 5Zm0 8-14 6v10c0 9 5 16 14 21 9-5 14-12 14-21V19l-14-6Zm-2 27L19 29l5-5 6 6 11-12 5 5-16 17Z" />
        <path *ngSwitchCase="'mask'" d="M9 22c8-5 17-7 23-3 6-4 15-2 23 3-1 15-8 25-19 25-2 0-4-1-4-3 0 2-2 3-4 3C17 47 10 37 9 22Zm10 8c2 5 6 8 11 8-2-5-6-8-11-8Zm26 0c-5 0-9 3-11 8 5 0 9-3 11-8Z" />
        <path *ngSwitchCase="'flame'" d="M35 5c5 12-7 15 2 25 2-6 7-9 12-11-1 9 6 14 6 23 0 10-9 17-22 17S10 52 10 41c0-12 12-18 13-32 5 4 8 9 12 16 4-6 1-12 0-20Z" />
        <path *ngSwitchCase="'bolt'" d="M37 5 15 36h14l-3 23 23-34H35l2-20Z" />
        <path *ngSwitchCase="'split'" d="M13 13h14v14H13V13Zm24 0h14v14H37V13ZM13 37h14v14H13V37Zm24 0h14v14H37V37Zm-10-3h10v-4l9 7-9 7v-4H27v4l-9-7 9-7v4Z" />
        <path *ngSwitchCase="'pill'" d="M20 26h24c7 0 12 5 12 12s-5 12-12 12H20C13 50 8 45 8 38s5-12 12-12Zm0 7a5 5 0 0 0 0 10h12V33H20Zm18 0v10h6a5 5 0 0 0 0-10h-6Z" />
        <path *ngSwitchCase="'star'" d="m32 6 7 16 17 2-13 12 4 17-15-9-15 9 4-17L8 24l17-2 7-16Z" />
        <path *ngSwitchCase="'crown'" d="M12 22l11 8 9-15 9 15 11-8-4 27H16L12 22Zm10 21h20l1-9-7 5-4-8-4 8-7-5 1 9Z" />
        <path *ngSwitchCase="'orbit'" d="M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm0 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM8 39c3 8 18 10 33 5 14-5 23-15 20-23-1-3-4-5-8-6 2 6-5 15-17 19-12 4-24 3-28-3-1 3-1 6 0 8Z" />
        <path *ngSwitchDefault d="M32 7a25 25 0 1 0 0 50 25 25 0 0 0 0-50Zm0 9a16 16 0 1 1 0 32 16 16 0 0 1 0-32Zm0 7a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
      </svg>
    </span>
  `,
  styles: [`
    :host{display:inline-grid;place-items:center}
    .achievement-icon{width:100%;height:100%;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 50% 38%,rgba(0,246,255,.18),rgba(0,0,0,.34) 64%);box-shadow:0 0 16px rgba(0,246,255,.2),inset 0 0 16px rgba(255,255,255,.06)}
    svg{width:70%;height:70%;fill:var(--achievement-color,var(--secondary-glow));filter:drop-shadow(0 0 8px var(--achievement-color,var(--secondary-glow)))}
    .locked{filter:grayscale(.45) saturate(.58) brightness(.9);opacity:.86}
  `],
})
export class AchievementIconComponent {
  @Input() icon: AchievementIcon | string | null = 'chip';
  @Input() locked = false;
}
