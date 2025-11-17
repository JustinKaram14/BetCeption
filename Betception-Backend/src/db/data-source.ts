import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { ENTITIES } from '../entity/index.js';
import { InitSchema1700000000000 } from './migrations/1700000000000-InitSchema.js';
import { AddRateLimitCounters1700000000001 } from './migrations/1700000000001-AddRateLimitCounters.js';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  ssl: env.db.sslCa ? { ca: env.db.sslCa } : undefined,
  entities: ENTITIES,
  migrations: [InitSchema1700000000000, AddRateLimitCounters1700000000001],
  synchronize: false,
  logging: env.nodeEnv === 'development',
});

export async function initDataSource() {
  if (AppDataSource.isInitialized) return AppDataSource;
  return AppDataSource.initialize();
}
