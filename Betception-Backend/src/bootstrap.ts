import 'reflect-metadata';
import { startServer } from './server.js';

startServer({ runMigrations: true });
