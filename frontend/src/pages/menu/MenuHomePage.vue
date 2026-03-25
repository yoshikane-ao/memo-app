<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { menuSectionGroups } from "../../app/router/appRegistry";
import "./menu-home.css";

const totalAppCount = computed(() =>
  menuSectionGroups.reduce((count, group) => count + group.apps.length, 0)
);

const getSectionStyle = (index: number) => ({
  "--menu-section-enter-delay": `${0.12 + index * 0.06}s`,
});

const getCardStyle = (groupIndex: number, appIndex: number) => ({
  "--menu-card-enter-delay": `${0.16 + (groupIndex * 3 + appIndex) * 0.06}s`,
});
</script>

<template>
  <div class="menu-home-page">
    <section class="menu-hero">
      <p class="menu-hero-kicker">アプリ一覧</p>
      <h1 class="menu-hero-title">使いたい機能を、ここからすぐに。</h1>
      <p class="menu-hero-copy">
        記録や整理に使う機能を、ひとつの入口から迷わず開けます。これからアプリが増えても、
        同じ場所から探せます。
      </p>
      <div class="menu-hero-meta">
        <span class="menu-hero-pill">現在利用できるアプリ {{ totalAppCount }}件</span>
      </div>
    </section>

    <section
      v-for="(group, groupIndex) in menuSectionGroups"
      :key="group.section.slug"
      class="menu-section"
      :data-menu-section="group.section.slug"
      :style="getSectionStyle(groupIndex)"
    >
      <div class="menu-section-header">
        <div class="menu-section-heading">
          <p class="menu-section-kicker">カテゴリー</p>
          <h2 class="menu-section-title">{{ group.section.label }}</h2>
        </div>
        <div class="menu-section-meta">
          <p class="menu-section-copy">{{ group.section.description }}</p>
          <span class="menu-section-count">{{ group.apps.length }}件</span>
        </div>
      </div>

      <div class="menu-card-grid">
        <RouterLink
          v-for="(app, appIndex) in group.apps"
          :key="app.id"
          :to="app.path"
          class="menu-app-card"
          :data-menu-app-id="app.id"
          :style="getCardStyle(groupIndex, appIndex)"
        >
          <div class="menu-app-card-header">
            <div class="menu-app-card-title-block">
              <span class="menu-app-card-title">{{ app.name }}</span>
              <span class="menu-app-card-subtitle">{{ group.section.label }}</span>
            </div>
            <span class="menu-app-card-arrow" aria-hidden="true">&rarr;</span>
          </div>
          <p class="menu-app-card-summary">{{ app.summary }}</p>
          <div class="menu-app-card-keywords">
            <span
              v-for="keyword in app.keywords"
              :key="`${app.id}-${keyword}`"
              class="menu-app-card-keyword"
            >
              {{ keyword }}
            </span>
          </div>
          <div class="menu-app-card-footer">
            <span class="menu-app-card-cta">{{ app.ctaLabel }}</span>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
