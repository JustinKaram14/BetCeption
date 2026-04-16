import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
  {
    path: 'homepage',
    loadComponent: () =>
      import('./features/casino/homepage/pages/homepage/homepage')
        .then(m => m.HomepageComponent) // ggf. auf deinen Klassennamen anpassen
  },
  {
    path: 'blackjack',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/casino/blackjack/pages/blackjack/blackjack')
        .then(m => m.Blackjack),
  },
  { path: '**', redirectTo: 'homepage' }
];
