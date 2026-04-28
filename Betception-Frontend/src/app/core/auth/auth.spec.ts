import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { Auth } from './auth';
import { HttpClient } from '../api/http-client';
import { TokenStorage } from './token-storage';
import { AuthUser } from '../api/api.types';

describe('Auth', () => {
  let service: Auth;
  let httpMock: jasmine.SpyObj<HttpClient>;
  let tokenStorageMock: jasmine.SpyObj<TokenStorage>;

  const mockUser: AuthUser = { sub: 'u1', email: 'a@b.com', username: 'tester' };

  beforeEach(() => {
    httpMock = jasmine.createSpyObj<HttpClient>('HttpClient', [
      'get',
      'post',
      'put',
      'patch',
      'delete',
    ]);
    tokenStorageMock = jasmine.createSpyObj<TokenStorage>(
      'TokenStorage',
      ['setToken', 'store', 'clear', 'getUser'],
      { token$: of(null), user$: of(null) },
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: TokenStorage, useValue: tokenStorageMock },
      ],
    });

    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('calls POST /auth/login, stores the token, and returns the current user', () => {
      httpMock.post.and.returnValue(of({ accessToken: 'tok123' }));
      tokenStorageMock.getUser.and.returnValue(mockUser);

      let result: AuthUser | null | undefined;
      service.login({ email: 'a@b.com', password: 'pass' }).subscribe((u) => (result = u));

      expect(httpMock.post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'a@b.com', password: 'pass' },
        jasmine.anything(),
      );
      expect(tokenStorageMock.setToken).toHaveBeenCalledWith('tok123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('calls POST /auth/register with the payload', () => {
      httpMock.post.and.returnValue(of({ message: 'ok' }));

      service
        .register({ email: 'a@b.com', password: 'pass', username: 'tester' })
        .subscribe();

      expect(httpMock.post).toHaveBeenCalledWith(
        '/auth/register',
        { email: 'a@b.com', password: 'pass', username: 'tester' },
        jasmine.anything(),
      );
    });
  });

  describe('logout', () => {
    it('calls POST /auth/logout and clears the session', () => {
      httpMock.post.and.returnValue(of(undefined));

      service.logout().subscribe();

      expect(httpMock.post).toHaveBeenCalledWith(
        '/auth/logout',
        undefined,
        jasmine.anything(),
      );
      expect(tokenStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when a user is stored in token storage', () => {
      tokenStorageMock.getUser.and.returnValue(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('returns false when no user is stored', () => {
      tokenStorageMock.getUser.and.returnValue(null);
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('refresh', () => {
    it('calls POST /auth/refresh, stores the new token, and emits the current user', () => {
      httpMock.post.and.returnValue(of({ accessToken: 'new-tok' }));
      tokenStorageMock.getUser.and.returnValue(mockUser);

      let result: AuthUser | null | undefined;
      service.refresh().subscribe((u) => (result = u));

      expect(httpMock.post).toHaveBeenCalledWith(
        '/auth/refresh',
        undefined,
        jasmine.anything(),
      );
      expect(tokenStorageMock.setToken).toHaveBeenCalledWith('new-tok');
      expect(result).toEqual(mockUser);
    });

    it('clears the session and re-throws when refresh fails', () => {
      const err = new Error('Unauthorized');
      httpMock.post.and.returnValue(throwError(() => err));

      let caughtError: unknown;
      service.refresh().subscribe({ error: (e) => (caughtError = e) });

      expect(tokenStorageMock.clear).toHaveBeenCalled();
      expect(caughtError).toBe(err);
    });

    it('deduplicates concurrent calls — only one HTTP request is made', () => {
      const subject = new Subject<{ accessToken: string }>();
      httpMock.post.and.returnValue(subject.asObservable());
      tokenStorageMock.getUser.and.returnValue(mockUser);

      const ref1 = service.refresh();
      const ref2 = service.refresh();

      expect(ref1).withContext('both calls must return the same observable').toBe(ref2);
      expect(httpMock.post).toHaveBeenCalledTimes(1);

      const results: (AuthUser | null)[] = [];
      ref1.subscribe((v) => results.push(v));
      ref2.subscribe((v) => results.push(v));

      subject.next({ accessToken: 'shared-token' });
      subject.complete();

      expect(results.length)
        .withContext('both subscribers must receive the value')
        .toBe(2);
    });

    it('clears the in-progress flag after completion so subsequent calls re-fetch', () => {
      httpMock.post.and.returnValue(of({ accessToken: 'tok' }));
      tokenStorageMock.getUser.and.returnValue(null);

      service.refresh().subscribe();
      expect(httpMock.post).toHaveBeenCalledTimes(1);

      service.refresh().subscribe();
      expect(httpMock.post)
        .withContext('second call after completion must issue a new request')
        .toHaveBeenCalledTimes(2);
    });

    it('clears the in-progress flag after an error so subsequent calls re-fetch', () => {
      httpMock.post.and.returnValue(throwError(() => new Error('fail')));

      service.refresh().subscribe({ error: () => {} });
      expect(httpMock.post).toHaveBeenCalledTimes(1);

      httpMock.post.and.returnValue(of({ accessToken: 'tok' }));
      tokenStorageMock.getUser.and.returnValue(null);
      service.refresh().subscribe();
      expect(httpMock.post)
        .withContext('second call after error must issue a new request')
        .toHaveBeenCalledTimes(2);
    });
  });
});
