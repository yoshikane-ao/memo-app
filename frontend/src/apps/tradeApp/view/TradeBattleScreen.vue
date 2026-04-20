<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import StockBoard from './StockBoard.vue';
import PlayerPanel from './PlayerPanel.vue';
import ActionPanel from './ActionPanel.vue';

import { useTradeGameStore } from '../store/useTradeGameStore';
import type {
  BattleActionDraft,
  BattleClosePreview,
  ChartOrderMarker,
  PlayerId,
  PlayerState,
  StockKey,
  StockState,
} from '../features/trade';
import {
  MAX_BATTLE_TURNS as MAX_TURNS,
  buildActivePositionMarkers,
  buildBattleActionProjection,
  buildBattleConfirmedAction,
  buildBattleResult,
  buildPendingClosePreview,
  buildPendingCloseSummary,
  buildProjectedBoardPrices,
  calculatePlayerVictoryValue,
  cloneStockSnapshots,
  createDefaultBattleActionDraft,
  createInitialGameState,
  findPlayerById,
  formatCurrency,
  hasProjectedChartMovement,
} from '../features/trade';
import { createTradeBattleFlow } from '../application';
import { useTradeButtonSound } from '../composables/useTradeButtonSound';

import '../css/style.css';

const gameStore = useTradeGameStore();
const router = useRouter();
const sessionSnapshot = computed(() => gameStore.state.session);
const startSettings = computed(() => sessionSnapshot.value?.settings ?? null);

const state = reactive(createInitialGameState());

type ResolvedChartAnimation = {
  id: number;
  stocks: StockState[];
  projectedPrices: Partial<Record<StockKey, number>>;
};

const actionDraft = ref<BattleActionDraft>(createDefaultBattleActionDraft());
const pendingClosePositionId = ref<string | null>(null);
const lastClosedPositionTurn = ref<number | null>(null);
const isGameOver = ref(false);
const battleScreenRoot = ref<HTMLElement | null>(null);
const resolvedChartAnimation = ref<ResolvedChartAnimation | null>(null);
const stockHistoryPointIds = reactive<Record<StockKey, number[]>>({
  p1: [],
  p2: [],
  market: [],
});
const stockHistoryPointCounters = reactive<Record<StockKey, number>>({
  p1: 0,
  p2: 0,
  market: 0,
});

let resolvedChartAnimationSequence = 0;
let resolvedChartAnimationTimer: number | null = null;

const RESOLVED_CHART_ANIMATION_DURATION_MS = 760;

useTradeButtonSound(battleScreenRoot);

function recalculateDynamicLines(): void {
  state.stocks.forEach((stock) => {
    stock.bubbleUpper = 0;
    stock.bubbleLower = 0;
  });
}

const battleFlow = createTradeBattleFlow({
  state,
  startSettings,
  stockHistory: {
    pointCounters: stockHistoryPointCounters,
    pointIds: stockHistoryPointIds,
  },
  actionDraft,
  pendingClosePositionId,
  lastClosedPositionTurn,
  isGameOver,
  recalculateDynamicLines,
});

battleFlow.normalizePlayersForBattleStart();

const leftPlayer = computed(() => getPlayer('player1'));
const rightPlayer = computed(() => getPlayer('player2'));
const activePlayer = computed(() => getPlayer(state.currentPlayer));
const playerNames = computed(() => ({
  p1: leftPlayer.value.name,
  p2: rightPlayer.value.name,
}));
const actionProjection = computed(() =>
  buildBattleActionProjection(activePlayer.value, state.stocks, actionDraft.value),
);

watch(
  () => state.currentPlayer,
  () => {
    actionDraft.value = createDefaultBattleActionDraft();
    pendingClosePositionId.value = null;
    lastClosedPositionTurn.value = null;
  },
);

onBeforeUnmount(() => {
  clearResolvedChartAnimationTimer();
});

const leftVictoryValue = computed(() =>
  calculatePlayerVictoryValue(leftPlayer.value, state.stocks),
);
const rightVictoryValue = computed(() =>
  calculatePlayerVictoryValue(rightPlayer.value, state.stocks),
);
const leftVictoryDiff = computed(() => leftVictoryValue.value - rightVictoryValue.value);
const rightVictoryDiff = computed(() => rightVictoryValue.value - leftVictoryValue.value);
const displayTurn = computed(() => Math.min(state.turn, MAX_TURNS));
const turnAnnouncementKey = computed(() => `${displayTurn.value}-${state.currentPlayer}`);

function clearResolvedChartAnimationTimer(): void {
  if (resolvedChartAnimationTimer == null || typeof window === 'undefined') {
    return;
  }

  window.clearTimeout(resolvedChartAnimationTimer);
  resolvedChartAnimationTimer = null;
}

function queueResolvedChartAnimation(
  projectedPrices: Partial<Record<StockKey, number>> | null,
): void {
  clearResolvedChartAnimationTimer();

  if (!hasProjectedChartMovement(projectedPrices, state.stocks)) {
    resolvedChartAnimation.value = null;
    return;
  }

  resolvedChartAnimationSequence += 1;
  resolvedChartAnimation.value = {
    id: resolvedChartAnimationSequence,
    stocks: cloneStockSnapshots(state.stocks),
    projectedPrices: { ...projectedPrices },
  };

  if (typeof window === 'undefined') {
    return;
  }

  resolvedChartAnimationTimer = window.setTimeout(() => {
    resolvedChartAnimation.value = null;
    resolvedChartAnimationTimer = null;
  }, RESOLVED_CHART_ANIMATION_DURATION_MS);
}

const pendingClosePreview = computed<BattleClosePreview | null>(() =>
  buildPendingClosePreview({
    isGameOver: isGameOver.value,
    pendingClosePositionId: pendingClosePositionId.value,
    player: activePlayer.value,
    stocks: state.stocks,
  }),
);

const projectedBoardPrices = computed<Partial<Record<StockKey, number>> | null>(() =>
  buildProjectedBoardPrices({
    isGameOver: isGameOver.value,
    pendingClosePreview: pendingClosePreview.value,
    currentPlayer: activePlayer.value,
    actionDraft: actionDraft.value,
    actionProjection: actionProjection.value,
    stocks: state.stocks,
  }),
);

const battleResult = computed(() =>
  buildBattleResult({
    isGameOver: isGameOver.value,
    leftPlayer: leftPlayer.value,
    rightPlayer: rightPlayer.value,
    leftVictoryValue: leftVictoryValue.value,
    rightVictoryValue: rightVictoryValue.value,
  }),
);

const pendingCloseSummary = computed(() => buildPendingCloseSummary(pendingClosePreview.value));

const activePositionMarkers = computed<ChartOrderMarker[]>(() =>
  buildActivePositionMarkers({
    players: state.players,
    stocks: state.stocks,
    stockHistoryPointIds,
    pendingClosePreview: pendingClosePreview.value,
    pendingClosePositionId: pendingClosePositionId.value,
  }),
);

function getPlayer(playerId: PlayerId): PlayerState {
  return findPlayerById(state, playerId);
}

function handleDraftChange(nextDraft: BattleActionDraft): void {
  actionDraft.value = nextDraft;
}

function handleConfirmTurn(): void {
  if (isGameOver.value) {
    return;
  }

  if (pendingClosePreview.value) {
    queueResolvedChartAnimation(pendingClosePreview.value.priceMap);
    battleFlow.executePendingClose(pendingClosePreview.value.positionId);
    return;
  }

  const payload = buildBattleConfirmedAction(activePlayer.value, actionProjection.value);
  if (!payload) {
    return;
  }

  queueResolvedChartAnimation(projectedBoardPrices.value);
  battleFlow.handleTurn(payload);
  actionDraft.value = createDefaultBattleActionDraft();
}

function handleClosePosition(positionId: string): void {
  if (isGameOver.value) {
    return;
  }

  if (!activePlayer.value.positions.some((position) => position.id === positionId)) {
    return;
  }

  pendingClosePositionId.value = pendingClosePositionId.value === positionId ? null : positionId;
}

async function goBackToMenu(): Promise<void> {
  try {
    await router.push('/menu/workspace/trade');
  } catch {
    window.location.href = '/menu/workspace/trade';
  }
}
</script>

<template>
  <div ref="battleScreenRoot" class="battle-screen">
    <div class="battle-topbar">
      <button type="button" class="menu-return-button" @click="goBackToMenu">メニューへ戻る</button>

      <div class="turn-announce-slot">
        <Transition name="turn-announce" mode="out-in">
          <div
            v-if="!isGameOver"
            :key="turnAnnouncementKey"
            class="turn-announce"
            :class="state.currentPlayer"
            data-turn-announce
          >
            <span class="turn-announce__label">NOW PLAYING</span>
            <strong class="turn-announce__name">{{ activePlayer.name }}</strong>
            <span class="turn-announce__meta">のターン</span>
          </div>
        </Transition>
      </div>

      <div class="battle-status">
        <span class="turn-badge">TURN {{ displayTurn }} / {{ MAX_TURNS }}</span>
        <span v-if="isGameOver" class="finish-badge">終了</span>
      </div>
    </div>

    <PlayerPanel
      class="left-panel"
      :player="leftPlayer"
      :stocks="state.stocks"
      :projected-prices="projectedBoardPrices"
      :pending-close="pendingClosePreview"
      :is-active="!isGameOver && state.currentPlayer === 'player1'"
      :victory-value="leftVictoryValue"
      :victory-diff="leftVictoryDiff"
      @close-position="handleClosePosition"
    />

    <StockBoard
      class="chart-panel"
      :stocks="state.stocks"
      :turn="displayTurn"
      :projected-prices="projectedBoardPrices"
      :order-markers="activePositionMarkers"
      :interactive-player-id="!isGameOver ? state.currentPlayer : null"
      :resolved-animation="resolvedChartAnimation"
      :resolved-animation-duration-ms="RESOLVED_CHART_ANIMATION_DURATION_MS"
      @close-position="handleClosePosition"
    />

    <PlayerPanel
      class="right-panel"
      :player="rightPlayer"
      :stocks="state.stocks"
      :projected-prices="projectedBoardPrices"
      :pending-close="pendingClosePreview"
      :is-active="!isGameOver && state.currentPlayer === 'player2'"
      :victory-value="rightVictoryValue"
      :victory-diff="rightVictoryDiff"
      @close-position="handleClosePosition"
    />

    <ActionPanel
      v-if="!isGameOver"
      class="action-panel-slot"
      :current-player="activePlayer"
      :player-names="playerNames"
      :draft="actionDraft"
      :projection="actionProjection"
      :pending-close="pendingCloseSummary"
      @update:draft="handleDraftChange"
      @confirm="handleConfirmTurn"
    />

    <section v-else class="action-panel-slot result-card" :class="battleResult?.tone">
      <div class="result-title">10ターン終了</div>
      <div class="result-winner">{{ battleResult?.title }}</div>
      <div class="result-score-row">
        <div class="result-score-item">
          <span class="result-name">{{ leftPlayer.name }}</span>
          <strong>{{ formatCurrency(leftVictoryValue) }}</strong>
        </div>
        <div class="result-score-item">
          <span class="result-name">{{ rightPlayer.name }}</span>
          <strong>{{ formatCurrency(rightVictoryValue) }}</strong>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.battle-screen {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  max-height: 100%;
  padding: 7px 8px 8px;
  display: grid;
  grid-template-columns: minmax(208px, 1fr) minmax(0, 4.8fr) minmax(208px, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'topbar topbar topbar'
    'left chart right'
    'action action action';
  gap: 9px;
  align-items: stretch;
  align-content: stretch;
  overflow: hidden;
}

.battle-topbar,
.action-panel-slot {
  min-height: 0;
  min-width: 0;
  height: auto;
}

.left-panel,
.chart-panel,
.right-panel {
  min-height: 0;
  min-width: 0;
  height: 100%;
  position: relative;
  z-index: 1;
}

.battle-topbar {
  grid-area: topbar;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 0;
}

.turn-announce-slot {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.turn-announce {
  position: relative;
  min-width: min(320px, 100%);
  max-width: 100%;
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  border: 1px solid rgba(122, 171, 255, 0.3);
  background: linear-gradient(180deg, rgba(11, 22, 44, 0.94), rgba(6, 14, 30, 0.96));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 14px 30px rgba(0, 0, 0, 0.24);
}

.turn-announce::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.turn-announce.player1 {
  border-color: rgba(124, 180, 255, 0.36);
  box-shadow:
    inset 0 0 0 1px rgba(99, 163, 255, 0.14),
    0 14px 30px rgba(0, 0, 0, 0.24);
}

.turn-announce.player1::before {
  background: linear-gradient(
    118deg,
    transparent 16%,
    rgba(125, 184, 255, 0.34) 48%,
    transparent 80%
  );
  animation: turn-announce-sweep-blue 780ms ease-out both;
}

.turn-announce.player2 {
  border-color: rgba(255, 150, 171, 0.34);
  box-shadow:
    inset 0 0 0 1px rgba(255, 110, 138, 0.14),
    0 14px 30px rgba(0, 0, 0, 0.24);
}

.turn-announce.player2::before {
  background: linear-gradient(
    118deg,
    transparent 16%,
    rgba(255, 150, 171, 0.34) 48%,
    transparent 80%
  );
  animation: turn-announce-sweep-red 780ms ease-out both;
}

.turn-announce__label {
  color: rgba(214, 228, 255, 0.68);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.turn-announce__name {
  color: #f7fbff;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.turn-announce__meta {
  color: rgba(224, 236, 255, 0.82);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.turn-announce-enter-active,
.turn-announce-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.turn-announce-enter-from,
.turn-announce-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

.battle-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.turn-badge,
.finish-badge {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.turn-badge {
  border: 1px solid rgba(122, 171, 255, 0.26);
  background: rgba(14, 23, 44, 0.92);
  color: #dfeaff;
}

.finish-badge {
  border: 1px solid rgba(255, 143, 143, 0.26);
  background: rgba(68, 18, 28, 0.92);
  color: #ffd6dc;
}

.menu-return-button {
  position: relative;
  z-index: 3;
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(10, 17, 32, 0.92), rgba(14, 23, 44, 0.96));
  color: #edf3ff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease;
}

.menu-return-button:hover {
  transform: translateY(-1px);
  border-color: rgba(122, 171, 255, 0.34);
}

.left-panel {
  grid-area: left;
}

.chart-panel {
  grid-area: chart;
}

.right-panel {
  grid-area: right;
}

.action-panel-slot {
  grid-area: action;
  align-self: end;
  justify-self: stretch;
  position: relative;
  z-index: 2;
  height: auto;
  width: 100%;
  max-width: 1420px;
  margin: 0 auto;
}

.result-card {
  border-radius: 18px;
  border: 1px solid rgba(120, 156, 228, 0.2);
  background:
    linear-gradient(180deg, rgba(6, 12, 28, 0.98) 0%, rgba(4, 9, 21, 0.94) 100%),
    radial-gradient(circle at top, rgba(78, 131, 255, 0.12), transparent 42%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 36px rgba(0, 0, 0, 0.28);
  padding: 14px 18px;
  display: grid;
  gap: 10px;
}

.result-card.player1 {
  border-color: rgba(99, 163, 255, 0.42);
}

.result-card.player2 {
  border-color: rgba(255, 110, 138, 0.4);
}

.result-card.draw {
  border-color: rgba(190, 205, 232, 0.28);
}

.result-title {
  color: rgba(213, 227, 255, 0.74);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.result-winner {
  color: #f5f8ff;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
}

.result-score-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.result-score-item {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}

.result-name {
  color: rgba(201, 216, 255, 0.72);
  font-size: 10px;
  font-weight: 700;
}

.result-score-item strong {
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
}

@keyframes turn-announce-sweep-blue {
  0% {
    transform: translateX(-122%);
    opacity: 0;
  }

  24% {
    opacity: 1;
  }

  100% {
    transform: translateX(112%);
    opacity: 0;
  }
}

@keyframes turn-announce-sweep-red {
  0% {
    transform: translateX(-122%);
    opacity: 0;
  }

  24% {
    opacity: 1;
  }

  100% {
    transform: translateX(112%);
    opacity: 0;
  }
}

@media (min-width: 1700px) {
  .battle-screen {
    grid-template-columns: minmax(224px, 0.98fr) minmax(0, 5.4fr) minmax(224px, 0.98fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
}

@media (max-width: 1480px) {
  .battle-screen {
    grid-template-columns: minmax(188px, 0.92fr) minmax(0, 4.2fr) minmax(188px, 0.92fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 7px;
    padding: 7px 8px 8px;
  }

  .action-panel-slot {
    max-width: 1320px;
  }
}

@media (max-width: 1180px) {
  .battle-screen {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto minmax(0, 0.92fr) auto auto;
    grid-template-areas:
      'topbar topbar'
      'chart chart'
      'left right'
      'action action';
  }

  .left-panel,
  .right-panel {
    height: auto;
  }

  .action-panel-slot {
    width: 100%;
    max-width: none;
  }

  .turn-announce {
    min-width: 0;
  }
}

@media (max-width: 760px) {
  .battle-screen {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(220px, auto) auto auto auto;
    grid-template-areas:
      'topbar'
      'chart'
      'left'
      'right'
      'action';
    padding: 6px;
  }

  .battle-topbar {
    flex-wrap: wrap;
  }

  .turn-announce-slot {
    order: 3;
    width: 100%;
    justify-content: flex-start;
  }

  .battle-status,
  .result-score-row {
    width: 100%;
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
