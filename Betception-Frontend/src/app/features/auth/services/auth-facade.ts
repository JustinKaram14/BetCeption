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
