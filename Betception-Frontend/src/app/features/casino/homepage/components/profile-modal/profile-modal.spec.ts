import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NEVER, of, throwError } from 'rxjs';
import { ProfileModalComponent } from './profile-modal';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { CrateInventoryComponent } from '../crate-inventory/crate-inventory';
import { WalletTransactionKind } from '../../../../../core/api/api.types';

describe('ProfileModalComponent', () => {
  let fixture: ComponentFixture<ProfileModalComponent>;
  let component: ProfileModalComponent;
  let apiMock: jasmine.SpyObj<BetceptionApi>;
  let toastMock: jasmine.SpyObj<ToastService>;

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
    },
  };

  beforeEach(async () => {
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'getWalletTransactionsSummary',
      'getWalletTransactions',
      'getOwnProfile',
      'updateOwnProfile',
      'changeOwnPassword',
      'listCrates',
      'openCrate',
    ]);
    toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info']);

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
    apiMock.listCrates.and.returnValue(of({ items: [] }));
    apiMock.openCrate.and.returnValue(NEVER as any);

    await TestBed.configureTestingModule({
      imports: [ProfileModalComponent],
      providers: [
        { provide: BetceptionApi, useValue: apiMock },
        { provide: ToastService, useValue: toastMock },
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
    expect(apiMock.getWalletTransactionsSummary).toHaveBeenCalled();
    expect(apiMock.getWalletTransactions).toHaveBeenCalledWith({ page: 1, limit: 12 });
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

  it('opens on the profile tab with profile, crates, transactions order', () => {
    createComponent();

    expect(component.activeTab).toBe('profile');
    const labels = fixture.debugElement
      .queryAll(By.css('.profile-tab'))
      .map((button) => button.nativeElement.textContent.trim().replace('!', ''));

    expect(labels).toEqual(['Profil', 'Kisten', 'Transaktionen']);
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

    expect(editor.querySelector<HTMLInputElement>('input[name="currentPassword"]')).toBeTruthy();
    expect(editor.querySelector<HTMLInputElement>('input[name="newPassword"]')).toBeTruthy();
    expect(editor.querySelector<HTMLInputElement>('input[name="confirmPassword"]')).toBeTruthy();
    expect(editor.querySelectorAll('input').length).toBe(3);
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

  it('validates password confirmation before calling the API', () => {
    createComponent();
    component.selectTab('profile');
    fixture.detectChanges();

    component.passwordForm = {
      currentPassword: 'current-password',
      newPassword: 'new-password',
      confirmPassword: 'other-password',
    };
    component.changePassword();

    expect(toastMock.error).toHaveBeenCalled();
    expect(apiMock.changeOwnPassword).not.toHaveBeenCalled();
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
});
