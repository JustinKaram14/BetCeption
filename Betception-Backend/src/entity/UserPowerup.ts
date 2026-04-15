import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from './User.js';
import { PowerupType } from './PowerupType.js';

@Entity({ name: 'user_powerups' })
export class UserPowerup {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.powerups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @ManyToOne(() => PowerupType, (type) => type.userPowerups, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'type_id' })
  type!: Relation<PowerupType>;

  @Column({ type: 'int', default: () => '0' })
  quantity!: number;

  @Column({
    name: 'acquired_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  acquiredAt!: Date;
}
