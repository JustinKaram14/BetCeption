import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'leaderboard_weekly_winnings' })
export class LeaderboardWeeklyWinningsView {
  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn({ name: 'net_winnings_7d' })
  netWinnings7d!: string;
}
