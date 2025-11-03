import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'betception',
  },
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET!,
    accessTtlMin: Number(process.env.ACCESS_TOKEN_TTL_MIN ?? 15),
    refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
  },
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200',
  },
  cookies: {
    secure: process.env.COOKIE_SECURE === 'true',
  }
};
