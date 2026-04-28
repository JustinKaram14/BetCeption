import cors from 'cors';
import { env } from './env.js';
const localFrontendOrigins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
];
const allowedOrigins = new Set([
    env.cors.origin,
    ...(env.nodeEnv === 'development' ? localFrontendOrigins : []),
]);
export const corsMiddleware = cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});
