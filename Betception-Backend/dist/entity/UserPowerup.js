var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { User } from './User.js';
import { PowerupType } from './PowerupType.js';
let UserPowerup = class UserPowerup {
    id;
    user;
    type;
    quantity;
    acquiredAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], UserPowerup.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.powerups, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' })
], UserPowerup.prototype, "user", void 0);
__decorate([
    ManyToOne(() => PowerupType, (type) => type.userPowerups, {
        onDelete: 'RESTRICT',
    }),
    JoinColumn({ name: 'type_id' })
], UserPowerup.prototype, "type", void 0);
__decorate([
    Column({ type: 'int', default: () => '0' })
], UserPowerup.prototype, "quantity", void 0);
__decorate([
    Column({
        name: 'acquired_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], UserPowerup.prototype, "acquiredAt", void 0);
UserPowerup = __decorate([
    Entity({ name: 'user_powerups' })
], UserPowerup);
export { UserPowerup };
