import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'leaderboard_alltime_winnings' })
export class LeaderboardAlltimeWinningsView {
  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn()
  username!: string;

  @ViewColumn({ name: 'net_winnings' })
  netWinnings!: string;
}
