// src/app/features/homepage/components/auth-panel/auth-panel.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { LoginRequest, RegisterRequest } from '../../../../../core/api/api.types';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './auth-panel.html',
  styleUrls: ['./auth-panel.css']
})
export class AuthPanelComponent {
  tab: 'login' | 'register' = 'login';
  email = '';
  username = '';
  password = '';
  validationError: string | null = null;

  @Output() login = new EventEmitter<LoginRequest>();
  @Output() register = new EventEmitter<RegisterRequest>();

  onTabChange(tab: 'login' | 'register') {
    this.tab = tab;
    this.validationError = null;
  }

  submit() {
    this.validationError = null;
    const email = this.email.trim();
    const password = this.password;

    if (!email || !this.isValidEmail(email)) {
      this.validationError = 'Bitte eine gültige E-Mail-Adresse eingeben.';
      return;
    }
    if (password.length < 8) {
      this.validationError = 'Passwort muss mindestens 8 Zeichen lang sein.';
      return;
    }

    if (this.tab === 'login') {
      this.login.emit({ email, password });
      return;
    }

    const username = this.username.trim();
    if (username.length < 3 || username.length > 32) {
      this.validationError = 'Benutzername muss 3–32 Zeichen lang sein.';
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
