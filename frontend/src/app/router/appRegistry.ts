import type { RouteRecordRaw } from "vue-router";
import { memoAppDefinition } from "../../apps/memoApp";
import type { MenuAppDefinition, MenuAppEntry, MenuSectionGroup } from "./menuApp.types";

export const menuHomePath = "/menu";

export const buildMenuAppPath = (sectionSlug: string, appSlug: string) =>
  `${menuHomePath}/${sectionSlug}/${appSlug}`;

const appDefinitions: MenuAppDefinition[] = [memoAppDefinition];

export const menuAppRegistry: MenuAppEntry[] = appDefinitions.map(({ entry }) => entry);

const registryWithPaths = menuAppRegistry.map((entry) => ({
  ...entry,
  path: buildMenuAppPath(entry.section.slug, entry.slug),
}));

export const menuSectionGroups: MenuSectionGroup[] = Object.values(
  registryWithPaths.reduce<Record<string, MenuSectionGroup>>((groups, entry) => {
    const existingGroup = groups[entry.section.slug];
    if (existingGroup) {
      existingGroup.apps.push(entry);
      return groups;
    }

    groups[entry.section.slug] = {
      section: entry.section,
      apps: [entry],
    };
    return groups;
  }, {})
);

export const findMenuAppById = (appId: string) =>
  menuAppRegistry.find((entry) => entry.id === appId) ?? null;

export const createMenuAppRoutes = (): RouteRecordRaw[] =>
  appDefinitions.flatMap((definition) => definition.createRoutes());
