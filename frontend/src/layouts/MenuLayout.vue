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
</script>

<template>
  <div class="menu-shell">
    <header class="menu-shell-header">
      <div class="menu-shell-header-row">
        <div class="menu-shell-home">
          <RouterLink :to="menuHomePath" class="menu-shell-home-link">
            アプリ一覧
          </RouterLink>
          <p class="menu-shell-home-copy">ひとつの入口から、必要な機能へ移動できます。</p>
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

    <main class="menu-shell-main">
      <router-view />
    </main>
  </div>
</template>
