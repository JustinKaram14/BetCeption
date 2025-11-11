var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { HandOwnerType, HandStatus } from './enums.js';
import { Round } from './Round.js';
import { User } from './User.js';
import { Card } from './Card.js';
import { MainBet } from './MainBet.js';
let Hand = class Hand {
    id;
    round;
    ownerType;
    user = null;
    parent = null;
    children;
    status;
    handValue = null;
    createdAt;
    cards;
    mainBet;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], Hand.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Round, (round) => round.hands, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'round_id' }),
    __metadata("design:type", Round)
], Hand.prototype, "round", void 0);
__decorate([
    Column({
        name: 'owner_type',
        type: 'enum',
        enum: HandOwnerType,
    }),
    __metadata("design:type", String)
], Hand.prototype, "ownerType", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.hands, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", Object)
], Hand.prototype, "user", void 0);
__decorate([
    ManyToOne(() => Hand, (hand) => hand.children, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    JoinColumn({ name: 'parent_hand_id' }),
    __metadata("design:type", Object)
], Hand.prototype, "parent", void 0);
__decorate([
    OneToMany(() => Hand, (hand) => hand.parent),
    __metadata("design:type", Array)
], Hand.prototype, "children", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: HandStatus,
        default: HandStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Hand.prototype, "status", void 0);
__decorate([
    Column({ name: 'hand_value', type: 'tinyint', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], Hand.prototype, "handValue", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], Hand.prototype, "createdAt", void 0);
__decorate([
    OneToMany(() => Card, (card) => card.hand),
    __metadata("design:type", Array)
], Hand.prototype, "cards", void 0);
__decorate([
    OneToOne(() => MainBet, (bet) => bet.hand),
    __metadata("design:type", MainBet)
], Hand.prototype, "mainBet", void 0);
Hand = __decorate([
    Entity({ name: 'hands' })
], Hand);
export { Hand };
