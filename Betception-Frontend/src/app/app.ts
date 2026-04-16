import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DisclaimerFooterComponent } from './shared/ui/disclaimer-footer/disclaimer-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DisclaimerFooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Betception-Frontend');
}
