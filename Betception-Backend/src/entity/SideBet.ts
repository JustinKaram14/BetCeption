import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Round } from './Round.js';
import { User } from './User.js';
import { SidebetType } from './SidebetType.js';
import {
  CardRank,
  CardSuit,
  SideBetColor,
  SideBetStatus,
  SideBetTargetContext,
} from './enums.js';

@Entity({ name: 'side_bets' })
export class SideBet {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Round, (round) => round.sideBets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id' })
  round!: Relation<Round>;

  @ManyToOne(() => User, (user) => user.sideBets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @ManyToOne(() => SidebetType, (type) => type.sideBets, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'type_id' })
  type!: Relation<SidebetType>;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Column({
    name: 'predicted_color',
    type: 'enum',
    enum: SideBetColor,
    nullable: true,
  })
  predictedColor: SideBetColor | null = null;

  @Column({
    name: 'predicted_suit',
    type: 'enum',
    enum: CardSuit,
    nullable: true,
  })
  predictedSuit: CardSuit | null = null;

  @Column({
    name: 'predicted_rank',
    type: 'enum',
    enum: CardRank,
    nullable: true,
  })
  predictedRank: CardRank | null = null;

  @Column({
    name: 'target_context',
    type: 'enum',
    enum: SideBetTargetContext,
    default: SideBetTargetContext.FIRST_PLAYER_CARD,
  })
  targetContext!: SideBetTargetContext;

  @Column({
    type: 'enum',
    enum: SideBetStatus,
    default: SideBetStatus.PLACED,
  })
  status!: SideBetStatus;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 3,
    nullable: true,
  })
  odds: string | null = null;

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
