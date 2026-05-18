import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HeroComponent } from '../../components/hero/hero';
import { NeonCardComponent } from '../../components/neon-card/neon-card';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard';
import { AuthPanelComponent } from '../../components/auth-panel/auth-panel';
import { CtaPanelComponent } from '../../components/cta-panel/cta-panel';
import { DailyRewardModalComponent } from '../../components/daily-reward-modal/daily-reward-modal';
import { HowToPlayModalComponent } from '../../components/how-to-play-modal/how-to-play-modal';
import { ProfileModalComponent } from '../../components/profile-modal/profile-modal';
import { DisclaimerFooterComponent } from '../../../../../shared/ui/disclaimer-footer/disclaimer-footer';
import { ToastContainerComponent } from '../../../../../shared/ui/toast/toast-container';
import { SettingsMenuComponent } from '../../../../../shared/ui/settings-menu/settings-menu';
import { LevelProgressComponent } from '../../../../../shared/ui/level-progress/level-progress';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { AuthFacade } from '../../../../auth/services/auth-facade';
import { Wallet } from '../../../../../core/services/wallet/wallet';
import { I18n } from '../../../../../core/i18n/i18n';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { CrateNotifications } from '../../../../../core/services/crate-notifications/crate-notifications';
import { LoginRequest, RegisterRequest, WalletSummary } from '../../../../../core/api/api.types';
import type { AuthUser } from '../../../../../core/api/api.types';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [NgIf, AsyncPipe, HeroComponent, NeonCardComponent, LeaderboardComponent, AuthPanelComponent, CtaPanelComponent, DailyRewardModalComponent, HowToPlayModalComponent, ProfileModalComponent, DisclaimerFooterComponent, ToastContainerComponent, SettingsMenuComponent, LevelProgressComponent],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class HomepageComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly wallet = inject(Wallet);
  private readonly api = inject(BetceptionApi);
  private readonly crateNotifications = inject(CrateNotifications);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18n);

  readonly isAuthenticated$ = this.authFacade.isAuthenticated$;
  readonly user$ = this.authFacade.user$;

  get isNarrow(): boolean {
    return window.outerWidth <= 900;
  }

  get profileButtonLabel(): string {
    return this.i18n.t('profile.title');
  }

  @HostListener('window:resize')
  onWindowResize(): void { /* triggers change detection so isNarrow getter re-evaluates */ }

  authLoading = false;
  showRewardModal = false;
  showHowToPlayModal = false;
  showProfileModal = false;
  showVerifyEmailModal = false;
  verifyEmailAddress = '';
  walletSummary: WalletSummary | null = null;
  unseenCrateCount = 0;
  private currentUserIdValue: string | null = null;

  constructor() {
    this.isAuthenticated$
      .pipe(
        switchMap((isAuthenticated) =>
          isAuthenticated
            ? this.wallet.getSummary().pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((summary) => {
        this.walletSummary = summary;
      });

    this.user$
      .pipe(
        switchMap((user) =>
          {
            this.currentUserIdValue = user?.sub ?? null;
            return user?.sub
              ? this.api.listCrates().pipe(catchError(() => of({ items: [] })))
              : of({ items: [] });
          }
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.unseenCrateCount = this.crateNotifications.unseenUnopenedCount(
          this.currentUserId,
          response.items,
        );
      });
  }

  onLogin(payload: LoginRequest) {
    this.authLoading = true;
    this.authFacade.login(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.toast.success(this.i18n.t('home.toast.welcomeBack', { name: user?.username ?? payload.email }));
          this.authLoading = false;
        },
        error: (error) => {
          const code = error?.error?.code;
          if (code === 'EMAIL_NOT_VERIFIED') {
            this.verifyEmailAddress = payload.email;
            this.showVerifyEmailModal = true;
          } else {
            this.toast.error(this.extractErrorMessage(error));
          }
          this.authLoading = false;
        },
        complete: () => {
          this.authLoading = false;
        },
      });
  }

  onRegister(payload: RegisterRequest) {
    this.authLoading = true;
    this.authFacade.register(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.verifyEmailAddress = payload.email;
          this.showVerifyEmailModal = true;
          this.authLoading = false;
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
          this.authLoading = false;
        },
      });
  }

  closeVerifyEmailModal() {
    this.showVerifyEmailModal = false;
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
    this.showRewardModal = true;
  }

  onRewardClaimed(balance: number) {
    if (this.walletSummary) {
      this.walletSummary = { ...this.walletSummary, balance };
    }
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

  openProfileModal() {
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  onCrateBalanceUpdated(balance: number) {
    if (this.walletSummary) {
      this.walletSummary = { ...this.walletSummary, balance };
    }
  }

  onUnseenCrateCountChanged(count: number) {
    this.unseenCrateCount = count;
  }

  get currentUserId(): string | null {
    return this.currentUserIdValue ?? (this.walletSummary?.id as string | undefined) ?? null;
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
        const translated = this.authErrorMessageForCode((payload as any).code);
        if (translated) {
          return translated;
        }
        return String(payload.message);
      }
      if ('message' in (error as any)) {
        return String((error as any).message);
      }
    }
    return this.i18n.t('home.toast.actionFailed');
  }

  private authErrorMessageForCode(code: unknown): string | null {
    if (code === 'EMAIL_DISPOSABLE') {
      return this.i18n.t('auth.emailDisposable');
    }
    if (code === 'EMAIL_DOMAIN_INVALID') {
      return this.i18n.t('auth.emailDomainInvalid');
    }
    if (code === 'EMAIL_DOMAIN_UNAVAILABLE') {
      return this.i18n.t('auth.emailDomainUnavailable');
    }
    return null;
  }
}
