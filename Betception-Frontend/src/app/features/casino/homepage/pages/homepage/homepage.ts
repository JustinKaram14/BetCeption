import { Component, DestroyRef, inject } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HeroComponent } from '../../components/hero/hero';
import { NeonCardComponent } from '../../components/neon-card/neon-card';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard';
import { AuthPanelComponent } from '../../components/auth-panel/auth-panel';
import { CtaPanelComponent } from '../../components/cta-panel/cta-panel';
import { DailyRewardModalComponent, DailyRewardState } from '../../components/daily-reward-modal/daily-reward-modal';
import { HowToPlayModalComponent } from '../../components/how-to-play-modal/how-to-play-modal';
import { DisclaimerFooterComponent } from '../../../../../shared/ui/disclaimer-footer/disclaimer-footer';
import { ToastContainerComponent } from '../../../../../shared/ui/toast/toast-container';
import { SettingsMenuComponent } from '../../../../../shared/ui/settings-menu/settings-menu';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { AuthFacade } from '../../../../auth/services/auth-facade';
import { Wallet } from '../../../../../core/services/wallet/wallet';
import { I18n } from '../../../../../core/i18n/i18n';
import { LoginRequest, RegisterRequest } from '../../../../../core/api/api.types';
import type { AuthUser } from '../../../../../core/api/api.types';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [NgIf, AsyncPipe, HeroComponent, NeonCardComponent, LeaderboardComponent, AuthPanelComponent, CtaPanelComponent, DailyRewardModalComponent, HowToPlayModalComponent, DisclaimerFooterComponent, ToastContainerComponent, SettingsMenuComponent],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class HomepageComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly wallet = inject(Wallet);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18n);

  readonly isAuthenticated$ = this.authFacade.isAuthenticated$;
  readonly user$ = this.authFacade.user$;

  authLoading = false;
  showRewardModal = false;
  showHowToPlayModal = false;
  rewardState: DailyRewardState = { kind: 'loading' };

  onLogin(payload: LoginRequest) {
    this.runAuthRequest(
      this.authFacade.login(payload),
      (user) => this.i18n.t('home.toast.welcomeBack', { name: user?.username ?? payload.email }),
    );
  }

  onRegister(payload: RegisterRequest) {
    this.runAuthRequest(
      this.authFacade
        .register(payload)
        .pipe(switchMap(() => this.authFacade.login({ email: payload.email, password: payload.password }))),
      (user) => this.i18n.t('home.toast.accountCreated', { name: user?.username ?? payload.username }),
    );
  }

  onLogout() {
    this.authFacade.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
        },
      });
  }

  onEnter() {
    if (this.authFacade.isAuthenticated()) {
      this.router.navigate(['/blackjack']);
      return;
    }
    this.toast.error(this.i18n.t('home.toast.loginRequiredPlay'));
  }
  onRewards() {
    if (!this.authFacade.isAuthenticated()) {
      this.toast.error(this.i18n.t('home.toast.loginRequiredReward'));
      return;
    }

    this.rewardState = { kind: 'loading' };
    this.showRewardModal = true;

    this.wallet.claimDailyReward()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.rewardState = {
            kind: 'success',
            claimedAmount: res.claimedAmount,
            balance: res.balance,
            eligibleAt: res.eligibleAt,
          };
        },
        error: (err) => {
          const status = err?.status;
          if (status === 409) {
            const eligibleAt = err?.error?.eligibleAt ?? new Date().toISOString();
            this.rewardState = { kind: 'already-claimed', eligibleAt };
          } else {
            const message = err?.error?.message ?? this.i18n.t('home.toast.unknownError');
            this.toast.error(message);
            this.showRewardModal = false;
          }
        },
      });
  }

  closeRewardModal() {
    this.showRewardModal = false;
  }

  openHowToPlay() {
    this.showHowToPlayModal = true;
  }

  closeHowToPlay() {
    this.showHowToPlayModal = false;
  }

  private runAuthRequest(
    request$: Observable<AuthUser | null>,
    successMessage: (value: AuthUser | null) => string,
  ) {
    this.authLoading = true;

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.toast.success(successMessage(result));
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
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
    return this.i18n.t('home.toast.actionFailed');
  }
}
