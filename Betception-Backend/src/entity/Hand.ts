import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { HandOwnerType, HandStatus } from './enums.js';
import { Round } from './Round.js';
import { User } from './User.js';
import { Card } from './Card.js';
import { MainBet } from './MainBet.js';

@Entity({ name: 'hands' })
export class Hand {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Round, (round) => round.hands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id' })
  round!: Relation<Round>;

  @Column({
    name: 'owner_type',
    type: 'enum',
    enum: HandOwnerType,
  })
  ownerType!: HandOwnerType;

  @ManyToOne(() => User, (user) => user.hands, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null = null;

  @ManyToOne(() => Hand, (hand) => hand.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_hand_id' })
  parent: Relation<Hand> | null = null;

  @OneToMany(() => Hand, (hand) => hand.parent)
  children?: Relation<Hand[]>;

  @Column({
    type: 'enum',
    enum: HandStatus,
    default: HandStatus.ACTIVE,
  })
  status!: HandStatus;

  @Column({ name: 'hand_value', type: 'tinyint', unsigned: true, nullable: true })
  handValue: number | null = null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @OneToMany(() => Card, (card) => card.hand)
  cards?: Relation<Card[]>;

  @OneToOne(() => MainBet, (bet) => bet.hand)
  mainBet?: Relation<MainBet>;
}
