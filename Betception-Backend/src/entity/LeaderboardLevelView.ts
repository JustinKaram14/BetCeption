import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'leaderboard_level' })
export class LeaderboardLevelView {
  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn()
  username!: string;

  @ViewColumn()
  level!: number;

  @ViewColumn()
  xp!: number;
}
