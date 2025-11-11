import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User.js';
import { WalletTransactionKind } from './enums.js';

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.walletTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: WalletTransactionKind })
  kind!: WalletTransactionKind;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Column({ name: 'ref_table', type: 'varchar', length: 32, nullable: true })
  refTable: string | null = null;

  @Column({ name: 'ref_id', type: 'bigint', unsigned: true, nullable: true })
  refId: string | null = null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
