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

@Entity({ name: 'user_achievements' })
@Index(['user', 'achievementCode'], { unique: true })
export class UserAchievement {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.achievements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ name: 'achievement_code', type: 'varchar', length: 64 })
  achievementCode!: string;

  @Column({ type: 'int', unsigned: true, default: () => '0' })
  progress: number = 0;

  @Column({ type: 'boolean', default: false })
  unlocked: boolean = false;

  @Column({ name: 'unlocked_at', type: 'timestamp', nullable: true })
  unlockedAt: Date | null = null;

  @Column({ name: 'seen_at', type: 'timestamp', nullable: true })
  seenAt: Date | null = null;

  @Column({ name: 'rewarded_at', type: 'timestamp', nullable: true })
  rewardedAt: Date | null = null;

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
