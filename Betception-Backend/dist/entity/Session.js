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
let Session = class Session {
    id;
    user;
    refreshToken;
    userAgent = null;
    ip = null;
    expiresAt;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], Session.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", User)
], Session.prototype, "user", void 0);
__decorate([
    Column({ name: 'refresh_token', type: 'char', length: 64, unique: true }),
    __metadata("design:type", String)
], Session.prototype, "refreshToken", void 0);
__decorate([
    Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Session.prototype, "userAgent", void 0);
__decorate([
    Column({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", Object)
], Session.prototype, "ip", void 0);
__decorate([
    Column({ name: 'expires_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Session.prototype, "expiresAt", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], Session.prototype, "createdAt", void 0);
Session = __decorate([
    Entity({ name: 'sessions' })
], Session);
export { Session };
