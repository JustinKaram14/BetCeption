export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface AuthUser {
  sub: string;
  email: string;
  username: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  username: string;
  balance: number;
  xp: number;
  level: number;
  avatarIcon: ProfileAvatarIcon;
  avatarColor: ProfileAvatarColor;
  levelProgress: LevelProgress;
  createdAt: string;
}

export interface OwnProfile {
  id: string;
  username: string;
  email: string;
  balance: number;
  xp: number;
  level: number;
  avatarIcon: ProfileAvatarIcon;
  avatarColor: ProfileAvatarColor;
  levelProgress: LevelProgress;
  createdAt: string;
}

export type ProfileAvatarIcon =
  | 'chip'
  | 'spade'
  | 'crown'
  | 'bolt'
  | 'diamond'
  | 'orbit'
  | 'cards'
  | 'flame'
  | 'star';

export type ProfileAvatarColor =
  | 'cyan'
  | 'blue'
  | 'violet'
  | 'magenta'
  | 'red'
  | 'gold'
  | 'green'
  | 'ice'
  | 'white';

export interface LevelProgress {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  xpGained?: number;
}

export interface UserResponse {
  user: UserProfile;
}

export interface OwnProfileResponse {
  user: OwnProfile;
}

export interface UpdateOwnProfileRequest {
  username?: string;
  email?: string;
  avatarIcon?: ProfileAvatarIcon;
  avatarColor?: ProfileAvatarColor;
}

export interface ChangeOwnPasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeOwnPasswordResponse {
  success: boolean;
}

export interface CurrentUserResponse {
  user: AuthUser;
}

export enum RoundStatus {
  CREATED = 'created',
  DEALING = 'dealing',
  IN_PROGRESS = 'in_progress',
  SETTLED = 'settled',
  ABORTED = 'aborted',
}

export enum HandOwnerType {
  DEALER = 'dealer',
  PLAYER = 'player',
  PLAYER_SPLIT = 'player_split',
}

export enum HandStatus {
  ACTIVE = 'active',
  STOOD = 'stood',
  BUSTED = 'busted',
  BLACKJACK = 'blackjack',
  SURRENDERED = 'surrendered',
  SETTLED = 'settled',
}

export enum CardRank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
}

export enum CardSuit {
  CLUBS = 'C',
  DIAMONDS = 'D',
  HEARTS = 'H',
  SPADES = 'S',
}

export enum MainBetStatus {
  PLACED = 'placed',
  WON = 'won',
  LOST = 'lost',
  PUSH = 'push',
  REFUNDED = 'refunded',
  VOID = 'void',
}

export enum SideBetColor {
  RED = 'RED',
  BLACK = 'BLACK',
}

export enum SideBetTargetContext {
  FIRST_PLAYER_CARD = 'FIRST_PLAYER_CARD',
  FIRST_DEALER_CARD = 'FIRST_DEALER_CARD',
}

export enum SideBetStatus {
  PLACED = 'placed',
  WON = 'won',
  LOST = 'lost',
  REFUNDED = 'refunded',
  VOID = 'void',
}

export type BetceptionSideBetCode =
  | 'CARD_EXACT'
  | 'CARD_SUIT'
  | 'DEALER_BUST'
  | 'PILL_TRIGGER'
  | 'PLAYER_BLACKJACK'
  | 'SPLIT_COUNT';

export enum WalletTransactionKind {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  BET_PLACE = 'bet_place',
  BET_WIN = 'bet_win',
  BET_REFUND = 'bet_refund',
  ADJUSTMENT = 'adjustment',
  REWARD = 'reward',
  CRATE_REWARD = 'crate_reward',
}

export interface WalletSummary {
  id: string;
  username: string;
  balance: number;
  xp: number;
  level: number;
  levelProgress: LevelProgress;
  lastDailyRewardAt: string | null;
}

export interface WalletSummaryResponse extends WalletSummary {}

export type QueryValue =
  | string
  | number
  | boolean
  | ReadonlyArray<string | number | boolean>
  | null
  | undefined;

export interface WalletTransactionsQuery {
  [key: string]: QueryValue;
  page?: number;
  limit?: number;
}

export interface WalletTransaction {
  id: string;
  kind: WalletTransactionKind;
  amount: number;
  refTable: string | null;
  refId: string | null;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: WalletTransaction[];
}

export interface WalletTransactionsSummaryResponse {
  totalWins: number;
  totalLossesOrBets: number;
  netTotal: number;
  transactionCount: number;
}

export interface WalletAdjustmentRequest {
  amount: number;
  reference?: string;
}

export interface WalletAdjustmentResponse {
  message: string;
  balance: number;
  transactionId: string;
}

export interface DailyRewardResponse {
  claimedDay: number;
  reward: DayRewardScheduleItem;
  claimedAmount: number;
  balance: number;
  eligibleAt: string;
  loginStreak: number;
  streakReset: boolean;
}

export interface DayRewardScheduleItem {
  day: number;
  kind: 'coins' | 'powerup';
  coins?: number;
  powerupCode?: string;
  powerupLabel?: string;
  isMilestone: boolean;
  label: string;
  icon: string;
}

export interface DailyRewardStatusResponse {
  loginStreak: number;
  currentDay: number;
  lastClaimedAt: string | null;
  eligibleAt: string | null;
  isEligible: boolean;
  schedule: DayRewardScheduleItem[];
  streakReset: boolean;
}

export interface PowerupType {
  id: number;
  code: PowerPillCode;
  title: string;
  description: string | null;
  minLevel: number;
  price: number;
  effect: Record<string, unknown> | null;
}

export type PowerPillCode = 'RED_PILL' | 'BLUE_PILL';
export type PowerPillColor = 'red' | 'blue';

export interface ActivePowerup {
  type: PowerupType;
  usesRemaining: number;
}

export interface TriggeredPowerupEffect {
  code: PowerPillCode;
  color: PowerPillColor;
}

export interface PowerupListResponse {
  items: PowerupType[];
}

export interface PurchasePowerupRequest {
  typeId: number;
  quantity?: number;
}

export interface PurchasePowerupResponse {
  message: string;
  balance: number;
  quantity: number;
  activePowerup: ActivePowerup | null;
}

export interface EquipPowerupRequest {
  typeId: number;
}

export interface EquipPowerupResponse {
  message: string;
  quantity: number;
  activePowerup: ActivePowerup | null;
}

export interface InventoryPowerup {
  id: string;
  quantity: number;
  acquiredAt: string;
  type: PowerupType | null;
}

export interface InventoryResponse {
  items: InventoryPowerup[];
  activePowerup: ActivePowerup | null;
}

export interface LeaderboardQuery {
  [key: string]: QueryValue;
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponse<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
  currentUserRank: number | null;
}

export interface BalanceLeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  balance: number;
}

export interface LevelLeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  level: number;
  xp: number;
}

export interface WinningsLeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  netWinnings7d: number;
}

export interface RoundCard {
  id: string;
  rank: CardRank | null;
  suit: CardSuit | null;
  drawOrder: number;
  createdAt: string;
}

export interface RoundHand {
  id: string;
  ownerType: HandOwnerType;
  status: HandStatus;
  handValue: number | null;
  cards: RoundCard[];
}

export interface MainBet {
  id: string;
  amount: string;
  status: MainBetStatus;
  payoutMultiplier: string | null;
  settledAmount: string | null;
  settledAt: string | null;
}

export interface RoundSideBet {
  id: string;
  type: string;
  amount: string;
  status: SideBetStatus;
  odds: string | null;
  predictedColor: SideBetColor | null;
  predictedSuit: CardSuit | null;
  predictedRank: CardRank | null;
  targetContext: SideBetTargetContext;
  selection: Record<string, unknown> | null;
  settledAmount: string | null;
  settledAt: string | null;
}

export interface BetceptionResolutionStep {
  id: string;
  kind: 'MAIN_BET' | BetceptionSideBetCode | string;
  status: MainBetStatus | SideBetStatus;
  amount: string;
  payout: string | null;
  multiplier: string | null;
  selection: Record<string, unknown> | null;
}

export interface BetceptionResolution {
  depthLevel: number;
  totalPayout: string;
  totalStake: string;
  steps: BetceptionResolutionStep[];
}

export type DealerActionKind =
  | 'REVEAL_HOLE'
  | 'DRAW_CARD'
  | 'STAND'
  | 'BUST'
  | 'BLACKJACK'
  | 'NONE';

export interface DealerAction {
  kind: DealerActionKind;
  cardId: string | null;
  dealerTurnComplete: boolean;
}

export interface FairnessPayload {
  roundId: string;
  status: RoundStatus;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  serverSeedHash: string | null;
  serverSeed: string | null;
  revealedAt: string | null;
}

export interface RoundState {
  id: string;
  status: RoundStatus;
  startedAt: string | null;
  endedAt: string | null;
  mainBet: MainBet;
  splitBets: MainBet[];
  playerHand: RoundHand;
  splitHands: RoundHand[];
  dealerHand: RoundHand;
  sideBets: RoundSideBet[];
  playerProgress: LevelProgress | null;
  fairness: FairnessPayload;
}

export interface RoundResponse {
  round: RoundState;
  dealerAction?: DealerAction | null;
  levelUpCrate?: LevelUpCrate | null;
  activePowerup?: ActivePowerup | null;
  triggeredPowerupEffect?: TriggeredPowerupEffect | null;
  expiredPowerup?: TriggeredPowerupEffect | null;
  betceptionResolution?: BetceptionResolution | null;
}

export interface SideBetPlacement {
  typeId?: number;
  typeCode?: BetceptionSideBetCode;
  amount: number;
  predictedColor?: SideBetColor;
  predictedSuit?: CardSuit;
  predictedRank?: CardRank;
  targetContext?: SideBetTargetContext;
  selection?: Record<string, unknown>;
}

export interface StartRoundRequest {
  betAmount: number;
  sideBets?: SideBetPlacement[];
}

export interface RoundIdParams {
  roundId: string;
}

export interface ConsumePowerupRequest {
  typeId: number;
  quantity: number;
  roundId?: string;
}

export interface ConsumePowerupResponse {
  message: string;
  consumed: number;
  remaining: number;
  powerup: {
    id: number;
    code: string;
    title: string;
    effect: Record<string, unknown> | null;
  };
  roundId: string | null;
}

export interface PeekCardResponse {
  rank: string;
  suit: string;
}

export interface SwapCardRequest {
  cardId: string;
}

export interface FairnessRoundResponse {
  round: FairnessPayload;
}

export interface FairnessHistoryQuery {
  [key: string]: QueryValue;
  limit?: number;
  page?: number;
}

export interface FairnessHistoryResponse {
  page: number;
  pageSize: number;
  total: number;
  items: FairnessPayload[];
}

// ── Crate system ──────────────────────────────────────────────────────────────

export interface LevelUpCrate {
  id: string;
  tier: number;
  tierLabel: string;
  acquiredLevel: number;
}

export interface CrateReward {
  kind: 'coins' | 'powerup';
  coins: number | null;
  powerup: { id: number; code: string; title: string; quantity?: number } | null;
}

export interface UserCrateItem {
  id: string;
  tier: number;
  tierLabel: string;
  acquiredLevel: number;
  acquiredAt: string;
  opened: boolean;
  openedAt: string | null;
  reward: CrateReward | null;
}

export interface CrateListResponse {
  items: UserCrateItem[];
}

export interface OpenCrateResponse {
  crate: UserCrateItem;
  balance: number;
}
