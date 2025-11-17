import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'leaderboard_balance' })
export class LeaderboardBalanceView {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balance!: string;
}
