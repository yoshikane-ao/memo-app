import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as Sentry from '@sentry/vue';
import App from './App.vue';
import router from './app/router';
import { initThemeBeforeMount } from './shared/theme/useThemeStore';
import './style.css';

async function bootstrap() {
  initThemeBeforeMount();

  const app = createApp(App);
  const pinia = createPinia();

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      app,
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),
    });
  }

  app.use(pinia);
  app.use(router);
  app.mount('#app');
}

bootstrap();
