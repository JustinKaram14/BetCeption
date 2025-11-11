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
