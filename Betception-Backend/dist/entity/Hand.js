var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], Hand.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Round, (round) => round.hands, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'round_id' })
], Hand.prototype, "round", void 0);
__decorate([
    Column({
        name: 'owner_type',
        type: 'enum',
        enum: HandOwnerType,
    })
], Hand.prototype, "ownerType", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.hands, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    JoinColumn({ name: 'user_id' })
], Hand.prototype, "user", void 0);
__decorate([
    ManyToOne(() => Hand, (hand) => hand.children, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    JoinColumn({ name: 'parent_hand_id' })
], Hand.prototype, "parent", void 0);
__decorate([
    OneToMany(() => Hand, (hand) => hand.parent)
], Hand.prototype, "children", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: HandStatus,
        default: HandStatus.ACTIVE,
    })
], Hand.prototype, "status", void 0);
__decorate([
    Column({ name: 'hand_value', type: 'tinyint', unsigned: true, nullable: true })
], Hand.prototype, "handValue", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], Hand.prototype, "createdAt", void 0);
__decorate([
    OneToMany(() => Card, (card) => card.hand)
], Hand.prototype, "cards", void 0);
__decorate([
    OneToOne(() => MainBet, (bet) => bet.hand)
], Hand.prototype, "mainBet", void 0);
Hand = __decorate([
    Entity({ name: 'hands' })
], Hand);
export { Hand };
