import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { Session } from './Session.js';
import { Hand } from './Hand.js';
import { MainBet } from './MainBet.js';
import { SideBet } from './SideBet.js';
import { WalletTransaction } from './WalletTransaction.js';
import { DailyRewardClaim } from './DailyRewardClaim.js';
import { UserPowerup } from './UserPowerup.js';
import { PowerupConsumption } from './PowerupConsumption.js';
import { PowerupType } from './PowerupType.js';

@Entity({ name: 'users' })
@Index(['email'])
@Index(['username'])
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: () => '0.00',
  })
  balance!: string;

  @Column({ type: 'int', default: () => '0' })
  xp!: number;

  @Column({ type: 'int', default: () => '1' })
  level!: number;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null = null;

  @Column({ name: 'last_daily_reward_at', type: 'date', nullable: true })
  lastDailyRewardAt: string | null = null;

  @Column({ name: 'login_streak', type: 'int', unsigned: true, default: () => '0' })
  loginStreak: number = 0;

  @Column({ name: 'streak_expires_at', type: 'date', nullable: true })
  streakExpiresAt: string | null = null;

  @Column({ name: 'xp_boost_expires_at', type: 'timestamp', nullable: true })
  xpBoostExpiresAt: Date | null = null;

  @ManyToOne(() => PowerupType, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'active_powerup_type_id' })
  activePowerupType!: Relation<PowerupType> | null;

  @Column({ name: 'active_powerup_uses_remaining', type: 'int', unsigned: true, default: () => '0' })
  activePowerupUsesRemaining: number = 0;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions?: Relation<Session[]>;

  @OneToMany(() => Hand, (hand) => hand.user)
  hands?: Relation<Hand[]>;

  @OneToMany(() => MainBet, (bet) => bet.user)
  mainBets?: Relation<MainBet[]>;

  @OneToMany(() => SideBet, (bet) => bet.user)
  sideBets?: Relation<SideBet[]>;

  @OneToMany(() => WalletTransaction, (tx) => tx.user)
  walletTransactions?: Relation<WalletTransaction[]>;

  @OneToMany(() => DailyRewardClaim, (claim) => claim.user)
  dailyRewardClaims?: Relation<DailyRewardClaim[]>;

  @OneToMany(() => UserPowerup, (powerup) => powerup.user)
  powerups?: Relation<UserPowerup[]>;

  @OneToMany(() => PowerupConsumption, (consumption) => consumption.user)
  powerupConsumptions?: Relation<PowerupConsumption[]>;
}
