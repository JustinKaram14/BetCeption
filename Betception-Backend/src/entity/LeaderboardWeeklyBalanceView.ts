import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'leaderboard_weekly_balance' })
export class LeaderboardWeeklyBalanceView {
  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn()
  username!: string;

  @ViewColumn({ name: 'balance_7d' })
  balance7d!: string;
}
