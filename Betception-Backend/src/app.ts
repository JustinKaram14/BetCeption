import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { corsMiddleware } from './config/cors.js';
import { authRouter } from './modules/auth/auth.router.js';
import { userRouter } from './modules/user/user.router.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './docs/swagger.js';

export const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/users', userRouter);

app.use(errorHandler);

setupSwagger(app);
