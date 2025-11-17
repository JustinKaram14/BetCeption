import express, { type RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsMiddleware } from './config/cors.js';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.router.js';
import { userRouter } from './modules/user/user.router.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { setupSwagger } from './docs/swagger.js';
import { walletRouter } from './modules/wallet/wallet.router.js';
import { shopRouter } from './modules/shop/shop.router.js';
import { inventoryRouter } from './modules/inventory/inventory.router.js';
import { rewardsRouter } from './modules/rewards/rewards.router.js';
import { leaderboardRouter } from './modules/leaderboard/leaderboard.router.js';
import { roundRouter } from './modules/round/round.router.js';
import { powerupsRouter } from './modules/powerups/powerups.router.js';
import { fairnessRouter } from './modules/fairness/fairness.router.js';
import { requestContext } from './middlewares/requestContext.js';
import { getMetricsSnapshot } from './observability/metrics.js';
import { apiKeyGuard } from './middlewares/apiKeyGuard.js';
import { globalRateLimiter } from './middlewares/rateLimiters.js';

export const app = express();

app.set('trust proxy', env.http.trustProxy);
app.use(helmet());
app.use(morgan('dev'));
app.use(corsMiddleware);
app.use(requestContext);
app.use(express.json());
app.use(cookieParser());
app.use(globalRateLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

if (env.monitoring.metrics.enabled) {
  const guards: RequestHandler[] = [];
  if (env.monitoring.metrics.apiKey) {
    guards.push(apiKeyGuard(env.monitoring.metrics.apiKey));
  }
  app.get('/metrics', ...guards, (_req, res) => res.json(getMetricsSnapshot()));
}

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/wallet', walletRouter);
app.use('/shop', shopRouter);
app.use('/inventory', inventoryRouter);
app.use('/rewards', rewardsRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/round', roundRouter);
app.use('/powerups', powerupsRouter);
app.use('/fairness', fairnessRouter);

if (env.monitoring.docs.enabled) {
  const guards: RequestHandler[] = [];
  if (env.monitoring.docs.apiKey) {
    guards.push(apiKeyGuard(env.monitoring.docs.apiKey));
  }
  setupSwagger(app, { middlewares: guards });
}

app.use(notFoundHandler);
app.use(errorHandler);
