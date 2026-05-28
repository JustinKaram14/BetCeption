import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from './User.js';

export type BetceptionPresetStakeMode = 'fixed' | 'percentage';

export type BetceptionPresetItem = {
  typeCode: string;
  amount?: number;
  percent?: number;
  predictedSuit?: string;
  predictedRank?: string;
  selection?: Record<string, unknown>;
};

@Entity({ name: 'betception_presets' })
@Index('IDX_betception_presets_user', ['user'])
export class BetceptionPreset {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.betceptionPresets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ type: 'varchar', length: 48, default: () => "'Preset'" })
  name: string = 'Preset';

  @Column({ name: 'stake_mode', type: 'varchar', length: 16, default: () => "'fixed'" })
  stakeMode: BetceptionPresetStakeMode = 'fixed';

  @Column({ name: 'config_json', type: 'json' })
  configJson!: { items: BetceptionPresetItem[] };

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive = false;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
