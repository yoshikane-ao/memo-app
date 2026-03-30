<script setup lang="ts">
import { computed } from 'vue'
import type { BattleMode } from '../../store/useTradeGameStore'
import type { TradeProfile } from '../../store/useTradeProfileStore'
import type { PlayerIdentity } from '../../types/playerIdentity'
import { createCpuIdentity } from '../../types/playerIdentity'
import ProfileSlotCard from './ProfileSlotCard.vue'

const props = defineProps<{
  battleMode: BattleMode
  p1Identity: PlayerIdentity
  p2Identity: PlayerIdentity
  p1Profile?: TradeProfile | null
  p2Profile?: TradeProfile | null
}>()

const emit = defineEmits<{
  (e: 'select-profile', slot: 'p1' | 'p2'): void
  (e: 'create-profile', slot: 'p1' | 'p2'): void
  (e: 'reset-to-guest', slot: 'p1' | 'p2'): void
  (e: 'open-stats', slot: 'p1' | 'p2'): void
}>()

const cpuIdentity = createCpuIdentity()

const leftIdentity = computed(() => {
  return props.battleMode === 'cvc' ? cpuIdentity : props.p1Identity
})

const rightIdentity = computed(() => {
  if (props.battleMode === 'pvc' || props.battleMode === 'cvc') {
    return cpuIdentity
  }

  return props.p2Identity
})

const leftDisabled = computed(() => props.battleMode === 'cvc')
const rightDisabled = computed(() => props.battleMode === 'pvc' || props.battleMode === 'cvc')

const helperCopy = computed(() => {
  if (props.battleMode === 'pvp') {
    return 'ゲストのままでも開始できます。プロフィールを選ぶと戦績を保存できます。'
  }

  if (props.battleMode === 'pvc') {
    return 'PLAYER 1 はゲストまたはプロフィールを選択できます。CPU 側の戦績は保存されません。'
  }

  return 'CPU vs CPU ではプロフィール選択は不要です。'
})
</script>

<template>
  <div class="player-setup-section">
    <div class="player-grid">
      <ProfileSlotCard
        slot="p1"
        :identity="leftIdentity"
        :profile="p1Profile"
        :disabled="leftDisabled"
        @select="emit('select-profile', 'p1')"
        @create="emit('create-profile', 'p1')"
        @reset-guest="emit('reset-to-guest', 'p1')"
        @open-stats="emit('open-stats', 'p1')"
      />

      <ProfileSlotCard
        slot="p2"
        :identity="rightIdentity"
        :profile="battleMode === 'pvp' ? p2Profile : null"
        :disabled="rightDisabled"
        @select="emit('select-profile', 'p2')"
        @create="emit('create-profile', 'p2')"
        @reset-guest="emit('reset-to-guest', 'p2')"
        @open-stats="emit('open-stats', 'p2')"
      />
    </div>

    <p class="player-helper">{{ helperCopy }}</p>
  </div>
</template>

<style scoped>
.player-setup-section {
  display: grid;
  gap: 10px;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.player-helper {
  margin: 0;
  color: #98a8cb;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 980px) {
  .player-grid {
    grid-template-columns: 1fr;
  }
}
</style>
