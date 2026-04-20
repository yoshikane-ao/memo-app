import cors from 'cors';
type CorsOptions = Parameters<typeof cors>[0];
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { prisma } from './db';
import { authMiddleware, authRouter } from './features/auth';
import { memosRouter, tagsRouter } from './features/memo';
import { quizRouter } from './features/quiz';
import { requestLogger } from './shared/http/requestLogger';
import { metricsMiddleware } from './shared/http/metricsMiddleware';
import { registry as metricsRegistry } from './shared/metrics';
import { createDocsRouter } from './shared/openapi/docsRouter';
import { registerSentryErrorHandler } from './shared/sentry';
// import { tradeAppRoutes } from "./tradeApp/routes"

const createRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMaxRequests,
  });

// CORS ポリシー:
//  - `wildcard` (既定): 全オリジン許可・Cookie 送信不可。`Access-Control-Allow-Origin: *`
//    ブラウザは credentials:'include' と `*` を組み合わせられないため、
//    Cookie ベースの認証 API ではクロスオリジン呼び出しを事実上拒否する。
//  - `allowList`: 指定オリジンのみ許可・Cookie 送信許可。本番でクロスオリジン運用する場合に使う。
const toCorsOptions = (): CorsOptions => {
  if (config.cors.kind === 'allowList') {
    return { origin: config.cors.origins, credentials: true };
  }
  return { origin: '*', credentials: false };
};

const registerRoutes = (app: express.Express) => {
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', db: 'ok' });
    } catch (error) {
      res.req?.log?.error({ err: error }, 'readiness check failed');
      res.status(503).json({ status: 'error', db: 'error' });
    }
  });

  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  });

  app.use('/auth', authRouter);
  app.use('/memos', authMiddleware, memosRouter);
  app.use('/tags', authMiddleware, tagsRouter);
  app.use('/quiz', authMiddleware, quizRouter);
  // OpenAPI ドキュメント。認証不要（公開 API 仕様として閲覧可能）。
  app.use('/api', createDocsRouter());
  // app.use("/quizTag", quizTagRouter);
  // app.use("/trade", tradeAppRoutes);
};

export function buildApp() {
  const app = express();

  app.use(requestLogger);
  app.use(metricsMiddleware);
  app.use(cors(toCorsOptions()));
  // Swagger UI が 'unsafe-inline' / 'unsafe-eval' を要求し、HTTP 配信環境では
  // upgrade-insecure-requests が誤動作するため、CSP を portfolio 用に緩める。
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(createRateLimiter());
  app.use(express.json());
  app.use(cookieParser());

  registerRoutes(app);

  registerSentryErrorHandler(app);

  return app;
}
