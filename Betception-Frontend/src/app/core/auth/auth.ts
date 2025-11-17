import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import {
  AuthTokens,
  AuthUser,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
} from '../api/api.types';
import { HttpClient } from '../api/http-client';
import { SKIP_AUTH } from './auth-interceptor';
import { TokenStorage } from './token-storage';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorage);

  readonly token$ = this.tokenStorage.token$;
  readonly user$ = this.tokenStorage.user$;
  readonly isAuthenticated$ = this.user$.pipe(map((user) => !!user));

  register(payload: RegisterRequest) {
    return this.http.post<MessageResponse>('/auth/register', payload, {
      context: this.skipAuth(),
    });
  }

  login(credentials: LoginRequest) {
    return this.http
      .post<AuthTokens>('/auth/login', credentials, {
        context: this.skipAuth(),
      })
      .pipe(
        tap(({ accessToken }) => this.setSession(accessToken)),
        map(() => this.getCurrentUser()),
      );
  }

  refresh() {
    return this.http
      .post<AuthTokens>('/auth/refresh', undefined, {
        context: this.skipAuth(),
      })
      .pipe(
        tap(({ accessToken }) => this.setSession(accessToken)),
        map(() => this.getCurrentUser()),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        }),
      );
  }

  logout() {
    return this.http
      .post<void>('/auth/logout', undefined, {
        context: this.skipAuth(),
      })
      .pipe(
        finalize(() => this.clearSession()),
        map(() => void 0),
      );
  }

  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  getCurrentUser(): AuthUser | null {
    return this.tokenStorage.getUser();
  }

  private setSession(accessToken: string) {
    this.tokenStorage.setToken(accessToken);
  }

  private clearSession() {
    this.tokenStorage.clear();
  }

  private skipAuth() {
    return new HttpContext().set(SKIP_AUTH, true);
  }
}
