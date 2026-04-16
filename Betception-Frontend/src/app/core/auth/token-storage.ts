import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUser } from '../api/api.types';

@Injectable({
  providedIn: 'root',
})
export class TokenStorage {
  private readonly isBrowser: boolean;
  private readonly tokenSubject: BehaviorSubject<string | null>;
  readonly token$: Observable<string | null>;
  readonly user$: Observable<AuthUser | null>;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Access token lives in memory only — never persisted to localStorage/sessionStorage.
    // On page reload the token is intentionally gone; the authGuard performs a silent
    // refresh via the HttpOnly refresh-cookie which the browser sends automatically.
    this.tokenSubject = new BehaviorSubject<string | null>(null);
    this.token$ = this.tokenSubject.asObservable();
    this.user$ = this.token$.pipe(map((token) => this.decode(token)));
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  setToken(token: string | null) {
    const normalized = token?.trim() || null;
    this.tokenSubject.next(normalized);
  }

  store(token: string) {
    this.tokenSubject.next(token);
  }

  clear() {
    this.tokenSubject.next(null);
  }

  getUser(): AuthUser | null {
    return this.decode(this.tokenSubject.value);
  }

  decodeToken(token: string): AuthUser | null {
    return this.decode(token);
  }

  private decode(rawToken: string | null): AuthUser | null {
    if (!rawToken) {
      return null;
    }
    try {
      const payload = rawToken.split('.')[1];
      if (!payload) {
        return null;
      }
      const result = this.decodeBase64Url(payload);
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  private decodeBase64Url(segment: string) {
    let normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4;
    if (pad) {
      normalized += '='.repeat(4 - pad);
    }
    return atob(normalized);
  }
}
