import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BetceptionPresetEditorComponent } from './betception-preset-editor';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { BetceptionPreset, BetceptionPresetResponse, CardRank, CardSuit } from '../../../../../core/api/api.types';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

describe('BetceptionPresetEditorComponent', () => {
  let component: BetceptionPresetEditorComponent;
  let fixture: ComponentFixture<BetceptionPresetEditorComponent>;
  let apiMock: jasmine.SpyObj<BetceptionApi>;
  let toastMock: jasmine.SpyObj<ToastService>;
  const savedPreset: BetceptionPreset = {
    id: 'preset-1',
    name: 'Preset',
    stakeMode: 'fixed',
    items: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const emptyPresetResponse: BetceptionPresetResponse = {
    preset: null,
    presets: [],
    activePresetId: null,
  };

  beforeEach(async () => {
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', [
      'getBetceptionPreset',
      'saveBetceptionPreset',
      'activateBetceptionPreset',
      'deleteBetceptionPreset',
    ]);
    toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info', 'achievement', 'crate', 'dismissAll']);
    apiMock.getBetceptionPreset.and.returnValue(of(emptyPresetResponse));
    apiMock.saveBetceptionPreset.and.returnValue(of({
      preset: savedPreset,
      presets: [savedPreset],
      activePresetId: savedPreset.id,
    }));
    apiMock.activateBetceptionPreset.and.returnValue(of({
      preset: savedPreset,
      presets: [savedPreset],
      activePresetId: savedPreset.id,
    }));
    apiMock.deleteBetceptionPreset.and.returnValue(of({ success: true, ...emptyPresetResponse }));

    await TestBed.configureTestingModule({
      imports: [BetceptionPresetEditorComponent],
      providers: [
        { provide: BetceptionApi, useValue: apiMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BetceptionPresetEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the existing preset', () => {
    expect(apiMock.getBetceptionPreset).toHaveBeenCalled();
    expect(component.items).toEqual([]);
  });

  it('adds exact-card entries and saves the preset', () => {
    component.name = 'Card Trap';
    component.selectedTarget = 'CARD_EXACT';
    component.selectedSuit = CardSuit.HEARTS;
    component.selectedRank = CardRank.ACE;
    component.entryAmount = 25;

    component.addOrUpdateItem();
    const expectedItems = [...component.items];
    component.saveAndContinue();

    expect(expectedItems).toEqual([
      {
        typeCode: 'CARD_EXACT',
        amount: 25,
        predictedSuit: CardSuit.HEARTS,
        predictedRank: CardRank.ACE,
      },
    ]);
    expect(apiMock.saveBetceptionPreset).toHaveBeenCalledWith({
      id: undefined,
      name: 'Card Trap',
      stakeMode: 'fixed',
      items: expectedItems,
      activate: true,
    });
    expect(component.selectedPresetId).toBe(savedPreset.id);
  });

  it('selects and confirms an existing preset from the list', () => {
    const inactivePreset: BetceptionPreset = {
      ...savedPreset,
      id: 'preset-2',
      name: 'Dealer Trap',
      isActive: false,
      items: [{ typeCode: 'DEALER_BUST', amount: 50 }],
    };
    const activatedPreset = { ...inactivePreset, isActive: true };
    apiMock.saveBetceptionPreset.and.returnValue(of({
      preset: activatedPreset,
      presets: [{ ...savedPreset, isActive: false }, activatedPreset],
      activePresetId: activatedPreset.id,
    }));
    component.presets = [savedPreset, inactivePreset];
    component.activePresetId = savedPreset.id;

    component.selectPreset(inactivePreset);
    component.saveAndContinue();

    expect(component.selectedPresetId).toBe('preset-2');
    expect(component.items).toEqual(inactivePreset.items);
    expect(apiMock.saveBetceptionPreset).toHaveBeenCalledWith({
      id: 'preset-2',
      name: 'Dealer Trap',
      stakeMode: 'fixed',
      items: inactivePreset.items,
      activate: true,
    });
  });

  it('adds a new draft to the preset list without closing the editor', () => {
    const inactivePreset: BetceptionPreset = {
      ...savedPreset,
      isActive: false,
      items: [{ typeCode: 'DEALER_BUST', amount: 25 }],
    };
    apiMock.saveBetceptionPreset.and.returnValue(of({
      preset: null,
      presets: [inactivePreset],
      activePresetId: null,
    }));
    spyOn(component.closed, 'emit');
    component.items = inactivePreset.items;

    component.saveDraft();

    expect(component.presets).toEqual([inactivePreset]);
    expect(component.selectedPresetId).toBe(inactivePreset.id);
    expect(component.closed.emit).not.toHaveBeenCalled();
  });

  it('surfaces load errors', () => {
    apiMock.getBetceptionPreset.and.returnValue(throwError(() => new Error('nope')));
    fixture = TestBed.createComponent(BetceptionPresetEditorComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.error).toBeTruthy();
  });
});
