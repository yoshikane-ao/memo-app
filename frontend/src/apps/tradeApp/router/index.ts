import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import TradeStartPage from '@/apps/tradeApp/view/TradeStartPage.vue'
import TradeBattlePage from '@/apps/tradeApp/view/TradeBattlePage.vue'
import { useTradeGameStore } from '../store/useTradeGameStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'trade-start' },
  },
  {
    path: '/trade',
    redirect: { name: 'trade-start' },
  },
  {
    path: '/trade/start',
    name: 'trade-start',
    component: TradeStartPage,
  },
  {
    path: '/trade/battle',
    name: 'trade-battle',
    component: TradeBattlePage,
    beforeEnter: () => {
      const gameStore = useTradeGameStore()
      return gameStore.state.isInitialized
        ? true
        : { name: 'trade-start' }
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'trade-start' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
