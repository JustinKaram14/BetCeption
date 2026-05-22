import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NEVER, of, throwError } from 'rxjs';
import { ProfileModalComponent } from './profile-modal';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { CrateInventoryComponent } from '../crate-inventory/crate-inventory';
import { WalletTransactionKind } from '../../../../../core/api/api.types';
import { AuthFacade } from '../../../../auth/services/auth-facade';
import { Router } from '@angular/router';

describe('ProfileModalComponent', () => {
  let fixture: ComponentFixture<ProfileModalComponent>;
  let component: ProfileModalComponent;
  let apiMock: jasmine.SpyObj<BetceptionApi>;
  let toastMock: jasmine.SpyObj<ToastService>;
  let authFacadeMock: jasmine.SpyObj<AuthFacade>;
  let routerMock: jasmine.SpyObj<Router>;

  const achievement = {
    code: 'FIRST_WIN',
    category: 'starter',
    titleKey: 'achievement.FIRST_WIN.title',
    descriptionKey: 'achievement.FIRST_WIN.description',
    icon: 'trophy',
    target: 1,
    progress: 1,
    unlocked: true,
    unlockedAt: '2025-01-01T12:00:00Z',
    seen: false,
    rewardCoins: 50,
    secret: false,
    sortOrder: 2,
  };

  const profileResponse = {
    user: {
      id: 'u1',
      username: 'tester',
      email: 'tester@example.com',
      balance: 1200,
      xp: 25,
      level: 2,
      avatarIcon: 'chip',
      avatarColor: 'cyan',
      levelProgress: {
        level: 2,
        xp: 25,
        currentLevelXp: 0,
        nextLevelXp: 500,
        xpIntoLevel: 25,
        xpToNextLevel: 475,
        progressPercent: 5,
      },
      createdAt: '2025-01-01T00:00:00Z',
      achievements: [achievement],
      unseenAchievementCount: 1,
    },
  };

  beforeEach(async () => {
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'getWalletTransactionsSummary',
      'getWalletTransactions',
      'getOwnProfile',
      'updateOwnProfile',
      'changeOwnPassword',
      'deleteOwnAccount',
      'listCrates',
      'openCrate',
      'listAchievements',
      'markAchievementsSeen',
    ]);
    toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info']);
    authFacadeMock = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['requestPasswordChange', 'logout']);
    authFacadeMock.requestPasswordChange.and.returnValue(of({ message: 'ok' }));
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiMock.getWalletTransactionsSummary.and.returnValue(
      of({ totalWins: 150, totalLossesOrBets: 40, netTotal: 110, transactionCount: 2 }),
    );
    apiMock.getWalletTransactions.and.returnValue(
      of({
        page: 1,
        pageSize: 12,
        total: 2,
        items: [
          {
            id: 'tx-1',
            kind: WalletTransactionKind.BET_WIN,
            amount: 150,
            refTable: 'rounds',
            refId: '7',
            createdAt: '2025-01-01T12:00:00Z',
          },
          {
            id: 'tx-2',
            kind: WalletTransactionKind.BET_PLACE,
            amount: -40,
            refTable: 'rounds',
            refId: '7',
            createdAt: '2025-01-01T11:55:00Z',
          },
        ],
      }),
    );
    apiMock.getOwnProfile.and.returnValue(of(profileResponse as any));
    apiMock.updateOwnProfile.and.returnValue(of(profileResponse as any));
    apiMock.changeOwnPassword.and.returnValue(of({ success: true }));
    apiMock.deleteOwnAccount.and.returnValue(of({ success: true }));
    apiMock.listCrates.and.returnValue(of({ items: [] }));
    apiMock.openCrate.and.returnValue(NEVER as any);
    apiMock.listAchievements.and.returnValue(of({ items: [achievement], unseenCount: 0 } as any));
    apiMock.markAchievementsSeen.and.returnValue(of({ items: [{ ...achievement, seen: true }], unseenCount: 0 } as any));
    authFacadeMock.logout.and.returnValue(of(void 0));
    routerMock.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [ProfileModalComponent],
      providers: [
        { provide: BetceptionApi, useValue: apiMock },
        { provide: ToastService, useValue: toastMock },
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(ProfileModalComponent);
    component = fixture.componentInstance;
    component.userId = 'u1';
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
    document.body.style.overflow = '';
  });

  it('renders transaction summary and rows', () => {
    createComponent();
    component.selectTab('transactions');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Gesamt gewonnen');
    expect(text).toContain('Gewinn');
    expect(text).toContain('Einsatz');
    expect(text).toContain('Von');
    expect(text).toContain('Bis');
    expect(apiMock.getWalletTransactionsSummary).toHaveBeenCalledWith({});
    expect(apiMock.getWalletTransactions).toHaveBeenCalledWith({ page: 1, limit: 12 });
  });

  it('loads transactions with from and to filters', () => {
    createComponent();
    component.selectTab('transactions');
    component.transactionFilterFrom = '2026-01-01T00:00';
    component.transactionFilterTo = '2026-01-31T23:59';

    component.applyTransactionFilter();

    expect(apiMock.getWalletTransactionsSummary).toHaveBeenCalledWith(
      jasmine.objectContaining({
        from: jasmine.any(String),
        to: jasmine.any(String),
      }),
    );
    expect(apiMock.getWalletTransactions).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 1,
        limit: 12,
        from: jasmine.any(String),
        to: jasmine.any(String),
      }),
    );
  });

  it('resets transaction filters and reloads unfiltered transactions', () => {
    createComponent();
    component.selectTab('transactions');
    component.transactionFilterFrom = '2026-01-01T00:00';
    component.applyTransactionFilter();

    component.resetTransactionFilter();

    expect(component.transactionFilterFrom).toBe('');
    expect(component.transactionFilterTo).toBe('');
    expect(apiMock.getWalletTransactionsSummary).toHaveBeenCalledWith({});
    expect(apiMock.getWalletTransactions).toHaveBeenCalledWith({ page: 1, limit: 12 });
  });

  it('shows a validation error when the start date is after the end date', () => {
    createComponent();
    component.selectTab('transactions');
    component.transactionFilterFrom = '2026-02-01T00:00';
    component.transactionFilterTo = '2026-01-01T00:00';

    component.applyTransactionFilter();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Startdatum darf nicht nach Enddatum liegen');
  });

  it('keeps the active filter when loading more transactions', () => {
    createComponent();
    component.selectTab('transactions');
    component.transactionFilterFrom = '2026-01-01T00:00';
    component.applyTransactionFilter();
    component.transactionTotal = 3;

    component.loadMoreTransactions();

    expect(apiMock.getWalletTransactions).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 2,
        limit: 12,
        from: jasmine.any(String),
      }),
    );
  });

  it('shows a filtered empty state', () => {
    apiMock.getWalletTransactionsSummary.and.returnValue(
      of({ totalWins: 0, totalLossesOrBets: 0, netTotal: 0, transactionCount: 0 }),
    );
    apiMock.getWalletTransactions.and.returnValue(of({ page: 1, pageSize: 12, total: 0, items: [] }));
    createComponent();
    component.selectTab('transactions');
    component.transactionFilterFrom = '2026-01-01T00:00';
    component.applyTransactionFilter();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Keine Transaktionen im ausgewaehlten Zeitraum');
  });

  it('shows a loading state while transactions load', () => {
    apiMock.getWalletTransactionsSummary.and.returnValue(NEVER as any);
    apiMock.getWalletTransactions.and.returnValue(NEVER as any);

    createComponent();
    component.selectTab('transactions');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Transaktionen werden geladen');
  });

  it('shows an error state when transactions fail', () => {
    apiMock.getWalletTransactionsSummary.and.returnValue(throwError(() => new Error('Network error')));

    createComponent();
    component.selectTab('transactions');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Network error');
  });

  it('opens on the profile tab with profile, crates, achievements, transactions order', () => {
    createComponent();

    expect(component.activeTab).toBe('profile');
    const labels = fixture.debugElement
      .queryAll(By.css('.profile-tab'))
      .map((button) => button.nativeElement.textContent.replace('!', '').replace(/\s+/g, ' ').trim());

    expect(labels).toEqual(['Profil', 'Kisten', 'Achievements', 'Transaktionen']);
    expect(apiMock.getOwnProfile).toHaveBeenCalled();
    expect(apiMock.getWalletTransactionsSummary).not.toHaveBeenCalled();
  });

  it('switches tabs and embeds the crate inventory', () => {
    createComponent();

    const crateButton = fixture.debugElement
      .queryAll(By.css('.profile-tab'))
      .find((button) => button.nativeElement.textContent.includes('Kisten'));
    crateButton!.nativeElement.click();
    fixture.detectChanges();

    const crateInventory = fixture.debugElement.query(By.directive(CrateInventoryComponent));
    expect(crateInventory).toBeTruthy();
    expect((crateInventory.componentInstance as CrateInventoryComponent).embedded).toBeTrue();
  });

  it('loads profile data in the profile tab', async () => {
    createComponent();

    const profileButton = fixture.debugElement
      .queryAll(By.css('.profile-tab'))
      .find((button) => button.nativeElement.textContent.includes('Profil'));
    profileButton!.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.openAccountEdit('username');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const usernameInput: HTMLInputElement = fixture.nativeElement.querySelector('input[name="username"]');
    expect(usernameInput.value).toBe('tester');
    expect(apiMock.getOwnProfile).toHaveBeenCalled();
  });

  it('opens account edit forms from the three account action buttons', async () => {
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    const editor: HTMLElement = fixture.nativeElement.querySelector('.profile-account-editor');
    const actionButtons = editor.querySelectorAll<HTMLButtonElement>('.profile-account-action');

    expect(actionButtons.length).toBe(3);
    expect(editor.querySelectorAll('input').length).toBe(0);

    actionButtons[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(editor.querySelector<HTMLInputElement>('input[name="email"]')).toBeTruthy();
    expect(editor.querySelectorAll('input').length).toBe(1);

    actionButtons[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Password change is now done via email link – no form inputs
    expect(editor.querySelectorAll('input').length).toBe(0);
    expect(editor.querySelector('.profile-pw-mail-panel')).toBeTruthy();
  });

  it('saves a username edit through the profile API and closes the edit panel', () => {
    createComponent();
    apiMock.updateOwnProfile.and.returnValue(
      of({
        user: {
          ...profileResponse.user,
          username: 'newname',
        },
      } as any),
    );

    component.openAccountEdit('username');
    component.profileForm.username = 'newname';
    component.saveUsername();

    expect(apiMock.updateOwnProfile).toHaveBeenCalledWith({ username: 'newname' });
    expect(component.accountEditMode).toBeNull();
    expect(component.profile?.username).toBe('newname');
  });

  it('rejects a glitch username edit before calling the profile API', () => {
    createComponent();

    component.openAccountEdit('username');
    component.profileForm.username = 'T̵e̷s̶';
    component.saveUsername();

    expect(apiMock.updateOwnProfile).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalled();
  });

  it('saves selected profile avatar options', () => {
    createComponent();
    apiMock.updateOwnProfile.and.returnValue(
      of({
        user: {
          ...profileResponse.user,
          avatarIcon: 'star',
          avatarColor: 'gold',
        },
      } as any),
    );

    component.beginAvatarEdit();
    component.selectAvatarIcon('star');
    component.selectAvatarColor('gold');
    component.saveAvatar();

    expect(apiMock.updateOwnProfile).toHaveBeenCalledWith({
      avatarIcon: 'star',
      avatarColor: 'gold',
    });
    expect(component.avatarEditing).toBeFalse();
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('sends a password-change link by email when the password panel button is clicked', async () => {
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    component.openAccountEdit('password');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const sendButton: HTMLButtonElement = fixture.nativeElement.querySelector('.profile-submit');
    sendButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(authFacadeMock.requestPasswordChange).toHaveBeenCalled();
    expect(component.passwordChangeEmailSent).toBeTrue();
  });

  it('shows the email-sent confirmation after a successful password change request', async () => {
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    component.openAccountEdit('password');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.sendPasswordChangeMail();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.passwordChangeEmailSent).toBeTrue();
    const panel: HTMLElement = fixture.nativeElement.querySelector('.profile-pw-mail-panel');
    expect(panel.textContent).toContain('Mail gesendet');
  });

  it('shows a toast and does not change state when the password change email request fails', async () => {
    authFacadeMock.requestPasswordChange.and.returnValue(throwError(() => new Error('Service unavailable')));
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    component.openAccountEdit('password');
    component.sendPasswordChangeMail();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.passwordChangeEmailSent).toBeFalse();
    expect(toastMock.error).toHaveBeenCalled();
  });

  it('shows the centered account delete trigger in the private profile', () => {
    createComponent();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Gefahrenzone');
    expect(fixture.nativeElement.querySelector('.profile-danger-trigger')).toBeTruthy();
  });

  it('shows delete confirmation after clicking the delete button', async () => {
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    const dangerButton: HTMLButtonElement = fixture.nativeElement.querySelector('.profile-danger-trigger');
    dangerButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[name="accountDeletePassword"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[name="accountDeleteConfirm"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Account endgültig löschen');
  });

  it('does not delete without a password', () => {
    createComponent();
    component.openAccountDelete();
    component.accountDeleteForm = { password: '', confirm: true };

    component.deleteOwnAccount();

    expect(toastMock.error).toHaveBeenCalledWith('Bitte gib dein Passwort ein.');
    expect(apiMock.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it('cancels account delete confirmation without API call', () => {
    createComponent();
    component.openAccountDelete();

    component.cancelAccountDelete();

    expect(component.accountDeleteExpanded).toBeFalse();
    expect(apiMock.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it('logs out and navigates home after successful account deletion', () => {
    createComponent();
    component.openAccountDelete();
    component.accountDeleteForm = { password: 'current-password', confirm: true };
    const closeSpy = jasmine.createSpy('closed');
    component.closed.subscribe(closeSpy);

    component.deleteOwnAccount();

    expect(apiMock.deleteOwnAccount).toHaveBeenCalledWith({ password: 'current-password', confirm: true });
    expect(authFacadeMock.logout).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('translates invalid password delete errors', () => {
    apiMock.deleteOwnAccount.and.returnValue(throwError(() => ({ error: { code: 'INVALID_PASSWORD' } })));
    createComponent();
    component.openAccountDelete();
    component.accountDeleteForm = { password: 'wrong-password', confirm: true };

    component.deleteOwnAccount();

    expect(toastMock.error).toHaveBeenCalledWith('Passwort ist falsch.');
    expect(authFacadeMock.logout).not.toHaveBeenCalled();
  });

  it('emits closed when the close button is clicked', () => {
    createComponent();
    const closeSpy = jasmine.createSpy('closed');
    component.closed.subscribe(closeSpy);

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.profile-close');
    closeButton.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('closes when the overlay is clicked but not when the modal is clicked', () => {
    createComponent();
    const closeSpy = jasmine.createSpy('closed');
    component.closed.subscribe(closeSpy);

    const modal: HTMLElement = fixture.nativeElement.querySelector('.profile-modal');
    modal.click();
    expect(closeSpy).not.toHaveBeenCalled();

    const overlay: HTMLElement = fixture.nativeElement.querySelector('.profile-overlay');
    overlay.click();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('locks background scroll while mounted and restores it on destroy', () => {
    document.body.style.overflow = 'auto';
    createComponent();

    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('shows the crates tab notification when unseen crates exist', () => {
    createComponent();
    component.unseenCrateCount = 1;
    fixture.detectChanges();

    const crateButton = fixture.debugElement
      .queryAll(By.css('.profile-tab'))
      .find((button) => button.nativeElement.textContent.includes('Kisten'));

    expect(crateButton!.nativeElement.querySelector('.profile-tab-notice')).toBeTruthy();
  });

  it('shows achievements and marks them seen when the achievements tab is opened', () => {
    createComponent();
    component.unseenAchievementCount = 1;
    fixture.detectChanges();

    const achievementButton = fixture.debugElement
      .queryAll(By.css('.profile-tab'))
      .find((button) => button.nativeElement.textContent.includes('Achievements'));
    expect(achievementButton!.nativeElement.querySelector('.profile-tab-notice')).toBeTruthy();

    achievementButton!.nativeElement.click();
    fixture.detectChanges();

    expect(apiMock.markAchievementsSeen).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Blut geleckt');
    expect(component.unseenAchievementCount).toBe(0);
  });

  it('renders partially completed tier achievements as active with only earned stars highlighted', () => {
    createComponent();
    component.profile = {
      ...profileResponse.user,
      achievements: [
        {
          ...achievement,
          code: 'ROUND_10',
          titleKey: 'achievement.ROUND_10.title',
          descriptionKey: 'achievement.ROUND_10.description',
          icon: 'cards',
          target: 10,
          progress: 10,
          unlocked: true,
          rewardCoins: 200,
          sortOrder: 30,
        },
        {
          ...achievement,
          code: 'ROUND_100',
          titleKey: 'achievement.ROUND_100.title',
          descriptionKey: 'achievement.ROUND_100.description',
          icon: 'calendar',
          target: 100,
          progress: 24,
          unlocked: false,
          unlockedAt: null,
          rewardCoins: 1500,
          sortOrder: 40,
        },
        {
          ...achievement,
          code: 'ROUND_500',
          titleKey: 'achievement.ROUND_500.title',
          descriptionKey: 'achievement.ROUND_500.description',
          icon: 'signal',
          target: 500,
          progress: 24,
          unlocked: false,
          unlockedAt: null,
          rewardCoins: 7500,
          sortOrder: 50,
        },
      ],
      unseenAchievementCount: 0,
    } as any;
    component.activeTab = 'achievements';
    fixture.detectChanges();

    const tierCard: HTMLElement = fixture.nativeElement.querySelector('.achievement-card.has-tiers');
    const stars = tierCard.querySelectorAll<HTMLElement>('.achievement-card__stars span');

    expect(tierCard.classList).toContain('is-unlocked');
    expect(tierCard.classList).not.toContain('is-locked');
    expect(tierCard.querySelector('.achievement-icon.locked')).toBeNull();
    expect(stars[0].classList).toContain('active');
    expect(stars[1].classList).not.toContain('active');
    expect(stars[2].classList).not.toContain('active');
  });

  it('loads the achievement catalog when no unseen achievements are pending', () => {
    createComponent();
    component.profile = { ...profileResponse.user, achievements: [], unseenAchievementCount: 0 } as any;
    component.unseenAchievementCount = 0;
    fixture.detectChanges();

    const achievementButton = fixture.debugElement
      .queryAll(By.css('.profile-tab'))
      .find((button) => button.nativeElement.textContent.includes('Achievements'));

    achievementButton!.nativeElement.click();
    fixture.detectChanges();

    expect(apiMock.listAchievements).toHaveBeenCalledTimes(1);
    expect(apiMock.markAchievementsSeen).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Blut geleckt');
  });
});
