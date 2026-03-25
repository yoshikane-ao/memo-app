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
  keywords: ["記録", "整理", "タグ", "ごみ箱"],
};

const loadMemoPage: NonNullable<RouteRecordRaw["component"]> = () => import("./pages/MemoPage.vue");
const loadMemoTrashPage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/MemoTrashPage.vue");

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
      name: `menu-${memoEntry.section.slug}-${memoEntry.slug}`,
      component: loadMemoPage,
      meta: {
        pageTitle: `${memoEntry.name} | アプリ一覧`,
        menuAppId: memoEntry.id,
        menuSectionSlug: memoEntry.section.slug,
      },
    },
    {
      path: `${memoEntry.section.slug}/${memoEntry.slug}/trash`,
      name: `menu-${memoEntry.section.slug}-${memoEntry.slug}-trash`,
      component: loadMemoTrashPage,
      meta: {
        pageTitle: `ごみ箱 | ${memoEntry.name}`,
        menuAppId: memoEntry.id,
        menuSectionSlug: memoEntry.section.slug,
      },
    },
  ],
};
