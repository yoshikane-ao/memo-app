<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiRequestError } from '../../shared/api/apiError';
import { sanitizeRedirect, useAuthStore } from '../../shared/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const displayName = ref('');
const errorMessage = ref<string | null>(null);

const submit = async () => {
  errorMessage.value = null;
  try {
    await authStore.register(
      email.value.trim(),
      password.value,
      displayName.value.trim() || undefined,
    );
    await router.push(sanitizeRedirect(route.query.redirect));
  } catch (error) {
    if (error instanceof ApiRequestError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = '登録に失敗しました。時間をおいて再度お試しください。';
    }
  }
};
</script>

<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1 class="auth-title">新規登録</h1>
      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span class="auth-field-label">メールアドレス</span>
          <input v-model="email" type="email" autocomplete="email" required class="auth-input" />
        </label>
        <label class="auth-field">
          <span class="auth-field-label">表示名（任意）</span>
          <input v-model="displayName" type="text" autocomplete="nickname" class="auth-input" />
        </label>
        <label class="auth-field">
          <span class="auth-field-label">パスワード（8文字以上）</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="auth-input"
          />
        </label>
        <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
        <button type="submit" class="auth-submit" :disabled="authStore.pending">
          {{ authStore.pending ? '処理中…' : '登録' }}
        </button>
      </form>
      <p class="auth-switch">
        既にアカウントをお持ちの方は
        <router-link to="/login" class="auth-link">ログイン</router-link>
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
