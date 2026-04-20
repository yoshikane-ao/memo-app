import type { RouteRecordRaw } from 'vue-router';
import type { MenuAppDefinition, MenuAppEntry } from '../../app/router/menuApp.types';
import { workspaceSection } from '../../app/router/menuSections';

const memoEntry: MenuAppEntry = {
  id: 'memo',
  slug: 'memo',
  name: 'メモ',
  summary: 'すばやく記録して、タグ整理とごみ箱管理まで行えます。',
  ctaLabel: 'ひらく',
  section: workspaceSection,
  keywords: ['メモ', '記録', 'タグ', 'ごみ箱'],
  portfolio: {
    thumbnail: '/portfolio/memo.svg',
    highlights: [
      'タグ管理とごみ箱を組み合わせ、整理と誤削除復帰を両立した',
      'Prismaのソフトデリート設計で、DB整合性とUX要件を同時に満たした',
    ],
    languages: ['TypeScript'],
    frameworks: ['Vue 3', 'Express', 'Prisma'],
    databases: ['PostgreSQL'],
    period: '2ヶ月',
  },
};

const loadMemoAppShell: NonNullable<RouteRecordRaw['component']> = () =>
  import('./pages/MemoAppShell.vue');
const loadMemoPage: NonNullable<RouteRecordRaw['component']> = () => import('./pages/MemoPage.vue');
const loadMemoTrashPage: NonNullable<RouteRecordRaw['component']> = () =>
  import('./pages/MemoTrashPage.vue');

const buildMenuAppPath = (sectionSlug: string, appSlug: string) =>
  `/menu/${sectionSlug}/${appSlug}`;

export const memoPaths = {
  active: buildMenuAppPath(memoEntry.section.slug, memoEntry.slug),
  trash: `${buildMenuAppPath(memoEntry.section.slug, memoEntry.slug)}/trash`,
} as const;

export const memoAppDefinition: MenuAppDefinition = {
  entry: memoEntry,
  createRoutes: () => [
    {
      path: `${memoEntry.section.slug}/${memoEntry.slug}`,
      component: loadMemoAppShell,
      children: [
        {
          path: '',
          name: `menu-${memoEntry.section.slug}-${memoEntry.slug}`,
          component: loadMemoPage,
          meta: {
            pageTitle: `${memoEntry.name} | アプリ一覧`,
            menuAppId: memoEntry.id,
            menuSectionSlug: memoEntry.section.slug,
          },
        },
        {
          path: 'trash',
          name: `menu-${memoEntry.section.slug}-${memoEntry.slug}-trash`,
          component: loadMemoTrashPage,
          meta: {
            pageTitle: `ごみ箱 | ${memoEntry.name}`,
            menuAppId: memoEntry.id,
            menuSectionSlug: memoEntry.section.slug,
          },
        },
      ],
    },
  ],
};
