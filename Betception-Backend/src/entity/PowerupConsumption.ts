import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from './User.js';
import { PowerupType } from './PowerupType.js';
import { Round } from './Round.js';

@Entity({ name: 'powerup_consumptions' })
export class PowerupConsumption {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.powerupConsumptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @ManyToOne(() => PowerupType, (type) => type.powerupConsumptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'type_id' })
  type!: Relation<PowerupType>;

  @ManyToOne(() => Round, (round) => round.powerupConsumptions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'round_id' })
  round: Relation<Round> | null = null;

  @Column({
    name: 'consumed_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  consumedAt!: Date;
}
