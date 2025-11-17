import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'leaderboard_weekly_winnings' })
export class LeaderboardWeeklyWinningsView {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'net_winnings_7d', type: 'decimal', precision: 18, scale: 2 })
  netWinnings7d!: string;
}
