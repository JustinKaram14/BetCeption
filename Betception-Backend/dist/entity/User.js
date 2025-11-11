var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Index, } from 'typeorm';
import { Session } from './Session.js';
import { Hand } from './Hand.js';
import { MainBet } from './MainBet.js';
import { SideBet } from './SideBet.js';
import { WalletTransaction } from './WalletTransaction.js';
import { DailyRewardClaim } from './DailyRewardClaim.js';
import { UserPowerup } from './UserPowerup.js';
import { PowerupConsumption } from './PowerupConsumption.js';
let User = class User {
    id;
    username;
    email;
    passwordHash;
    balance;
    xp;
    level;
    lastLoginAt = null;
    lastDailyRewardAt = null;
    createdAt;
    sessions;
    hands;
    mainBets;
    sideBets;
    walletTransactions;
    dailyRewardClaims;
    powerups;
    powerupConsumptions;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column({ name: 'password_hash', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
        default: () => '0.00',
    }),
    __metadata("design:type", String)
], User.prototype, "balance", void 0);
__decorate([
    Column({ type: 'int', default: () => '0' }),
    __metadata("design:type", Number)
], User.prototype, "xp", void 0);
__decorate([
    Column({ type: 'int', default: () => '1' }),
    __metadata("design:type", Number)
], User.prototype, "level", void 0);
__decorate([
    Column({ name: 'last_login_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    Column({ name: 'last_daily_reward_at', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastDailyRewardAt", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    OneToMany(() => Session, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
__decorate([
    OneToMany(() => Hand, (hand) => hand.user),
    __metadata("design:type", Array)
], User.prototype, "hands", void 0);
__decorate([
    OneToMany(() => MainBet, (bet) => bet.user),
    __metadata("design:type", Array)
], User.prototype, "mainBets", void 0);
__decorate([
    OneToMany(() => SideBet, (bet) => bet.user),
    __metadata("design:type", Array)
], User.prototype, "sideBets", void 0);
__decorate([
    OneToMany(() => WalletTransaction, (tx) => tx.user),
    __metadata("design:type", Array)
], User.prototype, "walletTransactions", void 0);
__decorate([
    OneToMany(() => DailyRewardClaim, (claim) => claim.user),
    __metadata("design:type", Array)
], User.prototype, "dailyRewardClaims", void 0);
__decorate([
    OneToMany(() => UserPowerup, (powerup) => powerup.user),
    __metadata("design:type", Array)
], User.prototype, "powerups", void 0);
__decorate([
    OneToMany(() => PowerupConsumption, (consumption) => consumption.user),
    __metadata("design:type", Array)
], User.prototype, "powerupConsumptions", void 0);
User = __decorate([
    Entity({ name: 'users' }),
    Index(['email']),
    Index(['username'])
], User);
export { User };
