var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { Round } from './Round.js';
import { User } from './User.js';
import { SidebetType } from './SidebetType.js';
import { CardRank, CardSuit, SideBetColor, SideBetStatus, SideBetTargetContext, } from './enums.js';
let SideBet = class SideBet {
    id;
    round;
    user;
    type;
    amount;
    predictedColor = null;
    predictedSuit = null;
    predictedRank = null;
    targetContext;
    status;
    odds = null;
    settledAmount = null;
    createdAt;
    settledAt = null;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], SideBet.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Round, (round) => round.sideBets, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'round_id' }),
    __metadata("design:type", Round)
], SideBet.prototype, "round", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.sideBets, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", User)
], SideBet.prototype, "user", void 0);
__decorate([
    ManyToOne(() => SidebetType, (type) => type.sideBets, {
        onDelete: 'RESTRICT',
    }),
    JoinColumn({ name: 'type_id' }),
    __metadata("design:type", SidebetType)
], SideBet.prototype, "type", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
    }),
    __metadata("design:type", String)
], SideBet.prototype, "amount", void 0);
__decorate([
    Column({
        name: 'predicted_color',
        type: 'enum',
        enum: SideBetColor,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SideBet.prototype, "predictedColor", void 0);
__decorate([
    Column({
        name: 'predicted_suit',
        type: 'enum',
        enum: CardSuit,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SideBet.prototype, "predictedSuit", void 0);
__decorate([
    Column({
        name: 'predicted_rank',
        type: 'enum',
        enum: CardRank,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SideBet.prototype, "predictedRank", void 0);
__decorate([
    Column({
        name: 'target_context',
        type: 'enum',
        enum: SideBetTargetContext,
        default: SideBetTargetContext.FIRST_PLAYER_CARD,
    }),
    __metadata("design:type", String)
], SideBet.prototype, "targetContext", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: SideBetStatus,
        default: SideBetStatus.PLACED,
    }),
    __metadata("design:type", String)
], SideBet.prototype, "status", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 8,
        scale: 3,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SideBet.prototype, "odds", void 0);
__decorate([
    Column({
        name: 'settled_amount',
        type: 'decimal',
        precision: 18,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SideBet.prototype, "settledAmount", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], SideBet.prototype, "createdAt", void 0);
__decorate([
    Column({ name: 'settled_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SideBet.prototype, "settledAt", void 0);
SideBet = __decorate([
    Entity({ name: 'side_bets' })
], SideBet);
export { SideBet };
