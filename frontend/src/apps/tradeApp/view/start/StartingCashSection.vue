<script setup lang="ts">
type StartingCashMode = 'same' | 'separate'

const props = defineProps<{
  cashMode: StartingCashMode
  sharedCash: number
  player1Cash: number
  player2Cash: number
  player1Name: string
  player2Name: string
}>()

const emit = defineEmits<{
  (e: 'update:cashMode', value: StartingCashMode): void
  (e: 'update:sharedCash', value: number): void
  (e: 'update:player1Cash', value: number): void
  (e: 'update:player2Cash', value: number): void
}>()
</script>

<template>
  <div class="cash-section">
    <div class="mode-grid">
      <button
        type="button"
        class="mode-button"
        :class="{ 'mode-button--active': props.cashMode === 'same' }"
        @click="emit('update:cashMode', 'same')"
      >
        同額スタート
      </button>

      <button
        type="button"
        class="mode-button"
        :class="{ 'mode-button--active': props.cashMode === 'separate' }"
        @click="emit('update:cashMode', 'separate')"
      >
        個別スタート
      </button>
    </div>

    <div v-if="props.cashMode === 'same'" class="cash-grid cash-grid--single">
      <label class="field">
        <span class="field-label">共通の初期現金</span>
        <div class="money-input">
          <span class="currency">¥</span>
          <input
            class="field-input"
            type="number"
            min="0"
            step="100"
            :value="props.sharedCash"
            @input="emit('update:sharedCash', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </label>
    </div>

    <div v-else class="cash-grid">
      <label class="field">
        <span class="field-label">{{ props.player1Name }} の初期現金</span>
        <div class="money-input">
          <span class="currency">¥</span>
          <input
            class="field-input"
            type="number"
            min="0"
            step="100"
            :value="props.player1Cash"
            @input="emit('update:player1Cash', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </label>

      <label class="field">
        <span class="field-label">{{ props.player2Name }} の初期現金</span>
        <div class="money-input">
          <span class="currency">¥</span>
          <input
            class="field-input"
            type="number"
            min="0"
            step="100"
            :value="props.player2Cash"
            @input="emit('update:player2Cash', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </label>
    </div>
  </div>
</template>

<style scoped>
.cash-section {
  display: grid;
  gap: 8px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mode-button {
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(17, 29, 55, 0.84), rgba(9, 17, 32, 0.94));
  color: #f5f7fb;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.mode-button:hover {
  transform: translateY(-1px);
  border-color: rgba(125, 205, 255, 0.24);
}

.mode-button--active {
  border-color: rgba(125, 205, 255, 0.7);
  background: linear-gradient(135deg, rgba(73, 119, 255, 0.9), rgba(58, 198, 255, 0.82));
  box-shadow:
    0 10px 22px rgba(52, 109, 255, 0.22),
    inset 0 1px 0 rgba(255,255,255,0.12);
}

.cash-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.cash-grid--single {
  grid-template-columns: 1fr;
}

.field {
  display: grid;
  gap: 5px;
}

.field-label {
  font-size: 11px;
  color: #a7b8df;
}

.money-input {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.currency {
  font-size: 13px;
  font-weight: 800;
  color: #7fb5ff;
}

.field-input {
  width: 100%;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(11, 20, 40, 0.94), rgba(7, 14, 29, 0.96));
  color: #f5f7fb;
  padding: 0 10px;
  font-size: 13px;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: rgba(116, 167, 255, 0.48);
  box-shadow: 0 0 0 3px rgba(73, 120, 255, 0.14);
}

@media (max-width: 900px) {
  .mode-grid,
  .cash-grid {
    grid-template-columns: 1fr;
  }
}
</style>
