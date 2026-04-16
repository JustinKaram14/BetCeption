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
  {
    path: 'impressum',
    loadComponent: () =>
      import('./features/legal/impressum/impressum')
        .then(m => m.ImpressumComponent),
  },
  {
    path: 'datenschutz',
    loadComponent: () =>
      import('./features/legal/datenschutz/datenschutz')
        .then(m => m.DatenschutzComponent),
  },
  { path: '**', redirectTo: 'homepage' }
];
