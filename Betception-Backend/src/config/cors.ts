import cors from 'cors';
import { env } from './env.js';

export const corsMiddleware = cors({
  origin: env.cors.origin,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
});
