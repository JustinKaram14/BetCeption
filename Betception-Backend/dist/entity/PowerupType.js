var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserPowerup } from './UserPowerup.js';
import { PowerupConsumption } from './PowerupConsumption.js';
let PowerupType = class PowerupType {
    id;
    code;
    title;
    description = null;
    minLevel;
    price;
    effectJson = null;
    userPowerups;
    powerupConsumptions;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'tinyint', unsigned: true })
], PowerupType.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, unique: true })
], PowerupType.prototype, "code", void 0);
__decorate([
    Column({ type: 'varchar', length: 128 })
], PowerupType.prototype, "title", void 0);
__decorate([
    Column({ type: 'varchar', length: 512, nullable: true })
], PowerupType.prototype, "description", void 0);
__decorate([
    Column({ name: 'min_level', type: 'int', default: () => '1' })
], PowerupType.prototype, "minLevel", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
    })
], PowerupType.prototype, "price", void 0);
__decorate([
    Column({ name: 'effect_json', type: 'json', nullable: true })
], PowerupType.prototype, "effectJson", void 0);
__decorate([
    OneToMany(() => UserPowerup, (up) => up.type)
], PowerupType.prototype, "userPowerups", void 0);
__decorate([
    OneToMany(() => PowerupConsumption, (consumption) => consumption.type)
], PowerupType.prototype, "powerupConsumptions", void 0);
PowerupType = __decorate([
    Entity({ name: 'powerup_types' })
], PowerupType);
export { PowerupType };
