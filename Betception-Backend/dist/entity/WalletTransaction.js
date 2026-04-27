var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
    PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
], WalletTransaction.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.walletTransactions, {
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'user_id' })
], WalletTransaction.prototype, "user", void 0);
__decorate([
    Column({ type: 'enum', enum: WalletTransactionKind })
], WalletTransaction.prototype, "kind", void 0);
__decorate([
    Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
    })
], WalletTransaction.prototype, "amount", void 0);
__decorate([
    Column({ name: 'ref_table', type: 'varchar', length: 32, nullable: true })
], WalletTransaction.prototype, "refTable", void 0);
__decorate([
    Column({ name: 'ref_id', type: 'bigint', unsigned: true, nullable: true })
], WalletTransaction.prototype, "refId", void 0);
__decorate([
    Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
], WalletTransaction.prototype, "createdAt", void 0);
WalletTransaction = __decorate([
    Entity({ name: 'wallet_transactions' })
], WalletTransaction);
export { WalletTransaction };
