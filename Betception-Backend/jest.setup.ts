import { TextEncoder, TextDecoder } from 'node:util';

const globalAny = global as any;

if (!globalAny.TextEncoder) {
  globalAny.TextEncoder = TextEncoder;
}

if (!globalAny.TextDecoder) {
  globalAny.TextDecoder = TextDecoder;
}

const envDefaults = {
  NODE_ENV: 'test',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'test-user',
  DB_PASSWORD: 'test-password',
  DB_NAME: 'betception_test',
  ACCESS_TOKEN_SECRET: 'test-access-secret-12345678901234567890',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret-098765432109876543210',
  ACCESS_TOKEN_TTL_MIN: '15',
  REFRESH_TOKEN_TTL_DAYS: '7',
  FRONTEND_ORIGIN: 'http://localhost:4200',
  COOKIE_SECURE: 'false',
} as const;

for (const [key, value] of Object.entries(envDefaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

export {};
