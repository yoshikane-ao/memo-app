<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { findMenuAppById, menuHomePath } from "../app/router/appRegistry";
import "../styles/menu-theme.css";
import "./menu-shell.css";

const route = useRoute();

const activeApp = computed(() => {
  const menuAppId = route.meta.menuAppId;
  return typeof menuAppId === "string" ? findMenuAppById(menuAppId) : null;
});

const isMenuHome = computed(() => {
  return route.path === menuHomePath || route.name === "menu-home";
});

const isTradeBattleRoute = computed(() => {
  return route.name === "menu-workspace-trade-battle";
});

const showCompactNav = computed(() => {
  return !isMenuHome.value && !isTradeBattleRoute.value;
});
</script>

<template>
  <div class="menu-shell">
    <header v-if="isMenuHome" class="menu-shell-header">
      <div class="menu-shell-header-row">
        <div class="menu-shell-home">
          <RouterLink :to="menuHomePath" class="menu-shell-home-link">
            アプリ一覧
          </RouterLink>
          <p class="menu-shell-home-copy">
            ひとつの入口から、必要な機能へ移動できます。
          </p>
        </div>

        <div v-if="activeApp" class="menu-shell-breadcrumb">
          <span class="menu-shell-breadcrumb-section">{{ activeApp.section.label }}</span>
          <span class="menu-shell-breadcrumb-separator">/</span>
          <span class="menu-shell-breadcrumb-app">{{ activeApp.name }}</span>
        </div>
      </div>

      <div class="menu-shell-summary">
        <template v-if="activeApp">
          {{ activeApp.summary }}
        </template>
        <template v-else>
          開きたい機能を選んでください。ここから各アプリへ進めます。
        </template>
      </div>
    </header>

    <div v-else-if="showCompactNav" class="menu-shell-compact-nav">
      <RouterLink :to="menuHomePath" class="menu-shell-compact-link">
        アプリ一覧へ戻る
      </RouterLink>
    </div>

    <main class="menu-shell-main">
      <router-view />
    </main>
  </div>
</template>
