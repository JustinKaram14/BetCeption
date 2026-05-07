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
    fixture.detectChanges();
  }

  it('renders transaction summary and rows', () => {
    createComponent();

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

    expect(fixture.nativeElement.textContent).toContain('Transaktionen werden geladen');
  });

  it('shows an error state when transactions fail', () => {
    apiMock.getWalletTransactionsSummary.and.returnValue(throwError(() => new Error('Network error')));

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Network error');
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

    const usernameInput: HTMLInputElement = fixture.nativeElement.querySelector('input[name="username"]');
    expect(usernameInput.value).toBe('tester');
    expect(apiMock.getOwnProfile).toHaveBeenCalled();
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
});
