import 'reflect-metadata';
import type { Server } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { AppDataSource, initDataSource } from './db/data-source.js';
import { logger } from './utils/logger.js';

let httpServer: Server | null = null;
let shuttingDown = false;

async function bootstrap() {
  try {
    logger.info('server.starting', { port: env.port });
    await initDataSource();
    httpServer = app.listen(env.port, () => {
      logger.info('server.listening', {
        port: env.port,
        swagger: `http://localhost:${env.port}/docs`,
      });
    });
  } catch (error) {
    logger.error('server.startup_failed', { error });
    process.exit(1);
  }
}

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('server.shutdown.initiated', { signal });

  const serverClose = httpServer
    ? new Promise<void>((resolve, reject) => {
        httpServer?.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      })
    : Promise.resolve();

  try {
    await serverClose;
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    logger.info('server.shutdown.completed');
    process.exit(0);
  } catch (error) {
    logger.error('server.shutdown_failed', { error });
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

bootstrap();
