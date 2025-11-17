import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { UserPowerup } from './UserPowerup.js';
import { PowerupConsumption } from './PowerupConsumption.js';

@Entity({ name: 'powerup_types' })
export class PowerupType {
  @PrimaryGeneratedColumn({ type: 'tinyint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string | null = null;

  @Column({ name: 'min_level', type: 'int', default: () => '1' })
  minLevel!: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  price!: string;

  @Column({ name: 'effect_json', type: 'json', nullable: true })
  effectJson: Record<string, unknown> | null = null;

  @OneToMany(() => UserPowerup, (up) => up.type)
  userPowerups?: Relation<UserPowerup[]>;

  @OneToMany(() => PowerupConsumption, (consumption) => consumption.type)
  powerupConsumptions?: Relation<PowerupConsumption[]>;
}
