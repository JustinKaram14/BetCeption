import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'rate_limit_counters' })
export class RateLimitCounter {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key!: string;

  @Column({ type: 'int', unsigned: true })
  points!: number;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;
}
