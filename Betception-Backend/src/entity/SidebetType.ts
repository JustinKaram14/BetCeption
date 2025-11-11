import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SideBet } from './SideBet.js';

@Entity({ name: 'sidebet_types' })
export class SidebetType {
  @PrimaryGeneratedColumn({ type: 'tinyint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string | null = null;

  @Column({
    name: 'base_odds',
    type: 'decimal',
    precision: 8,
    scale: 3,
    nullable: true,
  })
  baseOdds: string | null = null;

  @Column({ name: 'config_json', type: 'json', nullable: true })
  configJson: Record<string, unknown> | null = null;

  @OneToMany(() => SideBet, (bet) => bet.type)
  sideBets?: SideBet[];
}
