import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'leaderboard_balance' })
export class LeaderboardBalanceView {
  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn()
  username!: string;

  @ViewColumn()
  balance!: string;
}
