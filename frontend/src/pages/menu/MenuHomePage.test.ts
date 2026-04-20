import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import MenuHomePage from './MenuHomePage.vue';

describe('MenuHomePage', () => {
  it('renders the memo app card and links to its menu path', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/menu',
          component: { template: '<div />' },
        },
        {
          path: '/menu/workspace/memo',
          component: { template: '<div />' },
        },
        {
          path: '/menu/workspace/quiz',
          component: { template: '<div />' },
        },
        {
          path: '/menu/workspace/trade',
          component: { template: '<div />' },
        },
        {
          path: '/menu/workspace/test',
          component: { template: '<div />' },
        },
      ],
    });

    router.push('/menu');
    await router.isReady();

    const wrapper = mount(MenuHomePage, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const memoCard = wrapper.get('[data-menu-app-id="memo"]');
    expect(memoCard.text()).toContain('メモ');
    expect(memoCard.attributes('href')).toBe('/menu/workspace/memo');
  });
});
