var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], User.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, unique: true })
], User.prototype, "username", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, unique: true })
], User.prototype, "email", void 0);
__decorate([
    Column({ name: 'password_hash', type: 'varchar', length: 255 })
], User.prototype, "passwordHash", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
        default: () => '0.00',
    })
], User.prototype, "balance", void 0);
__decorate([
    Column({ type: 'int', default: () => '0' })
], User.prototype, "xp", void 0);
__decorate([
    Column({ type: 'int', default: () => '1' })
], User.prototype, "level", void 0);
__decorate([
    Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
], User.prototype, "lastLoginAt", void 0);
__decorate([
    Column({ name: 'last_daily_reward_at', type: 'date', nullable: true })
], User.prototype, "lastDailyRewardAt", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], User.prototype, "createdAt", void 0);
__decorate([
    OneToMany(() => Session, (session) => session.user)
], User.prototype, "sessions", void 0);
__decorate([
    OneToMany(() => Hand, (hand) => hand.user)
], User.prototype, "hands", void 0);
__decorate([
    OneToMany(() => MainBet, (bet) => bet.user)
], User.prototype, "mainBets", void 0);
__decorate([
    OneToMany(() => SideBet, (bet) => bet.user)
], User.prototype, "sideBets", void 0);
__decorate([
    OneToMany(() => WalletTransaction, (tx) => tx.user)
], User.prototype, "walletTransactions", void 0);
__decorate([
    OneToMany(() => DailyRewardClaim, (claim) => claim.user)
], User.prototype, "dailyRewardClaims", void 0);
__decorate([
    OneToMany(() => UserPowerup, (powerup) => powerup.user)
], User.prototype, "powerups", void 0);
__decorate([
    OneToMany(() => PowerupConsumption, (consumption) => consumption.user)
], User.prototype, "powerupConsumptions", void 0);
User = __decorate([
    Entity({ name: 'users' }),
    Index(['email']),
    Index(['username'])
], User);
export { User };
