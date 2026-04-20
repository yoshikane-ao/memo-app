import dotenv from 'dotenv';

dotenv.config();

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export type AppConfig = {
  host: string;
  port: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  logLevel: LogLevel;
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const LOG_LEVELS: readonly LogLevel[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
];

const parseLogLevel = (value: string | undefined, fallback: LogLevel): LogLevel => {
  const normalized = value?.trim().toLowerCase();
  return LOG_LEVELS.includes(normalized as LogLevel) ? (normalized as LogLevel) : fallback;
};

export const createConfig = (env: Record<string, string | undefined> = process.env): AppConfig => ({
  host: env.HOST?.trim() || '0.0.0.0',
  port: parsePositiveInt(env.PORT, 3004),
  rateLimitWindowMs: parsePositiveInt(env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: parsePositiveInt(env.RATE_LIMIT_MAX_REQUESTS, 60),
  logLevel: parseLogLevel(env.LOG_LEVEL, 'info'),
});

export const config = createConfig();
