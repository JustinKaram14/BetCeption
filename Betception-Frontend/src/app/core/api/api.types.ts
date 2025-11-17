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
  email: string;
  balance: number;
  xp: number;
  level: number;
  lastDailyRewardAt: string | null;
}

export interface UserResponse {
  user: UserProfile;
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

export enum WalletTransactionKind {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  BET_PLACE = 'bet_place',
  BET_WIN = 'bet_win',
  BET_REFUND = 'bet_refund',
  ADJUSTMENT = 'adjustment',
  REWARD = 'reward',
}

export interface WalletSummary {
  id: string;
  username: string;
  balance: number;
  xp: number;
  level: number;
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
  claimedAmount: number;
  balance: number;
  eligibleAt: string;
}

export interface PowerupType {
  id: number;
  code: string;
  title: string;
  description: string | null;
  minLevel: number;
  price: number;
  effect: Record<string, unknown> | null;
}

export interface PowerupListResponse {
  items: PowerupType[];
}

export interface PurchasePowerupRequest {
  typeId: number;
  quantity: number;
}

export interface PurchasePowerupResponse {
  message: string;
  balance: number;
  quantity: number;
}

export interface InventoryPowerup {
  id: string;
  quantity: number;
  acquiredAt: string;
  type: PowerupType | null;
}

export interface InventoryResponse {
  items: InventoryPowerup[];
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
  netWinnings7d: number;
}

export interface RoundCard {
  id: string;
  rank: CardRank;
  suit: CardSuit;
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
  settledAmount: string | null;
  settledAt: string | null;
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
  playerHand: RoundHand;
  dealerHand: RoundHand;
  sideBets: RoundSideBet[];
  fairness: FairnessPayload;
}

export interface RoundResponse {
  round: RoundState;
}

export interface SideBetPlacement {
  typeId: number;
  amount: number;
  predictedColor?: SideBetColor;
  predictedSuit?: CardSuit;
  predictedRank?: CardRank;
  targetContext?: SideBetTargetContext;
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
