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
  tab:'login'|'register' = 'login';
  email = '';
  username = '';
  password = '';
  @Output() login = new EventEmitter<LoginRequest>();
  @Output() register = new EventEmitter<RegisterRequest>();

  submit(){
    const email = this.email.trim();
    const password = this.password;
    if (!email || !password) {
      return;
    }

    if (this.tab === 'login') {
      this.login.emit({ email, password });
      return;
    }

    const username = this.username.trim();
    if (!username) {
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
    const usernameValid = this.username.trim().length > 0;
    return emailValid && passwordValid && usernameValid;
  }
}
