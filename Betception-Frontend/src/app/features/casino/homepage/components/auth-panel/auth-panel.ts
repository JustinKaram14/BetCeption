// src/app/features/homepage/components/auth-panel/auth-panel.ts
import { Component, EventEmitter, Output, inject } from '@angular/core';
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

  tab: 'login' | 'register' = 'login';
  email = '';
  username = '';
  password = '';

  @Output() login = new EventEmitter<LoginRequest>();
  @Output() register = new EventEmitter<RegisterRequest>();

  onTabChange(tab: 'login' | 'register') {
    this.tab = tab;
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
}
