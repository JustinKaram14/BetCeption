import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { authGuard } from './auth-guard';
import { Auth } from './auth';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authMock: jasmine.SpyObj<Auth>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const stateAt = (url: string) => ({ url } as RouterStateSnapshot);

  beforeEach(() => {
    authMock = jasmine.createSpyObj<Auth>('Auth', ['isAuthenticated', 'refresh']);
    routerMock = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('returns true immediately when the user is already authenticated', () => {
    authMock.isAuthenticated.and.returnValue(true);

    const result = executeGuard(mockRoute, stateAt('/casino'));

    expect(result).toBeTrue();
    expect(authMock.refresh).not.toHaveBeenCalled();
  });

  it('returns true when not authenticated but silent refresh succeeds', (done) => {
    authMock.isAuthenticated.and.returnValue(false);
    authMock.refresh.and.returnValue(of(null));

    (executeGuard(mockRoute, stateAt('/casino')) as Observable<boolean>).subscribe((value) => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('redirects to /homepage with a redirect query param when refresh fails', (done) => {
    authMock.isAuthenticated.and.returnValue(false);
    authMock.refresh.and.returnValue(throwError(() => new Error('Unauthorized')));

    const fakeTree = {} as UrlTree;
    routerMock.createUrlTree.and.returnValue(fakeTree);

    (
      executeGuard(mockRoute, stateAt('/casino/blackjack')) as Observable<UrlTree>
    ).subscribe((value) => {
      expect(value).toBe(fakeTree);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/homepage'], {
        queryParams: { redirect: '/casino/blackjack' },
      });
      done();
    });
  });
});
