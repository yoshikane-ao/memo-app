import type { RouteRecordRaw } from "vue-router";
import type { MenuAppDefinition, MenuSection } from "../../app/router/menuApp.types";

const workspaceSection: MenuSection = {
  slug: "workspace",
  label: "作業スペース",
  description: "記録や整理に使うアプリを、ここからまとめて開けます。",
};

const memoEntry = {
  id: "memo",
  slug: "memo",
  name: "メモ",
  summary: "すばやく記録して、編集・タグ整理・ごみ箱管理まで行えます。",
  ctaLabel: "ひらく",
  section: workspaceSection,
  keywords: ["メモ", "記録", "タグ", "ごみ箱"],
};

const quizEntry = {
  id: "quiz",
  slug: "quiz",
  name: "クイズ",
  summary: "すばやく記録して、編集・タグ整理・ごみ箱管理まで行えます。",
  ctaLabel: "ひらく",
  section: workspaceSection,
  keywords: ["メモ", "記録", "タグ", "ごみ箱"],
};

const tradeEntry = {
  id: "trade",
  slug: "trade",
  name: "トレードバトルゲーム",
  summary: "資金を増やして、相手より多く稼げ！",
  ctaLabel: "ひらく",
  section: workspaceSection,
  keywords: ["投資", "投機", "会社", "バトル"],
};
const loadMemoAppShell: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/MemoAppShell.vue");
const loadMemoPage: NonNullable<RouteRecordRaw["component"]> = () => import("./pages/MemoPage.vue");
const loadMemoTrashPage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/MemoTrashPage.vue");

const loadQuizAppShell: NonNullable<RouteRecordRaw["component"]> = () =>
  import("../quiz-app/register.vue");
const loadQuizPage: NonNullable<RouteRecordRaw["component"]> = () => import("../quiz-app/register.vue");

const loadTradeStartPage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("../tradeApp/view/TradeStartPage.vue");
const loadTradeBattlePage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("../tradeApp/view/TradeBattlePage.vue");

const buildMenuAppPath = (sectionSlug: string, appSlug: string) => `/menu/${sectionSlug}/${appSlug}`;

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
          path: "",
          name: `menu-${memoEntry.section.slug}-${memoEntry.slug}`,
          component: loadMemoPage,
          meta: {
            pageTitle: `${memoEntry.name} | アプリ一覧`,
            menuAppId: memoEntry.id,
            menuSectionSlug: memoEntry.section.slug,
          },
        },
        {
          path: "trash",
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


export const quizAppDefinition: MenuAppDefinition = {
  entry: quizEntry,
  createRoutes: () => [
    {
      path: `${quizEntry.section.slug}/${quizEntry.slug}`,
      component: loadQuizAppShell,
      children: [
        {
          path: "",
          name: `menu-${quizEntry.section.slug}-${quizEntry.slug}`,
          component: loadQuizPage,
          meta: {
            pageTitle: `${quizEntry.name} | アプリ一覧`,
            menuAppId: quizEntry.id,
            menuSectionSlug: quizEntry.section.slug,
          },
        },
      ],
    },
  ],
};


export const tradeAppDefinition: MenuAppDefinition = {
  entry: tradeEntry,
  createRoutes: () => [
    {
      path: `${tradeEntry.section.slug}/${tradeEntry.slug}`,
      name: `menu-${tradeEntry.section.slug}-${tradeEntry.slug}`,
      component: loadTradeStartPage,
      meta: {
        pageTitle: `${tradeEntry.name} | アプリ一覧`,
        menuAppId: tradeEntry.id,
        menuSectionSlug: tradeEntry.section.slug,
      },
    },
    {
      path: `${tradeEntry.section.slug}/${tradeEntry.slug}/battle`,
      name: `menu-${tradeEntry.section.slug}-${tradeEntry.slug}-battle`,
      component: loadTradeBattlePage,
      meta: {
        pageTitle: `${tradeEntry.name} | Battle`,
        menuAppId: tradeEntry.id,
        menuSectionSlug: tradeEntry.section.slug,
      },
    },
  ],
};