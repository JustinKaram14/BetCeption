import { TextEncoder, TextDecoder } from 'node:util';

declare global {
  // eslint-disable-next-line no-var
  var TextEncoder: typeof TextEncoder | undefined;
  // eslint-disable-next-line no-var
  var TextDecoder: typeof TextDecoder | undefined;
}

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

const envDefaults = {
  NODE_ENV: 'test',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'test-user',
  DB_PASSWORD: 'test-password',
  DB_NAME: 'betception_test',
  ACCESS_TOKEN_SECRET: 'test-access-secret',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret',
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
