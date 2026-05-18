import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { AuthPanelComponent } from './auth-panel';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { AuthFacade } from '../../../../auth/services/auth-facade';

describe('AuthPanelComponent', () => {
  let component: AuthPanelComponent;
  let fixture: ComponentFixture<AuthPanelComponent>;
  const toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['error']);
  const authFacadeMock = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['forgotPassword']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthPanelComponent],
      providers: [
        { provide: ToastService, useValue: toastMock },
        { provide: AuthFacade, useValue: authFacadeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPanelComponent);
    component = fixture.componentInstance;
    toastMock.error.calls.reset();
    authFacadeMock.forgotPassword.calls.reset();
    authFacadeMock.forgotPassword.and.returnValue(of({ message: 'ok' }));
    fixture.detectChanges();
  });

  it('switches to register via keyboard navigation and focuses the username field', fakeAsync(() => {
    component.email = 'neo@matrix.io';
    fixture.detectChanges();

    const loginTab: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="auth-tab-login"]');
    loginTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    tick();

    const registerTab: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="auth-tab-register"]');
    const usernameInput: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="auth-username-input"]');

    expect(component.tab).toBe('register');
    expect(registerTab.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(usernameInput);
  }));

  it('emits login credentials when the login form is submitted', () => {
    const loginSpy = spyOn(component.login, 'emit');

    component.email = 'neo@matrix.io';
    component.password = 'supersecret';
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(loginSpy).toHaveBeenCalledOnceWith({
      email: 'neo@matrix.io',
      password: 'supersecret',
    });
  });

  it('keeps the register submit button disabled until all fields are filled', fakeAsync(() => {
    const registerTab: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="auth-tab-register"]');
    registerTab.click();
    fixture.detectChanges();
    tick();

    const submitButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="auth-submit"]');

    component.email = 'trinity@matrix.io';
    component.password = 'supersecret';
    fixture.detectChanges();
    expect(submitButton.disabled).toBeTrue();

    component.username = 'trinity';
    fixture.detectChanges();
    expect(submitButton.disabled).toBeFalse();
  }));

  it('shows a toast and does not emit register data for an invalid username', fakeAsync(() => {
    const registerSpy = spyOn(component.register, 'emit');
    const registerTab: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="auth-tab-register"]');
    registerTab.click();
    fixture.detectChanges();
    tick();

    component.email = 'trinity@matrix.io';
    component.username = 'no';
    component.password = 'supersecret';

    component.submit();

    expect(registerSpy).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalled();
  }));

  it('shows a toast and does not emit register data for a glitch username', fakeAsync(() => {
    const registerSpy = spyOn(component.register, 'emit');
    const registerTab: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="auth-tab-register"]');
    registerTab.click();
    fixture.detectChanges();
    tick();

    component.email = 'trinity@matrix.io';
    component.username = 'T̵e̷s̶';
    component.password = 'supersecret';

    component.submit();

    expect(registerSpy).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalled();
  }));

  it('opens the forgot-password panel when the forgot-password link is clicked', () => {
    const forgotLink: HTMLButtonElement = fixture.nativeElement.querySelector('.forgot-link');
    forgotLink.click();
    fixture.detectChanges();

    expect(component.forgotMode).toBeTrue();
    const forgotPanel: HTMLElement = fixture.nativeElement.querySelector('.forgot-panel');
    expect(forgotPanel).toBeTruthy();
  });

  it('pre-fills the forgot-password email with the login email field value', () => {
    component.email = 'neo@matrix.io';
    fixture.detectChanges();

    const forgotLink: HTMLButtonElement = fixture.nativeElement.querySelector('.forgot-link');
    forgotLink.click();
    fixture.detectChanges();

    expect(component.forgotEmail).toBe('neo@matrix.io');
  });

  it('calls forgotPassword and shows the confirmation screen on successful submission', () => {
    component.openForgotPassword();
    component.forgotEmail = 'neo@matrix.io';
    fixture.detectChanges();

    component.submitForgotPassword();
    fixture.detectChanges();

    expect(authFacadeMock.forgotPassword).toHaveBeenCalledWith('neo@matrix.io');
    expect(component.forgotSubmitted).toBeTrue();
    const successEl: HTMLElement = fixture.nativeElement.querySelector('.forgot-success');
    expect(successEl).toBeTruthy();
  });

  it('shows the confirmation even when the forgotPassword request fails (anti-enumeration)', () => {
    authFacadeMock.forgotPassword.and.returnValue(throwError(() => new Error('not found')));
    component.openForgotPassword();
    component.forgotEmail = 'ghost@matrix.io';
    fixture.detectChanges();

    component.submitForgotPassword();
    fixture.detectChanges();

    expect(component.forgotSubmitted).toBeTrue();
  });

  it('shows a toast and does not submit when the forgot-password email is invalid', () => {
    component.openForgotPassword();
    component.forgotEmail = 'not-an-email';
    fixture.detectChanges();

    component.submitForgotPassword();

    expect(authFacadeMock.forgotPassword).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalled();
  });

  it('returns to the login panel when the back button is clicked in forgot mode', () => {
    component.openForgotPassword();
    fixture.detectChanges();

    const backButton: HTMLButtonElement = fixture.nativeElement.querySelector('.forgot-back');
    backButton.click();
    fixture.detectChanges();

    expect(component.forgotMode).toBeFalse();
    const loginForm: HTMLElement = fixture.nativeElement.querySelector('.auth-form');
    expect(loginForm).toBeTruthy();
  });
});
