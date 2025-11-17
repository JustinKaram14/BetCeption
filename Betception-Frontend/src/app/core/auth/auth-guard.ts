import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Auth } from './auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return auth.refresh().pipe(
    map(() => true),
    catchError(() =>
      of(
        router.createUrlTree(['/auth/login'], {
          queryParams: { redirect: state.url },
        }),
      ),
    ),
  );
};
