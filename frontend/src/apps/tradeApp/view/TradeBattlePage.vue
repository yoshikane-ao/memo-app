<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TradeWorkspaceShell from './TradeWorkspaceShell.vue'
import TradeBattleScreen from './TradeBattleScreen.vue'
import { useTradeGameStore } from '../store/useTradeGameStore'

const router = useRouter()
const gameStore = useTradeGameStore()
const isInitialized = computed(() => gameStore.state.isInitialized)

onMounted(() => {
  if (!isInitialized.value) {
    router.replace({ name: 'menu-workspace-trade' })
  }
})
</script>

<template>
  <TradeWorkspaceShell current-label="trade battle">
    <section class="trade-battle-page-shell">
      <TradeBattleScreen v-if="isInitialized" />
    </section>
  </TradeWorkspaceShell>
</template>

<style scoped>
.trade-battle-page-shell {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #05070d;
}
</style>
