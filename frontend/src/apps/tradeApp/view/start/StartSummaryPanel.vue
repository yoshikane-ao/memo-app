<script setup lang="ts">
const props = defineProps<{
  battleModeLabel: string
  player1Name: string
  player2Name: string
  firstPlayerLabel: string
  marketCpuCount: number
  player1Cash: number
  player2Cash: number
  canStart: boolean
}>()

const emit = defineEmits<{
  (e: 'start'): void
}>()

function formatCurrency(value: number): string {
  return `¥${Math.max(0, Math.floor(value || 0)).toLocaleString()}`
}
</script>

<template>
  <section class="summary-card">
    <header class="summary-head">
      <div>
        <h2>開始設定の確認</h2>
        <p>この内容でそのまま対戦を始めます。</p>
      </div>
      <span class="summary-badge">一画面確認</span>
    </header>

    <dl class="summary-grid">
      <div class="summary-item summary-item--wide">
        <dt>対戦形式</dt>
        <dd>{{ props.battleModeLabel }}</dd>
      </div>
      <div class="summary-item">
        <dt>プレイヤー1</dt>
        <dd>{{ props.player1Name }}</dd>
      </div>
      <div class="summary-item">
        <dt>プレイヤー2</dt>
        <dd>{{ props.player2Name }}</dd>
      </div>
      <div class="summary-item">
        <dt>先攻</dt>
        <dd>{{ props.firstPlayerLabel }}</dd>
      </div>
      <div class="summary-item">
        <dt>市場CPU</dt>
        <dd>{{ props.marketCpuCount }}人</dd>
      </div>
      <div class="summary-item">
        <dt>{{ props.player1Name }} 現金</dt>
        <dd>{{ formatCurrency(props.player1Cash) }}</dd>
      </div>
      <div class="summary-item">
        <dt>{{ props.player2Name }} 現金</dt>
        <dd>{{ formatCurrency(props.player2Cash) }}</dd>
      </div>
      <div class="summary-item summary-item--wide summary-item--note">
        <dt>開始時の純資産</dt>
        <dd>現金と同額</dd>
      </div>
    </dl>

    <div class="summary-footer">
      <button
        type="button"
        class="start-button"
        :disabled="!props.canStart"
        @click="emit('start')"
      >
        ゲーム開始
      </button>
    </div>
  </section>
</template>

<style scoped>
.summary-card {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border-radius: 18px;
  padding: 13px;
  background:
    linear-gradient(180deg, rgba(11, 20, 40, 0.92), rgba(7, 14, 28, 0.96)),
    linear-gradient(90deg, rgba(86, 132, 255, 0.08), transparent 55%, rgba(255, 98, 118, 0.08));
  border: 1px solid rgba(130, 150, 196, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 16px 32px rgba(0, 0, 0, 0.28);
}

.summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-head h2 {
  margin: 0 0 2px;
  font-size: 15px;
  color: #f3f8ff;
}

.summary-head p {
  margin: 0;
  font-size: 11px;
  color: #9fb0d4;
  line-height: 1.35;
}

.summary-badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  background: linear-gradient(180deg, rgba(27, 49, 91, 0.9), rgba(11, 20, 43, 0.96));
  color: #ccecff;
  border: 1px solid rgba(127, 208, 255, 0.22);
  white-space: nowrap;
}

.summary-grid {
  margin: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-content: start;
}

.summary-item {
  min-width: 0;
  padding: 10px 11px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.summary-item--wide {
  grid-column: 1 / -1;
}

.summary-item--note {
  background: rgba(127, 208, 255, 0.06);
}

.summary-item dt {
  margin: 0 0 4px;
  font-size: 10px;
  color: #9fb0d4;
}

.summary-item dd {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #f4f8ff;
}

.summary-footer {
  padding-top: 10px;
}

.start-button {
  width: 100%;
  height: 46px;
  border: 1px solid rgba(137, 189, 255, 0.38);
  border-radius: 14px;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  color: #eaf4ff;
  background: linear-gradient(135deg, rgba(80, 125, 255, 0.96), rgba(54, 196, 255, 0.92));
  box-shadow: 0 16px 30px rgba(46, 113, 255, 0.24);
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
