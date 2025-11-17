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
import { WalletTransactionKind } from './enums.js';
let WalletTransaction = class WalletTransaction {
    id;
    user;
    kind;
    amount;
    refTable = null;
    refId = null;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.walletTransactions, {
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", User)
], WalletTransaction.prototype, "user", void 0);
__decorate([
    Column({ type: 'enum', enum: WalletTransactionKind }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "kind", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
    }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "amount", void 0);
__decorate([
    Column({ name: 'ref_table', type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], WalletTransaction.prototype, "refTable", void 0);
__decorate([
    Column({ name: 'ref_id', type: 'bigint', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], WalletTransaction.prototype, "refId", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], WalletTransaction.prototype, "createdAt", void 0);
WalletTransaction = __decorate([
    Entity({ name: 'wallet_transactions' })
], WalletTransaction);
export { WalletTransaction };
