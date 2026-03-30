<script setup lang="ts">
const props = defineProps<{
  cpuMode: 'fixed' | 'random'
  fixedValue: number
  randomMin: number
  randomMax: number
  resolvedPreview: number
}>()

const emit = defineEmits<{
  (e: 'update:cpuMode', value: 'fixed' | 'random'): void
  (e: 'update:fixedValue', value: number): void
  (e: 'update:randomMin', value: number): void
  (e: 'update:randomMax', value: number): void
  (e: 'normalize'): void
}>()
</script>

<template>
  <div class="market-cpu-section">
    <div class="field-head">
      <span class="field-label">市場参加CPU数</span>
      <span class="field-value">
        <template v-if="props.cpuMode === 'fixed'">{{ props.fixedValue }}人</template>
        <template v-else>{{ props.randomMin }}〜{{ props.randomMax }}人</template>
      </span>
    </div>

    <div class="mode-switch" role="tablist" aria-label="市場参加CPU数の設定方法">
      <button
        type="button"
        class="mode-chip"
        :class="{ active: props.cpuMode === 'fixed' }"
        @click="emit('update:cpuMode', 'fixed')"
      >
        固定
      </button>
      <button
        type="button"
        class="mode-chip"
        :class="{ active: props.cpuMode === 'random' }"
        @click="emit('update:cpuMode', 'random')"
      >
        ランダム
      </button>
    </div>

    <div v-if="props.cpuMode === 'fixed'" class="market-row">
      <input
        id="marketCpuRange"
        class="cpu-range"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="props.fixedValue"
        @input="emit('update:fixedValue', Number(($event.target as HTMLInputElement).value))"
      />

      <input
        class="cpu-number"
        type="number"
        min="0"
        max="100"
        step="1"
        :value="props.fixedValue"
        @input="emit('update:fixedValue', Number(($event.target as HTMLInputElement).value))"
        @change="emit('normalize')"
      />
    </div>

    <div v-else class="random-grid">
      <label class="range-card">
        <span class="range-label">最小</span>
        <input
          class="cpu-number"
          type="number"
          min="0"
          max="100"
          step="1"
          :value="props.randomMin"
          @input="emit('update:randomMin', Number(($event.target as HTMLInputElement).value))"
          @change="emit('normalize')"
        />
      </label>

      <label class="range-card">
        <span class="range-label">最大</span>
        <input
          class="cpu-number"
          type="number"
          min="0"
          max="100"
          step="1"
          :value="props.randomMax"
          @input="emit('update:randomMax', Number(($event.target as HTMLInputElement).value))"
          @change="emit('normalize')"
        />
      </label>
    </div>

    <div class="preview-box">
      <span class="preview-label">開始時に反映される人数</span>
      <strong class="preview-value">{{ props.resolvedPreview }}人</strong>
    </div>
  </div>
</template>

<style scoped>
.market-cpu-section {
  display: grid;
  gap: 8px;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.field-label {
  font-size: 11px;
  color: #a7b8df;
}

.field-value {
  font-size: 12px;
  font-weight: 800;
  color: #dce6ff;
}

.mode-switch {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(7, 13, 27, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-chip {
  height: 34px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #9db0d6;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.mode-chip:hover {
  transform: translateY(-1px);
  color: #edf3ff;
}

.mode-chip.active {
  background: linear-gradient(135deg, rgba(91, 132, 255, 0.28), rgba(255, 90, 118, 0.18));
  color: #f7f9ff;
  box-shadow: 0 0 14px rgba(95, 134, 255, 0.16);
}

.market-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
  gap: 8px;
  align-items: center;
}

.random-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.range-card {
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(11, 19, 37, 0.96), rgba(7, 14, 29, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.range-label {
  font-size: 11px;
  color: #9bb0d8;
}

.cpu-range {
  width: 100%;
  margin: 0;
  accent-color: #5e8cff;
  filter: drop-shadow(0 0 10px rgba(88, 129, 255, 0.18));
}

.cpu-number {
  width: 100%;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(11, 20, 40, 0.94), rgba(7, 14, 29, 0.96));
  color: #f5f7fb;
  padding: 0 10px;
  font-size: 13px;
  text-align: right;
  box-sizing: border-box;
}

.cpu-number:focus {
  outline: none;
  border-color: rgba(116, 167, 255, 0.48);
  box-shadow: 0 0 0 3px rgba(73, 120, 255, 0.14);
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(13, 22, 43, 0.96), rgba(8, 14, 27, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-label {
  font-size: 11px;
  color: #9cb2db;
}

.preview-value {
  font-size: 13px;
  color: #eef4ff;
}
</style>
