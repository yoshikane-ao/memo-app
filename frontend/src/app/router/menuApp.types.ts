import type { RouteRecordRaw } from "vue-router";

export type MenuSection = {
  slug: string;
  label: string;
  description: string;
};

export type MenuAppEntry = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  ctaLabel: string;
  section: MenuSection;
  keywords: string[];
};

export type MenuAppDefinition = {
  entry: MenuAppEntry;
  createRoutes: () => RouteRecordRaw[];
};

export type MenuSectionGroup = {
  section: MenuSection;
  apps: Array<MenuAppEntry & { path: string }>;
};
