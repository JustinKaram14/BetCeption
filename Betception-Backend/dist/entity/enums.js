export var RoundStatus;
(function (RoundStatus) {
    RoundStatus["CREATED"] = "created";
    RoundStatus["DEALING"] = "dealing";
    RoundStatus["IN_PROGRESS"] = "in_progress";
    RoundStatus["SETTLED"] = "settled";
    RoundStatus["ABORTED"] = "aborted";
})(RoundStatus || (RoundStatus = {}));
export var HandOwnerType;
(function (HandOwnerType) {
    HandOwnerType["DEALER"] = "dealer";
    HandOwnerType["PLAYER"] = "player";
})(HandOwnerType || (HandOwnerType = {}));
export var HandStatus;
(function (HandStatus) {
    HandStatus["ACTIVE"] = "active";
    HandStatus["STOOD"] = "stood";
    HandStatus["BUSTED"] = "busted";
    HandStatus["BLACKJACK"] = "blackjack";
    HandStatus["SURRENDERED"] = "surrendered";
    HandStatus["SETTLED"] = "settled";
})(HandStatus || (HandStatus = {}));
export var CardRank;
(function (CardRank) {
    CardRank["TWO"] = "2";
    CardRank["THREE"] = "3";
    CardRank["FOUR"] = "4";
    CardRank["FIVE"] = "5";
    CardRank["SIX"] = "6";
    CardRank["SEVEN"] = "7";
    CardRank["EIGHT"] = "8";
    CardRank["NINE"] = "9";
    CardRank["TEN"] = "10";
    CardRank["JACK"] = "J";
    CardRank["QUEEN"] = "Q";
    CardRank["KING"] = "K";
    CardRank["ACE"] = "A";
})(CardRank || (CardRank = {}));
export var CardSuit;
(function (CardSuit) {
    CardSuit["CLUBS"] = "C";
    CardSuit["DIAMONDS"] = "D";
    CardSuit["HEARTS"] = "H";
    CardSuit["SPADES"] = "S";
})(CardSuit || (CardSuit = {}));
export var MainBetStatus;
(function (MainBetStatus) {
    MainBetStatus["PLACED"] = "placed";
    MainBetStatus["WON"] = "won";
    MainBetStatus["LOST"] = "lost";
    MainBetStatus["PUSH"] = "push";
    MainBetStatus["REFUNDED"] = "refunded";
    MainBetStatus["VOID"] = "void";
})(MainBetStatus || (MainBetStatus = {}));
export var SideBetColor;
(function (SideBetColor) {
    SideBetColor["RED"] = "RED";
    SideBetColor["BLACK"] = "BLACK";
})(SideBetColor || (SideBetColor = {}));
export var SideBetTargetContext;
(function (SideBetTargetContext) {
    SideBetTargetContext["FIRST_PLAYER_CARD"] = "FIRST_PLAYER_CARD";
    SideBetTargetContext["FIRST_DEALER_CARD"] = "FIRST_DEALER_CARD";
})(SideBetTargetContext || (SideBetTargetContext = {}));
export var SideBetStatus;
(function (SideBetStatus) {
    SideBetStatus["PLACED"] = "placed";
    SideBetStatus["WON"] = "won";
    SideBetStatus["LOST"] = "lost";
    SideBetStatus["REFUNDED"] = "refunded";
    SideBetStatus["VOID"] = "void";
})(SideBetStatus || (SideBetStatus = {}));
export var WalletTransactionKind;
(function (WalletTransactionKind) {
    WalletTransactionKind["DEPOSIT"] = "deposit";
    WalletTransactionKind["WITHDRAW"] = "withdraw";
    WalletTransactionKind["BET_PLACE"] = "bet_place";
    WalletTransactionKind["BET_WIN"] = "bet_win";
    WalletTransactionKind["BET_REFUND"] = "bet_refund";
    WalletTransactionKind["ADJUSTMENT"] = "adjustment";
    WalletTransactionKind["REWARD"] = "reward";
})(WalletTransactionKind || (WalletTransactionKind = {}));
