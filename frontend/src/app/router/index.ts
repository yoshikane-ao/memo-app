import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from "vue-router";
import { createMenuAppRoutes, menuHomePath } from "./appRegistry";

const MenuLayout = () => import("../../layouts/MenuLayout.vue");
const MenuHomePage = () => import("../../pages/menu/MenuHomePage.vue");

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: menuHomePath,
  },
  {
    path: menuHomePath,
    component: MenuLayout,
    children: [
      {
        path: "",
        name: "menu-home",
        component: MenuHomePage,
        meta: {
          pageTitle: "アプリ一覧 | Memo App",
        },
      },
      ...createMenuAppRoutes(),
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: menuHomePath,
  },
];

const applyDocumentTitle = (pageTitle?: unknown) => {
  if (typeof document === "undefined") {
    return;
  }

  document.title = typeof pageTitle === "string" && pageTitle.trim() !== "" ? pageTitle : "Memo App";
};

export const createAppRouter = (history: RouterHistory = createWebHistory()) => {
  const router = createRouter({
    history,
    routes,
  });

  router.afterEach((to) => {
    applyDocumentTitle(to.meta.pageTitle);
  });

  return router;
};

export const createTestRouter = () => createAppRouter(createMemoryHistory());

const router = createAppRouter();

export default router;
