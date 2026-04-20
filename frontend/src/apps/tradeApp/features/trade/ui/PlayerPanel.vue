<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerState, StockKey, StockState, TradePositionEntry } from '../types';
import {
  calculateTradePositionPnL,
  formatCurrency,
  formatSignedCurrency,
} from '../model/gameCalculations';

const props = defineProps<{
  player: PlayerState;
  stocks: StockState[];
  projectedPrices?: Partial<Record<StockKey, number>> | null;
  pendingClose?: {
    positionId: string;
    executionPrice: number;
    realizedPnl: number;
  } | null;
  isActive: boolean;
  victoryValue: number;
  victoryDiff: number;
}>();

const emit = defineEmits<{
  (event: 'close-position', positionId: string): void;
}>();

const cashLabel = '\u73fe\u91d1';
const victoryValueLabel = '\u7dcf\u8cc7\u7523';
const positionsLabel = '\u6ce8\u6587\u30dd\u30b8\u30b7\u30e7\u30f3';
const noPositionsLabel = '\u30dd\u30b8\u30b7\u30e7\u30f3\u306a\u3057';
const closePositionLabel = '\u30dd\u30b8\u30b7\u30e7\u30f3\u6c7a\u6e08';
const orderAmountLabel = '\u6ce8\u6587';
const buyLabel = '\u8cb7\u3044';
const sellLabel = '\u58f2\u308a';
const pnlLabel = '\u640d\u76ca';
const projectedPnlLabel = '\u884c\u52d5\u5f8c';
const pendingCloseLabel = '\u6c7a\u6e08\u4fdd\u7559\u4e2d';
const releasePendingCloseLabel = '\u4fdd\u7559\u89e3\u9664';

function resolveTargetLabel(stockKey: StockKey): string {
  if (stockKey === 'market') return '\u30de\u30fc\u30b1\u30c3\u30c8';
  if (stockKey === 'p1') return 'Player1\u4f1a\u793e';
  return 'Player2\u4f1a\u793e';
}

function calculatePositionPnl(position: TradePositionEntry, currentPrice: number): number {
  return calculateTradePositionPnL(position, currentPrice);
}

const positionRows = computed(() => {
  const currentPriceMap = props.stocks.reduce<Record<StockKey, number>>(
    (acc, stock) => {
      acc[stock.key] = stock.currentPrice;
      return acc;
    },
    { p1: 0, p2: 0, market: 0 },
  );

  return [...props.player.positions].reverse().map((position) => {
    const currentPrice = currentPriceMap[position.stockKey] ?? 0;
    const isPendingClose = props.pendingClose?.positionId === position.id;
    const projectedPrice = props.projectedPrices?.[position.stockKey] ?? currentPrice;
    const currentPnl = calculatePositionPnl(position, currentPrice);

    return {
      id: position.id,
      targetLabel: resolveTargetLabel(position.stockKey),
      orderAmountText: formatCurrency(position.orderAmount),
      directionText: position.side === 'buy' ? buyLabel : sellLabel,
      pnl: currentPnl,
      projectedPnl: isPendingClose ? currentPnl : calculatePositionPnl(position, projectedPrice),
      projectedPnlLabel: isPendingClose ? '\u6c7a\u6e08\u640d\u76ca' : projectedPnlLabel,
      isPendingClose,
      closeButtonLabel: isPendingClose ? releasePendingCloseLabel : closePositionLabel,
    };
  });
});
</script>

<template>
  <aside class="player-panel" :class="[player.id, { active: isActive }]">
    <header class="panel-head">
      <div class="player-head-copy">
        <strong class="player-name">{{ player.name }}</strong>
        <span v-if="isActive" class="turn-flag" data-turn-flag>手番</span>
      </div>
      <div class="turn-dot" :class="{ active: isActive }"></div>
    </header>

    <section class="cash-grid">
      <article class="metric-card metric-card--cash">
        <span class="metric-label">{{ cashLabel }}</span>
        <strong class="metric-value">{{ formatCurrency(player.cash) }}</strong>
      </article>

      <article class="metric-card metric-card--diff">
        <span class="metric-label">{{ victoryValueLabel }}</span>
        <strong
          class="metric-value"
          :class="{
            positive: victoryDiff > 0,
            negative: victoryDiff < 0,
            flat: victoryDiff === 0,
          }"
        >
          {{ formatCurrency(victoryValue) }}
        </strong>
      </article>
    </section>

    <section class="positions-card">
      <div class="section-title">{{ positionsLabel }}</div>

      <div v-if="positionRows.length > 0" class="positions-list">
        <article v-for="row in positionRows" :key="row.id" class="position-card">
          <div v-if="row.isPendingClose" class="position-pending-chip">{{ pendingCloseLabel }}</div>

          <div class="position-head">
            <strong class="position-target">{{ row.targetLabel }}</strong>
            <span class="position-amount">{{ orderAmountLabel }} {{ row.orderAmountText }}</span>
          </div>

          <div class="position-direction-row">
            <span
              class="direction-chip"
              :class="row.directionText === buyLabel ? 'is-buy' : 'is-sell'"
            >
              {{ row.directionText }}
            </span>
          </div>

          <div class="position-stats">
            <div class="position-stat">
              <span class="position-stat-label">{{ pnlLabel }}</span>
              <strong
                class="position-stat-value"
                :class="{
                  positive: row.pnl > 0,
                  negative: row.pnl < 0,
                  flat: row.pnl === 0,
                }"
              >
                {{ formatSignedCurrency(row.pnl) }}
              </strong>
            </div>

            <div class="position-stat">
              <span class="position-stat-label">{{ row.projectedPnlLabel }}</span>
              <strong
                class="position-stat-value"
                :class="{
                  positive: row.projectedPnl > 0,
                  negative: row.projectedPnl < 0,
                  flat: row.projectedPnl === 0,
                }"
              >
                {{ formatSignedCurrency(row.projectedPnl) }}
              </strong>
            </div>
          </div>

          <button
            type="button"
            class="position-close"
            :disabled="!isActive"
            @click="emit('close-position', row.id)"
          >
            {{ row.closeButtonLabel }}
          </button>
        </article>
      </div>

      <div v-else class="positions-empty">{{ noPositionsLabel }}</div>
    </section>
  </aside>
</template>

<style scoped>
.player-panel {
  position: relative;
  isolation: isolate;
  height: 100%;
  min-height: 0;
  min-width: 0;
  border-radius: 18px;
  border: 1px solid rgba(120, 156, 228, 0.18);
  background:
    linear-gradient(180deg, rgba(4, 11, 28, 0.98) 0%, rgba(3, 8, 21, 0.94) 100%),
    radial-gradient(circle at top, rgba(78, 131, 255, 0.08), transparent 46%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 36px rgba(0, 0, 0, 0.28);
  padding: 10px;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 8px;
  overflow: hidden;
}

.player-panel::before {
  content: '';
  position: absolute;
  inset: -30% -10% auto;
  height: 48%;
  background: radial-gradient(circle, rgba(91, 138, 255, 0.18), transparent 68%);
  filter: blur(18px);
  opacity: 0.55;
  pointer-events: none;
}

.player-panel::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
}

.player-panel.player2::before {
  background: radial-gradient(circle, rgba(255, 102, 122, 0.16), transparent 68%);
}

.player-panel.player1 {
  border-color: rgba(101, 148, 255, 0.22);
}

.player-panel.player2 {
  border-color: rgba(255, 108, 128, 0.2);
}

.player-panel.active {
  box-shadow:
    inset 0 0 24px rgba(83, 128, 255, 0.08),
    0 18px 42px rgba(0, 0, 0, 0.34);
}

.player-panel.player1.active::after {
  background: linear-gradient(
    108deg,
    transparent 10%,
    rgba(99, 163, 255, 0.24) 42%,
    rgba(99, 163, 255, 0.08) 56%,
    transparent 76%
  );
  animation: player-panel-turn-sweep-blue 820ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.player-panel.player2.active::after {
  background: linear-gradient(
    108deg,
    transparent 10%,
    rgba(255, 110, 138, 0.24) 42%,
    rgba(255, 110, 138, 0.08) 56%,
    transparent 76%
  );
  animation: player-panel-turn-sweep-red 820ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.player-panel.player1.active {
  border-color: rgba(99, 163, 255, 0.54);
}

.player-panel.player2.active {
  border-color: rgba(255, 110, 138, 0.5);
}

.panel-head,
.cash-grid,
.positions-card {
  position: relative;
  z-index: 1;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.player-head-copy {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.player-name {
  color: #f7fbff;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.turn-flag {
  height: 18px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.08em;
  white-space: nowrap;
  animation: turn-flag-pop 460ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

.player-panel.player1 .turn-flag {
  border: 1px solid rgba(124, 180, 255, 0.45);
  background: linear-gradient(180deg, rgba(22, 49, 95, 0.95), rgba(9, 23, 49, 0.96));
  color: #dceaff;
  box-shadow: 0 0 18px rgba(99, 163, 255, 0.18);
}

.player-panel.player2 .turn-flag {
  border: 1px solid rgba(255, 146, 170, 0.45);
  background: linear-gradient(180deg, rgba(72, 20, 34, 0.95), rgba(43, 11, 22, 0.96));
  color: #ffe2e8;
  box-shadow: 0 0 18px rgba(255, 110, 138, 0.16);
}

.turn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  flex: 0 0 auto;
}

.turn-dot.active {
  background: #63a3ff;
  box-shadow: 0 0 12px rgba(99, 163, 255, 0.56);
  animation: active-turn-dot-pulse 1.35s ease-in-out infinite;
}

.player-panel.player2 .turn-dot.active {
  background: #ff6e8a;
  box-shadow: 0 0 12px rgba(255, 110, 138, 0.52);
}

.cash-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.metric-card,
.positions-card,
.position-card {
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.025));
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(6px);
}

.metric-card {
  padding: 9px 10px 8px;
  display: grid;
  gap: 4px;
}

.metric-card--diff {
  background: linear-gradient(180deg, rgba(92, 132, 255, 0.12), rgba(32, 45, 88, 0.18));
}

.metric-label,
.section-title {
  color: rgba(202, 220, 255, 0.76);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.metric-value {
  color: #f7fbff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.05;
}

.metric-value.positive,
.position-stat-value.positive {
  color: #6fd6b3;
}

.metric-value.negative,
.position-stat-value.negative {
  color: #ff7b8e;
}

.metric-value.flat,
.position-stat-value.flat {
  color: #c8d7f2;
}

.positions-card {
  min-height: 0;
  padding: 7px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
}

.positions-list {
  min-height: 0;
  display: grid;
  gap: 6px;
  overflow: auto;
  padding-right: 2px;
  align-content: start;
}

.positions-empty {
  display: grid;
  place-items: center;
  min-height: 72px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  color: rgba(214, 226, 247, 0.72);
  font-size: 9px;
  font-weight: 700;
}

.position-card {
  padding: 8px;
  display: grid;
  gap: 7px;
  align-content: start;
}

.position-pending-chip {
  width: fit-content;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(111, 159, 255, 0.14);
  border: 1px solid rgba(111, 159, 255, 0.28);
  color: #dfeaff;
  font-size: 7px;
  font-weight: 800;
  line-height: 1;
}

.position-head {
  display: grid;
  gap: 4px;
}

.position-target {
  color: #eef5ff;
  font-size: 9px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.position-amount {
  width: fit-content;
  max-width: 100%;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(214, 226, 247, 0.88);
  font-size: 7px;
  font-weight: 800;
  line-height: 1;
}

.position-direction-row {
  display: flex;
  align-items: center;
}

.direction-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 7px;
  font-weight: 800;
  line-height: 1;
}

.direction-chip.is-buy {
  background: rgba(111, 143, 255, 0.16);
  color: #e7efff;
}

.direction-chip.is-sell {
  background: rgba(255, 112, 139, 0.16);
  color: #ffd6de;
}

.position-stats {
  display: grid;
  gap: 5px;
}

.position-stat {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 6px 7px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.position-stat-label {
  color: rgba(214, 226, 247, 0.66);
  font-size: 8px;
  font-weight: 700;
  line-height: 1.1;
}

.position-stat-value {
  min-width: 0;
  font-size: 8px;
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  text-align: right;
}

.position-close {
  width: 100%;
  height: 22px;
  padding: 0 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(10, 17, 33, 0.9);
  color: #eef5ff;
  font-size: 7px;
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    opacity 0.18s ease;
}

.position-close:hover:enabled {
  border-color: rgba(99, 163, 255, 0.44);
  transform: translateY(-1px);
}

.position-close:disabled {
  opacity: 0.42;
  cursor: default;
}

@keyframes player-panel-turn-sweep-blue {
  0% {
    transform: translateX(-118%);
    opacity: 0;
  }

  24% {
    opacity: 0.9;
  }

  100% {
    transform: translateX(112%);
    opacity: 0;
  }
}

@keyframes player-panel-turn-sweep-red {
  0% {
    transform: translateX(-118%);
    opacity: 0;
  }

  24% {
    opacity: 0.9;
  }

  100% {
    transform: translateX(112%);
    opacity: 0;
  }
}

@keyframes turn-flag-pop {
  0% {
    opacity: 0;
    transform: translateY(-5px) scale(0.92);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes active-turn-dot-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }

  50% {
    transform: scale(1.18);
    filter: brightness(1.12);
  }
}

@media (max-width: 1200px) {
  .cash-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    padding: 8px;
  }
}

@media (max-width: 860px) {
  .positions-list {
    overflow: visible;
  }
}
</style>
