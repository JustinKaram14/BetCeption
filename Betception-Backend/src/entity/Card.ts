import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { CardRank, CardSuit } from './enums.js';
import { Hand } from './Hand.js';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Hand, (hand) => hand.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hand_id' })
  hand!: Relation<Hand>;

  @Column({ name: 'draw_order', type: 'tinyint', unsigned: true })
  drawOrder!: number;

  @Column({ type: 'enum', enum: CardRank })
  rank!: CardRank;

  @Column({ type: 'enum', enum: CardSuit })
  suit!: CardSuit;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
