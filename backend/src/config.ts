import dotenv from 'dotenv';

dotenv.config();

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export type AuthConfig = {
  jwtSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  cookieSecure: boolean;
  cookieDomain: string | undefined;
};

export type DemoConfig = {
  email: string | null;
  password: string | null;
  displayName: string;
};

export type CorsConfig =
  // 明示指定なし: 全許可 + Cookie なし（現状互換。ブラウザは credentials:'include' と `*` を組み合わせ不可）
  | { kind: 'wildcard' }
  // 明示指定あり: 指定オリジンのみ許可 + Cookie 送信許可（本番運用向け）
  | { kind: 'allowList'; origins: string[] };

export type AppConfig = {
  host: string;
  port: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  logLevel: LogLevel;
  auth: AuthConfig;
  demo: DemoConfig;
  cors: CorsConfig;
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

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const DEV_JWT_FALLBACK = 'dev-only-secret-do-not-use-in-production-minimum-32-characters-needed';

const parseCors = (value: string | undefined): CorsConfig => {
  const trimmed = value?.trim();
  if (!trimmed) return { kind: 'wildcard' };
  const origins = trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (origins.length === 0) return { kind: 'wildcard' };
  return { kind: 'allowList', origins };
};

const resolveJwtSecret = (value: string | undefined): string => {
  const trimmed = value?.trim();
  if (trimmed && trimmed.length >= 32) {
    return trimmed;
  }

  // テスト / ローカル開発のみ許容するフォールバック。本番では startup で検証する。
  return DEV_JWT_FALLBACK;
};

export const createConfig = (env: Record<string, string | undefined> = process.env): AppConfig => ({
  host: env.HOST?.trim() || '0.0.0.0',
  port: parsePositiveInt(env.PORT, 3004),
  rateLimitWindowMs: parsePositiveInt(env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: parsePositiveInt(env.RATE_LIMIT_MAX_REQUESTS, 60),
  logLevel: parseLogLevel(env.LOG_LEVEL, 'info'),
  auth: {
    jwtSecret: resolveJwtSecret(env.JWT_SECRET),
    accessTokenTtl: env.JWT_ACCESS_TTL?.trim() || '15m',
    refreshTokenTtl: env.JWT_REFRESH_TTL?.trim() || '7d',
    cookieSecure: parseBool(env.COOKIE_SECURE, env.NODE_ENV === 'production'),
    cookieDomain: env.COOKIE_DOMAIN?.trim() || undefined,
  },
  demo: {
    email: env.DEMO_EMAIL?.trim() || null,
    password: env.DEMO_PASSWORD?.trim() || null,
    displayName: env.DEMO_DISPLAY_NAME?.trim() || 'デモユーザー',
  },
  cors: parseCors(env.CORS_ALLOWED_ORIGIN),
});

export const config = createConfig();

export const assertProductionSecrets = (cfg: AppConfig = config): void => {
  if (process.env.NODE_ENV !== 'production') return;
  if (cfg.auth.jwtSecret === DEV_JWT_FALLBACK) {
    throw new Error(
      'JWT_SECRET は本番環境で必須です（32 文字以上のランダム文字列を設定してください）。',
    );
  }
};
