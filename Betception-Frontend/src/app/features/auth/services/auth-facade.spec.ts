import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthFacade } from './auth-facade';
import { Auth } from '../../../core/auth/auth';

describe('AuthFacade', () => {
  let service: AuthFacade;
  const authMock = jasmine.createSpyObj<Auth>(
    'Auth',
    [
      'login', 'register', 'refresh', 'logout', 'getCurrentUser', 'isAuthenticated',
      'verifyEmail', 'resendVerification',
      'requestPasswordChange', 'confirmPasswordChange', 'forgotPassword', 'resetPassword',
    ],
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

  it('login delegates to auth.login', () => {
    authMock.login.and.returnValue(of(null));
    service.login({ email: 'a@b.com', password: 'pass' }).subscribe();
    expect(authMock.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' });
  });

  it('register delegates to auth.register', () => {
    authMock.register.and.returnValue(of({ message: 'ok' }));
    service.register({ email: 'a@b.com', password: 'pass', username: 'tester' }).subscribe();
    expect(authMock.register).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
      username: 'tester',
    });
  });

  it('logout delegates to auth.logout', () => {
    service.logout().subscribe();
    expect(authMock.logout).toHaveBeenCalled();
  });

  it('isAuthenticated delegates to auth.isAuthenticated', () => {
    authMock.isAuthenticated.and.returnValue(true);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('exposes user$ from auth', (done) => {
    service.user$.subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
  });

  it('requestPasswordChange delegates to auth.requestPasswordChange', () => {
    authMock.requestPasswordChange.and.returnValue(of({ message: 'ok' }));
    service.requestPasswordChange().subscribe();
    expect(authMock.requestPasswordChange).toHaveBeenCalled();
  });

  it('confirmPasswordChange delegates to auth.confirmPasswordChange', () => {
    const payload = { token: 'tok', oldPassword: 'oldpass', newPassword: 'newpass1' };
    authMock.confirmPasswordChange.and.returnValue(of({ message: 'ok' }));
    service.confirmPasswordChange(payload).subscribe();
    expect(authMock.confirmPasswordChange).toHaveBeenCalledWith(payload);
  });

  it('forgotPassword delegates to auth.forgotPassword', () => {
    authMock.forgotPassword.and.returnValue(of({ message: 'ok' }));
    service.forgotPassword('user@example.com').subscribe();
    expect(authMock.forgotPassword).toHaveBeenCalledWith('user@example.com');
  });

  it('resetPassword delegates to auth.resetPassword', () => {
    const payload = { token: 'tok', newPassword: 'newpass1' };
    authMock.resetPassword.and.returnValue(of({ message: 'ok' }));
    service.resetPassword(payload).subscribe();
    expect(authMock.resetPassword).toHaveBeenCalledWith(payload);
  });
});
