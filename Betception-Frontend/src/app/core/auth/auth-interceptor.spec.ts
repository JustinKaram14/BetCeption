import {
  HttpClient as NgHttpClient,
  HttpContext,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Auth } from './auth';
import { authInterceptor, SKIP_AUTH } from './auth-interceptor';
import { TokenStorage } from './token-storage';

describe('authInterceptor', () => {
  let http: NgHttpClient;
  let httpController: HttpTestingController;
  let authMock: jasmine.SpyObj<Auth>;
  let mockToken: string | null;

  beforeEach(() => {
    mockToken = 'access-token';
    authMock = jasmine.createSpyObj<Auth>('Auth', ['refresh']);

    const tokenStorageMock: Partial<TokenStorage> = {
      setToken: jasmine.createSpy('setToken'),
      store: jasmine.createSpy('store'),
      clear: jasmine.createSpy('clear'),
      getUser: jasmine.createSpy('getUser').and.returnValue(null),
    };
    Object.defineProperty(tokenStorageMock, 'token', {
      get: () => mockToken,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: authMock },
        { provide: TokenStorage, useValue: tokenStorageMock },
      ],
    });

    http = TestBed.inject(NgHttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('adds a Bearer Authorization header when a token is present', () => {
    http.get('/api/data').subscribe();

    const req = httpController.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
    req.flush({});
  });

  it('does not add Authorization header when SKIP_AUTH context is set', () => {
    const context = new HttpContext().set(SKIP_AUTH, true);
    http.get('/api/data', { context }).subscribe();

    const req = httpController.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('does not add Authorization header when no token exists', () => {
    mockToken = null;
    http.get('/api/data').subscribe();

    const req = httpController.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('does not overwrite an existing Authorization header', () => {
    http.get('/api/data', { headers: { Authorization: 'Bearer custom' } }).subscribe();

    const req = httpController.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer custom');
    req.flush({});
  });

  it('retries the request with the refreshed token after a 401 response', () => {
    authMock.refresh.and.callFake(() => {
      mockToken = 'new-token';
      return of(null as any);
    });

    let result: unknown;
    http.get('/api/data').subscribe((r) => (result = r));

    const firstReq = httpController.expectOne('/api/data');
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer access-token');
    firstReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpController.expectOne('/api/data');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ data: 'ok' });

    expect(authMock.refresh).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: 'ok' });
  });

  it('propagates the error when refresh fails after a 401 response', () => {
    const refreshErr = new Error('Refresh failed');
    authMock.refresh.and.returnValue(throwError(() => refreshErr));

    let caughtError: unknown;
    http.get('/api/data').subscribe({ error: (e) => (caughtError = e) });

    const req = httpController.expectOne('/api/data');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.refresh).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(refreshErr);
  });

  it('propagates non-401 errors without attempting a refresh', () => {
    let caughtError: unknown;
    http.get('/api/data').subscribe({ error: (e) => (caughtError = e) });

    const req = httpController.expectOne('/api/data');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(authMock.refresh).not.toHaveBeenCalled();
    expect((caughtError as HttpErrorResponse).status).toBe(500);
  });

  it('does not apply 401 retry logic when the request had no token to begin with', () => {
    mockToken = null;

    let caughtError: unknown;
    http.get('/api/data').subscribe({ error: (e) => (caughtError = e) });

    const req = httpController.expectOne('/api/data');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.refresh).not.toHaveBeenCalled();
    expect((caughtError as HttpErrorResponse).status).toBe(401);
  });
});
