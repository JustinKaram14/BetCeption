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

  entries = [
    { rank: 1, player: 'CYB3R_GH0ST', bestWin: 150000, depth: 70 },
    { rank: 2, player: 'N30N_N1NJA', bestWin: 125000, depth: 60 },
    { rank: 3, player: 'DataWraith', bestWin: 110000, depth: 80 },
    { rank: 4, player: 'GlitchQueen', bestWin: 98000, depth: 50 },
    { rank: 5, player: 'V010_WALK3R', bestWin: 92500, depth: 70 },
    { rank: 6, player: 'BinaryBard', bestWin: 85000, depth: 40 },
    { rank: 7, player: 'SyntaxSorcerer', bestWin: 81000, depth: 60 },
    { rank: 8, player: 'MegaPixel', bestWin: 76000, depth: 50 },
    { rank: 9, player: 'CircuitSiren', bestWin: 71500, depth: 50 },
    { rank:10, player: 'PacketPharaoh', bestWin: 68000, depth: 40 },
  ];

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
