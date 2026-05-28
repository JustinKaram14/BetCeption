import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivePowerup,
  Achievement,
  BetceptionPreset,
  BetceptionPresetItem,
  BetceptionPresetResponse,
  BetceptionResolution,
  BetceptionResolutionStep,
  CardRank,
  CardSuit,
  DealerAction,
  HandOwnerType,
  HandStatus,
  InventoryPowerup,
  LevelProgress,
  LevelUpCrate,
  MainBet,
  MainBetStatus,
  PowerPillCode,
  PowerPillColor,
  PowerupType,
  RoundResponse,
  RoundState,
  RoundSideBet,
  SideBetPlacement,
  SideBetStatus,
  RoundStatus,
} from '../../../../../core/api/api.types';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { Rng } from '../../../../../core/services/rng/rng';
import { Wallet } from '../../../../../core/services/wallet/wallet';
import { Table } from '../../components/table/table';
import { Controls } from '../../components/controls/controls';
import { PowerupMenu } from '../../components/powerup-menu/powerup-menu';
import { BetceptionPresetEditorComponent } from '../../components/betception-preset-editor/betception-preset-editor';
import { I18n } from '../../../../../core/i18n/i18n';
import { LevelProgressComponent } from '../../../../../shared/ui/level-progress/level-progress';
import { ToastContainerComponent } from '../../../../../shared/ui/toast/toast-container';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

type ActionKind = 'deal' | 'hit' | 'stand' | 'settle' | 'dealer-step' | 'double' | 'split';
type BetceptionView = 'overview' | 'cards' | 'dealerBust' | 'pill' | 'blackjack' | 'splitCount';
type CardBetTarget = 'suit' | 'card';
type PayoutTier = 'none' | 'win' | 'big' | 'super' | 'mega';
type BetceptionStakeCategory = 'CARD' | 'DEALER_BUST' | 'PILL_TRIGGER' | 'PLAYER_BLACKJACK' | 'SPLIT_COUNT';
type RoundResultTone = 'won' | 'lost' | 'push' | 'neutral';
type RoundOutcome = {
  headline: string;
  detail: string | null;
  won: boolean;
  lost: boolean;
  push: boolean;
  plus?: boolean;
  dealerInfo: string | null;
  mainHeadline?: string;
  mainDetail?: string | null;
  mainTone?: RoundResultTone;
};
type BetceptionPanelRow = {
  id: string;
  label: string;
  value: string;
  items?: string[];
  status?: string;
  mark?: string;
  payout?: string;
  revealed?: boolean;
  won?: boolean;
  lost?: boolean;
  push?: boolean;
};
type IndexedResolutionStep = {
  step: BetceptionResolutionStep;
  index: number;
};
type PresetDraftResult = {
  ok: boolean;
  message?: string;
  cardBets: Record<string, number>;
  suitBets: Partial<Record<CardSuit, number>>;
  dealerBustBetAmount: number;
  pillTriggerBetAmount: number;
  blackjackBetAmount: number;
  splitCountBets: Record<number, number>;
};

const BETCEPTION_TOTAL_STAKE_CAP = 2;
const BETCEPTION_CATEGORY_STAKE_CAP: Record<BetceptionStakeCategory, number> = {
  CARD: 1,
  DEALER_BUST: 0.6,
  PILL_TRIGGER: 0.5,
  PLAYER_BLACKJACK: 0.5,
  SPLIT_COUNT: 0.5,
};

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault, RouterLink, Table, Controls, PowerupMenu, BetceptionPresetEditorComponent, LevelProgressComponent, ToastContainerComponent],
  templateUrl: './blackjack.html',
  styleUrls: ['./blackjack.css']
})
export class Blackjack implements OnInit {
  private readonly rng = inject(Rng);
  private readonly wallet = inject(Wallet);
  private readonly api = inject(BetceptionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18n);
  @ViewChild('betceptionPanelRowsContainer') private betceptionPanelRowsRef?: ElementRef<HTMLElement>;
  private readonly dealerRevealMs = 620;
  private readonly dealerFollowUpCardStepMs = 360;
  private readonly cardAnimationMs = 650;
  private readonly resultPauseMs = 250;
  private readonly betceptionStepMs = 620;
  readonly betceptionChips = [1, 5, 25, 100, 500];
  readonly splitCountOptions = [1, 2, 3];
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

  round: RoundState | null = null;
  betAmount = 0;
  balance: number | null = null;
  levelProgress: LevelProgress | null = null;
  busyAction: ActionKind | null = null;
  error: string | null = null;
  info: string | null = null;
  showBlackjackBanner = false;
  showRoundOverlay = false;
  roundResolutionActive = false;
  roundOutcome: RoundOutcome | null = null;
  showPowerupMenu = false;
  showBetceptionPresetEditor = false;
  betceptionPreset: BetceptionPreset | null = null;
  appliedBetceptionPresetId: string | null = null;
  betceptionPresetLoading = false;
  inventory: InventoryPowerup[] = [];
  availablePowerups: PowerupType[] = [];
  activePowerup: ActivePowerup | null = null;
  pillPulse: PowerPillColor | null = null;
  pillExpiredCode: PowerPillCode | null = null;
  showBetceptionMenu = false;
  betceptionView: BetceptionView = 'overview';
  selectedCardSuit = CardSuit.HEARTS;
  selectedCardRank = CardRank.JACK;
  cardBetTarget: CardBetTarget = 'card';
  cardBets: Record<string, number> = {};
  suitBets: Partial<Record<CardSuit, number>> = {};
  dealerBustBetAmount = 0;
  pillTriggerBetAmount = 0;
  blackjackBetAmount = 0;
  splitCountBets: Record<number, number> = {};
  selectedSplitCount = 1;
  betceptionResolution: BetceptionResolution | null = null;
  revealedResolutionStepCount = 0;
  animatedPayoutAmount = 0;
  finalPayoutAmount = 0;
  finalNetAmount = 0;
  finalStakeAmount = 0;
  payoutFramePulseTier: Exclude<PayoutTier, 'none'> | null = null;
  userLevel = 1;
  private pendingLevelUpCrate: LevelUpCrate | null = null;
  private pendingAchievementUnlocks: Achievement[] = [];
  private inventoryLoaded = false;
  private bannerTimer: number | null = null;
  private resultOverlayTimer: number | null = null;
  private walletRefreshTimer: number | null = null;
  private pillPulseTimer: number | null = null;
  private pillPopTimer: number | null = null;
  private dealerFlowTimer: number | null = null;
  dealerFlowActive = false;
  private payoutCountTimer: number | null = null;
  private payoutFramePulseTimer: number | null = null;
  private payoutFramePulseResetTimer: number | null = null;
  private lastAnimatedPayoutTier: PayoutTier = 'none';
  private betceptionResolutionTimers: number[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.bannerTimer) {
        window.clearTimeout(this.bannerTimer);
      }
      this.clearResultOverlayTimer();
      this.clearWalletRefreshTimer();
      this.clearPillTimers();
      this.clearDealerFlowTimer();
      this.clearPayoutCountTimer();
      this.clearPayoutFramePulseTimers();
      this.clearBetceptionResolutionTimers();
    });
  }

  ngOnInit() {
    this.loadBalance();
    this.loadInventory();
    this.loadBetceptionPreset();
    this.resumeActiveRoundIfAny();
    this.queueLocalWinDemoIfRequested();
    this.queueLocalSplitDemoIfRequested();
  }

  get playerHandStatus(): HandStatus | null {
    if (!this.round) return null;
    const activeSplit = this.round.splitHands?.find((hand) => hand.status === HandStatus.ACTIVE);
    return activeSplit?.status ?? this.round.playerHand?.status ?? null;
  }

  get activeHand(): HandOwnerType | null {
    if (this.round?.status === RoundStatus.IN_PROGRESS) {
      if (this.dealerFlowActive || this.shouldRunDealerTurn(this.round)) {
        return HandOwnerType.DEALER;
      }
      if (this.round.playerHand?.status === HandStatus.ACTIVE) {
        return HandOwnerType.PLAYER;
      }
      if (this.round.splitHands?.some((hand) => hand.status === HandStatus.ACTIVE)) {
        return HandOwnerType.PLAYER_SPLIT;
      }
    }
    return null;
  }

  get activeHandId(): string | null {
    if (this.round?.status !== RoundStatus.IN_PROGRESS) return null;
    if (this.dealerFlowActive || this.shouldRunDealerTurn(this.round)) {
      return this.round.dealerHand?.id ?? null;
    }
    if (this.round.playerHand?.status === HandStatus.ACTIVE) {
      return this.round.playerHand.id;
    }
    const activeSplit = this.round.splitHands?.find((hand) => hand.status === HandStatus.ACTIVE);
    return activeSplit?.id ?? null;
  }

  get activePlayerCardCount(): number {
    if (this.round?.playerHand?.status === HandStatus.ACTIVE) {
      return this.round.playerHand.cards?.length ?? 0;
    }
    const activeSplit = this.round?.splitHands?.find((hand) => hand.status === HandStatus.ACTIVE);
    return activeSplit?.cards?.length ?? 0;
  }

  get canSplitHandNow(): boolean {
    if (!this.round) return false;
    const totalHands = 1 + (this.round.splitHands?.length ?? 0);
    if (totalHands >= 4) return false;
    const activeHand =
      this.round.playerHand?.status === HandStatus.ACTIVE
        ? this.round.playerHand
        : this.round.splitHands?.find((hand) => hand.status === HandStatus.ACTIVE) ?? null;
    const cards = activeHand?.cards ?? [];
    if (cards.length !== 2) return false;
    return this.cardBlackjackValue(cards[0].rank) === this.cardBlackjackValue(cards[1].rank);
  }

  get isBusy() {
    return !!this.busyAction || this.dealerFlowActive || this.roundResolutionActive || this.showRoundOverlay || this.resultOverlayTimer !== null;
  }

  get totalSideBetAmount() {
    return (
      this.cardBetTotal +
      this.suitBetTotal +
      this.dealerBustBetAmount +
      this.pillTriggerBetAmount +
      this.blackjackBetAmount +
      this.splitCountBetTotal
    );
  }

  get cardBetTotal() {
    return this.cardBetEntries.reduce((sum, bet) => sum + bet.amount, 0);
  }

  get suitBetTotal() {
    return this.suitBetEntries.reduce((sum, bet) => sum + bet.amount, 0);
  }

  get splitCountBetTotal() {
    return this.splitCountBetEntries.reduce((sum, bet) => sum + bet.amount, 0);
  }

  get remainingBetceptionBalance() {
    if (this.balance === null) return Number.POSITIVE_INFINITY;
    return Math.max(0, this.balance - this.betAmount - this.totalSideBetAmount);
  }

  get hasFiniteRemainingBetceptionBalance() {
    return Number.isFinite(this.remainingBetceptionBalance);
  }

  get cardBetEntries() {
    return Object.entries(this.cardBets)
      .map(([key, amount]) => {
        const [suit, rank] = key.split('|') as [CardSuit, CardRank];
        return { key, suit, rank, amount };
      })
      .filter((entry) => entry.amount > 0);
  }

  get suitBetEntries() {
    return Object.entries(this.suitBets)
      .map(([suit, amount]) => ({ suit: suit as CardSuit, amount: amount ?? 0 }))
      .filter((entry) => entry.amount > 0);
  }

  get splitCountBetEntries() {
    return Object.entries(this.splitCountBets)
      .map(([count, amount]) => ({ count: Number(count), amount: amount ?? 0 }))
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => a.count - b.count);
  }

  get currentCardBetAmount() {
    return this.cardBets[this.cardBetKey(this.selectedCardSuit, this.selectedCardRank)] ?? 0;
  }

  get currentSuitBetAmount() {
    return this.suitBets[this.selectedCardSuit] ?? 0;
  }

  get currentCardMenuBetAmount() {
    return this.cardBetTarget === 'suit' ? this.currentSuitBetAmount : this.currentCardBetAmount;
  }

  get selectedCardMenuLabel() {
    if (this.cardBetTarget === 'suit') {
      return `${this.suitSymbol(this.selectedCardSuit)} ${this.suitName(this.selectedCardSuit)}`;
    }
    return this.selectedCardLabel;
  }

  get selectedCardMenuLabelKey() {
    return this.cardBetTarget === 'suit'
      ? this.i18n.t('betception.selectedSuit')
      : this.i18n.t('betception.selectedCard');
  }

  get currentSplitCountBetAmount() {
    return this.splitCountBets[this.selectedSplitCount] ?? 0;
  }

  get currentDepthLevel() {
    if (this.betceptionResolution) return this.betceptionResolution.depthLevel;
    const roundDepth = this.round ? 1 + this.roundSideBetCategoryCount() : 0;
    if (roundDepth > 1 || this.round) return roundDepth;
    if (this.betAmount <= 0) return 0;
    return 1 + this.draftSideBetCategoryCount();
  }

  get showBetceptionPanel() {
    return this.betAmount > 0 || !!this.round || !!this.betceptionResolution || this.showBetceptionMenu;
  }

  get betceptionPanelRows(): BetceptionPanelRow[] {
    if (this.betceptionResolution) {
      return this.resolutionPanelRows();
    }

    if (this.round) {
      return this.roundPanelRows();
    }

    const rows: BetceptionPanelRow[] = [];
    if (this.betAmount > 0) {
      rows.push({
        id: 'main-draft',
        label: this.i18n.t('betception.mainBet'),
        value: this.formatCoins(this.betAmount),
      });
    }
    if (this.cardBetEntries.length || this.suitBetEntries.length) {
      rows.push({
        id: 'card-draft',
        label: this.i18n.t('betception.cardBets'),
        value: '',
        items: [
          ...this.suitBetEntries.map((bet) => this.suitBetPanelItem(bet.suit, bet.amount)),
          ...this.cardBetEntries.map((bet) => this.cardBetPanelItem(bet.suit, bet.rank, bet.amount)),
        ],
      });
    }
    if (this.dealerBustBetAmount > 0) {
      rows.push({
        id: 'dealer-bust-draft',
        label: this.i18n.t('betception.dealerBustBet'),
        value: this.formatCoins(this.dealerBustBetAmount),
      });
    }
    if (this.pillTriggerBetAmount > 0) {
      rows.push({
        id: 'pill-draft',
        label: this.i18n.t('betception.pillBet'),
        value: this.formatCoins(this.pillTriggerBetAmount),
      });
    }
    if (this.blackjackBetAmount > 0) {
      rows.push({
        id: 'blackjack-draft',
        label: this.i18n.t('betception.blackjackBet'),
        value: this.formatCoins(this.blackjackBetAmount),
      });
    }
    if (this.splitCountBetEntries.length) {
      rows.push({
        id: 'split-count-draft',
        label: this.i18n.t('betception.splitCountBet'),
        value: '',
        items: this.splitCountBetEntries.map((bet) => this.splitCountPanelItem(bet.count, bet.amount)),
      });
    }
    return rows;
  }

  trackBetceptionPanelRow(_index: number, row: BetceptionPanelRow) {
    return row.id;
  }

  get betceptionConfirmLabel() {
    return this.totalSideBetAmount > 0
      ? this.i18n.t('betception.confirmAndDeal')
      : this.i18n.t('betception.continueWithout');
  }

  get payoutTier(): PayoutTier {
    if (this.finalPayoutAmount <= 0) return 'none';
    return this.payoutTierFor(Math.max(1, this.animatedPayoutAmount));
  }

  get finalPayoutTier(): PayoutTier {
    return this.payoutTierFor(this.finalPayoutAmount);
  }

  get showPayoutBurst() {
    return this.payoutTier === 'big' || this.payoutTier === 'super' || this.payoutTier === 'mega';
  }

  get payoutCelebrationLabel() {
    if (this.roundOutcome?.plus) return this.i18n.t('betception.plusResult');
    if (this.payoutTier === 'mega') return this.i18n.t('betception.megaWin');
    if (this.payoutTier === 'super') return this.i18n.t('betception.superWin');
    if (this.payoutTier === 'big') return this.i18n.t('betception.bigWin');
    if (this.payoutTier === 'win') return this.i18n.t('betception.winCelebration');
    if (this.roundOutcome?.won && this.finalPayoutAmount > 0) {
      return this.i18n.t('betception.winCelebration');
    }
    return this.roundOutcome?.headline ?? this.i18n.t('blackjack.finishedHeadline');
  }

  get animatedPayoutDisplay() {
    return this.formatCoins(this.animatedPayoutAmount);
  }

  get hasBetceptionPayout() {
    return this.betceptionPayoutAmount > 0;
  }

  get betceptionPayoutAmount() {
    if (!this.betceptionResolution) return 0;
    return this.betceptionResolution.steps
      .filter((step) => step.kind !== 'MAIN_BET')
      .reduce((sum, step) => sum + Number(step.payout ?? 0), 0);
  }

  get betceptionPayoutDisplay() {
    return this.formatCoins(this.betceptionPayoutAmount);
  }

  get betceptionPanelPayoutDisplay() {
    if (!this.betceptionResolution) return this.formatCoins(0);
    const revealedPayout = this.betceptionResolution.steps
      .slice(0, this.revealedResolutionStepCount)
      .reduce((sum, step) => sum + Number(step.payout ?? 0), 0);
    return this.formatCoins(revealedPayout);
  }

  get selectedCardLabel() {
    return `${this.suitSymbol(this.selectedCardSuit)}${this.selectedCardRank}`;
  }

  get betceptionPresetTotalLabel() {
    if (!this.betceptionPreset || this.betceptionPreset.items.length === 0) {
      return this.i18n.t('betception.presetEmptyShort');
    }
    if (this.betceptionPreset.stakeMode === 'percentage') {
      const totalPercent = this.betceptionPreset.items.reduce((sum, item) => sum + Number(item.percent ?? 0), 0);
      return `${Math.round(totalPercent * 100) / 100}%`;
    }
    const total = this.betceptionPreset.items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    return this.formatCoins(total);
  }

  get canApplyBetceptionPreset() {
    return this.validateBetceptionPreset().ok;
  }

  get betceptionPresetUnavailableReason() {
    return this.validateBetceptionPreset().message;
  }

  onPlaceBet(amount: number) {
    if (this.isRoundActive) return;
    const updated = Math.max(0, Math.round((this.betAmount + amount) * 100) / 100);
    this.betAmount = this.balance !== null ? Math.min(updated, this.balance) : updated;
  }

  onResetBet() {
    if (this.isRoundActive) return;
    this.betAmount = 0;
    this.resetBetceptionDraft();
  }

  onDeal() {
    if (this.isBusy || this.betAmount <= 0) {
      this.error = this.betAmount <= 0 ? this.i18n.t('blackjack.setBetError') : this.error;
      return;
    }
    this.error = null;
    this.showBetceptionMenu = true;
    this.betceptionView = 'overview';
  }

  onCloseBetceptionMenu() {
    if (this.isBusy) return;
    this.showBetceptionMenu = false;
    this.betceptionView = 'overview';
  }

  onOpenBetceptionPresetEditor(event?: Event) {
    event?.stopPropagation();
    this.showBetceptionPresetEditor = true;
  }

  onCloseBetceptionPresetEditor() {
    this.showBetceptionPresetEditor = false;
  }

  onBetceptionPresetSaved(response: BetceptionPresetResponse) {
    this.betceptionPreset = response.preset;
    this.appliedBetceptionPresetId = null;
  }

  onApplyBetceptionPreset() {
    if (!this.betceptionPreset) {
      this.onOpenBetceptionPresetEditor();
      return;
    }
    if (this.appliedBetceptionPresetId === this.betceptionPreset.id) {
      this.resetBetceptionDraft();
      return;
    }
    const draft = this.buildPresetDraft();
    if (!draft.ok) {
      this.toast.error(draft.message ?? this.i18n.t('betception.presetUnavailableGeneric'));
      return;
    }
    this.cardBets = draft.cardBets;
    this.suitBets = draft.suitBets;
    this.dealerBustBetAmount = draft.dealerBustBetAmount;
    this.pillTriggerBetAmount = draft.pillTriggerBetAmount;
    this.blackjackBetAmount = draft.blackjackBetAmount;
    this.splitCountBets = draft.splitCountBets;
    this.appliedBetceptionPresetId = this.betceptionPreset.id;
    this.toast.success(this.i18n.t('betception.presetApplied'));
  }

  onConfirmBetception() {
    if (this.isBusy || this.betAmount <= 0) return;
    const sideBets = this.buildSideBetPlacements();
    this.showBetceptionMenu = false;
    this.betceptionView = 'overview';
    this.runAction('deal', this.rng.startRound({ betAmount: this.betAmount, sideBets }));
  }

  onBetceptionView(view: BetceptionView) {
    this.betceptionView = view;
  }

  onSelectCardSuit(suit: CardSuit) {
    this.selectedCardSuit = suit;
    this.cardBetTarget = 'suit';
  }

  onSelectCardRank(rank: CardRank) {
    this.selectedCardRank = rank;
    this.cardBetTarget = 'card';
  }

  onAddCardBet(amount: number) {
    if (!this.canAddSideBetChip(amount, 'CARD')) return;
    this.appliedBetceptionPresetId = null;
    const key = this.cardBetKey(this.selectedCardSuit, this.selectedCardRank);
    this.cardBets = {
      ...this.cardBets,
      [key]: Math.round(((this.cardBets[key] ?? 0) + amount) * 100) / 100,
    };
  }

  onAddSuitBet(amount: number) {
    if (!this.canAddSideBetChip(amount, 'CARD')) return;
    this.appliedBetceptionPresetId = null;
    this.suitBets = {
      ...this.suitBets,
      [this.selectedCardSuit]: Math.round(((this.suitBets[this.selectedCardSuit] ?? 0) + amount) * 100) / 100,
    };
  }

  onClearSelectedCardBet() {
    this.appliedBetceptionPresetId = null;
    const key = this.cardBetKey(this.selectedCardSuit, this.selectedCardRank);
    const rest = { ...this.cardBets };
    delete rest[key];
    this.cardBets = rest;
  }

  onClearSelectedSuitBet() {
    this.appliedBetceptionPresetId = null;
    const rest = { ...this.suitBets };
    delete rest[this.selectedCardSuit];
    this.suitBets = rest;
  }

  onAddCardMenuBet(amount: number) {
    if (this.cardBetTarget === 'suit') {
      this.onAddSuitBet(amount);
      return;
    }
    this.onAddCardBet(amount);
  }

  onClearSelectedCardMenuBet() {
    if (this.cardBetTarget === 'suit') {
      this.onClearSelectedSuitBet();
      return;
    }
    this.onClearSelectedCardBet();
  }

  onAddDealerBustBet(amount: number) {
    if (!this.canAddSideBetChip(amount, 'DEALER_BUST')) return;
    this.appliedBetceptionPresetId = null;
    this.dealerBustBetAmount = Math.round((this.dealerBustBetAmount + amount) * 100) / 100;
  }

  onClearDealerBustBet() {
    this.appliedBetceptionPresetId = null;
    this.dealerBustBetAmount = 0;
  }

  onAddPillTriggerBet(amount: number) {
    if (!this.activePowerup || !this.canAddSideBetChip(amount, 'PILL_TRIGGER')) return;
    this.appliedBetceptionPresetId = null;
    this.pillTriggerBetAmount = Math.round((this.pillTriggerBetAmount + amount) * 100) / 100;
  }

  onClearPillTriggerBet() {
    this.appliedBetceptionPresetId = null;
    this.pillTriggerBetAmount = 0;
  }

  onAddBlackjackBet(amount: number) {
    if (!this.canAddSideBetChip(amount, 'PLAYER_BLACKJACK')) return;
    this.appliedBetceptionPresetId = null;
    this.blackjackBetAmount = Math.round((this.blackjackBetAmount + amount) * 100) / 100;
  }

  onClearBlackjackBet() {
    this.appliedBetceptionPresetId = null;
    this.blackjackBetAmount = 0;
  }

  onSelectSplitCount(count: number) {
    this.selectedSplitCount = count;
  }

  onAddSplitCountBet(amount: number) {
    if (!this.canAddSideBetChip(amount, 'SPLIT_COUNT')) return;
    this.appliedBetceptionPresetId = null;
    this.splitCountBets = {
      ...this.splitCountBets,
      [this.selectedSplitCount]: Math.round(((this.splitCountBets[this.selectedSplitCount] ?? 0) + amount) * 100) / 100,
    };
  }

  onClearSelectedSplitCountBet() {
    this.appliedBetceptionPresetId = null;
    const rest = { ...this.splitCountBets };
    delete rest[this.selectedSplitCount];
    this.splitCountBets = rest;
  }

  onHit() {
    if (!this.round || this.isBusy) return;
    this.runAction('hit', this.rng.hit(this.round.id));
  }

  onStand() {
    if (!this.round || this.isBusy) return;
    this.runAction('stand', this.rng.stand(this.round.id));
  }

  onDouble() {
    if (!this.round || this.isBusy) return;
    this.runAction('double', this.rng.double(this.round.id));
  }

  onSplit() {
    if (!this.round || this.isBusy) return;
    this.runAction('split', this.rng.split(this.round.id));
  }

  onSettle() {
    if (!this.round || this.isBusy) return;
    this.runAction('settle', this.rng.settle(this.round.id));
  }

  get isRoundActive() {
    const status = this.round?.status;
    return (
      status === RoundStatus.CREATED ||
      status === RoundStatus.DEALING ||
      status === RoundStatus.IN_PROGRESS
    );
  }

  canAddSideBetChip(amount: number, category?: BetceptionStakeCategory) {
    if (this.betAmount <= 0) return false;
    const nextTotalSideBets = this.totalSideBetAmount + amount;
    if (nextTotalSideBets > this.betAmount * BETCEPTION_TOTAL_STAKE_CAP) return false;
    if (this.balance !== null && this.betAmount + nextTotalSideBets > this.balance) return false;
    if (!category) return true;
    const categoryCap = this.betAmount * BETCEPTION_CATEGORY_STAKE_CAP[category];
    return this.sideBetCategoryAmount(category) + amount <= categoryCap;
  }

  private sideBetCategoryAmount(category: BetceptionStakeCategory) {
    if (category === 'CARD') return this.cardBetTotal + this.suitBetTotal;
    if (category === 'DEALER_BUST') return this.dealerBustBetAmount;
    if (category === 'PILL_TRIGGER') return this.pillTriggerBetAmount;
    if (category === 'PLAYER_BLACKJACK') return this.blackjackBetAmount;
    return this.splitCountBetTotal;
  }

  private validateBetceptionPreset(): { ok: boolean; message?: string } {
    if (!this.betceptionPreset || this.betceptionPreset.items.length === 0) {
      return { ok: false, message: this.i18n.t('betception.presetEmptyShort') };
    }
    return this.buildPresetDraft();
  }

  private buildPresetDraft(): PresetDraftResult {
    const empty = this.emptyPresetDraft();
    if (!this.betceptionPreset || this.betceptionPreset.items.length === 0) {
      return { ...empty, ok: false, message: this.i18n.t('betception.presetEmptyShort') };
    }
    if (this.betAmount <= 0) {
      return { ...empty, ok: false, message: this.i18n.t('betception.presetNeedsMainBet') };
    }

    const draft = empty;
    for (const item of this.betceptionPreset.items) {
      const amount = this.presetItemAmount(item);
      if (amount <= 0) {
        return { ...draft, ok: false, message: this.i18n.t('betception.presetAmountTooSmall') };
      }
      if (item.typeCode === 'PILL_TRIGGER' && !this.activePowerup) {
        return { ...draft, ok: false, message: this.i18n.t('betception.presetNeedsPill') };
      }
      this.addPresetItemToDraft(draft, item, amount);
      const validation = this.validatePresetDraftLimits(draft);
      if (!validation.ok) {
        return { ...draft, ok: false, message: validation.message };
      }
    }
    return { ...draft, ok: true };
  }

  private emptyPresetDraft(): PresetDraftResult {
    return {
      ok: false,
      cardBets: {},
      suitBets: {},
      dealerBustBetAmount: 0,
      pillTriggerBetAmount: 0,
      blackjackBetAmount: 0,
      splitCountBets: {},
    };
  }

  private presetItemAmount(item: BetceptionPresetItem) {
    if (this.betceptionPreset?.stakeMode === 'percentage') {
      return Math.floor((this.betAmount * Number(item.percent ?? 0)) / 100);
    }
    return Math.round(Number(item.amount ?? 0));
  }

  private addPresetItemToDraft(
    draft: PresetDraftResult,
    item: BetceptionPresetItem,
    amount: number,
  ) {
    if (item.typeCode === 'CARD_EXACT' && item.predictedSuit && item.predictedRank) {
      const key = this.cardBetKey(item.predictedSuit, item.predictedRank);
      draft.cardBets[key] = Math.round(((draft.cardBets[key] ?? 0) + amount) * 100) / 100;
      return;
    }
    if (item.typeCode === 'CARD_SUIT' && item.predictedSuit) {
      draft.suitBets[item.predictedSuit] = Math.round(((draft.suitBets[item.predictedSuit] ?? 0) + amount) * 100) / 100;
      return;
    }
    if (item.typeCode === 'DEALER_BUST') {
      draft.dealerBustBetAmount = Math.round((draft.dealerBustBetAmount + amount) * 100) / 100;
      return;
    }
    if (item.typeCode === 'PILL_TRIGGER') {
      draft.pillTriggerBetAmount = Math.round((draft.pillTriggerBetAmount + amount) * 100) / 100;
      return;
    }
    if (item.typeCode === 'PLAYER_BLACKJACK') {
      draft.blackjackBetAmount = Math.round((draft.blackjackBetAmount + amount) * 100) / 100;
      return;
    }
    if (item.typeCode === 'SPLIT_COUNT') {
      const count = Number(item.selection?.['splitCount'] ?? 0);
      if ([1, 2, 3].includes(count)) {
        draft.splitCountBets[count] = Math.round(((draft.splitCountBets[count] ?? 0) + amount) * 100) / 100;
      }
    }
  }

  private validatePresetDraftLimits(draft: PresetDraftResult) {
    const total = this.presetDraftTotal(draft);
    if (total > this.betAmount * BETCEPTION_TOTAL_STAKE_CAP) {
      return { ok: false, message: this.i18n.t('betception.presetLimitExceeded') };
    }
    if (this.balance !== null && this.betAmount + total > this.balance) {
      return { ok: false, message: this.i18n.t('betception.presetInsufficientBalance') };
    }
    const categoryAmounts: Record<BetceptionStakeCategory, number> = {
      CARD: this.presetDraftCardTotal(draft),
      DEALER_BUST: draft.dealerBustBetAmount,
      PILL_TRIGGER: draft.pillTriggerBetAmount,
      PLAYER_BLACKJACK: draft.blackjackBetAmount,
      SPLIT_COUNT: Object.values(draft.splitCountBets).reduce((sum, amount) => sum + amount, 0),
    };
    for (const category of Object.keys(categoryAmounts) as BetceptionStakeCategory[]) {
      if (categoryAmounts[category] > this.betAmount * BETCEPTION_CATEGORY_STAKE_CAP[category]) {
        return { ok: false, message: this.i18n.t('betception.presetLimitExceeded') };
      }
    }
    return { ok: true, message: '' };
  }

  private presetDraftTotal(draft: PresetDraftResult) {
    return (
      this.presetDraftCardTotal(draft) +
      draft.dealerBustBetAmount +
      draft.pillTriggerBetAmount +
      draft.blackjackBetAmount +
      Object.values(draft.splitCountBets).reduce((sum, amount) => sum + amount, 0)
    );
  }

  private presetDraftCardTotal(draft: PresetDraftResult) {
    return (
      Object.values(draft.cardBets).reduce((sum, amount) => sum + amount, 0) +
      Object.values(draft.suitBets).reduce((sum, amount) => sum + (amount ?? 0), 0)
    );
  }

  isSuitSelected(suit: CardSuit) {
    return this.selectedCardSuit === suit;
  }

  isSuitBetTarget(suit: CardSuit) {
    return this.cardBetTarget === 'suit' && this.selectedCardSuit === suit;
  }

  isRankSelected(rank: CardRank) {
    return this.selectedCardRank === rank;
  }

  cardBetAmount(suit: CardSuit, rank: CardRank) {
    return this.cardBets[this.cardBetKey(suit, rank)] ?? 0;
  }

  suitBetAmount(suit: CardSuit) {
    return this.suitBets[suit] ?? 0;
  }

  isSplitCountSelected(count: number) {
    return this.selectedSplitCount === count;
  }

  splitCountBetAmount(count: number) {
    return this.splitCountBets[count] ?? 0;
  }

  private cardBlackjackValue(rank: CardRank | null) {
    if (!rank) return -1;
    if (rank === CardRank.ACE) return 11;
    if ([CardRank.TEN, CardRank.JACK, CardRank.QUEEN, CardRank.KING].includes(rank)) return 10;
    return Number(rank);
  }

  suitSymbol(suit: CardSuit | string | null | undefined) {
    switch (suit) {
      case CardSuit.HEARTS:
        return '♥';
      case CardSuit.DIAMONDS:
        return '♦';
      case CardSuit.CLUBS:
        return '♣';
      case CardSuit.SPADES:
        return '♠';
      default:
        return '';
    }
  }

  suitName(suit: CardSuit) {
    switch (suit) {
      case CardSuit.HEARTS:
        return this.i18n.t('betception.suitHearts');
      case CardSuit.DIAMONDS:
        return this.i18n.t('betception.suitDiamonds');
      case CardSuit.CLUBS:
        return this.i18n.t('betception.suitClubs');
      case CardSuit.SPADES:
        return this.i18n.t('betception.suitSpades');
    }
  }

  isRedSuit(suit: CardSuit | string | null | undefined) {
    return suit === CardSuit.HEARTS || suit === CardSuit.DIAMONDS;
  }

  formatCoins(amount: number) {
    return `${Math.round(amount)} ${this.i18n.t('common.coins')}`;
  }

  private formatSignedCoins(amount: number) {
    const rounded = Math.round(amount);
    if (rounded > 0) return `+${this.formatCoins(rounded)}`;
    if (rounded < 0) return `-${this.formatCoins(Math.abs(rounded))}`;
    return this.formatCoins(0);
  }

  pillTriggerOddsLabel() {
    return this.activePowerup?.type.code === 'BLUE_PILL' ? '14:1' : '10.5:1';
  }

  private buildSideBetPlacements(): SideBetPlacement[] {
    const sideBets: SideBetPlacement[] = [];
    for (const entry of this.cardBetEntries) {
      sideBets.push({
        typeCode: 'CARD_EXACT',
        amount: entry.amount,
        predictedSuit: entry.suit,
        predictedRank: entry.rank,
      });
    }
    for (const entry of this.suitBetEntries) {
      sideBets.push({
        typeCode: 'CARD_SUIT',
        amount: entry.amount,
        predictedSuit: entry.suit,
      });
    }
    if (this.dealerBustBetAmount > 0) {
      sideBets.push({
        typeCode: 'DEALER_BUST',
        amount: this.dealerBustBetAmount,
      });
    }
    if (this.pillTriggerBetAmount > 0 && this.activePowerup) {
      sideBets.push({
        typeCode: 'PILL_TRIGGER',
        amount: this.pillTriggerBetAmount,
      });
    }
    if (this.blackjackBetAmount > 0) {
      sideBets.push({
        typeCode: 'PLAYER_BLACKJACK',
        amount: this.blackjackBetAmount,
      });
    }
    for (const entry of this.splitCountBetEntries) {
      sideBets.push({
        typeCode: 'SPLIT_COUNT',
        amount: entry.amount,
        selection: { splitCount: entry.count },
      });
    }
    return sideBets;
  }

  private resetBetceptionDraft() {
    this.cardBets = {};
    this.suitBets = {};
    this.dealerBustBetAmount = 0;
    this.pillTriggerBetAmount = 0;
    this.blackjackBetAmount = 0;
    this.splitCountBets = {};
    this.cardBetTarget = 'card';
    this.betceptionView = 'overview';
    this.appliedBetceptionPresetId = null;
  }

  private cardBetKey(suit: CardSuit, rank: CardRank) {
    return `${suit}|${rank}`;
  }

  private roundPanelRows(): BetceptionPanelRow[] {
    if (!this.round) return [];
    const rows: BetceptionPanelRow[] = [{
      id: 'main',
      label: this.i18n.t('betception.mainBet'),
      value: this.formatCoins(Number(this.round.mainBet.amount)),
    }];

    const sideBets = this.round.sideBets ?? [];
    const cardBets = sideBets.filter((sideBet) => sideBet.type === 'CARD_EXACT' || sideBet.type === 'CARD_SUIT');
    if (cardBets.length) {
      rows.push({
        id: 'side-card-group',
        label: this.i18n.t('betception.cardBets'),
        value: '',
        items: cardBets.map((sideBet) => this.sideBetPanelItem(sideBet)),
      });
    }

    for (const sideBet of sideBets.filter((bet) => bet.type !== 'CARD_EXACT' && bet.type !== 'CARD_SUIT')) {
      rows.push({
        id: `side-${sideBet.id}`,
        label: this.panelLabelForSideBetType(sideBet.type),
        value: this.sideBetPanelValue(sideBet),
      });
    }

    return rows;
  }

  private resolutionPanelRows(): BetceptionPanelRow[] {
    const indexed = this.betceptionResolution?.steps.map((step, index) => ({ step, index })) ?? [];
    const rows: BetceptionPanelRow[] = [];
    const main = indexed.find(({ step }) => step.kind === 'MAIN_BET');
    if (main) {
      rows.push(this.resolutionGroupRow('main-resolution', this.i18n.t('betception.mainBet'), this.formatCoins(Number(main.step.amount)), [main]));
    }

    const cardSteps = indexed.filter(({ step }) => step.kind === 'CARD_EXACT' || step.kind === 'CARD_SUIT');
    if (cardSteps.length) {
      rows.push(this.resolutionGroupRow(
        'card-resolution',
        this.i18n.t('betception.cardBets'),
        '',
        cardSteps,
        cardSteps.map(({ step }) => this.resolutionCardPanelItem(step)),
      ));
    }

    for (const kind of ['DEALER_BUST', 'PILL_TRIGGER', 'PLAYER_BLACKJACK', 'SPLIT_COUNT', 'COMBO_BONUS']) {
      const steps = indexed.filter(({ step }) => step.kind === kind);
      if (!steps.length) continue;
      const step = steps[0].step;
      rows.push(this.resolutionGroupRow(
        `${kind.toLowerCase()}-resolution`,
        this.panelLabelForSideBetType(kind),
        this.resolutionPanelValue(step),
        steps,
      ));
    }

    return rows;
  }

  private resolutionGroupRow(
    id: string,
    label: string,
    value: string,
    steps: IndexedResolutionStep[],
    items?: string[],
  ): BetceptionPanelRow {
    const revealed = steps.every(({ index }) => index < this.revealedResolutionStepCount);
    const won = steps.some(({ step }) => this.isResolutionWin(step));
    const lost = !won && steps.some(({ step }) => this.isResolutionLoss(step));
    const push = !won && !lost && steps.some(({ step }) => this.isResolutionPush(step));
    const payout = steps.reduce((sum, { step }) => sum + Number(step.payout ?? 0), 0);
    return {
      id,
      label,
      value,
      items,
      revealed,
      won: revealed && won,
      lost: revealed && lost,
      push: revealed && push,
      status: revealed ? this.resolutionGroupStatus({ won, lost, push }) : undefined,
      mark: revealed ? this.resolutionGroupMark({ won, lost, push }) : undefined,
      payout: revealed && payout > 0 ? `+${this.formatCoins(payout)}` : undefined,
    };
  }

  private resolutionGroupStatus(result: { won: boolean; lost: boolean; push: boolean }) {
    if (result.won) return this.i18n.t('betception.hit');
    if (result.push) return this.i18n.t('betception.refund');
    if (result.lost) return this.i18n.t('betception.miss');
    return this.i18n.t('betception.pending');
  }

  private resolutionGroupMark(result: { won: boolean; lost: boolean; push: boolean }) {
    if (result.won) return '✓';
    if (result.push) return '↺';
    if (result.lost) return '×';
    return '•';
  }

  private panelLabelForSideBetType(type: string) {
    if (type === 'CARD_EXACT') return this.i18n.t('betception.cardBets');
    if (type === 'CARD_SUIT') return this.i18n.t('betception.cardSuitBet');
    if (type === 'DEALER_BUST') return this.i18n.t('betception.dealerBustBet');
    if (type === 'PILL_TRIGGER') return this.i18n.t('betception.pillBet');
    if (type === 'PLAYER_BLACKJACK') return this.i18n.t('betception.blackjackBet');
    if (type === 'SPLIT_COUNT') return this.i18n.t('betception.splitCountBet');
    if (type === 'COMBO_BONUS') return this.i18n.t('betception.comboBonus');
    return type;
  }

  private sideBetPanelValue(sideBet: RoundSideBet) {
    if (sideBet.type === 'DEALER_BUST') return this.formatCoins(Number(sideBet.amount));
    if (sideBet.type === 'PILL_TRIGGER') {
      return this.formatCoins(Number(sideBet.amount));
    }
    if (sideBet.type === 'PLAYER_BLACKJACK') {
      return this.formatCoins(Number(sideBet.amount));
    }
    if (sideBet.type === 'SPLIT_COUNT') {
      return this.sideBetPanelItem(sideBet);
    }
    return this.formatCoins(Number(sideBet.amount));
  }

  private sideBetPanelItem(sideBet: RoundSideBet) {
    if (sideBet.type === 'CARD_SUIT') {
      const suit = (sideBet.selection?.['suit'] as CardSuit | undefined) ?? sideBet.predictedSuit;
      return this.suitBetPanelItem(suit, Number(sideBet.amount));
    }
    if (sideBet.type === 'SPLIT_COUNT') {
      const count = Number(sideBet.selection?.['splitCount'] ?? 0);
      return this.splitCountPanelItem(count, Number(sideBet.amount));
    }
    const suit = (sideBet.selection?.['suit'] as CardSuit | undefined) ?? sideBet.predictedSuit;
    const rank = (sideBet.selection?.['rank'] as CardRank | undefined) ?? sideBet.predictedRank;
    return this.cardBetPanelItem(suit, rank, Number(sideBet.amount));
  }

  private resolutionPanelValue(step: BetceptionResolutionStep) {
    if (step.kind === 'COMBO_BONUS') {
      return step.multiplier ? `x${Number(step.multiplier).toFixed(2)}` : '';
    }
    if (step.kind === 'DEALER_BUST') return this.formatCoins(Number(step.amount));
    return this.formatCoins(Number(step.amount));
  }

  private resolutionCardPanelItem(step: BetceptionResolutionStep) {
    if (step.kind === 'CARD_SUIT') {
      const suit = step.selection?.['suit'] as CardSuit | undefined;
      return this.suitBetPanelItem(suit, Number(step.amount));
    }
    const suit = step.selection?.['suit'] as CardSuit | undefined;
    const rank = step.selection?.['rank'] as CardRank | undefined;
    return this.cardBetPanelItem(suit, rank, Number(step.amount));
  }

  private cardBetPanelItem(suit: CardSuit | string | null | undefined, rank: CardRank | string | null | undefined, amount: number) {
    return `${this.suitSymbol(suit)}${rank ?? ''} - ${this.formatCoins(amount)}`;
  }

  private suitBetPanelItem(suit: CardSuit | string | null | undefined, amount: number) {
    return `${this.i18n.t('betception.cardSuitShort')} ${this.suitSymbol(suit)} - ${this.formatCoins(amount)}`;
  }

  private splitCountPanelItem(count: number, amount: number) {
    return `${this.i18n.t('betception.splitCountOption', { count })} - ${this.formatCoins(amount)}`;
  }

  private draftSideBetCategoryCount() {
    return [
      this.cardBetEntries.length > 0 || this.suitBetEntries.length > 0,
      this.dealerBustBetAmount > 0,
      this.pillTriggerBetAmount > 0,
      this.blackjackBetAmount > 0,
      this.splitCountBetEntries.length > 0,
    ].filter(Boolean).length;
  }

  private roundSideBetCategoryCount() {
    const categories = new Set<string>();
    for (const sideBet of this.round?.sideBets ?? []) {
      categories.add(sideBet.type === 'CARD_EXACT' || sideBet.type === 'CARD_SUIT' ? 'CARD' : sideBet.type);
    }
    return categories.size;
  }

  private sideBetLabel(
    type: string,
    selection: Record<string, unknown> | null,
    predictedSuit: CardSuit | null,
    predictedRank: CardRank | null,
  ) {
    if (type === 'CARD_EXACT') {
      const suit = (selection?.['suit'] as CardSuit | undefined) ?? predictedSuit;
      const rank = (selection?.['rank'] as CardRank | undefined) ?? predictedRank;
      return `${this.i18n.t('betception.cardExactShort')} ${this.suitSymbol(suit)}${rank ?? ''}`;
    }
    if (type === 'CARD_SUIT') {
      const suit = (selection?.['suit'] as CardSuit | undefined) ?? predictedSuit;
      return `${this.i18n.t('betception.cardSuitShort')} ${this.suitSymbol(suit)}`;
    }
    if (type === 'DEALER_BUST') return this.i18n.t('betception.dealerBustShort');
    if (type === 'PILL_TRIGGER') return this.i18n.t('betception.pillShort');
    if (type === 'PLAYER_BLACKJACK') return this.i18n.t('betception.blackjackShort');
    if (type === 'COMBO_BONUS') return this.i18n.t('betception.comboBonus');
    if (type === 'SPLIT_COUNT') {
      const count = Number(selection?.['splitCount'] ?? 0);
      return this.i18n.t('betception.splitCountOption', { count });
    }
    return type;
  }

  private resolutionStepLabel(step: BetceptionResolutionStep) {
    if (step.kind === 'MAIN_BET') return this.i18n.t('betception.mainBet');
    return this.sideBetLabel(
      step.kind,
      step.selection,
      (step.selection?.['suit'] as CardSuit | undefined) ?? null,
      (step.selection?.['rank'] as CardRank | undefined) ?? null,
    );
  }

  private resolutionStepValue(step: BetceptionResolutionStep) {
    const amount = this.formatCoins(Number(step.amount));
    const payout = step.payout !== null ? this.formatCoins(Number(step.payout)) : this.formatCoins(0);
    return `${amount} → ${payout}`;
  }

  private resolutionStepStatus(step: BetceptionResolutionStep) {
    if (this.isResolutionWin(step)) return this.i18n.t('betception.hit');
    if (this.isResolutionPush(step)) return this.i18n.t('betception.refund');
    if (this.isResolutionLoss(step)) return this.i18n.t('betception.miss');
    return this.i18n.t('betception.pending');
  }

  private resolutionStepMark(step: BetceptionResolutionStep) {
    if (this.isResolutionWin(step)) return '✓';
    if (this.isResolutionPush(step)) return '↺';
    if (this.isResolutionLoss(step)) return '×';
    return '•';
  }

  private isResolutionWin(step: BetceptionResolutionStep) {
    return step.status === MainBetStatus.WON || step.status === SideBetStatus.WON;
  }

  private isResolutionLoss(step: BetceptionResolutionStep) {
    return step.status === MainBetStatus.LOST || step.status === SideBetStatus.LOST;
  }

  private isResolutionPush(step: BetceptionResolutionStep) {
    return (
      step.status === MainBetStatus.PUSH ||
      step.status === MainBetStatus.REFUNDED ||
      step.status === SideBetStatus.REFUNDED ||
      step.status === SideBetStatus.VOID
    );
  }

  private runAction(kind: ActionKind, request$: ReturnType<Rng['startRound']>) {
    this.busyAction = kind;
    this.error = null;
    this.info = null;
    this.clearResultOverlayTimer();
    this.clearBetceptionResolutionTimers();
    this.clearDealerFlowTimer();

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const { round } = response;
          const previousRound = this.round;
          this.round = round;
          this.applyPowerupResponse(response);
          if (round.playerProgress) {
            this.levelProgress = round.playerProgress;
          }
          this.triggerBanner(round);
          if (kind === 'deal') {
            this.loadBalance();
            this.resetBetceptionDraft();
          }
          if (kind === 'settle') {
            this.dealerFlowActive = false;
            this.roundResolutionActive = true;
            this.pendingLevelUpCrate = response.levelUpCrate ?? null;
            this.pendingAchievementUnlocks = response.unlockedAchievements ?? [];
            this.scheduleBetceptionResolution(response.betceptionResolution ?? null, previousRound, round);
            this.scheduleRoundOverlay(previousRound, round, response.betceptionResolution ?? null);
            this.walletRefreshTimer = window.setTimeout(() => {
              this.loadBalance(true);
              this.walletRefreshTimer = null;
            }, 1500 + this.betceptionResolutionDuration(response.betceptionResolution ?? null));
          }
          this.busyAction = null;

          this.scheduleNextRoundStep(kind, response, previousRound, round);
        },
        error: (err) => {
          this.error = this.extractError(err);
          this.busyAction = null;
          this.dealerFlowActive = false;
          if (!this.resultOverlayTimer) {
            this.roundResolutionActive = false;
          }
        },
      });
  }

  private scheduleNextRoundStep(
    kind: ActionKind,
    response: RoundResponse,
    previousRound: RoundState | null,
    round: RoundState,
  ) {
    if (round.status === RoundStatus.SETTLED || round.status === RoundStatus.ABORTED) {
      this.dealerFlowActive = false;
      return;
    }

    if (kind === 'settle') {
      return;
    }

    if (this.shouldAutoSettle(round)) {
      const delay =
        kind === 'deal'
          ? this.initialDealDuration(round)
          : Math.max(this.cardAnimationMs, this.settlementAnimationDelay(previousRound, round));
      this.scheduleAutoSettle(round.id, delay);
      return;
    }

    if (this.shouldRunDealerTurn(round)) {
      const delay = kind === 'stand'
        ? this.dealerRevealMs
        : this.dealerStepDelay(response.dealerAction ?? null);
      this.scheduleDealerStep(round.id, delay);
      return;
    }

    this.dealerFlowActive = false;
  }

  private scheduleDealerStep(roundId: string, delay: number) {
    this.dealerFlowActive = true;
    this.clearDealerFlowTimer();
    this.dealerFlowTimer = window.setTimeout(() => {
      this.dealerFlowTimer = null;
      if (this.round?.id !== roundId || this.busyAction) return;
      this.runAction('dealer-step', this.rng.dealerStep(roundId));
    }, delay);
  }

  private scheduleAutoSettle(roundId: string, delay: number) {
    this.dealerFlowActive = true;
    this.clearDealerFlowTimer();
    this.dealerFlowTimer = window.setTimeout(() => {
      this.dealerFlowTimer = null;
      if (this.round?.id !== roundId || this.busyAction) return;
      this.runAction('settle', this.rng.settle(roundId));
    }, delay);
  }

  private shouldRunDealerTurn(round: RoundState) {
    const playerHands = this.playerHandsFor(round);
    return (
      round.status === RoundStatus.IN_PROGRESS &&
      playerHands.length > 0 &&
      playerHands.every((hand) => hand.status !== HandStatus.ACTIVE) &&
      playerHands.some((hand) => hand.status !== HandStatus.BUSTED) &&
      round.dealerHand?.status === HandStatus.ACTIVE
    );
  }

  private shouldAutoSettle(round: RoundState) {
    if (round.status !== RoundStatus.IN_PROGRESS) return false;
    if (round.dealerHand?.status === HandStatus.BLACKJACK) return true;
    const playerHands = this.playerHandsFor(round);
    if (!playerHands.length || playerHands.some((hand) => hand.status === HandStatus.ACTIVE)) {
      return false;
    }
    const naturalBlackjackAllowed = (round.splitHands?.length ?? 0) === 0;
    return (
      playerHands.every((hand) => hand.status === HandStatus.BUSTED) ||
      (naturalBlackjackAllowed && round.playerHand?.status === HandStatus.BLACKJACK) ||
      this.isDealerTurnComplete(round)
    );
  }

  private playerHandsFor(round: RoundState) {
    return [round.playerHand, ...(round.splitHands ?? [])].filter((hand): hand is NonNullable<typeof hand> => !!hand);
  }

  private isDealerTurnComplete(round: RoundState) {
    return (
      round.dealerHand?.status === HandStatus.STOOD ||
      round.dealerHand?.status === HandStatus.BUSTED ||
      round.dealerHand?.status === HandStatus.BLACKJACK
    );
  }

  private dealerStepDelay(action: DealerAction | null) {
    if (!action) return this.cardAnimationMs;
    if (action.kind === 'DRAW_CARD' || action.kind === 'BUST') {
      return this.cardAnimationMs + this.dealerFollowUpCardStepMs;
    }
    return this.resultPauseMs;
  }

  private initialDealDuration(round: RoundState) {
    const cardCount = Math.max(
      round.playerHand?.cards?.length ?? 0,
      round.dealerHand?.cards?.length ?? 0,
    );
    return this.cardAnimationMs + Math.max(0, cardCount - 1) * this.dealerFollowUpCardStepMs;
  }

  private loadBalance(preserveXpGain = false) {
    this.wallet
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ balance, level, levelProgress }) => {
          this.balance = balance;
          this.userLevel = level;
          const xpGained =
            preserveXpGain && this.levelProgress?.xp === levelProgress.xp
              ? this.levelProgress.xpGained
              : 0;
          this.levelProgress = { ...levelProgress, xpGained };
        },
        error: () => null,
      });
  }

  private loadBetceptionPreset() {
    this.betceptionPresetLoading = true;
    this.api
      .getBetceptionPreset()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ preset }) => {
          this.betceptionPreset = preset;
          if (this.appliedBetceptionPresetId && this.appliedBetceptionPresetId !== preset?.id) {
            this.appliedBetceptionPresetId = null;
          }
          this.betceptionPresetLoading = false;
        },
        error: () => {
          this.betceptionPreset = null;
          this.appliedBetceptionPresetId = null;
          this.betceptionPresetLoading = false;
        },
      });
  }

  private resumeActiveRoundIfAny() {
    this.rng
      .getActiveRound()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ round }) => {
          this.round = round;
          if (this.shouldRunDealerTurn(round)) {
            this.scheduleDealerStep(round.id, this.dealerRevealMs);
          } else if (this.shouldAutoSettle(round)) {
            this.scheduleAutoSettle(round.id, this.cardAnimationMs);
          }
        },
        error: () => null, // 404 = no active round, nothing to resume
      });
  }

  private triggerBanner(round: RoundState) {
    const isBlackjack =
      round.playerHand?.status === HandStatus.BLACKJACK &&
      round.status !== RoundStatus.SETTLED;
    if (!isBlackjack) {
      this.showBlackjackBanner = false;
      return;
    }
    this.showBlackjackBanner = true;
    if (this.bannerTimer) {
      window.clearTimeout(this.bannerTimer);
    }
    this.bannerTimer = window.setTimeout(() => {
      this.showBlackjackBanner = false;
    }, 1500);
  }

  private buildOutcomeText(round: RoundState) {
    const status = round.mainBet?.status;
    const amount = round.mainBet?.settledAmount ?? null;
    if (!status) return this.i18n.t('blackjack.completed');

    const formattedAmount =
      amount !== null ? Number(amount).toFixed(2) : null;

    if (status === MainBetStatus.WON) {
      return formattedAmount
        ? this.i18n.t('blackjack.wonPayout', { amount: formattedAmount })
        : this.i18n.t('blackjack.won');
    }
    if (status === MainBetStatus.PUSH) {
      return this.i18n.t('blackjack.pushBetBack');
    }
    if (status === MainBetStatus.REFUNDED) {
      return this.i18n.t('blackjack.refunded');
    }
    if (status === MainBetStatus.LOST) {
      return this.i18n.t('blackjack.lostNewRound');
    }
    return this.i18n.t('blackjack.completed');
  }

  onNextRound() {
    this.clearResultOverlayTimer();
    this.clearDealerFlowTimer();
    this.dealerFlowActive = false;
    this.clearPayoutCountTimer();
    this.clearPayoutFramePulseTimers();
    this.roundResolutionActive = false;
    this.showRoundOverlay = false;
    this.roundOutcome = null;
    this.round = null;
    this.info = null;
    this.pendingLevelUpCrate = null;
    this.pendingAchievementUnlocks = [];
    this.betceptionResolution = null;
    this.revealedResolutionStepCount = 0;
    this.animatedPayoutAmount = 0;
    this.finalPayoutAmount = 0;
    this.finalNetAmount = 0;
    this.finalStakeAmount = 0;
    this.lastAnimatedPayoutTier = 'none';
    this.clearBetceptionResolutionTimers();
    if (this.balance !== null && this.betAmount > this.balance) {
      this.betAmount = this.balance;
    }
  }

  onOpenPowerupMenu() {
    if (this.activePowerup) return;
    this.showPowerupMenu = true;
    if (!this.inventoryLoaded) {
      this.loadInventory();
    }
  }

  onClosePowerupMenu() {
    this.showPowerupMenu = false;
  }

  onPurchasePowerup(payload: { typeId: number; quantity: number }) {
    this.api
      .purchasePowerup(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.balance = res.balance;
          this.activePowerup = res.activePowerup;
          if (res.unlockedAchievements?.length) {
            this.showAchievementToasts(res.unlockedAchievements);
          }
          this.loadInventory();
          this.showPowerupMenu = false;
        },
        error: (err) => {
          this.error = this.extractError(err);
        },
      });
  }

  onEquipPowerup(payload: { typeId: number }) {
    this.api
      .equipPowerup(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.activePowerup = res.activePowerup;
          this.loadInventory();
          this.showPowerupMenu = false;
        },
        error: (err) => {
          this.error = this.extractError(err);
        },
      });
  }

  private loadInventory() {
    this.api
      .listInventory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.inventory = res.items;
          this.activePowerup = res.activePowerup;
          this.inventoryLoaded = true;
        },
        error: () => null,
      });
    this.api
      .listPowerups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.availablePowerups = res.items;
        },
        error: () => null,
      });
  }

  private buildRoundOutcome(round: RoundState, resolution: BetceptionResolution | null): RoundOutcome {
    const dealer = round.dealerHand;
    let dealerInfo: string | null = null;
    if (dealer) {
      const val = dealer.handValue;
      if (dealer.status === HandStatus.STOOD) {
        dealerInfo = this.i18n.t('blackjack.dealerStands', { value: val ?? '--' });
      } else if (dealer.status === HandStatus.BUSTED) {
        dealerInfo = this.i18n.t('blackjack.dealerBust', { value: val ?? '--' });
      } else if (dealer.status === HandStatus.BLACKJACK) {
        dealerInfo = this.i18n.t('blackjack.dealerBlackjack');
      }
    }

    const allBets = [round.mainBet, ...(round.splitBets ?? [])].filter(Boolean);
    const hasSettledAmounts = allBets.some((bet) => bet.settledAmount !== null);
    const mainTotals = this.roundMainBetTotals(round);
    const mainNet = this.roundCurrency(mainTotals.payout - mainTotals.stake);
    let mainHeadline = this.i18n.t('blackjack.mainSettled');
    let mainTone: RoundResultTone = 'neutral';
    let mainDetail: string | null = null;

    if (hasSettledAmounts) {
      mainDetail = this.formatSignedCoins(mainNet);
      if (mainNet > 0) {
        mainHeadline = this.i18n.t('blackjack.mainWon');
        mainTone = 'won';
      } else if (mainNet === 0 && allBets.length) {
        mainHeadline = this.i18n.t('blackjack.mainPush');
        mainTone = 'push';
      } else if (mainNet < 0) {
        mainHeadline = this.i18n.t('blackjack.mainLost');
        mainTone = 'lost';
      }

      const net = this.roundTotalNet(round, resolution);
      const detail = this.formatSignedCoins(net);
      if (net > 0) {
        const isBetceptionPlus = mainNet <= 0;
        return {
          headline: isBetceptionPlus ? this.i18n.t('betception.plusResult') : this.i18n.t('betception.winCelebration'),
          detail,
          won: true,
          lost: false,
          push: false,
          plus: isBetceptionPlus,
          dealerInfo,
          mainHeadline,
          mainDetail,
          mainTone,
        };
      }
      if (net === 0 && allBets.length) {
        return {
          headline: this.i18n.t('betception.netEven'),
          detail,
          won: false,
          lost: false,
          push: true,
          dealerInfo,
          mainHeadline,
          mainDetail,
          mainTone,
        };
      }
      if (net < 0) {
        return {
          headline: this.i18n.t('betception.netLost'),
          detail,
          won: false,
          lost: true,
          push: false,
          dealerInfo,
          mainHeadline,
          mainDetail,
          mainTone,
        };
      }
    }

    const statuses = allBets.map((bet) => bet.status);
    if (statuses.includes(MainBetStatus.WON)) {
      return {
        headline: this.i18n.t('betception.winCelebration'),
        detail: null,
        won: true,
        lost: false,
        push: false,
        dealerInfo,
        mainHeadline: this.i18n.t('blackjack.mainWon'),
        mainDetail: null,
        mainTone: 'won',
      };
    }
    if (statuses.length && statuses.every((status) => status === MainBetStatus.PUSH || status === MainBetStatus.REFUNDED)) {
      return {
        headline: this.i18n.t('betception.netEven'),
        detail: this.formatCoins(0),
        won: false,
        lost: false,
        push: true,
        dealerInfo,
        mainHeadline: this.i18n.t('blackjack.mainPush'),
        mainDetail: this.formatCoins(0),
        mainTone: 'push',
      };
    }
    if (statuses.includes(MainBetStatus.LOST)) {
      const lostStake = allBets
        .filter((bet) => bet.status === MainBetStatus.LOST)
        .reduce((sum, bet) => sum + Number(bet.amount ?? 0), 0);
      const detail = lostStake > 0 ? this.formatSignedCoins(-lostStake) : null;
      return {
        headline: this.i18n.t('betception.netLost'),
        detail,
        won: false,
        lost: true,
        push: false,
        dealerInfo,
        mainHeadline: this.i18n.t('blackjack.mainLost'),
        mainDetail: detail,
        mainTone: 'lost',
      };
    }
    return {
      headline: this.i18n.t('blackjack.finishedHeadline'),
      detail: null,
      won: false,
      lost: false,
      push: false,
      dealerInfo,
      mainHeadline,
      mainDetail,
      mainTone,
    };
  }

  private scheduleRoundOverlay(
    previousRound: RoundState | null,
    settledRound: RoundState,
    resolution: BetceptionResolution | null,
  ) {
    const info = this.buildOutcomeText(settledRound);
    const outcome = this.buildRoundOutcome(settledRound, resolution);
    const delay =
      this.settlementAnimationDelay(previousRound, settledRound) +
      this.betceptionResolutionDuration(resolution);

    this.resultOverlayTimer = window.setTimeout(() => {
      if (this.round?.id !== settledRound.id) {
        return;
      }
      this.info = info;
      this.roundOutcome = outcome;
      this.showRoundOverlay = true;
      this.startPayoutCount(settledRound, resolution);
      this.showPendingRoundToasts();
      this.resultOverlayTimer = null;
    }, delay);
  }

  private showPendingRoundToasts() {
    if (this.pendingLevelUpCrate) {
      this.showLevelUpCrateToast(this.pendingLevelUpCrate);
      this.pendingLevelUpCrate = null;
    }
    if (this.pendingAchievementUnlocks.length) {
      this.showAchievementToasts(this.pendingAchievementUnlocks);
      this.pendingAchievementUnlocks = [];
    }
  }

  private showLevelUpCrateToast(crate: LevelUpCrate) {
    this.toast.crate(
      this.i18n.t('crate.levelUpReceived', { tier: crate.tierLabel }),
      5600,
      this.i18n.t('crate.levelUpTitle'),
    );
  }

  private showAchievementToasts(achievements: readonly Achievement[]) {
    const [primaryAchievement] = achievements;
    if (!primaryAchievement) {
      return;
    }

    const extraCount = achievements.length - 1;
    const title = this.i18n.t(primaryAchievement.titleKey);
    const message = extraCount > 0
      ? `${title} ${this.i18n.t('achievement.unlockedMore', { count: extraCount })}`
      : title;

    this.toast.achievement(
      message,
      6200,
      this.i18n.t('achievement.unlockedToast'),
    );
  }

  private startPayoutCount(settledRound: RoundState, resolution: BetceptionResolution | null) {
    this.clearPayoutCountTimer();
    this.finalStakeAmount = this.roundTotalStake(settledRound, resolution);
    this.finalNetAmount = this.roundTotalNet(settledRound, resolution);
    this.finalPayoutAmount = Math.max(0, this.finalNetAmount);
    this.animatedPayoutAmount = 0;
    this.lastAnimatedPayoutTier = 'none';
    this.clearPayoutFramePulseTimers();

    if (this.finalPayoutAmount <= 0) {
      return;
    }

    this.runPayoutCounter();
  }

  private runPayoutCounter() {
    if (this.finalPayoutAmount <= 0) {
      return;
    }

    const duration = this.payoutCountDuration(this.finalPayoutTier);
    const startedAt = Date.now();
    this.payoutCountTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = progress;
      this.animatedPayoutAmount = Math.round(this.finalPayoutAmount * eased);
      this.updatePayoutTierPulse();
      if (progress >= 1) {
        this.animatedPayoutAmount = this.finalPayoutAmount;
        this.updatePayoutTierPulse();
        this.clearPayoutCountTimer();
      }
    }, 28);
  }

  private updatePayoutTierPulse() {
    const currentTier = this.payoutTierFor(this.animatedPayoutAmount);
    if (
      currentTier !== this.lastAnimatedPayoutTier &&
      currentTier !== 'none' &&
      this.lastAnimatedPayoutTier !== 'none' &&
      (currentTier === 'super' || currentTier === 'mega')
    ) {
      this.triggerPayoutFramePulse(currentTier);
    }
    this.lastAnimatedPayoutTier = currentTier;
  }

  private triggerPayoutFramePulse(tier: Exclude<PayoutTier, 'none'>) {
    this.clearPayoutFramePulseTimers();
    this.payoutFramePulseTimer = window.setTimeout(() => {
      this.payoutFramePulseTier = tier;
      this.payoutFramePulseResetTimer = window.setTimeout(() => {
        this.payoutFramePulseTier = null;
        this.payoutFramePulseResetTimer = null;
      }, 170);
      this.payoutFramePulseTimer = null;
    }, 0);
  }

  private queueLocalWinDemoIfRequested() {
    const params = new URLSearchParams(window.location.search);
    const demoWin = params.get('demoWin');
    if (!this.isLocalDevHost() || !this.isPayoutTierDemo(demoWin)) {
      return;
    }

    window.setTimeout(() => this.showLocalWinDemo(demoWin), 300);
  }

  private queueLocalSplitDemoIfRequested() {
    const params = new URLSearchParams(window.location.search);
    const demoSplit = Number(params.get('demoSplit'));
    if (!this.isLocalDevHost() || !Number.isInteger(demoSplit) || demoSplit < 1 || demoSplit > 4) {
      return;
    }

    window.setTimeout(() => this.showLocalSplitDemo(demoSplit), 300);
  }

  private showLocalSplitDemo(handCount: number) {
    const now = new Date().toISOString();
    const card = (id: string, rank: CardRank | null, suit: CardSuit | null, drawOrder: number) => ({
      id,
      rank,
      suit,
      drawOrder,
      createdAt: now,
    });
    const hand = (
      id: string,
      ownerType: HandOwnerType,
      status: HandStatus,
      handValue: number | null,
      cards: ReturnType<typeof card>[],
    ) => ({
      id,
      ownerType,
      status,
      handValue,
      cards,
    });
    const bet = (id: string, amount: string): MainBet => ({
      id,
      amount,
      status: MainBetStatus.PLACED,
      payoutMultiplier: null,
      settledAmount: null,
      settledAt: null,
    });

    this.clearResultOverlayTimer();
    this.clearDealerFlowTimer();
    this.clearBetceptionResolutionTimers();
    this.showRoundOverlay = false;
    this.showBetceptionMenu = false;
    this.betceptionResolution = null;
    this.revealedResolutionStepCount = 0;
    this.error = null;
    this.info = `Lokale Split-Demo (${handCount})`;
    this.betAmount = 100;
    if (this.balance === null) this.balance = 5000;
    const playerHands = [
      hand('demo-player-1', HandOwnerType.PLAYER, HandStatus.ACTIVE, 13, [
        card('demo-player-1-a', CardRank.EIGHT, CardSuit.HEARTS, 1),
        card('demo-player-1-b', CardRank.FIVE, CardSuit.CLUBS, 2),
      ]),
      hand('demo-player-2', HandOwnerType.PLAYER_SPLIT, HandStatus.ACTIVE, 18, [
        card('demo-player-2-a', CardRank.EIGHT, CardSuit.DIAMONDS, 1),
        card('demo-player-2-b', CardRank.QUEEN, CardSuit.SPADES, 2),
      ]),
      hand('demo-player-3', HandOwnerType.PLAYER_SPLIT, HandStatus.ACTIVE, 16, [
        card('demo-player-3-a', CardRank.EIGHT, CardSuit.CLUBS, 1),
        card('demo-player-3-b', CardRank.EIGHT, CardSuit.SPADES, 2),
      ]),
      hand('demo-player-4', HandOwnerType.PLAYER_SPLIT, HandStatus.ACTIVE, 19, [
        card('demo-player-4-a', CardRank.EIGHT, CardSuit.SPADES, 1),
        card('demo-player-4-b', CardRank.ACE, CardSuit.HEARTS, 2),
      ]),
    ];

    this.round = {
      id: `local-demo-split-${handCount}`,
      status: RoundStatus.IN_PROGRESS,
      startedAt: now,
      endedAt: null,
      mainBet: bet('demo-main-bet', '100.00'),
      splitBets: [
        bet('demo-split-bet-1', '100.00'),
        bet('demo-split-bet-2', '100.00'),
        bet('demo-split-bet-3', '100.00'),
      ].slice(0, Math.max(0, handCount - 1)),
      dealerHand: hand('demo-dealer', HandOwnerType.DEALER, HandStatus.ACTIVE, 10, [
        card('demo-dealer-1', CardRank.TEN, CardSuit.SPADES, 1),
        card('demo-dealer-2', null, null, 2),
      ]),
      playerHand: playerHands[0],
      splitHands: playerHands.slice(1, handCount),
      sideBets: [],
      playerProgress: this.levelProgress,
      fairness: {
        roundId: `local-demo-split-${handCount}`,
        status: RoundStatus.IN_PROGRESS,
        createdAt: now,
        startedAt: now,
        endedAt: null,
        serverSeedHash: null,
        serverSeed: null,
        revealedAt: null,
      },
    };
  }

  private showLocalWinDemo(tier: Exclude<PayoutTier, 'none'>) {
    const demoByTier: Record<Exclude<PayoutTier, 'none'>, { stake: number; payout: number }> = {
      win: { stake: 1000, payout: 1800 },
      big: { stake: 1000, payout: 3600 },
      super: { stake: 1000, payout: 7200 },
      mega: { stake: 1000, payout: 10300 },
    };
    const demo = demoByTier[tier];

    this.clearResultOverlayTimer();
    this.clearPayoutCountTimer();
    this.clearPayoutFramePulseTimers();
    this.clearBetceptionResolutionTimers();
    this.showBetceptionMenu = false;
    this.error = null;
    this.info = null;
    this.round = null;
    this.betAmount = demo.stake;
    this.finalStakeAmount = demo.stake;
    this.finalPayoutAmount = demo.payout;
    this.finalNetAmount = demo.payout;
    this.animatedPayoutAmount = 0;
    this.lastAnimatedPayoutTier = 'none';
    this.roundOutcome = {
      headline: this.i18n.t('betception.winCelebration'),
      detail: null,
      won: true,
      lost: false,
      push: false,
      dealerInfo: 'Lokale Demo',
      mainHeadline: this.i18n.t('blackjack.mainWon'),
      mainDetail: this.formatSignedCoins(100),
      mainTone: 'won',
    };
    this.betceptionResolution = {
      depthLevel: 4,
      totalStake: String(demo.stake),
      totalPayout: String(demo.payout),
      steps: [
        {
          id: 'demo-main',
          kind: 'MAIN_BET',
          status: MainBetStatus.WON,
          amount: '100',
          payout: '200',
          multiplier: '2.000',
          selection: null,
        },
        {
          id: 'demo-card',
          kind: 'CARD_EXACT',
          status: SideBetStatus.WON,
          amount: '500',
          payout: '6000',
          multiplier: '12.000',
          selection: { suit: CardSuit.HEARTS, rank: CardRank.JACK },
        },
        {
          id: 'demo-pill',
          kind: 'PILL_TRIGGER',
          status: SideBetStatus.WON,
          amount: '100',
          payout: '500',
          multiplier: '5.000',
          selection: { powerupCode: 'RED_PILL' },
        },
        {
          id: 'demo-blackjack',
          kind: 'PLAYER_BLACKJACK',
          status: SideBetStatus.WON,
          amount: '300',
          payout: '3600',
          multiplier: '12.000',
          selection: { target: 'PLAYER' },
        },
      ],
    };
    this.revealedResolutionStepCount = this.betceptionResolution.steps.length;
    this.showRoundOverlay = true;
    this.runPayoutCounter();
  }

  private isLocalDevHost() {
    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  }

  private isPayoutTierDemo(value: string | null): value is Exclude<PayoutTier, 'none'> {
    return value === 'win' || value === 'big' || value === 'super' || value === 'mega';
  }

  private payoutTierFor(amount: number): PayoutTier {
    const multiplier = this.payoutMultiplierFor(amount);
    if (multiplier <= 1.05) return 'none';
    if (multiplier >= 10) return 'mega';
    if (multiplier >= 6) return 'super';
    if (multiplier >= 3) return 'big';
    return 'win';
  }

  private payoutMultiplierFor(amount: number) {
    if (amount <= 0) return 0;
    if (!Number.isFinite(this.finalStakeAmount) || this.finalStakeAmount <= 0) return 1.1;
    return amount / this.finalStakeAmount;
  }

  private payoutCountDuration(tier: PayoutTier) {
    const multiplier = this.payoutMultiplierFor(this.finalPayoutAmount);
    const multiplierWeight = Math.min(1200, Math.max(0, multiplier - 1) * 140);
    if (tier === 'mega') return 4800 + multiplierWeight;
    if (tier === 'super') return 3600 + multiplierWeight;
    if (tier === 'big') return 2500 + multiplierWeight;
    return 1300 + Math.min(450, multiplierWeight * 0.45);
  }

  private roundTotalPayout(settledRound: RoundState, resolution: BetceptionResolution | null) {
    const fallback = [
      settledRound.mainBet,
      ...(settledRound.splitBets ?? []),
    ].reduce((sum, bet) => sum + Number(bet?.settledAmount ?? 0), 0);
    const total = resolution ? Number(resolution.totalPayout) : fallback;
    return Number.isFinite(total) ? Math.max(0, total) : 0;
  }

  private roundTotalNet(settledRound: RoundState, resolution: BetceptionResolution | null) {
    const total = this.roundTotalPayout(settledRound, resolution) - this.roundTotalStake(settledRound, resolution);
    return this.roundCurrency(total);
  }

  private roundTotalStake(settledRound: RoundState, resolution: BetceptionResolution | null) {
    if (resolution?.steps.length) {
      const total = resolution.steps.reduce((sum, step) => sum + Number(step.amount ?? 0), 0);
      return Number.isFinite(total) ? Math.max(0, total) : 0;
    }
    const stake = [
      settledRound.mainBet,
      ...(settledRound.splitBets ?? []),
    ].reduce((sum, bet) => sum + Number(bet?.amount ?? 0), 0);
    return Number.isFinite(stake) ? Math.max(0, stake) : 0;
  }

  private roundMainBetTotals(round: RoundState) {
    const bets = [round.mainBet, ...(round.splitBets ?? [])].filter(Boolean);
    const stake = bets.reduce((sum, bet) => sum + Number(bet?.amount ?? 0), 0);
    const payout = bets.reduce((sum, bet) => sum + Number(bet?.settledAmount ?? 0), 0);
    return {
      stake: Number.isFinite(stake) ? Math.max(0, stake) : 0,
      payout: Number.isFinite(payout) ? Math.max(0, payout) : 0,
    };
  }

  private roundCurrency(amount: number) {
    return Math.round(amount * 100) / 100;
  }

  private scheduleBetceptionResolution(
    resolution: BetceptionResolution | null,
    previousRound: RoundState | null,
    settledRound: RoundState,
  ) {
    this.clearBetceptionResolutionTimers();
    if (!resolution) {
      this.betceptionResolution = null;
      this.revealedResolutionStepCount = 0;
      return;
    }

    this.betceptionResolution = resolution;
    this.revealedResolutionStepCount = 0;
    this.scrollBetceptionPanelToTop();
    const baseDelay = this.settlementAnimationDelay(previousRound, settledRound);
    const revealCounts = this.betceptionRevealCounts(resolution);
    revealCounts.forEach((revealedCount, index) => {
      const timer = window.setTimeout(() => {
        if (this.round?.id !== settledRound.id) return;
        this.revealedResolutionStepCount = revealedCount;
        this.scrollBetceptionPanelToLatestResult();
      }, baseDelay + index * this.betceptionStepMs);
      this.betceptionResolutionTimers.push(timer);
    });
  }

  private scrollBetceptionPanelToTop() {
    window.setTimeout(() => {
      const rowsContainer = this.betceptionPanelRowsRef?.nativeElement;
      if (!rowsContainer) return;
      rowsContainer.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  private scrollBetceptionPanelToLatestResult() {
    window.setTimeout(() => {
      const rowsContainer = this.betceptionPanelRowsRef?.nativeElement;
      if (!rowsContainer) return;

      const revealedRows = rowsContainer.querySelectorAll<HTMLElement>('.betception-panel__row.has-result');
      const latestRow = revealedRows.item(revealedRows.length - 1);
      if (!latestRow) return;

      const containerRect = rowsContainer.getBoundingClientRect();
      const rowRect = latestRow.getBoundingClientRect();
      const targetTop = rowsContainer.scrollTop + rowRect.top - containerRect.top - 10;
      const maxScrollTop = rowsContainer.scrollHeight - rowsContainer.clientHeight;
      rowsContainer.scrollTo({
        top: Math.max(0, Math.min(targetTop, maxScrollTop)),
        behavior: 'smooth',
      });
    });
  }

  private betceptionResolutionDuration(resolution: BetceptionResolution | null) {
    const revealStepCount = this.betceptionRevealCounts(resolution).length;
    if (!revealStepCount) return 0;
    return revealStepCount * this.betceptionStepMs + 500;
  }

  private betceptionRevealCounts(resolution: BetceptionResolution | null) {
    if (!resolution?.steps.length) return [];

    const indexed = resolution.steps.map((step, index) => ({ step, index }));
    const counts: number[] = [];
    const pushGroup = (steps: IndexedResolutionStep[]) => {
      if (!steps.length) return;
      counts.push(Math.max(...steps.map(({ index }) => index)) + 1);
    };

    pushGroup(indexed.filter(({ step }) => step.kind === 'MAIN_BET'));
    pushGroup(indexed.filter(({ step }) => step.kind === 'CARD_EXACT' || step.kind === 'CARD_SUIT'));
    for (const kind of ['DEALER_BUST', 'PILL_TRIGGER', 'PLAYER_BLACKJACK', 'SPLIT_COUNT', 'COMBO_BONUS']) {
      pushGroup(indexed.filter(({ step }) => step.kind === kind));
    }

    return [...new Set(counts)].sort((a, b) => a - b);
  }

  private settlementAnimationDelay(previousRound: RoundState | null, settledRound: RoundState) {
    const previousDealerCards = previousRound?.dealerHand?.cards ?? [];
    const settledDealerCards = settledRound.dealerHand?.cards ?? [];
    const previousDealerCardIds = new Set(previousDealerCards.map((card) => card.id));
    const newDealerCardCount = settledDealerCards.filter((card) => !previousDealerCardIds.has(card.id)).length;
    const hadHiddenDealerCard = previousDealerCards.some(
      (card, index) =>
        card.rank === null ||
        card.suit === null ||
        (index === 1 && previousDealerCards.length === 2),
    );

    const sequentialRevealCount = hadHiddenDealerCard ? Math.max(0, settledDealerCards.length - 1) : 0;
    const revealDuration =
      sequentialRevealCount > 0
        ? this.dealerRevealMs + (sequentialRevealCount - 1) * this.dealerFollowUpCardStepMs
        : 0;
    const drawDuration =
      newDealerCardCount > 0
        ? revealDuration + this.cardAnimationMs
        : revealDuration;

    return Math.max(this.cardAnimationMs, drawDuration + this.resultPauseMs);
  }

  private applyPowerupResponse(response: {
    activePowerup?: ActivePowerup | null;
    triggeredPowerupEffect?: { color: PowerPillColor } | null;
    expiredPowerup?: { code: PowerPillCode } | null;
  }) {
    if ('activePowerup' in response) {
      this.activePowerup = response.activePowerup ?? null;
    }
    if (response.triggeredPowerupEffect) {
      this.triggerPillPulse(response.triggeredPowerupEffect.color);
    }
    if (response.expiredPowerup) {
      this.triggerPillPop(response.expiredPowerup.code);
    }
  }

  private triggerPillPulse(color: PowerPillColor) {
    if (this.pillPulseTimer) {
      window.clearTimeout(this.pillPulseTimer);
    }
    this.pillPulse = color;
    this.pillPulseTimer = window.setTimeout(() => {
      this.pillPulse = null;
      this.pillPulseTimer = null;
    }, 760);
  }

  private triggerPillPop(code: PowerPillCode) {
    if (this.pillPopTimer) {
      window.clearTimeout(this.pillPopTimer);
    }
    this.pillExpiredCode = code;
    this.pillPopTimer = window.setTimeout(() => {
      this.pillExpiredCode = null;
      this.pillPopTimer = null;
    }, 560);
  }

  private clearResultOverlayTimer() {
    if (!this.resultOverlayTimer) {
      return;
    }
    window.clearTimeout(this.resultOverlayTimer);
    this.resultOverlayTimer = null;
  }

  private clearWalletRefreshTimer() {
    if (!this.walletRefreshTimer) {
      return;
    }
    window.clearTimeout(this.walletRefreshTimer);
    this.walletRefreshTimer = null;
  }

  private clearPillTimers() {
    if (this.pillPulseTimer) {
      window.clearTimeout(this.pillPulseTimer);
      this.pillPulseTimer = null;
    }
    if (this.pillPopTimer) {
      window.clearTimeout(this.pillPopTimer);
      this.pillPopTimer = null;
    }
  }

  private clearDealerFlowTimer() {
    if (!this.dealerFlowTimer) {
      return;
    }
    window.clearTimeout(this.dealerFlowTimer);
    this.dealerFlowTimer = null;
  }

  private clearBetceptionResolutionTimers() {
    for (const timer of this.betceptionResolutionTimers) {
      window.clearTimeout(timer);
    }
    this.betceptionResolutionTimers = [];
  }

  private clearPayoutCountTimer() {
    if (!this.payoutCountTimer) {
      return;
    }
    window.clearInterval(this.payoutCountTimer);
    this.payoutCountTimer = null;
  }

  private clearPayoutFramePulseTimers() {
    if (this.payoutFramePulseTimer) {
      window.clearTimeout(this.payoutFramePulseTimer);
      this.payoutFramePulseTimer = null;
    }
    if (this.payoutFramePulseResetTimer) {
      window.clearTimeout(this.payoutFramePulseResetTimer);
      this.payoutFramePulseResetTimer = null;
    }
    this.payoutFramePulseTier = null;
  }

  private extractError(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const payload = (error as any).error;
      if (payload && typeof payload === 'object' && 'message' in payload) {
        return String(payload.message);
      }
      if (typeof payload === 'string') return payload;
      if ('message' in (error as any)) {
        return String((error as any).message);
      }
    }
    return this.i18n.t('blackjack.actionFailed');
  }
}
