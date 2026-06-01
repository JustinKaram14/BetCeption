import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CrateInventoryComponent } from './crate-inventory';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { CrateReward, UserCrateItem } from '../../../../../core/api/api.types';

function crate(overrides: Partial<UserCrateItem> = {}): UserCrateItem {
  return {
    id: 'crate-1',
    tier: 2,
    tierLabel: 'Rare',
    acquiredLevel: 8,
    acquiredAt: '2026-01-01T00:00:00Z',
    opened: false,
    openedAt: null,
    reward: null,
    ...overrides,
  };
}

describe('CrateInventoryComponent', () => {
  let fixture: ComponentFixture<CrateInventoryComponent>;
  let component: CrateInventoryComponent;
  let apiMock: jasmine.SpyObj<BetceptionApi>;

  const coinReward: CrateReward = {
    kind: 'coins',
    coins: 250,
    powerup: null,
  };
  const powerupReward: CrateReward = {
    kind: 'powerup',
    coins: null,
    powerup: { id: 1, code: 'RED_PILL', title: 'Red Pill', quantity: 2 },
  };

  beforeEach(async () => {
    localStorage.clear();
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', ['listCrates', 'openCrate']);
    apiMock.listCrates.and.returnValue(
      of({
        items: [
          crate({ id: 'crate-open' }),
          crate({
            id: 'crate-done',
            tier: 3,
            opened: true,
            openedAt: '2026-01-02T00:00:00Z',
            reward: powerupReward,
          }),
        ],
      }),
    );
    apiMock.openCrate.and.returnValue(
      of({ crate: crate({ id: 'crate-open', opened: true, reward: coinReward }), balance: 777 }),
    );

    await TestBed.configureTestingModule({
      imports: [CrateInventoryComponent],
      providers: [{ provide: BetceptionApi, useValue: apiMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(CrateInventoryComponent);
    component = fixture.componentInstance;
    component.userId = 'user-1';
  });

  afterEach(() => {
    fixture?.destroy();
    localStorage.clear();
  });

  it('loads crates and separates unopened from opened entries', () => {
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.unopenedCrates.map((item) => item.id)).toEqual(['crate-open']);
    expect(component.openedCrates.map((item) => item.id)).toEqual(['crate-done']);
    expect(apiMock.listCrates).toHaveBeenCalled();
  });

  it('renders a loading error when crates cannot be loaded', () => {
    apiMock.listCrates.and.returnValue(throwError(() => new Error('offline')));

    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe(component.i18n.t('crate.loadError'));
  });

  it('formats tier, pill and reward labels through i18n helpers', () => {
    fixture.detectChanges();

    expect(component.tierName(99)).toBe('T3');
    expect(component.tierLabel(1)).toBe(component.i18n.t('crate.tier.common'));
    expect(component.tierBadgeLabel(2, 'Rare')).toContain('T2');
    expect(component.pillLabel('RED_PILL')).toBe(component.i18n.t('powerup.redPill'));
    expect(component.pillLabel('BLUE_PILL')).toBe(component.i18n.t('powerup.bluePill'));
    expect(component.rewardLabel(coinReward)).toContain(component.i18n.t('common.coins'));
    expect(component.rewardLabel(powerupReward)).toContain('2x');
    expect(component.rewardKind(null)).toBe('empty');
  });

  it('marks hovered crates as seen and emits the remaining unseen count', () => {
    const unseenSpy = spyOn(component.unseenCrateCountChange, 'emit');
    fixture.detectChanges();

    component.onCrateHover(crate({ id: 'crate-hover' }));

    expect(unseenSpy).toHaveBeenCalledWith(0);
  });

  it('opens a crate, updates balance and runs the reveal animation', fakeAsync(() => {
    const balanceSpy = spyOn(component.balanceUpdated, 'emit');
    fixture.detectChanges();

    component.onOpen(component.unopenedCrates[0]);
    tick(80);
    expect(component.spinPhase).toBe('spinning');
    expect(component.spinReward).toEqual(coinReward);
    expect(balanceSpy).toHaveBeenCalledWith(777);

    tick(5200 + 350);
    expect(component.spinPhase).toBe('done');

    component.onDismissReveal();
    expect(component.spinPhase).toBe('idle');
    expect(component.spinItems).toEqual([]);
  }));

  it('maps crate open API errors to localized UI messages', () => {
    apiMock.openCrate.and.returnValue(
      throwError(() => ({ error: { code: 'ALREADY_OPENED' } })),
    );
    fixture.detectChanges();

    component.onOpen(component.unopenedCrates[0]);

    expect(component.spinPhase).toBe('idle');
    expect(component.error).toBe(component.i18n.t('crate.errorAlreadyOpened'));
  });

  it('does not open another crate while a spin is already running', () => {
    fixture.detectChanges();
    component.spinPhase = 'spinning';

    component.onOpen(component.unopenedCrates[0]);

    expect(apiMock.openCrate).not.toHaveBeenCalled();
  });

  it('emits closed from the close handler', () => {
    const closeSpy = spyOn(component.closed, 'emit');

    component.onClose();

    expect(closeSpy).toHaveBeenCalled();
  });
});
