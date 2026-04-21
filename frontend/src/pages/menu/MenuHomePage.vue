<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { menuSectionGroups } from '../../app/router/appRegistry';
import { useThemeStore } from '../../shared/theme/useThemeStore';
import './menu-home.css';

const theme = useThemeStore();

const thumbnailFor = (path: string) => {
  if (theme.mode === 'dark') return path;
  return path.replace(/\.(png|svg)$/, '-light.$1');
};

type PortfolioGroup = {
  section: (typeof menuSectionGroups)[number]['section'];
  apps: Array<(typeof menuSectionGroups)[number]['apps'][number]>;
};

const portfolioGroups = computed<PortfolioGroup[]>(() =>
  menuSectionGroups
    .map((group) => ({
      section: group.section,
      apps: group.apps.filter((app) => app.portfolio),
    }))
    .filter((group) => group.apps.length > 0),
);

const totalWorkCount = computed(() =>
  portfolioGroups.value.reduce((count, group) => count + group.apps.length, 0),
);

const getSectionStyle = (index: number) => ({
  '--menu-section-enter-delay': `${0.12 + index * 0.06}s`,
});

const getCardStyle = (groupIndex: number, appIndex: number) => ({
  '--menu-card-enter-delay': `${0.16 + (groupIndex * 3 + appIndex) * 0.06}s`,
});
</script>

<template>
  <div class="menu-home-page">
    <section class="menu-hero">
      <p class="menu-hero-kicker">ポートフォリオ</p>
      <h1 class="menu-hero-title">作ったものを、動かしながら見せる。</h1>
      <p class="menu-hero-copy">
        各作品の概要・工夫した点・使用技術・制作期間を並べています。カードから実際のアプリを
        開いて、そのまま触って確認できます。
      </p>
      <div class="menu-hero-meta">
        <span class="menu-hero-pill">掲載作品 {{ totalWorkCount }}件</span>
      </div>
    </section>

    <section
      v-for="(group, groupIndex) in portfolioGroups"
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
          <div v-if="app.portfolio" class="menu-app-card-thumb">
            <img :src="thumbnailFor(app.portfolio.thumbnail)" :alt="app.name" loading="lazy" />
          </div>
          <div class="menu-app-card-body">
            <div class="menu-app-card-header">
              <div class="menu-app-card-title-block">
                <span class="menu-app-card-title">{{ app.name }}</span>
                <span class="menu-app-card-subtitle">{{ group.section.label }}</span>
              </div>
              <span class="menu-app-card-arrow" aria-hidden="true">&rarr;</span>
            </div>
            <p class="menu-app-card-summary">{{ app.summary }}</p>
            <ul v-if="app.portfolio" class="menu-app-card-highlights">
              <li v-for="highlight in app.portfolio.highlights" :key="highlight">
                {{ highlight }}
              </li>
            </ul>
            <dl v-if="app.portfolio" class="menu-app-card-stack">
              <div class="menu-app-card-stack-row">
                <dt>言語</dt>
                <dd>{{ app.portfolio.languages.join(', ') }}</dd>
              </div>
              <div class="menu-app-card-stack-row">
                <dt>フレームワーク</dt>
                <dd>{{ app.portfolio.frameworks.join(', ') }}</dd>
              </div>
              <div class="menu-app-card-stack-row">
                <dt>DB</dt>
                <dd>{{ app.portfolio.databases.join(', ') }}</dd>
              </div>
              <div class="menu-app-card-stack-row">
                <dt>制作期間</dt>
                <dd>{{ app.portfolio.period }}</dd>
              </div>
            </dl>
            <div class="menu-app-card-footer">
              <span class="menu-app-card-cta">{{ app.ctaLabel }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
