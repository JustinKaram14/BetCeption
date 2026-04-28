var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { Round } from './Round.js';
import { Hand } from './Hand.js';
import { User } from './User.js';
import { MainBetStatus } from './enums.js';
let MainBet = class MainBet {
    id;
    round;
    hand;
    user;
    amount;
    status;
    payoutMultiplier = null;
    settledAmount = null;
    createdAt;
    settledAt = null;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], MainBet.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Round, (round) => round.mainBets, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'round_id' })
], MainBet.prototype, "round", void 0);
__decorate([
    OneToOne(() => Hand, (hand) => hand.mainBet, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'hand_id' })
], MainBet.prototype, "hand", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.mainBets, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' })
], MainBet.prototype, "user", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
    })
], MainBet.prototype, "amount", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: MainBetStatus,
        default: MainBetStatus.PLACED,
    })
], MainBet.prototype, "status", void 0);
__decorate([
    Column({
        name: 'payout_multiplier',
        type: 'decimal',
        precision: 6,
        scale: 3,
        nullable: true,
    })
], MainBet.prototype, "payoutMultiplier", void 0);
__decorate([
    Column({
        name: 'settled_amount',
        type: 'decimal',
        precision: 18,
        scale: 2,
        nullable: true,
    })
], MainBet.prototype, "settledAmount", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], MainBet.prototype, "createdAt", void 0);
__decorate([
    Column({ name: 'settled_at', type: 'timestamp', nullable: true })
], MainBet.prototype, "settledAt", void 0);
MainBet = __decorate([
    Entity({ name: 'main_bets' })
], MainBet);
export { MainBet };
