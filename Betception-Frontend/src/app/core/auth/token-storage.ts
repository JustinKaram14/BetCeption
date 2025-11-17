import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUser } from '../api/api.types';

const STORAGE_KEY = 'betception.access_token';

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
    this.tokenSubject = new BehaviorSubject<string | null>(
      this.readInitialToken(),
    );
    this.token$ = this.tokenSubject.asObservable();
    this.user$ = this.token$.pipe(map((token) => this.decode(token)));
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  setToken(token: string | null) {
    const normalized = token?.trim() || null;
    this.persist(normalized);
  }

  store(token: string) {
    this.persist(token);
  }

  clear() {
    this.persist(null);
  }

  getUser(): AuthUser | null {
    return this.decode(this.tokenSubject.value);
  }

  decodeToken(token: string): AuthUser | null {
    return this.decode(token);
  }

  private persist(token: string | null) {
    if (this.isBrowser) {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    this.tokenSubject.next(token);
  }

  private readInitialToken() {
    if (!this.isBrowser) {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && stored.trim().length > 0 ? stored : null;
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
