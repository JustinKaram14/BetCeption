import 'reflect-metadata';
import { app } from './app.js';
import { env } from './config/env.js';
import { initDataSource } from './db/data-source.js';

async function bootstrap() {
  try {
    console.log('Starting server...');
    await initDataSource();
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
      console.log(`Swagger UI at http://localhost:${env.port}/docs`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
