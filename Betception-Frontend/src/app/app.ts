import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Betception-Frontend');

  constructor() {
    if (typeof navigator === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor;
    const isSafari = /Safari/i.test(userAgent)
      && /Apple/i.test(vendor)
      && !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android)/i.test(userAgent);

    if (isSafari) {
      document.documentElement.classList.add('is-safari');
    }
  }
}
