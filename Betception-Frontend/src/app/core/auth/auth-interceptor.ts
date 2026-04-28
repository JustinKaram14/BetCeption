import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Auth } from './auth';
import { TokenStorage } from './token-storage';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorage);
  const auth = inject(Auth);

  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const token = tokenStorage.token;
  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  const authorized = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authorized).pipe(
    catchError((error) => {
      if (error?.status !== 401) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        switchMap(() => {
          const newToken = tokenStorage.token;
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retried);
        }),
      );
    }),
  );
};
