import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import {
  ChangeOwnPasswordRequest,
  OwnProfile,
  UpdateOwnProfileRequest,
  WalletTransaction,
  WalletTransactionKind,
  WalletTransactionsSummaryResponse,
} from '../../../../../core/api/api.types';
import { I18n } from '../../../../../core/i18n/i18n';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { LevelProgressComponent } from '../../../../../shared/ui/level-progress/level-progress';
import { CrateInventoryComponent } from '../crate-inventory/crate-inventory';

type ProfileTab = 'transactions' | 'crates' | 'profile';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DecimalPipe, LevelProgressComponent, CrateInventoryComponent],
  templateUrl: './profile-modal.html',
  styleUrl: './profile-modal.css',
})
export class ProfileModalComponent implements OnInit, OnDestroy {
  @Input() userId: string | null | undefined = null;
  @Input() unseenCrateCount = 0;

  @Output() closed = new EventEmitter<void>();
  @Output() balanceUpdated = new EventEmitter<number>();
  @Output() unseenCrateCountChange = new EventEmitter<number>();

  private readonly api = inject(BetceptionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18n);

  readonly tabs: Array<{ id: ProfileTab; labelKey: Parameters<I18n['t']>[0] }> = [
    { id: 'profile', labelKey: 'profile.tab.profile' },
    { id: 'crates', labelKey: 'profile.tab.crates' },
    { id: 'transactions', labelKey: 'profile.tab.transactions' },
  ];

  activeTab: ProfileTab = 'profile';

  transactionsLoading = false;
  transactionsError: string | null = null;
  transactionSummary: WalletTransactionsSummaryResponse | null = null;
  transactions: WalletTransaction[] = [];
  transactionPage = 1;
  transactionPageSize = 12;
  transactionTotal = 0;

  profileLoading = false;
  profileError: string | null = null;
  profile: OwnProfile | null = null;
  profileForm = {
    username: '',
    email: '',
  };
  passwordForm: ChangeOwnPasswordRequest = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  profileSaving = false;
  passwordSaving = false;

  private previousBodyOverflow: string | null = null;

  ngOnInit(): void {
    this.lockBackgroundScroll();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.unlockBackgroundScroll();
  }

  selectTab(tab: ProfileTab): void {
    this.activeTab = tab;
    if (tab === 'transactions' && !this.transactionSummary && !this.transactionsLoading) {
      this.loadTransactions(true);
    }
    if (tab === 'profile' && !this.profile && !this.profileLoading) {
      this.loadProfile();
    }
  }

  close(): void {
    this.closed.emit();
  }

  stopModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  tabLabel(tab: { labelKey: Parameters<I18n['t']>[0] }): string {
    return this.i18n.t(tab.labelKey);
  }

  showTabNotice(tab: ProfileTab): boolean {
    return tab === 'crates' && this.unseenCrateCount > 0;
  }

  onCrateBalanceUpdated(balance: number): void {
    this.balanceUpdated.emit(balance);
    if (this.profile) {
      this.profile = { ...this.profile, balance };
    }
    this.loadTransactions(true);
  }

  onUnseenCrateCountChanged(count: number): void {
    this.unseenCrateCount = count;
    this.unseenCrateCountChange.emit(count);
  }

  loadTransactions(reset = false): void {
    if (this.transactionsLoading) {
      return;
    }
    if (reset) {
      this.transactionPage = 1;
      this.transactions = [];
      this.transactionTotal = 0;
    }

    this.transactionsLoading = true;
    this.transactionsError = null;

    const page = this.transactionPage;
    forkJoin({
      summary: this.api.getWalletTransactionsSummary(),
      history: this.api.getWalletTransactions({ page, limit: this.transactionPageSize }),
    })
      .pipe(
        finalize(() => {
          this.transactionsLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ summary, history }) => {
          this.transactionSummary = summary;
          this.transactionTotal = history.total;
          this.transactions = reset ? history.items : [...this.transactions, ...history.items];
        },
        error: (error) => {
          this.transactionsError = this.extractErrorMessage(error);
          this.transactions = reset ? [] : this.transactions;
        },
      });
  }

  loadMoreTransactions(): void {
    if (!this.hasMoreTransactions || this.transactionsLoading) {
      return;
    }
    this.transactionPage += 1;
    this.loadTransactions(false);
  }

  get hasMoreTransactions(): boolean {
    return this.transactions.length < this.transactionTotal;
  }

  loadProfile(): void {
    this.profileLoading = true;
    this.profileError = null;
    this.api
      .getOwnProfile()
      .pipe(
        finalize(() => {
          this.profileLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ user }) => {
          this.profile = user;
          this.profileForm = {
            username: user.username,
            email: user.email,
          };
        },
        error: (error) => {
          this.profileError = this.extractErrorMessage(error);
        },
      });
  }

  saveProfile(): void {
    const username = this.profileForm.username.trim();
    const email = this.profileForm.email.trim();

    if (username.length < 3 || username.length > 32) {
      this.toast.error(this.i18n.t('auth.usernameInvalid'));
      return;
    }
    if (!this.isValidEmail(email)) {
      this.toast.error(this.i18n.t('auth.emailInvalid'));
      return;
    }

    const payload: UpdateOwnProfileRequest = { username, email };
    this.profileSaving = true;
    this.api
      .updateOwnProfile(payload)
      .pipe(
        finalize(() => {
          this.profileSaving = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ user }) => {
          this.profile = user;
          this.profileForm = {
            username: user.username,
            email: user.email,
          };
          this.toast.success(this.i18n.t('profile.toast.profileUpdated'));
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
        },
      });
  }

  changePassword(): void {
    const currentPassword = this.passwordForm.currentPassword;
    const newPassword = this.passwordForm.newPassword;
    const confirmPassword = this.passwordForm.confirmPassword;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.toast.error(this.i18n.t('profile.toast.passwordFieldsRequired'));
      return;
    }
    if (newPassword.length < 8) {
      this.toast.error(this.i18n.t('auth.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      this.toast.error(this.i18n.t('profile.toast.passwordMismatch'));
      return;
    }

    this.passwordSaving = true;
    this.api
      .changeOwnPassword({ currentPassword, newPassword, confirmPassword })
      .pipe(
        finalize(() => {
          this.passwordSaving = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          };
          this.toast.success(this.i18n.t('profile.toast.passwordUpdated'));
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
        },
      });
  }

  kindLabel(kind: WalletTransactionKind): string {
    switch (kind) {
      case WalletTransactionKind.DEPOSIT:
        return this.i18n.t('profile.transaction.deposit');
      case WalletTransactionKind.WITHDRAW:
        return this.i18n.t('profile.transaction.withdraw');
      case WalletTransactionKind.BET_PLACE:
        return this.i18n.t('profile.transaction.betPlace');
      case WalletTransactionKind.BET_WIN:
        return this.i18n.t('profile.transaction.betWin');
      case WalletTransactionKind.BET_REFUND:
        return this.i18n.t('profile.transaction.betRefund');
      case WalletTransactionKind.ADJUSTMENT:
        return this.i18n.t('profile.transaction.adjustment');
      case WalletTransactionKind.REWARD:
        return this.i18n.t('profile.transaction.reward');
      case WalletTransactionKind.CRATE_REWARD:
        return this.i18n.t('profile.transaction.crateReward');
      default:
        return kind;
    }
  }

  formatSignedCoins(value: number): string {
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${this.formatCoins(Math.abs(value))}`;
  }

  formatCoins(value: number | null | undefined): string {
    const numeric = Number(value ?? 0);
    const hasDecimals = Math.abs(numeric % 1) > 0;
    return `${numeric.toLocaleString(this.currentLocale(), {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })} ${this.i18n.t('common.coins')}`;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(this.currentLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  referenceLabel(transaction: WalletTransaction): string {
    if (transaction.refTable && transaction.refId) {
      return `${transaction.refTable} #${transaction.refId}`;
    }
    if (transaction.refTable) {
      return transaction.refTable;
    }
    return '-';
  }

  private currentLocale(): string {
    switch (this.i18n.language()) {
      case 'en':
        return 'en-US';
      case 'es':
        return 'es-ES';
      case 'fr':
        return 'fr-FR';
      default:
        return 'de-DE';
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const payload = (error as any).error;
      if (typeof payload === 'string') {
        return payload;
      }
      if (payload && typeof payload === 'object') {
        if ('message' in payload) {
          return String(payload.message);
        }
        if ('errors' in payload) {
          return this.i18n.t('profile.toast.validationFailed');
        }
      }
      if ('message' in (error as any)) {
        return String((error as any).message);
      }
    }
    return this.i18n.t('home.toast.actionFailed');
  }

  private lockBackgroundScroll(): void {
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private unlockBackgroundScroll(): void {
    document.body.style.overflow = this.previousBodyOverflow ?? '';
  }
}
