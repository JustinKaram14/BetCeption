import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  BetceptionPreset,
  BetceptionPresetItem,
  BetceptionPresetResponse,
  BetceptionPresetStakeMode,
  BetceptionSideBetCode,
  CardRank,
  CardSuit,
} from '../../../../../core/api/api.types';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { I18n } from '../../../../../core/i18n/i18n';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

type PresetTarget = BetceptionSideBetCode;

type PresetTargetOption = {
  code: PresetTarget;
  labelKey: string;
  descriptionKey: string;
};

const TARGET_OPTIONS: PresetTargetOption[] = [
  { code: 'CARD_EXACT', labelKey: 'betception.presetTargetCard', descriptionKey: 'betception.cardExactSubtitle' },
  { code: 'CARD_SUIT', labelKey: 'betception.presetTargetSuit', descriptionKey: 'betception.cardSuitSubtitle' },
  { code: 'DEALER_BUST', labelKey: 'betception.dealerBustTitle', descriptionKey: 'betception.dealerBustSubtitle' },
  { code: 'PILL_TRIGGER', labelKey: 'betception.pillTitle', descriptionKey: 'betception.pillSubtitle' },
  { code: 'PLAYER_BLACKJACK', labelKey: 'betception.blackjackTitle', descriptionKey: 'betception.blackjackSubtitle' },
  { code: 'SPLIT_COUNT', labelKey: 'betception.splitCountTitle', descriptionKey: 'betception.splitCountSubtitle' },
];

@Component({
  selector: 'app-betception-preset-editor',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './betception-preset-editor.html',
  styleUrl: './betception-preset-editor.css',
})
export class BetceptionPresetEditorComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() presetSaved = new EventEmitter<BetceptionPresetResponse>();

  private readonly api = inject(BetceptionApi);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18n);

  readonly targetOptions = TARGET_OPTIONS;
  readonly stakeModes: BetceptionPresetStakeMode[] = ['fixed', 'percentage'];
  readonly cardSuits = [CardSuit.SPADES, CardSuit.HEARTS, CardSuit.DIAMONDS, CardSuit.CLUBS];
  readonly cardRanks = [
    CardRank.ACE,
    CardRank.TWO,
    CardRank.THREE,
    CardRank.FOUR,
    CardRank.FIVE,
    CardRank.SIX,
    CardRank.SEVEN,
    CardRank.EIGHT,
    CardRank.NINE,
    CardRank.TEN,
    CardRank.JACK,
    CardRank.QUEEN,
    CardRank.KING,
  ];
  readonly splitCountOptions = [1, 2, 3];
  readonly quickAmounts = [1, 5, 25, 100, 500];
  readonly quickPercents = [5, 10, 25, 50];

  loading = false;
  saving = false;
  deleting = false;
  activatingPresetId: string | null = null;
  error: string | null = null;
  presets: BetceptionPreset[] = [];
  selectedPresetId: string | null = null;
  activePresetId: string | null = null;
  name = 'Preset';
  stakeMode: BetceptionPresetStakeMode = 'fixed';
  items: BetceptionPresetItem[] = [];
  selectedTarget: PresetTarget = 'DEALER_BUST';
  selectedSuit = CardSuit.HEARTS;
  selectedRank = CardRank.ACE;
  selectedSplitCount = 1;
  entryAmount = 25;
  entryPercent = 10;

  ngOnInit(): void {
    this.toast.dismissAll();
    this.loadPresets();
  }

  loadPresets(): void {
    this.loading = true;
    this.error = null;
    this.api.getBetceptionPreset()
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: (response) => {
          this.applyPresetResponse(response, response.preset ?? response.presets[0] ?? null);
        },
        error: () => {
          this.error = this.i18n.t('betception.presetLoadError');
        },
      });
  }

  close(): void {
    this.closed.emit();
  }

  stopModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  newPreset(): void {
    this.selectedPresetId = null;
    this.name = this.i18n.t('betception.presetTitle');
    this.stakeMode = 'fixed';
    this.items = [];
    this.error = null;
  }

  selectPreset(preset: BetceptionPreset): void {
    this.selectedPresetId = preset.id;
    this.name = preset.name;
    this.stakeMode = preset.stakeMode;
    this.items = this.normalizePresetItems(preset.items);
    this.error = null;
  }

  selectTarget(code: PresetTarget): void {
    this.selectedTarget = code;
  }

  setStakeMode(mode: BetceptionPresetStakeMode): void {
    this.stakeMode = mode;
  }

  setAmount(amount: number): void {
    this.entryAmount = amount;
  }

  setPercent(percent: number): void {
    this.entryPercent = percent;
  }

  addOrUpdateItem(): void {
    const item = this.buildCurrentItem();
    const key = this.itemKey(item);
    this.items = [
      ...this.items.filter((entry) => this.itemKey(entry) !== key),
      item,
    ];
    this.error = null;
  }

  removeItem(item: BetceptionPresetItem): void {
    const key = this.itemKey(item);
    this.items = this.items.filter((entry) => this.itemKey(entry) !== key);
  }

  saveDraft(): void {
    if (this.saving) return;
    if (this.items.length === 0) {
      this.error = this.i18n.t('betception.presetEmpty');
      return;
    }
    this.saving = true;
    this.error = null;
    const request = {
      id: this.selectedPresetId ?? undefined,
      name: this.name.trim() || this.i18n.t('betception.presetTitle'),
      stakeMode: this.stakeMode,
      items: this.items,
      activate: this.selectedPresetId === this.activePresetId,
    };
    this.api.saveBetceptionPreset(request)
      .pipe(finalize(() => {
        this.saving = false;
      }))
      .subscribe({
        next: (response) => {
          this.applyPresetResponse(response, this.findSavedPreset(response, request) ?? response.preset);
        },
        error: () => {
          this.error = this.i18n.t('betception.presetSaveError');
        },
      });
  }

  saveAndContinue(): void {
    if (this.saving || this.deleting) return;
    if (this.items.length === 0) {
      this.error = this.i18n.t('betception.presetEmpty');
      return;
    }

    this.saving = true;
    this.error = null;
    this.api.saveBetceptionPreset({
      id: this.selectedPresetId ?? undefined,
      name: this.name.trim() || this.i18n.t('betception.presetTitle'),
      stakeMode: this.stakeMode,
      items: this.items,
      activate: true,
    })
      .pipe(finalize(() => {
        this.saving = false;
      }))
      .subscribe({
        next: (response) => {
          const selected = this.findActivePresetIn(this.normalizePresets(response), response.activePresetId) ?? response.preset;
          this.applyPresetResponse(response, selected);
          this.presetSaved.emit({ ...response, preset: selected });
          this.close();
        },
        error: () => {
          this.error = this.i18n.t('betception.presetSaveError');
        },
      });
  }

  deletePreset(): void {
    if (this.deleting) return;
    this.deleting = true;
    this.error = null;
    this.api.deleteBetceptionPreset(this.selectedPresetId ?? undefined)
      .pipe(finalize(() => {
        this.deleting = false;
      }))
      .subscribe({
        next: (response) => {
          this.applyPresetResponse(response, response.preset ?? response.presets[0] ?? null);
          this.presetSaved.emit(response);
        },
        error: () => {
          this.error = this.i18n.t('betception.presetDeleteError');
        },
      });
  }

  trackItem(_index: number, item: BetceptionPresetItem): string {
    return this.itemKey(item);
  }

  trackPreset(_index: number, preset: BetceptionPreset): string {
    return preset.id;
  }

  isPresetSelected(preset: BetceptionPreset): boolean {
    return this.selectedPresetId === preset.id;
  }

  isPresetActive(preset: BetceptionPreset): boolean {
    return preset.isActive || this.activePresetId === preset.id;
  }

  isAddDisabled(): boolean {
    return this.saving || this.deleting || this.items.length === 0 || (!this.selectedPresetId && !this.canCreatePreset);
  }

  targetLabel(code: PresetTarget): string {
    const option = this.targetOptions.find((target) => target.code === code);
    return option ? this.i18n.t(option.labelKey) : code;
  }

  targetDescription(option: PresetTargetOption): string {
    if (option.code === 'PILL_TRIGGER') {
      return this.i18n.t('betception.pillSubtitle', { odds: '10.5:1 / 14:1' });
    }
    return this.i18n.t(option.descriptionKey);
  }

  itemLabel(item: BetceptionPresetItem): string {
    if (item.typeCode === 'CARD_EXACT') {
      return `${this.i18n.t('betception.cardExactShort')} ${this.suitLabel(item.predictedSuit)}${item.predictedRank ?? ''}`;
    }
    if (item.typeCode === 'CARD_SUIT') {
      return `${this.i18n.t('betception.cardSuitShort')} ${this.suitLabel(item.predictedSuit)}`;
    }
    if (item.typeCode === 'SPLIT_COUNT') {
      return this.i18n.t('betception.splitCountOption', { count: Number(item.selection?.['splitCount'] ?? 1) });
    }
    return this.targetLabel(item.typeCode);
  }

  itemValue(item: BetceptionPresetItem): string {
    if (this.stakeMode === 'percentage') return `${item.percent ?? 0}%`;
    return `${Math.round(item.amount ?? 0)} ${this.i18n.t('common.coins')}`;
  }

  presetTotalLabel(preset: BetceptionPreset): string {
    if (preset.stakeMode === 'percentage') {
      const total = preset.items.reduce((sum, item) => sum + Number(item.percent ?? 0), 0);
      return `${Math.round(total * 100) / 100}%`;
    }
    const total = preset.items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    return `${Math.round(total)} ${this.i18n.t('common.coins')}`;
  }

  presetItemCountLabel(preset: BetceptionPreset): string {
    return this.i18n.t('betception.presetItemCount', { count: preset.items.length });
  }

  presetModeLabel(mode: BetceptionPresetStakeMode): string {
    return this.i18n.t(mode === 'fixed' ? 'betception.presetModeFixed' : 'betception.presetModePercentage');
  }

  suitLabel(suit: CardSuit | undefined): string {
    if (!suit) return '';
    if (suit === CardSuit.HEARTS) return 'H';
    if (suit === CardSuit.DIAMONDS) return 'D';
    if (suit === CardSuit.CLUBS) return 'C';
    return 'S';
  }

  get selectedTargetOption(): PresetTargetOption {
    return this.targetOptions.find((target) => target.code === this.selectedTarget) ?? this.targetOptions[0];
  }

  get itemCountLabel(): string {
    return this.i18n.t('betception.presetItemCount', { count: this.items.length });
  }

  get canCreatePreset(): boolean {
    return this.presets.length < 9;
  }

  get primaryActionLabel(): string {
    if (this.saving) return this.i18n.t('betception.presetSaving');
    return this.i18n.t('betception.presetSaveAndContinue');
  }

  get draftActionLabel(): string {
    if (this.saving) return this.i18n.t('betception.presetSaving');
    return this.selectedPresetId
      ? this.i18n.t('betception.presetSave')
      : this.i18n.t('betception.presetAddPreset');
  }

  private applyPresetResponse(response: BetceptionPresetResponse, preferredPreset: BetceptionPreset | null): void {
    this.presets = this.normalizePresets(response);
    this.activePresetId = this.findActivePresetIn(this.presets, response.activePresetId)?.id ?? null;
    const selected =
      (preferredPreset ? this.presets.find((preset) => preset.id === preferredPreset.id) : null) ??
      (this.selectedPresetId ? this.presets.find((preset) => preset.id === this.selectedPresetId) : null) ??
      this.presets[0] ??
      null;

    if (selected) {
      this.selectPreset(selected);
    } else {
      this.newPreset();
    }
  }

  private normalizePresets(response: BetceptionPresetResponse): BetceptionPreset[] {
    const rawPresets = Array.isArray(response.presets)
      ? response.presets
      : Object.values(response.presets ?? {});
    const presets = rawPresets
      .filter((preset): preset is BetceptionPreset => !!preset && typeof preset === 'object')
      .map((preset) => ({
        ...preset,
        items: this.normalizePresetItems(preset.items),
      }));

    if (response.preset && !presets.some((preset) => preset.id === response.preset?.id)) {
      presets.unshift({
        ...response.preset,
        items: this.normalizePresetItems(response.preset.items),
      });
    }

    return presets;
  }

  private normalizePresetItems(items: BetceptionPresetItem[] | null | undefined): BetceptionPresetItem[] {
    if (!Array.isArray(items)) return [];
    return items.filter((item): item is BetceptionPresetItem => !!item && typeof item === 'object');
  }

  private findActivePresetIn(presets: BetceptionPreset[], activePresetId: string | null): BetceptionPreset | null {
    return (
      presets.find((preset) => activePresetId === preset.id && preset.isActive) ??
      presets.find((preset) => preset.isActive) ??
      null
    );
  }

  private findSavedPreset(
    response: BetceptionPresetResponse,
    request: {
      id?: string;
      name: string;
      stakeMode: BetceptionPresetStakeMode;
      items: BetceptionPresetItem[];
    },
  ): BetceptionPreset | null {
    const presets = this.normalizePresets(response);
    if (request.id) {
      return presets.find((preset) => preset.id === request.id) ?? null;
    }

    return presets.find((preset) =>
      preset.name === request.name &&
      preset.stakeMode === request.stakeMode &&
      this.samePresetItems(preset.items, request.items),
    ) ?? null;
  }

  private samePresetItems(left: BetceptionPresetItem[], right: BetceptionPresetItem[]): boolean {
    if (left.length !== right.length) return false;
    const leftKeys = left.map((item) => `${this.itemKey(item)}:${item.amount ?? ''}:${item.percent ?? ''}`).sort();
    const rightKeys = right.map((item) => `${this.itemKey(item)}:${item.amount ?? ''}:${item.percent ?? ''}`).sort();
    return leftKeys.every((key, index) => key === rightKeys[index]);
  }

  private buildCurrentItem(): BetceptionPresetItem {
    const item: BetceptionPresetItem = {
      typeCode: this.selectedTarget,
    };
    if (this.stakeMode === 'fixed') {
      item.amount = Math.max(1, Math.round(Number(this.entryAmount) || 0));
    } else {
      item.percent = Math.max(0.01, Math.round((Number(this.entryPercent) || 0) * 100) / 100);
    }

    if (this.selectedTarget === 'CARD_EXACT' || this.selectedTarget === 'CARD_SUIT') {
      item.predictedSuit = this.selectedSuit;
    }
    if (this.selectedTarget === 'CARD_EXACT') {
      item.predictedRank = this.selectedRank;
    }
    if (this.selectedTarget === 'SPLIT_COUNT') {
      item.selection = { splitCount: this.selectedSplitCount };
    }
    return item;
  }

  private itemKey(item: BetceptionPresetItem): string {
    if (item.typeCode === 'CARD_EXACT') {
      return `${item.typeCode}:${item.predictedSuit ?? ''}:${item.predictedRank ?? ''}`;
    }
    if (item.typeCode === 'CARD_SUIT') {
      return `${item.typeCode}:${item.predictedSuit ?? ''}`;
    }
    if (item.typeCode === 'SPLIT_COUNT') {
      return `${item.typeCode}:${item.selection?.['splitCount'] ?? ''}`;
    }
    return item.typeCode;
  }
}
