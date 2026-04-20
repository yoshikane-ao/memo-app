import { initSentry } from './shared/sentry';

// Sentry は他のモジュールが読み込まれる前に初期化する。
initSentry();

import { buildApp } from './app';
import { config } from './config';
import { logger } from './shared/logger';

const app = buildApp();
const publicHost = config.host === '0.0.0.0' ? 'localhost' : config.host;

app.listen(config.port, config.host, () => {
  logger.info({ url: `http://${publicHost}:${config.port}` }, 'backend listening');
});
