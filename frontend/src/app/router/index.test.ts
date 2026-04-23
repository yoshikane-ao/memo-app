import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { activateTestPinia } from '../../test/pinia';
import { useAuthStore } from '../../shared/auth';
import { createAppRouter } from './index';

vi.mock('../../shared/auth/authApi', () => ({
  authApi: {
    me: vi.fn().mockResolvedValue({ id: 1, email: 'user@example.com', displayName: null }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe('app router', () => {
  beforeEach(() => {
    activateTestPinia();
    // 認証済み状態にしておく。/auth/me のモックは必要な場合のみ動く。
    useAuthStore().$patch({
      user: { id: 1, email: 'user@example.com', displayName: null },
      hydrated: true,
    });
  });

  afterEach(() => {
    document.title = '';
  });

  it('redirects the root path to /menu', async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push('/');
    await router.isReady();

    expect(router.currentRoute.value.fullPath).toBe('/menu');
    expect(document.title).toBe('ポートフォリオハブ');
  });

  it('resolves the memo app under the menu section path', async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push('/menu/workspace/memo');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('menu-workspace-memo');
    expect(router.currentRoute.value.meta.menuAppId).toBe('memo');
    expect(document.title).toBe('メモ | アプリ一覧');
  });

  it('resolves the memo trash page under the menu section path', async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push('/menu/workspace/memo/trash');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('menu-workspace-memo-trash');
    expect(router.currentRoute.value.meta.menuAppId).toBe('memo');
    expect(document.title).toBe('ごみ箱 | メモ');
  });

  it('redirects unauthenticated user to /login when accessing memo app', async () => {
    useAuthStore().$patch({ user: null, hydrated: true });
    const router = createAppRouter(createMemoryHistory());

    await router.push('/menu/workspace/memo');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/menu/workspace/memo');
  });
});
