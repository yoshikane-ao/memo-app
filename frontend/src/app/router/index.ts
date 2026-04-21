import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from 'vue-router';
import { useAuthStore } from '../../shared/auth';
import { createMenuAppRoutes, menuHomePath } from './appRegistry';

const MenuLayout = () => import('../../layouts/MenuLayout.vue');
const MenuHomePage = () => import('../../pages/menu/MenuHomePage.vue');
const LoginPage = () => import('../../pages/auth/LoginPage.vue');
const RegisterPage = () => import('../../pages/auth/RegisterPage.vue');

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: menuHomePath,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      pageTitle: 'ログイン | ポートフォリオハブ',
      requiresAuth: false,
      hideForAuthenticated: true,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: {
      pageTitle: '新規登録 | ポートフォリオハブ',
      requiresAuth: false,
      hideForAuthenticated: true,
    },
  },
  {
    path: menuHomePath,
    component: MenuLayout,
    children: [
      {
        path: '',
        name: 'menu-home',
        component: MenuHomePage,
        meta: {
          pageTitle: 'ポートフォリオハブ',
          requiresAuth: false,
        },
      },
      ...createMenuAppRoutes(),
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: menuHomePath,
  },
];

const applyDocumentTitle = (pageTitle?: unknown) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.title =
    typeof pageTitle === 'string' && pageTitle.trim() !== '' ? pageTitle : 'ポートフォリオハブ';
};

export const createAppRouter = (history: RouterHistory = createWebHistory()) => {
  const router = createRouter({
    history,
    routes,
  });

  router.beforeEach(async (to) => {
    const authStore = useAuthStore();
    if (!authStore.hydrated) {
      await authStore.hydrate();
    }

    const requiresAuth = to.meta.requiresAuth !== false;
    if (requiresAuth && !authStore.isAuthenticated) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      };
    }

    if (to.meta.hideForAuthenticated && authStore.isAuthenticated) {
      return menuHomePath;
    }

    return true;
  });

  router.afterEach((to) => {
    applyDocumentTitle(to.meta.pageTitle);
  });

  return router;
};

export const createTestRouter = () => createAppRouter(createMemoryHistory());

const router = createAppRouter();

export default router;
