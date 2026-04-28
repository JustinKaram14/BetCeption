var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { User } from './User.js';
import { PowerupType } from './PowerupType.js';
import { Round } from './Round.js';
let PowerupConsumption = class PowerupConsumption {
    id;
    user;
    type;
    round = null;
    consumedAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], PowerupConsumption.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.powerupConsumptions, {
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'user_id' })
], PowerupConsumption.prototype, "user", void 0);
__decorate([
    ManyToOne(() => PowerupType, (type) => type.powerupConsumptions, {
        onDelete: 'RESTRICT',
    }),
    JoinColumn({ name: 'type_id' })
], PowerupConsumption.prototype, "type", void 0);
__decorate([
    ManyToOne(() => Round, (round) => round.powerupConsumptions, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    JoinColumn({ name: 'round_id' })
], PowerupConsumption.prototype, "round", void 0);
__decorate([
    Column({
        name: 'consumed_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], PowerupConsumption.prototype, "consumedAt", void 0);
PowerupConsumption = __decorate([
    Entity({ name: 'powerup_consumptions' })
], PowerupConsumption);
export { PowerupConsumption };
