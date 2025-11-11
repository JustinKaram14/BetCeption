import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { ENTITIES } from '../entity/index.js';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  entities: ENTITIES,
  synchronize: false,
  logging: env.nodeEnv === 'development',
});

export async function initDataSource() {
  if (AppDataSource.isInitialized) return AppDataSource;
  return AppDataSource.initialize();
}
