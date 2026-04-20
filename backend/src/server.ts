import { initSentry } from './shared/sentry';

// Sentry は他のモジュールが読み込まれる前に初期化する。
initSentry();

import { buildApp } from './app';
import { config } from './config';
import { createContainer } from './composition/container';
import { logger } from './shared/logger';

async function bootstrap() {
  const container = createContainer();

  try {
    await container.ensureDemoUser();
  } catch (error) {
    // デモユーザー seed の失敗は起動自体を止めない（本体機能に影響しないため）
    logger.error({ err: error }, 'デモユーザーの seed に失敗しました');
  }

  const app = buildApp(container);
  const publicHost = config.host === '0.0.0.0' ? 'localhost' : config.host;

  app.listen(config.port, config.host, () => {
    logger.info({ url: `http://${publicHost}:${config.port}` }, 'backend listening');
  });
}

bootstrap();
