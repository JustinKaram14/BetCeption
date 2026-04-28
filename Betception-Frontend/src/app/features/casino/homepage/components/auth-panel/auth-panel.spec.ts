import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AuthPanelComponent } from './auth-panel';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

describe('AuthPanelComponent', () => {
  let component: AuthPanelComponent;
  let fixture: ComponentFixture<AuthPanelComponent>;
  const toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['error']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthPanelComponent],
      providers: [{ provide: ToastService, useValue: toastMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPanelComponent);
    component = fixture.componentInstance;
    toastMock.error.calls.reset();
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
});
