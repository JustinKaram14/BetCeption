// src/app/features/homepage/components/auth-panel/auth-panel.ts
import { Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { LoginRequest, RegisterRequest } from '../../../../../core/api/api.types';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { I18n } from '../../../../../core/i18n/i18n';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './auth-panel.html',
  styleUrls: ['./auth-panel.css']
})
export class AuthPanelComponent {
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18n);

  @ViewChild('loginTabButton') private loginTabButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('registerTabButton') private registerTabButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('emailField') private emailField?: ElementRef<HTMLInputElement>;
  @ViewChild('usernameField') private usernameField?: ElementRef<HTMLInputElement>;

  tab: 'login' | 'register' = 'login';
  email = '';
  username = '';
  password = '';

  @Output() login = new EventEmitter<LoginRequest>();
  @Output() register = new EventEmitter<RegisterRequest>();

  onTabChange(tab: 'login' | 'register') {
    this.tab = tab;
    window.setTimeout(() => this.focusActiveField());
  }

  onTabKeydown(event: KeyboardEvent, currentTab: 'login' | 'register') {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') {
      return;
    }

    event.preventDefault();

    const nextTab =
      event.key === 'ArrowLeft' || event.key === 'Home'
        ? 'login'
        : event.key === 'ArrowRight' || event.key === 'End'
          ? 'register'
          : currentTab;

    this.tab = nextTab;
    window.setTimeout(() => {
      this.focusTabButton(nextTab);
      this.focusActiveField();
    });
  }

  submit() {
    const email = this.email.trim();
    const password = this.password;

    if (!email || !this.isValidEmail(email)) {
      this.toast.error(this.i18n.t('auth.emailInvalid'));
      return;
    }
    if (password.length < 8) {
      this.toast.error(this.i18n.t('auth.passwordTooShort'));
      return;
    }

    if (this.tab === 'login') {
      this.login.emit({ email, password });
      return;
    }

    const username = this.username.trim();
    if (username.length < 3 || username.length > 32) {
      this.toast.error(this.i18n.t('auth.usernameInvalid'));
      return;
    }
    this.register.emit({ email, username, password });
  }

  canSubmit() {
    const emailValid = this.email.trim().length > 0;
    const passwordValid = this.password.length > 0;
    if (this.tab === 'login') {
      return emailValid && passwordValid;
    }
    return emailValid && passwordValid && this.username.trim().length > 0;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private focusActiveField() {
    const target =
      this.tab === 'register' && this.email.trim().length > 0
        ? this.usernameField?.nativeElement
        : this.emailField?.nativeElement;

    target?.focus();
  }

  private focusTabButton(tab: 'login' | 'register') {
    const button =
      tab === 'login'
        ? this.loginTabButton?.nativeElement
        : this.registerTabButton?.nativeElement;

    button?.focus();
  }
}
