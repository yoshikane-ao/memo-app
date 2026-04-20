import { initSentry } from './shared/sentry';

// Sentry は他のモジュールが読み込まれる前に初期化する。
initSentry();

import { buildApp } from './app';
import { assertProductionSecrets, config } from './config';
import { ensureDemoUser } from './features/auth';
import { logger } from './shared/logger';

async function bootstrap() {
  // 本番環境で JWT_SECRET が dev fallback のままデプロイされないよう、起動最初に検証する。
  assertProductionSecrets();

  try {
    await ensureDemoUser();
  } catch (error) {
    // デモユーザー seed の失敗は起動自体を止めない（本体機能に影響しないため）
    logger.error({ err: error }, 'デモユーザーの seed に失敗しました');
  }

  const app = buildApp();
  const publicHost = config.host === '0.0.0.0' ? 'localhost' : config.host;

  app.listen(config.port, config.host, () => {
    logger.info({ url: `http://${publicHost}:${config.port}` }, 'backend listening');
  });
}

bootstrap().catch((error) => {
  // assertProductionSecrets などトップレベルの起動失敗をログに残してから非ゼロ終了する。
  logger.fatal({ err: error }, 'backend 起動に失敗しました');
  process.exit(1);
});
