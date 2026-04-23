<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { findMenuAppById, menuHomePath } from '../app/router/appRegistry';
import ThemeToggle from '../shared/theme/ThemeToggle.vue';
import { useAuthStore } from '../shared/auth';
import '../styles/menu-theme.css';
import './menu-shell.css';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
  await router.push('/login');
};

const activeApp = computed(() => {
  const menuAppId = route.meta.menuAppId;
  return typeof menuAppId === 'string' ? findMenuAppById(menuAppId) : null;
});

const isMenuHome = computed(() => {
  return route.path === menuHomePath || route.name === 'menu-home';
});

const isTradeBattleRoute = computed(() => {
  return route.name === 'menu-workspace-trade-battle';
});

const isTradeAppRoute = computed(() => {
  return route.meta.menuAppId === 'trade';
});

const showCompactNav = computed(() => {
  return !isMenuHome.value && !isTradeBattleRoute.value;
});

// displayName が文字化け（U+FFFD を含む）している場合は email にフォールバックする。
// バックエンド/DB 側のエンコーディング不整合に対する防御。
const displayLabel = computed(() => {
  const name = authStore.user?.displayName;
  if (name && !name.includes('\uFFFD')) return name;
  return authStore.user?.email ?? '';
});

const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="menu-shell">
    <header v-if="isMenuHome" class="menu-shell-header">
      <div class="menu-shell-header-row">
        <div class="menu-shell-home">
          <RouterLink :to="menuHomePath" class="menu-shell-home-link"> ポートフォリオ </RouterLink>
          <p class="menu-shell-home-copy">作品の概要と使用技術を一覧できます。</p>
        </div>

        <div class="menu-shell-header-actions">
          <div v-if="activeApp" class="menu-shell-breadcrumb">
            <span class="menu-shell-breadcrumb-section">{{ activeApp.section.label }}</span>
            <span class="menu-shell-breadcrumb-separator">/</span>
            <span class="menu-shell-breadcrumb-app">{{ activeApp.name }}</span>
          </div>
          <ThemeToggle v-if="!isTradeAppRoute" />
          <template v-if="authStore.isAuthenticated">
            <span class="menu-shell-user">
              {{ displayLabel }}
            </span>
            <button type="button" class="menu-shell-auth-button" @click="handleLogout">
              ログアウト
            </button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="menu-shell-auth-button">ログイン</RouterLink>
          </template>
        </div>
      </div>

      <div class="menu-shell-summary">
        <template v-if="activeApp">
          {{ activeApp.summary }}
        </template>
        <template v-else>
          気になる作品を選ぶと、そのままアプリを開いて動作を確認できます。
        </template>
      </div>
    </header>

    <div v-else-if="showCompactNav" class="menu-shell-compact-nav">
      <RouterLink :to="menuHomePath" class="menu-shell-compact-link">
        ポートフォリオへ戻る
      </RouterLink>
      <div class="menu-shell-compact-actions">
        <ThemeToggle v-if="!isTradeAppRoute" />
        <template v-if="authStore.isAuthenticated">
          <span class="menu-shell-user">
            {{ displayLabel }}
          </span>
          <button type="button" class="menu-shell-auth-button" @click="handleLogout">
            ログアウト
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="menu-shell-auth-button">ログイン</RouterLink>
        </template>
      </div>
    </div>

    <div v-else-if="isTradeBattleRoute && !isTradeAppRoute" class="menu-shell-floating-actions">
      <ThemeToggle />
    </div>

    <main class="menu-shell-main">
      <router-view />
    </main>

    <footer v-if="isMenuHome" class="menu-shell-footer">
      <span class="menu-shell-footer-copy">© {{ currentYear }} Portfolio</span>
    </footer>
  </div>
</template>
