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
import { User } from './User.js';
let DailyRewardClaim = class DailyRewardClaim {
    id;
    user;
    claimDate;
    amount;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], DailyRewardClaim.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.dailyRewardClaims, {
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", User)
], DailyRewardClaim.prototype, "user", void 0);
__decorate([
    Column({ name: 'claim_date', type: 'date' }),
    __metadata("design:type", String)
], DailyRewardClaim.prototype, "claimDate", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
        default: () => '0',
    }),
    __metadata("design:type", String)
], DailyRewardClaim.prototype, "amount", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], DailyRewardClaim.prototype, "createdAt", void 0);
DailyRewardClaim = __decorate([
    Entity({ name: 'daily_reward_claims' })
], DailyRewardClaim);
export { DailyRewardClaim };
