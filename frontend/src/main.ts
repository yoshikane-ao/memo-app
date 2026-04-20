import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './app/router';
import { initThemeBeforeMount } from './shared/theme/useThemeStore';
import './style.css';

async function bootstrap() {
  initThemeBeforeMount();

  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);
  app.mount('#app');
}

bootstrap();
