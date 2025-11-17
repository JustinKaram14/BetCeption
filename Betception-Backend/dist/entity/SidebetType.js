var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SideBet } from './SideBet.js';
let SidebetType = class SidebetType {
    id;
    code;
    title;
    description = null;
    baseOdds = null;
    configJson = null;
    sideBets;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'tinyint', unsigned: true }),
    __metadata("design:type", Number)
], SidebetType.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, unique: true }),
    __metadata("design:type", String)
], SidebetType.prototype, "code", void 0);
__decorate([
    Column({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], SidebetType.prototype, "title", void 0);
__decorate([
    Column({ type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", Object)
], SidebetType.prototype, "description", void 0);
__decorate([
    Column({
        name: 'base_odds',
        type: 'decimal',
        precision: 8,
        scale: 3,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SidebetType.prototype, "baseOdds", void 0);
__decorate([
    Column({ name: 'config_json', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], SidebetType.prototype, "configJson", void 0);
__decorate([
    OneToMany(() => SideBet, (bet) => bet.type),
    __metadata("design:type", Array)
], SidebetType.prototype, "sideBets", void 0);
SidebetType = __decorate([
    Entity({ name: 'sidebet_types' })
], SidebetType);
export { SidebetType };
