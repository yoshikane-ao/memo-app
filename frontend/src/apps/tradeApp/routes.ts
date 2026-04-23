import type { RouteRecordRaw } from 'vue-router';
import type { MenuAppDefinition, MenuAppEntry } from '../../app/router/menuApp.types';
import { workspaceSection } from '../../app/router/menuSections';

const tradeEntry: MenuAppEntry = {
  id: 'trade',
  slug: 'trade',
  name: 'Trade Battle Game',
  summary: '2人対戦のローカル株式バトルゲーム。',
  ctaLabel: 'ひらく',
  section: workspaceSection,
  keywords: ['trade', 'stocks', 'battle', 'game'],
  portfolio: {
    thumbnail: '/portfolio/trade.png',
    highlights: [
      '1画面で2プレイヤーが交互に操作するローカル対戦の進行管理を実装した',
      '価格変動ロジックと勝敗判定を純粋関数で分離し、テスト容易性を高めた',
    ],
    languages: ['TypeScript'],
    frameworks: ['Vue 3', 'Express'],
    databases: ['PostgreSQL'],
    period: '1ヶ月',
  },
};

const loadTradeAppShell: NonNullable<RouteRecordRaw['component']> = () =>
  import('./pages/TradeAppShell.vue');
const loadTradeStartPage: NonNullable<RouteRecordRaw['component']> = () =>
  import('./pages/TradeStartPage.vue');
const loadTradeBattlePage: NonNullable<RouteRecordRaw['component']> = () =>
  import('./pages/TradeBattlePage.vue');

export const tradeAppDefinition: MenuAppDefinition = {
  entry: tradeEntry,
  createRoutes: () => [
    {
      path: `${tradeEntry.section.slug}/${tradeEntry.slug}`,
      component: loadTradeAppShell,
      children: [
        {
          path: '',
          name: `menu-${tradeEntry.section.slug}-${tradeEntry.slug}`,
          component: loadTradeStartPage,
          meta: {
            pageTitle: `${tradeEntry.name} | Start`,
            menuAppId: tradeEntry.id,
            menuSectionSlug: tradeEntry.section.slug,
          },
        },
        {
          path: 'battle',
          name: `menu-${tradeEntry.section.slug}-${tradeEntry.slug}-battle`,
          component: loadTradeBattlePage,
          meta: {
            pageTitle: `${tradeEntry.name} | Battle`,
            menuAppId: tradeEntry.id,
            menuSectionSlug: tradeEntry.section.slug,
          },
        },
      ],
    },
  ],
};
