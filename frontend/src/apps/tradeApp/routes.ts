import type { RouteRecordRaw } from "vue-router";
import type { MenuAppDefinition } from "../../app/router/menuApp.types";
import { workspaceSection } from "../../app/router/menuSections";

const tradeEntry = {
  id: "trade",
  slug: "trade",
  name: "Trade Battle Game",
  summary: "A local two-player stock battle game.",
  ctaLabel: "Open",
  section: workspaceSection,
  keywords: ["trade", "stocks", "battle", "game"],
};

const loadTradeAppShell: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/TradeAppShell.vue");
const loadTradeStartPage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/TradeStartPage.vue");
const loadTradeBattlePage: NonNullable<RouteRecordRaw["component"]> = () =>
  import("./pages/TradeBattlePage.vue");

export const tradeAppDefinition: MenuAppDefinition = {
  entry: tradeEntry,
  createRoutes: () => [
    {
      path: `${tradeEntry.section.slug}/${tradeEntry.slug}`,
      component: loadTradeAppShell,
      children: [
        {
          path: "",
          name: `menu-${tradeEntry.section.slug}-${tradeEntry.slug}`,
          component: loadTradeStartPage,
          meta: {
            pageTitle: `${tradeEntry.name} | Start`,
            menuAppId: tradeEntry.id,
            menuSectionSlug: tradeEntry.section.slug,
          },
        },
        {
          path: "battle",
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
