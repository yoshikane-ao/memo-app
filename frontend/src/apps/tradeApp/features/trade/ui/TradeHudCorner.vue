<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerPanelPositionRow, PlayerState } from '../types';
import { formatCurrency, formatSignedCurrency } from '../../../../../shared/format/currency';

const props = defineProps<{
  player: PlayerState;
  victoryValue: number;
  victoryDiff: number;
  isActive: boolean;
  side: 'left' | 'right';
  positionRows?: PlayerPanelPositionRow[];
  pendingClosePositionId?: string | null;
}>();

const FEINT_SLOT_CAPACITY = 3;

const feintSlots = computed(() =>
  Array.from({ length: Math.max(FEINT_SLOT_CAPACITY, props.player.feintTokens) }, (_, index) => ({
    key: index,
    filled: index < props.player.feintTokens,
  })),
);

const emit = defineEmits<{
  closePosition: [positionId: string];
}>();
</script>

<template>
  <div
    class="hud-corner"
    :class="[`is-${side}`, `is-${player.id}`, { 'is-active': isActive }]"
    :data-hud-corner="player.id"
  >
    <div class="hud-row hud-row--head">
      <span class="hud-player">{{ player.name }}</span>
      <span v-if="isActive" class="hud-turn-flag" data-turn-flag>NOW</span>
    </div>

    <div class="hud-row hud-row--stats">
      <div class="hud-kv">
        <span class="hud-label">現金</span>
        <strong class="hud-value">{{ formatCurrency(player.cash) }}</strong>
      </div>
      <div class="hud-kv">
        <span class="hud-label">総資産</span>
        <strong
          class="hud-value"
          :class="{
            positive: victoryDiff > 0,
            negative: victoryDiff < 0,
          }"
        >
          {{ formatCurrency(victoryValue) }}
        </strong>
        <span
          v-if="victoryDiff !== 0"
          class="hud-delta"
          :class="{ positive: victoryDiff > 0, negative: victoryDiff < 0 }"
        >
          {{ formatSignedCurrency(victoryDiff) }}
        </span>
      </div>
    </div>

    <div class="hud-row hud-row--meta">
      <span class="hud-mini-chip">予備 {{ formatCurrency(player.companyFunds) }}</span>
      <span
        class="hud-feint"
        :class="{ 'is-empty': player.feintTokens <= 0 }"
        :data-feint-count="player.feintTokens"
        :aria-label="`ブラフトークン ${player.feintTokens}枚`"
        :title="`ブラフ ${player.feintTokens} 枚 / 予約注文のキャンセルに使用`"
      >
        <span class="hud-feint__label">ブラフ</span>
        <span class="hud-feint__cards" aria-hidden="true">
          <span
            v-for="slot in feintSlots"
            :key="slot.key"
            class="hud-feint__card"
            :class="{ 'is-filled': slot.filled }"
          >
            <span class="hud-feint__card-face">♠</span>
          </span>
        </span>
        <span class="hud-feint__count">{{ player.feintTokens }}</span>
      </span>
    </div>

    <div v-if="positionRows && positionRows.length > 0" class="hud-positions">
      <button
        v-for="row in positionRows"
        :key="row.id"
        type="button"
        class="pos-chip"
        :class="{
          'is-buy': row.directionText === '買い',
          'is-sell': row.directionText === '売り',
          'is-pending-close': row.isPendingClose || pendingClosePositionId === row.id,
          'is-inactive': !isActive,
        }"
        :disabled="!isActive"
        :title="`${row.targetLabel} ${row.directionText} ${row.orderAmountText} / 損益 ${formatSignedCurrency(row.pnl)}\nクリックで決済プレビュー`"
        @click="emit('closePosition', row.id)"
      >
        <span class="pos-chip-target">{{ row.targetLabel }}</span>
        <span class="pos-chip-dir">{{ row.directionText === '買い' ? '買' : '売' }}</span>
        <span class="pos-chip-amount">{{ row.orderAmountText }}</span>
        <span class="pos-chip-pnl" :class="{ positive: row.pnl > 0, negative: row.pnl < 0 }">
          {{ formatSignedCurrency(row.pnl) }}
        </span>
        <span class="pos-chip-close" aria-label="決済">✕</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hud-corner {
  position: relative;
  pointer-events: auto;
  padding: 6px 8px;
  min-width: 220px;
  max-width: 320px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(7, 14, 32, 0.72), rgba(3, 8, 20, 0.78));
  border: 1px solid rgba(122, 171, 255, 0.16);
  backdrop-filter: blur(8px);
  color: #e7eefd;
  font-size: 10px;
  display: grid;
  gap: 3px;
  opacity: 0.55;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.22s ease,
    filter 0.22s ease;
  filter: saturate(0.75);
}

.hud-corner.is-active {
  opacity: 1;
  filter: saturate(1);
}

.hud-corner.is-active.is-player1 {
  border-color: rgba(124, 180, 255, 0.6);
  box-shadow:
    inset 0 0 0 1px rgba(99, 163, 255, 0.24),
    0 0 22px rgba(99, 163, 255, 0.28);
}

.hud-corner.is-active.is-player2 {
  border-color: rgba(255, 150, 171, 0.6);
  box-shadow:
    inset 0 0 0 1px rgba(255, 110, 138, 0.24),
    0 0 22px rgba(255, 110, 138, 0.28);
}

.hud-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hud-row--head {
  justify-content: space-between;
}

.hud-row--stats {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 4px 10px;
  align-items: baseline;
}

.hud-kv {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}

.hud-player {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.hud-turn-flag {
  font-size: 9px;
  font-weight: 900;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 204, 102, 0.22);
  color: #ffd794;
  letter-spacing: 0.1em;
}

.hud-label {
  font-size: 9px;
  opacity: 0.55;
  letter-spacing: 0.06em;
  white-space: nowrap;
  flex: 0 0 auto;
}

.hud-value {
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: clip;
}

.hud-value.positive {
  color: #7fe0b7;
}
.hud-value.negative {
  color: #ffa7b4;
}

.hud-delta {
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex: 0 0 auto;
}

.hud-delta.positive {
  color: #7fe0b7;
}
.hud-delta.negative {
  color: #ffa7b4;
}

.hud-row--meta {
  gap: 4px;
}

.hud-mini-chip {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(220, 230, 250, 0.72);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.hud-feint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px 2px 6px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 213, 128, 0.16), rgba(255, 148, 88, 0.1));
  border: 1px solid rgba(255, 198, 120, 0.34);
  color: #ffe3b5;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
  box-shadow: 0 0 10px rgba(255, 184, 96, 0.12);
}

.hud-feint.is-empty {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(220, 230, 250, 0.42);
  box-shadow: none;
}

.hud-feint__label {
  font-size: 8px;
  letter-spacing: 0.1em;
  opacity: 0.82;
}

.hud-feint__cards {
  display: inline-flex;
  align-items: center;
  gap: 1.5px;
}

.hud-feint__card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 13px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 198, 120, 0.28);
  color: rgba(255, 227, 181, 0.38);
  font-size: 7px;
  line-height: 1;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.hud-feint__card.is-filled {
  background: linear-gradient(160deg, #ffe2a7, #ff9a59);
  color: #3a1d04;
  border-color: rgba(255, 236, 180, 0.6);
  box-shadow:
    0 0 6px rgba(255, 188, 96, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.22);
  transform: translateY(-0.5px);
}

.hud-feint.is-empty .hud-feint__card {
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(220, 230, 250, 0.22);
}

.hud-feint__card-face {
  font-weight: 900;
}

.hud-feint__count {
  font-size: 10px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  padding-left: 1px;
}

.hud-feint.is-empty .hud-feint__count {
  opacity: 0.42;
}

.hud-positions {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
  padding-top: 4px;
  border-top: 1px dashed rgba(122, 171, 255, 0.18);
  min-width: 0;
  overflow: hidden;
}

.pos-chip {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 5px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #e7eefd;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  line-height: 1.1;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.pos-chip.is-inactive {
  cursor: not-allowed;
  opacity: 0.55;
}

.pos-chip:not(.is-inactive):hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 213, 128, 0.4);
}

.pos-chip.is-buy {
  border-color: rgba(56, 196, 162, 0.34);
  background: rgba(56, 196, 162, 0.14);
}

.pos-chip.is-sell {
  border-color: rgba(232, 88, 118, 0.34);
  background: rgba(232, 88, 118, 0.14);
}

.pos-chip.is-pending-close {
  border-color: rgba(255, 213, 128, 0.6);
  background: rgba(255, 196, 86, 0.18);
  box-shadow: 0 0 10px rgba(255, 196, 86, 0.2);
}

.pos-chip-target {
  opacity: 0.78;
  font-weight: 800;
  font-size: 9px;
}

.pos-chip-dir {
  font-weight: 900;
  font-size: 9px;
}

.pos-chip.is-buy .pos-chip-dir {
  color: #7fe0b7;
}
.pos-chip.is-sell .pos-chip-dir {
  color: #ffa7b4;
}

.pos-chip-amount {
  opacity: 0.82;
}

.pos-chip-pnl {
  font-weight: 800;
  font-size: 9px;
}

.pos-chip-pnl.positive {
  color: #7fe0b7;
}
.pos-chip-pnl.negative {
  color: #ffa7b4;
}

.pos-chip-close {
  margin-left: 2px;
  font-size: 10px;
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.pos-chip:not(.is-inactive):hover .pos-chip-close {
  opacity: 1;
  color: #ffd894;
}
</style>
