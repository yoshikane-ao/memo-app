<script setup lang="ts">
import type { BattleMode } from '../../store/useTradeGameStore'

const props = defineProps<{
  battleMode: BattleMode
  player1Name: string
  player2Name: string
}>()

const emit = defineEmits<{
  (e: 'update:player1Name', value: string): void
  (e: 'update:player2Name', value: string): void
}>()
</script>

<template>
  <div class="player-grid">
    <label v-if="props.battleMode !== 'cvc'" class="field">
      <span class="field-label">Player1 名</span>
      <input
        class="field-input"
        type="text"
        maxlength="20"
        placeholder="PLAYER 1"
        :value="props.player1Name"
        @input="emit('update:player1Name', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div v-else class="field field--fixed">
      <span class="field-label">Player1 名</span>
      <div class="fixed-value">プレイヤー1</div>
    </div>

    <label v-if="props.battleMode === 'pvp'" class="field">
      <span class="field-label">Player2 名</span>
      <input
        class="field-input"
        type="text"
        maxlength="20"
        placeholder="PLAYER 2"
        :value="props.player2Name"
        @input="emit('update:player2Name', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div v-else-if="props.battleMode === 'pvc'" class="field field--fixed">
      <span class="field-label">Player2 名</span>
      <div class="fixed-value">CPU</div>
    </div>

    <div v-else class="field field--fixed">
      <span class="field-label">Player2 名</span>
      <div class="fixed-value">プレイヤー2</div>
    </div>
  </div>
</template>

<style scoped>
.player-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.field {
  display: grid;
  gap: 5px;
}

.field-label {
  font-size: 11px;
  color: #a7b8df;
}

.field-input,
.fixed-value {
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(11, 20, 40, 0.94), rgba(7, 14, 29, 0.96));
  color: #f5f7fb;
  padding: 0 12px;
  font-size: 13px;
  box-sizing: border-box;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.field-input:focus {
  outline: none;
  border-color: rgba(116, 167, 255, 0.48);
  box-shadow: 0 0 0 3px rgba(73, 120, 255, 0.14);
}

.fixed-value {
  display: flex;
  align-items: center;
  color: #d9e4ff;
  background: linear-gradient(180deg, rgba(21, 35, 63, 0.9), rgba(10, 18, 34, 0.96));
}

@media (max-width: 900px) {
  .player-grid {
    grid-template-columns: 1fr;
  }
}
</style>
