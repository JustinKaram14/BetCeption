var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { CardRank, CardSuit } from './enums.js';
import { Hand } from './Hand.js';
let Card = class Card {
    id;
    hand;
    drawOrder;
    rank;
    suit;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], Card.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Hand, (hand) => hand.cards, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'hand_id' })
], Card.prototype, "hand", void 0);
__decorate([
    Column({ name: 'draw_order', type: 'tinyint', unsigned: true })
], Card.prototype, "drawOrder", void 0);
__decorate([
    Column({ type: 'enum', enum: CardRank })
], Card.prototype, "rank", void 0);
__decorate([
    Column({ type: 'enum', enum: CardSuit })
], Card.prototype, "suit", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], Card.prototype, "createdAt", void 0);
Card = __decorate([
    Entity({ name: 'cards' })
], Card);
export { Card };
