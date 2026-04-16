import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-disclaimer-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './disclaimer-footer.html',
  styleUrl: './disclaimer-footer.css',
})
export class DisclaimerFooterComponent {
  readonly year = new Date().getFullYear();
}
