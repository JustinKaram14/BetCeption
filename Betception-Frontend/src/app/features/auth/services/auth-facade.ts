import { Injectable, inject } from '@angular/core';
import { LoginRequest, RegisterRequest } from '../../../core/api/api.types';
import { Auth } from '../../../core/auth/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly auth = inject(Auth);

  readonly user$ = this.auth.user$;
  readonly isAuthenticated$ = this.auth.isAuthenticated$;

  login(credentials: LoginRequest) {
    return this.auth.login(credentials);
  }

  register(payload: RegisterRequest) {
    return this.auth.register(payload);
  }

  verifyEmail(token: string) {
    return this.auth.verifyEmail(token);
  }

  resendVerification(email: string) {
    return this.auth.resendVerification(email);
  }

  requestPasswordChange() {
    return this.auth.requestPasswordChange();
  }

  confirmPasswordChange(payload: { token: string; oldPassword: string; newPassword: string }) {
    return this.auth.confirmPasswordChange(payload);
  }

  forgotPassword(email: string) {
    return this.auth.forgotPassword(email);
  }

  resetPassword(payload: { token: string; newPassword: string }) {
    return this.auth.resetPassword(payload);
  }

  refresh() {
    return this.auth.refresh();
  }

  logout() {
    return this.auth.logout();
  }

  getCurrentUser() {
    return this.auth.getCurrentUser();
  }

  isAuthenticated() {
    return this.auth.isAuthenticated();
  }
}
