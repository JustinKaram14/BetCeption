import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'leaderboard_weekly_level' })
export class LeaderboardWeeklyLevelView {
  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn()
  username!: string;

  @ViewColumn({ name: 'xp_7d' })
  xp7d!: number;
}
