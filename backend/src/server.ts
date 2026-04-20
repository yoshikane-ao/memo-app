import { buildApp } from './app';
import { config } from './config';
import { logger } from './shared/logger';

const app = buildApp();
const publicHost = config.host === '0.0.0.0' ? 'localhost' : config.host;

app.listen(config.port, config.host, () => {
  logger.info({ url: `http://${publicHost}:${config.port}` }, 'backend listening');
});
