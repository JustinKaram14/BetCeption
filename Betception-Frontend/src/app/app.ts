import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DisclaimerFooterComponent } from './shared/ui/disclaimer-footer/disclaimer-footer';
import { Auth } from './core/auth/auth';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DisclaimerFooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Betception-Frontend');
  private readonly auth = inject(Auth);

  ngOnInit() {
    // Restore session from HttpOnly refresh cookie on every page load.
    // Errors are ignored — user simply stays unauthenticated if no valid cookie exists.
    this.auth.refresh().subscribe({ error: () => {} });
  }
}
