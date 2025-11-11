import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoundStatus } from './enums.js';
import { Hand } from './Hand.js';
import { MainBet } from './MainBet.js';
import { SideBet } from './SideBet.js';
import { PowerupConsumption } from './PowerupConsumption.js';

@Entity({ name: 'rounds' })
export class Round {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({
    type: 'enum',
    enum: RoundStatus,
    default: RoundStatus.CREATED,
  })
  status!: RoundStatus;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null = null;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null = null;

  @Column({ name: 'server_seed_hash', type: 'char', length: 64, nullable: true })
  serverSeedHash: string | null = null;

  @Column({ name: 'server_seed', type: 'char', length: 64, nullable: true })
  serverSeed: string | null = null;

  @OneToMany(() => Hand, (hand) => hand.round)
  hands?: Hand[];

  @OneToMany(() => MainBet, (bet) => bet.round)
  mainBets?: MainBet[];

  @OneToMany(() => SideBet, (bet) => bet.round)
  sideBets?: SideBet[];

  @OneToMany(() => PowerupConsumption, (consumption) => consumption.round)
  powerupConsumptions?: PowerupConsumption[];
}
