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

@Entity({ name: 'user_crates' })
export class UserCrate {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ type: 'tinyint', unsigned: true })
  tier!: number;

  @Column({ name: 'acquired_level', type: 'int' })
  acquiredLevel!: number;

  @Column({
    name: 'acquired_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  acquiredAt!: Date;

  @Column({ type: 'boolean', default: false })
  opened!: boolean;

  @Column({ name: 'opened_at', type: 'timestamp', nullable: true })
  openedAt: Date | null = null;

  @Column({
    name: 'reward_kind',
    type: 'enum',
    enum: ['coins', 'powerup'],
    nullable: true,
  })
  rewardKind: 'coins' | 'powerup' | null = null;

  @Column({
    name: 'reward_coins',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  rewardCoins: string | null = null;

  @ManyToOne(() => PowerupType, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reward_powerup_type_id' })
  rewardPowerupType: Relation<PowerupType> | null = null;
}
