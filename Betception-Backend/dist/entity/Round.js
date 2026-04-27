var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoundStatus } from './enums.js';
import { Hand } from './Hand.js';
import { MainBet } from './MainBet.js';
import { SideBet } from './SideBet.js';
import { PowerupConsumption } from './PowerupConsumption.js';
let Round = class Round {
    id;
    status;
    createdAt;
    startedAt = null;
    endedAt = null;
    serverSeedHash = null;
    serverSeed = null;
    hands;
    mainBets;
    sideBets;
    powerupConsumptions;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], Round.prototype, "id", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: RoundStatus,
        default: RoundStatus.CREATED,
    })
], Round.prototype, "status", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], Round.prototype, "createdAt", void 0);
__decorate([
    Column({ name: 'started_at', type: 'timestamp', nullable: true })
], Round.prototype, "startedAt", void 0);
__decorate([
    Column({ name: 'ended_at', type: 'timestamp', nullable: true })
], Round.prototype, "endedAt", void 0);
__decorate([
    Column({ name: 'server_seed_hash', type: 'char', length: 64, nullable: true })
], Round.prototype, "serverSeedHash", void 0);
__decorate([
    Column({ name: 'server_seed', type: 'char', length: 64, nullable: true })
], Round.prototype, "serverSeed", void 0);
__decorate([
    OneToMany(() => Hand, (hand) => hand.round)
], Round.prototype, "hands", void 0);
__decorate([
    OneToMany(() => MainBet, (bet) => bet.round)
], Round.prototype, "mainBets", void 0);
__decorate([
    OneToMany(() => SideBet, (bet) => bet.round)
], Round.prototype, "sideBets", void 0);
__decorate([
    OneToMany(() => PowerupConsumption, (consumption) => consumption.round)
], Round.prototype, "powerupConsumptions", void 0);
Round = __decorate([
    Entity({ name: 'rounds' })
], Round);
export { Round };
