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
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import {
  ChangeOwnPasswordRequest,
  OwnProfile,
  ProfileAvatarColor,
  ProfileAvatarIcon,
  UpdateOwnProfileRequest,
  WalletTransaction,
  WalletTransactionKind,
  WalletTransactionsSummaryQuery,
  WalletTransactionsSummaryResponse,
} from '../../../../../core/api/api.types';
import { I18n } from '../../../../../core/i18n/i18n';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { LevelProgressComponent } from '../../../../../shared/ui/level-progress/level-progress';
import { CrateInventoryComponent } from '../crate-inventory/crate-inventory';
import { AuthFacade } from '../../../../auth/services/auth-facade';

type ProfileTab = 'transactions' | 'crates' | 'profile';
type AccountEditMode = 'username' | 'email' | 'password';
type AvatarIconOption = {
  id: ProfileAvatarIcon;
  labelKey: string;
  path: string;
};
type AvatarColorOption = {
  id: ProfileAvatarColor;
  labelKey: string;
  value: string;
};

const AVATAR_ICONS: AvatarIconOption[] = [
  { id: 'chip', labelKey: 'profile.avatar.icon.chip', path: 'M32 7a25 25 0 1 0 0 50 25 25 0 0 0 0-50Zm0 9a16 16 0 1 1 0 32 16 16 0 0 1 0-32Zm0 7a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z' },
  { id: 'spade', labelKey: 'profile.avatar.icon.spade', path: 'M32 7C21 18 13 25 13 35c0 7 5 12 12 12 3 0 6-1 8-4-1 5-4 8-9 11h16c-5-3-8-6-9-11 2 3 5 4 8 4 7 0 12-5 12-12 0-10-8-17-19-28Z' },
  { id: 'crown', labelKey: 'profile.avatar.icon.crown', path: 'M12 22l11 8 9-15 9 15 11-8-4 27H16L12 22Zm10 21h20l1-9-7 5-4-8-4 8-7-5 1 9Z' },
  { id: 'bolt', labelKey: 'profile.avatar.icon.bolt', path: 'M36 5 15 36h14l-2 23 22-34H35l1-20Z' },
  { id: 'diamond', labelKey: 'profile.avatar.icon.diamond', path: 'M32 6 54 28 32 58 10 28 32 6Zm0 11-11 11 11 16 11-16-11-11Z' },
  { id: 'orbit', labelKey: 'profile.avatar.icon.orbit', path: 'M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm0 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM8 39c3 8 18 10 33 5 14-5 23-15 20-23-1-3-4-5-8-6 2 6-5 15-17 19-12 4-24 3-28-3-1 3-1 6 0 8Z' },
  { id: 'cards', labelKey: 'profile.avatar.icon.cards', path: 'M18 13h25c3 0 5 2 5 5v29c0 3-2 5-5 5H18c-3 0-5-2-5-5V18c0-3 2-5 5-5Zm5 8v7h7v-7h-7Zm11 15v7h7v-7h-7Zm-3-10 12 12 5-5-12-12-5 5Z' },
  { id: 'flame', labelKey: 'profile.avatar.icon.flame', path: 'M35 5c5 12-7 15 2 25 2-6 7-9 12-11-1 9 6 14 6 23 0 10-9 17-22 17S10 52 10 41c0-12 12-18 13-32 5 4 8 9 12 16 4-6 1-12 0-20Z' },
  { id: 'star', labelKey: 'profile.avatar.icon.star', path: 'm32 6 7 16 17 2-13 12 4 17-15-9-15 9 4-17L8 24l17-2 7-16Z' },
];

const AVATAR_COLORS: AvatarColorOption[] = [
  { id: 'cyan', labelKey: 'profile.avatar.color.cyan', value: '#00f6ff' },
  { id: 'blue', labelKey: 'profile.avatar.color.blue', value: '#208bff' },
  { id: 'violet', labelKey: 'profile.avatar.color.violet', value: '#8f5cff' },
  { id: 'magenta', labelKey: 'profile.avatar.color.magenta', value: '#ff00f5' },
  { id: 'red', labelKey: 'profile.avatar.color.red', value: '#ff4050' },
  { id: 'gold', labelKey: 'profile.avatar.color.gold', value: '#ffd21f' },
  { id: 'green', labelKey: 'profile.avatar.color.green', value: '#43ff95' },
  { id: 'ice', labelKey: 'profile.avatar.color.ice', value: '#a7f8ff' },
  { id: 'white', labelKey: 'profile.avatar.color.white', value: '#ffffff' },
];

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
  private readonly authFacade = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
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
  transactionFilterFrom = '';
  transactionFilterTo = '';
  transactionFilterError: string | null = null;
  private activeTransactionFilter: WalletTransactionsSummaryQuery = {};

  profileLoading = false;
  profileError: string | null = null;
  profile: OwnProfile | null = null;
  profileForm = {
    username: '',
    email: '',
    avatarIcon: 'chip' as ProfileAvatarIcon,
    avatarColor: 'cyan' as ProfileAvatarColor,
  };
  passwordForm: ChangeOwnPasswordRequest = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  profileSaving = false;
  passwordSaving = false;
  avatarEditing = false;
  avatarSaving = false;
  accountEditMode: AccountEditMode | null = null;
  accountDeleteExpanded = false;
  accountDeleting = false;
  accountDeleteForm = {
    password: '',
    confirm: false,
  };

  readonly avatarIcons = AVATAR_ICONS;
  readonly avatarColors = AVATAR_COLORS;

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
    const filterQuery = this.activeTransactionFilter;
    forkJoin({
      summary: this.api.getWalletTransactionsSummary(filterQuery),
      history: this.api.getWalletTransactions({
        page,
        limit: this.transactionPageSize,
        ...filterQuery,
      }),
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

  applyTransactionFilter(): void {
    const filter = this.buildTransactionFilterQuery();
    if (filter === null) {
      return;
    }
    this.activeTransactionFilter = filter;
    this.loadTransactions(true);
  }

  resetTransactionFilter(): void {
    this.transactionFilterFrom = '';
    this.transactionFilterTo = '';
    this.transactionFilterError = null;
    this.activeTransactionFilter = {};
    this.loadTransactions(true);
  }

  get isTransactionFilterActive(): boolean {
    return !!this.activeTransactionFilter.from || !!this.activeTransactionFilter.to;
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
            avatarIcon: user.avatarIcon ?? 'chip',
            avatarColor: user.avatarColor ?? 'cyan',
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
            avatarIcon: user.avatarIcon ?? 'chip',
            avatarColor: user.avatarColor ?? 'cyan',
          };
          this.toast.success(this.i18n.t('profile.toast.profileUpdated'));
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
        },
      });
  }

  openAccountEdit(mode: AccountEditMode): void {
    if (this.profile) {
      this.profileForm.username = this.profile.username;
      this.profileForm.email = this.profile.email;
    }
    if (mode === 'password') {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
    }
    this.accountEditMode = mode;
  }

  cancelAccountEdit(): void {
    if (this.profile) {
      this.profileForm.username = this.profile.username;
      this.profileForm.email = this.profile.email;
    }
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    this.accountEditMode = null;
  }

  saveUsername(): void {
    const username = this.profileForm.username.trim();

    if (username.length < 3 || username.length > 32) {
      this.toast.error(this.i18n.t('auth.usernameInvalid'));
      return;
    }

    this.profileSaving = true;
    this.api
      .updateOwnProfile({ username })
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
            avatarIcon: user.avatarIcon ?? 'chip',
            avatarColor: user.avatarColor ?? 'cyan',
          };
          this.accountEditMode = null;
          this.toast.success(this.i18n.t('profile.toast.profileUpdated'));
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
        },
      });
  }

  saveEmail(): void {
    const email = this.profileForm.email.trim();

    if (!this.isValidEmail(email)) {
      this.toast.error(this.i18n.t('auth.emailInvalid'));
      return;
    }

    this.profileSaving = true;
    this.api
      .updateOwnProfile({ email })
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
            avatarIcon: user.avatarIcon ?? 'chip',
            avatarColor: user.avatarColor ?? 'cyan',
          };
          this.accountEditMode = null;
          this.toast.success(this.i18n.t('profile.toast.profileUpdated'));
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
        },
      });
  }

  beginAvatarEdit(): void {
    this.avatarEditing = true;
  }

  cancelAvatarEdit(): void {
    if (this.profile) {
      this.profileForm.avatarIcon = this.profile.avatarIcon ?? 'chip';
      this.profileForm.avatarColor = this.profile.avatarColor ?? 'cyan';
    }
    this.avatarEditing = false;
  }

  selectAvatarIcon(icon: ProfileAvatarIcon): void {
    this.profileForm.avatarIcon = icon;
  }

  selectAvatarColor(color: ProfileAvatarColor): void {
    this.profileForm.avatarColor = color;
  }

  get hasAvatarChanges(): boolean {
    return !!this.profile && (
      this.profile.avatarIcon !== this.profileForm.avatarIcon ||
      this.profile.avatarColor !== this.profileForm.avatarColor
    );
  }

  saveAvatar(): void {
    if (!this.hasAvatarChanges) {
      this.avatarEditing = false;
      return;
    }

    this.avatarSaving = true;
    this.api
      .updateOwnProfile({
        avatarIcon: this.profileForm.avatarIcon,
        avatarColor: this.profileForm.avatarColor,
      })
      .pipe(
        finalize(() => {
          this.avatarSaving = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ user }) => {
          this.profile = user;
          this.profileForm = {
            username: user.username,
            email: user.email,
            avatarIcon: user.avatarIcon ?? 'chip',
            avatarColor: user.avatarColor ?? 'cyan',
          };
          this.avatarEditing = false;
          this.toast.success(this.i18n.t('profile.toast.avatarUpdated'));
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
          this.accountEditMode = null;
          this.toast.success(this.i18n.t('profile.toast.passwordUpdated'));
        },
        error: (error) => {
          this.toast.error(this.extractErrorMessage(error));
        },
      });
  }

  openAccountDelete(): void {
    this.accountDeleteExpanded = true;
    this.accountDeleteForm = {
      password: '',
      confirm: false,
    };
  }

  cancelAccountDelete(): void {
    if (this.accountDeleting) {
      return;
    }
    this.accountDeleteExpanded = false;
    this.accountDeleteForm = {
      password: '',
      confirm: false,
    };
  }

  deleteOwnAccount(): void {
    const password = this.accountDeleteForm.password;
    if (!password) {
      this.toast.error(this.i18n.t('profile.delete.passwordRequired'));
      return;
    }
    if (!this.accountDeleteForm.confirm) {
      this.toast.error(this.i18n.t('profile.delete.confirmRequired'));
      return;
    }

    this.accountDeleting = true;
    this.api
      .deleteOwnAccount({ password, confirm: true })
      .pipe(
        switchMap(() =>
          this.authFacade.logout().pipe(catchError(() => of(void 0))),
        ),
        finalize(() => {
          this.accountDeleting = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.accountDeleteForm = { password: '', confirm: false };
          this.accountDeleteExpanded = false;
          this.toast.success(this.i18n.t('profile.delete.deleted'));
          this.close();
          this.router.navigate(['/']);
        },
        error: (error) => {
          const code = error?.error?.code;
          this.toast.error(
            code === 'INVALID_PASSWORD'
              ? this.i18n.t('profile.delete.invalidPassword')
              : this.extractErrorMessage(error),
          );
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

  transactionEmptyMessage(): string {
    return this.isTransactionFilterActive
      ? this.i18n.t('profile.transactions.emptyFiltered')
      : this.i18n.t('profile.transactions.empty');
  }

  avatarIconPath(icon: ProfileAvatarIcon | null | undefined): string {
    return this.avatarIcons.find((option) => option.id === icon)?.path ?? this.avatarIcons[0].path;
  }

  avatarColorValue(color: ProfileAvatarColor | null | undefined): string {
    return this.avatarColors.find((option) => option.id === color)?.value ?? this.avatarColors[0].value;
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

  private buildTransactionFilterQuery(): WalletTransactionsSummaryQuery | null {
    this.transactionFilterError = null;

    const from = this.parseDateTimeLocal(this.transactionFilterFrom);
    const to = this.parseDateTimeLocal(this.transactionFilterTo);

    if (
      (this.transactionFilterFrom && !from) ||
      (this.transactionFilterTo && !to)
    ) {
      this.transactionFilterError = this.i18n.t('profile.transactions.invalidRange');
      return null;
    }

    if (from && to && from.getTime() > to.getTime()) {
      this.transactionFilterError = this.i18n.t('profile.transactions.startAfterEnd');
      return null;
    }

    return {
      ...(from ? { from: from.toISOString() } : {}),
      ...(to ? { to: to.toISOString() } : {}),
    };
  }

  private parseDateTimeLocal(value: string): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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
