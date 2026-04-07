import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { app } from './app.js';
import { env } from './config/env.js';
import { AppDataSource, initDataSource } from './db/data-source.js';
import { logger } from './utils/logger.js';
let httpServer = null;
let shuttingDown = false;
export async function startServer(options = {}) {
    try {
        logger.info('server.starting', { port: env.port, runMigrations: options.runMigrations ?? false });
        await initDataSource();
        if (options.runMigrations) {
            const results = await AppDataSource.runMigrations();
            logger.info('server.migrations.completed', {
                executed: results.map((migration) => migration.name),
            });
        }
        httpServer = app.listen(env.port, () => {
            logger.info('server.listening', {
                port: env.port,
                swagger: `http://localhost:${env.port}/docs`,
            });
        });
    }
    catch (error) {
        logger.error('server.startup_failed', { error });
        process.exit(1);
    }
}
async function shutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    logger.info('server.shutdown.initiated', { signal });
    const serverClose = httpServer
        ? new Promise((resolve, reject) => {
            httpServer?.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
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
    }
    catch (error) {
        logger.error('server.shutdown_failed', { error });
        process.exit(1);
    }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectExecution) {
    startServer();
}
