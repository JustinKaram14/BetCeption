import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from './User.js';

@Entity({ name: 'daily_reward_claims' })
export class DailyRewardClaim {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.dailyRewardClaims, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ name: 'claim_date', type: 'date' })
  claimDate!: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: () => '0',
  })
  amount!: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
