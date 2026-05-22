import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from './User.js';

@Entity({ name: 'user_xp_events' })
export class UserXpEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.xpEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ type: 'int', unsigned: true })
  amount!: number;

  @Column({ name: 'ref_table', type: 'varchar', length: 32, nullable: true })
  refTable: string | null = null;

  @Column({ name: 'ref_id', type: 'bigint', unsigned: true, nullable: true })
  refId: string | null = null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
