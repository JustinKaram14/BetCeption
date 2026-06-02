import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ResetPassword } from './reset-password';
import { AuthFacade } from '../../services/auth-facade';

function makeRoute(fragment: string | null) {
  return { snapshot: { fragment } };
}

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let authFacadeMock: jasmine.SpyObj<AuthFacade>;

  async function setup(fragment: string | null) {
    localStorage.setItem('betception-language', 'de');
    authFacadeMock = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['resetPassword']);

    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        { provide: ActivatedRoute, useValue: makeRoute(fragment) },
        { provide: AuthFacade, useValue: authFacadeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => fixture?.destroy());

  it('enters the error state immediately when no token is present in the URL fragment', async () => {
    await setup(null);

    expect(component.state()).toBe('error');
  });

  it('enters the error state when the fragment contains no token parameter', async () => {
    await setup('other=abc');

    expect(component.state()).toBe('error');
  });

  it('stays in the form state when a token is present in the URL fragment', async () => {
    await setup('token=abc123');

    expect(component.state()).toBe('form');
  });

  it('canSubmit is false until both password fields have at least 8 characters', async () => {
    await setup('token=abc123');

    expect(component.canSubmit).toBeFalse();

    component.newPassword = 'newpass1';
    expect(component.canSubmit).toBeFalse();

    component.confirmPassword = 'newpass1';
    expect(component.canSubmit).toBeTrue();
  });

  it('sets an error message when the passwords do not match', async () => {
    await setup('token=abc123');

    component.newPassword = 'newpass1';
    component.confirmPassword = 'different';

    component.submit();

    expect(component.state()).toBe('form');
    expect(component.errorMessage).toContain('stimmen nicht überein');
    expect(authFacadeMock.resetPassword).not.toHaveBeenCalled();
  });

  it('sets an error message when the password is shorter than 8 characters', async () => {
    await setup('token=abc123');

    component.newPassword = 'short';
    component.confirmPassword = 'short';

    component.submit();

    expect(component.errorMessage).toBeTruthy();
    expect(authFacadeMock.resetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword with the token and new password on submit', async () => {
    await setup('token=mytoken42');
    authFacadeMock.resetPassword.and.returnValue(of({ message: 'ok' }));

    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();

    expect(authFacadeMock.resetPassword).toHaveBeenCalledWith({
      token: 'mytoken42',
      newPassword: 'newPassword1',
    });
  });

  it('transitions to the success state after a successful password reset', async () => {
    await setup('token=mytoken42');
    authFacadeMock.resetPassword.and.returnValue(of({ message: 'ok' }));

    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();
    fixture.detectChanges();

    expect(component.state()).toBe('success');
  });

  it('transitions to the expired state when the server returns TOKEN_EXPIRED', async () => {
    await setup('token=expiredtoken');
    authFacadeMock.resetPassword.and.returnValue(
      throwError(() => ({ error: { code: 'TOKEN_EXPIRED' } })),
    );

    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();

    expect(component.state()).toBe('expired');
  });

  it('transitions to the error state for unexpected server errors', async () => {
    await setup('token=mytoken42');
    authFacadeMock.resetPassword.and.returnValue(
      throwError(() => ({ error: { code: 'SERVER_ERROR' } })),
    );

    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();

    expect(component.state()).toBe('error');
  });
});
