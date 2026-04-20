<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiRequestError } from '../../shared/api/apiError';
import { useAuthStore } from '../../shared/auth';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo12345';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const errorMessage = ref<string | null>(null);

const finishLogin = async () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/menu';
  await router.push(redirect);
};

const submit = async () => {
  errorMessage.value = null;
  try {
    await authStore.login(email.value.trim(), password.value);
    await finishLogin();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'ログインに失敗しました。時間をおいて再度お試しください。';
    }
  }
};

const loginAsDemo = async () => {
  errorMessage.value = null;
  email.value = DEMO_EMAIL;
  password.value = DEMO_PASSWORD;
  try {
    await authStore.login(DEMO_EMAIL, DEMO_PASSWORD);
    await finishLogin();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'デモログインに失敗しました。時間をおいて再度お試しください。';
    }
  }
};
</script>

<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1 class="auth-title">ログイン</h1>

      <section class="auth-demo" aria-label="デモアカウント">
        <p class="auth-demo-lead">
          このサイトはポートフォリオです。以下のデモアカウントでそのままお試しいただけます。
        </p>
        <dl class="auth-demo-list">
          <div>
            <dt>メール</dt>
            <dd><code>demo@example.com</code></dd>
          </div>
          <div>
            <dt>パスワード</dt>
            <dd><code>demo12345</code></dd>
          </div>
        </dl>
        <button
          type="button"
          class="auth-demo-button"
          :disabled="authStore.pending"
          @click="loginAsDemo"
        >
          {{ authStore.pending ? '処理中…' : 'デモアカウントでログイン' }}
        </button>
      </section>

      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span class="auth-field-label">メールアドレス</span>
          <input v-model="email" type="email" autocomplete="email" required class="auth-input" />
        </label>
        <label class="auth-field">
          <span class="auth-field-label">パスワード</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="auth-input"
          />
        </label>
        <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
        <button type="submit" class="auth-submit" :disabled="authStore.pending">
          {{ authStore.pending ? '処理中…' : 'ログイン' }}
        </button>
      </form>
      <p class="auth-switch">
        アカウントをお持ちでない方は
        <router-link to="/register" class="auth-link">新規登録</router-link>
      </p>
    </section>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--menu-bg, #f8f5ef);
  color: var(--menu-text, #1f1d1a);
  font-family: inherit;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  padding: 32px;
  border-radius: 16px;
  background: var(--menu-card-bg, #ffffff);
  border: 1px solid var(--menu-border, rgba(30, 20, 10, 0.12));
  box-shadow: 0 10px 30px rgba(30, 20, 10, 0.08);
}

.auth-demo {
  margin: 0 0 24px;
  padding: 16px;
  border-radius: 12px;
  background: var(--menu-accent-soft, rgba(200, 106, 56, 0.1));
  border: 1px dashed var(--menu-accent, #c86a38);
  display: grid;
  gap: 10px;
}

.auth-demo-lead {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--menu-text, #1f1d1a);
}

.auth-demo-list {
  margin: 0;
  display: grid;
  gap: 4px;
  font-size: 0.82rem;
}

.auth-demo-list > div {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.auth-demo-list dt {
  width: 72px;
  color: var(--menu-muted-text, rgba(30, 20, 10, 0.6));
  font-weight: 700;
  letter-spacing: 0.04em;
}

.auth-demo-list dd {
  margin: 0;
}

.auth-demo-list code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.84rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--menu-chip-bg, rgba(30, 20, 10, 0.06));
  color: var(--menu-text, #1f1d1a);
}

.auth-demo-button {
  margin-top: 2px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--menu-accent, #c86a38);
  background: transparent;
  color: var(--menu-accent-strong, #a55427);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.auth-demo-button:hover:not(:disabled) {
  background: var(--menu-accent, #c86a38);
  color: #fff;
}

.auth-demo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-title {
  margin: 0 0 24px;
  font-size: 1.5rem;
  letter-spacing: 0.04em;
}

.auth-form {
  display: grid;
  gap: 16px;
}

.auth-field {
  display: grid;
  gap: 6px;
}

.auth-field-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--menu-muted-text, rgba(30, 20, 10, 0.6));
}

.auth-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--menu-border, rgba(30, 20, 10, 0.18));
  background: var(--menu-input-bg, #fff);
  color: inherit;
  font: inherit;
}

.auth-input:focus-visible {
  outline: 2px solid var(--menu-accent, #c86a38);
  outline-offset: 1px;
}

.auth-error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(200, 60, 60, 0.08);
  color: #b24040;
  font-size: 0.88rem;
}

.auth-submit {
  margin-top: 4px;
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  background: var(--menu-accent, #c86a38);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.auth-submit:hover:not(:disabled) {
  background: var(--menu-accent-strong, #a55427);
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  margin: 20px 0 0;
  font-size: 0.86rem;
  text-align: center;
  color: var(--menu-muted-text, rgba(30, 20, 10, 0.7));
}

.auth-link {
  color: var(--menu-accent, #c86a38);
  font-weight: 700;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
