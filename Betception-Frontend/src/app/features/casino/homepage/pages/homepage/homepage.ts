import { Component, DestroyRef, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeroComponent } from '../../components/hero/hero';
import { NeonCardComponent } from '../../components/neon-card/neon-card';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard';
import { AuthPanelComponent } from '../../components/auth-panel/auth-panel';
import { CtaPanelComponent } from '../../components/cta-panel/cta-panel';
import { AuthFacade } from '../../../../auth/services/auth-facade';
import { LoginRequest, RegisterRequest } from '../../../../../core/api/api.types';
import type { AuthUser } from '../../../../../core/api/api.types';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [NgIf, HeroComponent, NeonCardComponent, LeaderboardComponent, AuthPanelComponent, CtaPanelComponent],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class HomepageComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);

  authLoading = false;
  authSuccess: string | null = null;
  authError: string | null = null;

  onLogin(payload: LoginRequest) {
    this.runAuthRequest(
      this.authFacade.login(payload),
      (user) => `Willkommen zurück, ${user?.username ?? payload.email}!`,
    );
  }

  onRegister(payload: RegisterRequest) {
    this.runAuthRequest(
      this.authFacade
        .register(payload)
        .pipe(switchMap(() => this.authFacade.login({ email: payload.email, password: payload.password }))),
      (user) => `Account erstellt! Eingeloggt als ${user?.username ?? payload.username}.`,
    );
  }

  onEnter() { console.log('enter betception'); }
  onRewards() { console.log('daily rewards'); }

  private runAuthRequest(
    request$: Observable<AuthUser | null>,
    successMessage: (value: AuthUser | null) => string,
  ) {
    this.authLoading = true;
    this.authError = null;
    this.authSuccess = null;

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.authSuccess = successMessage(result);
        },
        error: (error) => {
          this.authError = this.extractErrorMessage(error);
          this.authLoading = false;
        },
        complete: () => {
          this.authLoading = false;
        },
      });
  }

  private extractErrorMessage(error: unknown) {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const payload = (error as any).error;
      if (typeof payload === 'string') {
        return payload;
      }
      if (payload && typeof payload === 'object' && 'message' in payload) {
        return String(payload.message);
      }
      if ('message' in (error as any)) {
        return String((error as any).message);
      }
    }
    return 'Aktion fehlgeschlagen. Bitte versuche es erneut.';
  }
}
