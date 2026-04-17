import type { RouteRecordRaw } from "vue-router";
import type { MenuAppDefinition } from "../../app/router/menuApp.types";
import { workspaceSection } from "../../app/router/menuSections";

const testEntry = {
  id: "test",
  slug: "test",
  name: "Test App",
  summary: "A lightweight board used for UI and routing checks.",
  ctaLabel: "Open",
  section: workspaceSection,
  keywords: ["test", "board", "pipeline"],
};

const loadTestAppShell: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/TestAppShell.vue");
const loadTestPage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/TestPage.vue");

export const testAppDefinition: MenuAppDefinition = {
  entry: testEntry,
  createRoutes: () => [
    {
      path: `${testEntry.section.slug}/${testEntry.slug}`,
      component: loadTestAppShell,
      children: [
        {
          path: "",
          name: `menu-${testEntry.section.slug}-${testEntry.slug}`,
          component: loadTestPage,
          meta: {
            pageTitle: `${testEntry.name} | Overview`,
            menuAppId: testEntry.id,
            menuSectionSlug: testEntry.section.slug,
          },
        },
        {
          path: "battle",
          name: `menu-${testEntry.section.slug}-${testEntry.slug}-battle`,
          component: loadTestPage,
          meta: {
            pageTitle: `${testEntry.name} | Board`,
            menuAppId: testEntry.id,
            menuSectionSlug: testEntry.section.slug,
          },
        },
      ],
    },
  ],
};
