import 'dotenv/config';
import { z } from 'zod';
const DEFAULT_INITIAL_BALANCE = 1000;
const SAME_SITE_VALUES = ['strict', 'lax', 'none'];
const RawEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DB_HOST: z.string().min(1).default('localhost'),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().min(1).default('root'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().min(1).default('betception'),
    ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters long'),
    REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters long'),
    ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    FRONTEND_ORIGIN: z
        .string()
        .url('FRONTEND_ORIGIN must be a valid http(s) URL')
        .default('http://localhost:4200'),
    COOKIE_SECURE: z.string().optional(),
    COOKIE_SAMESITE: z.string().optional(),
    NEW_USER_INITIAL_BALANCE: z.coerce.number().nonnegative().default(DEFAULT_INITIAL_BALANCE),
    TRUST_PROXY: z.string().optional(),
    METRICS_ENABLED: z.string().optional(),
    METRICS_API_KEY: z.string().optional(),
    DOCS_ENABLED: z.string().optional(),
    DOCS_API_KEY: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
});
const parseResult = RawEnvSchema.safeParse(process.env);
if (!parseResult.success) {
    const reason = parseResult.error.errors
        .map((err) => `${err.path.join('.') || 'root'}: ${err.message}`)
        .join('; ');
    throw new Error(`Invalid environment configuration: ${reason}`);
}
const rawEnv = parseResult.data;
const parseCookieSecure = (value, nodeEnv) => {
    if (value === undefined) {
        return nodeEnv !== 'development';
    }
    return value === 'true';
};
const parseCookieSameSite = (value) => {
    const normalized = value?.trim().toLowerCase();
    if (normalized && SAME_SITE_VALUES.includes(normalized)) {
        return normalized;
    }
    return 'strict';
};
const parseTrustProxy = (value) => {
    if (!value || value.toLowerCase() === 'false') {
        return false;
    }
    if (value.toLowerCase() === 'true') {
        return true;
    }
    const maybeNumber = Number(value);
    if (Number.isInteger(maybeNumber) && maybeNumber >= 0) {
        return maybeNumber;
    }
    return value;
};
const cookieSecure = parseCookieSecure(rawEnv.COOKIE_SECURE, rawEnv.NODE_ENV);
const cookieSameSite = parseCookieSameSite(rawEnv.COOKIE_SAMESITE);
const trustProxy = parseTrustProxy(rawEnv.TRUST_PROXY);
const parseBooleanFlag = (value, defaultValue) => {
    if (value === undefined)
        return defaultValue;
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
};
if (cookieSameSite === 'none' && !cookieSecure) {
    throw new Error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true for browser compatibility and security.');
}
export const env = {
    nodeEnv: rawEnv.NODE_ENV,
    port: rawEnv.PORT,
    db: {
        host: rawEnv.DB_HOST,
        port: rawEnv.DB_PORT,
        user: rawEnv.DB_USER,
        password: rawEnv.DB_PASSWORD,
        database: rawEnv.DB_NAME,
    },
    jwt: {
        accessSecret: rawEnv.ACCESS_TOKEN_SECRET,
        refreshSecret: rawEnv.REFRESH_TOKEN_SECRET,
        accessTtlMin: rawEnv.ACCESS_TOKEN_TTL_MIN,
        refreshTtlDays: rawEnv.REFRESH_TOKEN_TTL_DAYS,
    },
    cors: {
        origin: rawEnv.FRONTEND_ORIGIN,
    },
    http: {
        trustProxy,
    },
    cookies: {
        secure: cookieSecure,
        sameSite: cookieSameSite,
    },
    users: {
        initialBalance: rawEnv.NEW_USER_INITIAL_BALANCE,
    },
    monitoring: {
        metrics: {
            enabled: parseBooleanFlag(rawEnv.METRICS_ENABLED, rawEnv.NODE_ENV !== 'production'),
            apiKey: rawEnv.METRICS_API_KEY ?? null,
        },
        docs: {
            enabled: parseBooleanFlag(rawEnv.DOCS_ENABLED, rawEnv.NODE_ENV !== 'production'),
            apiKey: rawEnv.DOCS_API_KEY ?? null,
        },
    },
    rateLimit: {
        global: {
            windowMs: rawEnv.RATE_LIMIT_WINDOW_MS,
            max: rawEnv.RATE_LIMIT_MAX,
        },
        auth: {
            windowMs: rawEnv.AUTH_RATE_LIMIT_WINDOW_MS,
            max: rawEnv.AUTH_RATE_LIMIT_MAX,
        },
    },
};
