import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
  {
    path: 'homepage',
    loadComponent: () =>
      import('./features/casino/homepage/pages/homepage/homepage')
        .then(m => m.HomepageComponent) // ggf. auf deinen Klassennamen anpassen
  },
  { path: '**', redirectTo: 'homepage' }
];
