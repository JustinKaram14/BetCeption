import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthFacade } from './auth-facade';
import { Auth } from '../../../core/auth/auth';

describe('AuthFacade', () => {
  let service: AuthFacade;
  const authMock = jasmine.createSpyObj<Auth>(
    'Auth',
    ['login', 'register', 'refresh', 'logout', 'getCurrentUser', 'isAuthenticated'],
    {
      user$: of(null),
      isAuthenticated$: of(false),
    },
  );

  beforeEach(() => {
    authMock.logout.and.returnValue(of(undefined));
    authMock.getCurrentUser.and.returnValue(null);
    authMock.isAuthenticated.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [{ provide: Auth, useValue: authMock }],
    });

    service = TestBed.inject(AuthFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
