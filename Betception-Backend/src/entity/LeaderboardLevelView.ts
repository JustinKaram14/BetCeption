import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'leaderboard_level' })
export class LeaderboardLevelView {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @Column({ type: 'int' })
  level!: number;

  @Column({ type: 'int' })
  xp!: number;
}
