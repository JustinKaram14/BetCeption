import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Round } from './Round.js';
import { Hand } from './Hand.js';
import { User } from './User.js';
import { MainBetStatus } from './enums.js';

@Entity({ name: 'main_bets' })
export class MainBet {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Round, (round) => round.mainBets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id' })
  round!: Relation<Round>;

  @OneToOne(() => Hand, (hand) => hand.mainBet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hand_id' })
  hand!: Relation<Hand>;

  @ManyToOne(() => User, (user) => user.mainBets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Column({
    type: 'enum',
    enum: MainBetStatus,
    default: MainBetStatus.PLACED,
  })
  status!: MainBetStatus;

  @Column({
    name: 'payout_multiplier',
    type: 'decimal',
    precision: 6,
    scale: 3,
    nullable: true,
  })
  payoutMultiplier: string | null = null;

  @Column({
    name: 'settled_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  settledAmount: string | null = null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({ name: 'settled_at', type: 'timestamp', nullable: true })
  settledAt: Date | null = null;
}
