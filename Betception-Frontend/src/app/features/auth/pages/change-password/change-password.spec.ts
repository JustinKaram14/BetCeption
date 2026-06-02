import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ChangePassword } from './change-password';
import { AuthFacade } from '../../services/auth-facade';

function makeRoute(fragment: string | null) {
  return { snapshot: { fragment } };
}

describe('ChangePassword', () => {
  let component: ChangePassword;
  let fixture: ComponentFixture<ChangePassword>;
  let authFacadeMock: jasmine.SpyObj<AuthFacade>;

  async function setup(fragment: string | null) {
    localStorage.setItem('betception-language', 'de');
    authFacadeMock = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['confirmPasswordChange']);

    await TestBed.configureTestingModule({
      imports: [ChangePassword],
      providers: [
        { provide: ActivatedRoute, useValue: makeRoute(fragment) },
        { provide: AuthFacade, useValue: authFacadeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePassword);
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

  it('canSubmit is false until all three fields are filled', async () => {
    await setup('token=abc123');

    expect(component.canSubmit).toBeFalse();

    component.oldPassword = 'current';
    expect(component.canSubmit).toBeFalse();

    component.newPassword = 'newpass1';
    expect(component.canSubmit).toBeFalse();

    component.confirmPassword = 'newpass1';
    expect(component.canSubmit).toBeTrue();
  });

  it('sets an error message when the new passwords do not match', async () => {
    await setup('token=abc123');

    component.oldPassword = 'current';
    component.newPassword = 'newpass1';
    component.confirmPassword = 'different';

    component.submit();

    expect(component.state()).toBe('form');
    expect(component.errorMessage).toContain('stimmen nicht überein');
    expect(authFacadeMock.confirmPasswordChange).not.toHaveBeenCalled();
  });

  it('sets an error message when the new password is shorter than 8 characters', async () => {
    await setup('token=abc123');

    component.oldPassword = 'current';
    component.newPassword = 'short';
    component.confirmPassword = 'short';

    component.submit();

    expect(component.errorMessage).toBeTruthy();
    expect(authFacadeMock.confirmPasswordChange).not.toHaveBeenCalled();
  });

  it('calls confirmPasswordChange with token, oldPassword and newPassword on submit', async () => {
    await setup('token=mytoken42');
    authFacadeMock.confirmPasswordChange.and.returnValue(of({ message: 'ok' }));

    component.oldPassword = 'oldPassword1';
    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();

    expect(authFacadeMock.confirmPasswordChange).toHaveBeenCalledWith({
      token: 'mytoken42',
      oldPassword: 'oldPassword1',
      newPassword: 'newPassword1',
    });
  });

  it('transitions to the success state after a successful password change', async () => {
    await setup('token=mytoken42');
    authFacadeMock.confirmPasswordChange.and.returnValue(of({ message: 'ok' }));

    component.oldPassword = 'oldPassword1';
    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();
    fixture.detectChanges();

    expect(component.state()).toBe('success');
  });

  it('transitions to the expired state when the server returns TOKEN_EXPIRED', async () => {
    await setup('token=expiredtoken');
    authFacadeMock.confirmPasswordChange.and.returnValue(
      throwError(() => ({ error: { code: 'TOKEN_EXPIRED' } })),
    );

    component.oldPassword = 'oldPassword1';
    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();

    expect(component.state()).toBe('expired');
  });

  it('sets an error message and returns to form state when the old password is incorrect', async () => {
    await setup('token=mytoken42');
    authFacadeMock.confirmPasswordChange.and.returnValue(
      throwError(() => ({ error: { code: 'INVALID_OLD_PASSWORD' } })),
    );

    component.oldPassword = 'wrongOldPass';
    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();

    expect(component.state()).toBe('form');
    expect(component.errorMessage).toContain('Passwort ist falsch');
  });

  it('transitions to the error state for unexpected server errors', async () => {
    await setup('token=mytoken42');
    authFacadeMock.confirmPasswordChange.and.returnValue(
      throwError(() => ({ error: { code: 'SERVER_ERROR' } })),
    );

    component.oldPassword = 'oldPassword1';
    component.newPassword = 'newPassword1';
    component.confirmPassword = 'newPassword1';

    component.submit();

    expect(component.state()).toBe('error');
  });
});
