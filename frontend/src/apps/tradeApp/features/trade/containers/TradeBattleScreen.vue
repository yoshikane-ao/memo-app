<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import StockBoard from '../ui/StockBoard.vue';
import TradeHudCorner from '../ui/TradeHudCorner.vue';
import CpuSentimentBar from '../ui/CpuSentimentBar.vue';
import TradeTimelineStrip from '../ui/TradeTimelineStrip.vue';
import TradeCockpit from '../ui/TradeCockpit.vue';

import type { PlayerId, PlayerPanelPositionRow, PlayerState, StockKey, StockState } from '../types';
import type { BattleActionDraft } from '../model/tradeBattle';
import {
  buildBattleActionProjection,
  buildBattleConfirmedAction,
  createDefaultBattleActionDraft,
} from '../model/tradeBattle';
import { calculatePlayerVictoryValue, calculateTradePositionPnL } from '../model/gameCalculations';
import { formatCurrency } from '../../../../../shared/format/currency';
import { MAX_BATTLE_TURNS as MAX_TURNS, findPlayerById } from '../model/tradeBattleState';
import type { BattleClosePreview, ChartOrderMarker } from '../model/tradeBattleSelectors';
import {
  buildActivePositionMarkers,
  buildBattleResult,
  buildCpuStats,
  buildForwardOrderRows,
  buildPendingClosePreview,
  buildPendingCloseSummary,
  buildProjectedBoardPrices,
  cloneStockSnapshots,
  hasProjectedChartMovement,
} from '../model/tradeBattleSelectors';
import { useTradeGameStore } from '../model/useTradeGameStore';
import { createInitialGameState } from '../model/mockGame';
import { createTradeBattleFlow } from '../application/tradeBattleFlow';
import { useTradeButtonSound } from './useTradeButtonSound';

import '../../../css/style.css';

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
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
  }
});

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown);
  }
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
  if (resolvedChartAnimationTimer == null || typeof window === 'undefined') return;
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

  if (typeof window === 'undefined') return;

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

const cpuStats = computed(() => buildCpuStats(state.stocks));

const forwardOrderRows = computed(() =>
  buildForwardOrderRows({
    state: { forwardOrders: state.forwardOrders, turn: state.turn },
  }).map((row) => ({
    ...row,
    canCancel: row.playerId === state.currentPlayer && activePlayer.value.feintTokens > 0,
  })),
);

const revealedEvents = computed(() =>
  state.revealedEvents.filter((event) => event.status !== 'expired'),
);

function getPlayer(playerId: PlayerId): PlayerState {
  return findPlayerById(state, playerId);
}

function resolveTargetLabel(stockKey: StockKey): string {
  if (stockKey === 'market') return 'Mkt';
  if (stockKey === 'p1') return 'P1';
  return 'P2';
}

function buildPlayerPanelPositionRows(player: PlayerState): PlayerPanelPositionRow[] {
  const currentPriceMap = state.stocks.reduce<Record<StockKey, number>>(
    (acc, stock) => {
      acc[stock.key] = stock.currentPrice;
      return acc;
    },
    { p1: 0, p2: 0, market: 0 },
  );
  const projectedPrices = projectedBoardPrices.value;
  const pendingCloseId = pendingClosePreview.value?.positionId ?? null;

  return [...player.positions].reverse().map((position) => {
    const currentPrice = currentPriceMap[position.stockKey] ?? 0;
    const isPendingClose = pendingCloseId === position.id;
    const projectedPrice = projectedPrices?.[position.stockKey] ?? currentPrice;
    const currentPnl = calculateTradePositionPnL(position, currentPrice);

    return {
      id: position.id,
      targetLabel: resolveTargetLabel(position.stockKey),
      orderAmountText: formatCurrency(position.orderAmount),
      directionText: position.side === 'buy' ? '買い' : '売り',
      pnl: currentPnl,
      projectedPnl: isPendingClose
        ? currentPnl
        : calculateTradePositionPnL(position, projectedPrice),
      projectedPnlLabel: isPendingClose ? '決済損益' : '行動後',
      isPendingClose,
      closeButtonLabel: isPendingClose ? '保留解除' : 'ポジション決済',
    };
  });
}

const leftPlayerRows = computed<PlayerPanelPositionRow[]>(() =>
  buildPlayerPanelPositionRows(leftPlayer.value),
);
const rightPlayerRows = computed<PlayerPanelPositionRow[]>(() =>
  buildPlayerPanelPositionRows(rightPlayer.value),
);

function handleDraftChange(nextDraft: BattleActionDraft): void {
  actionDraft.value = nextDraft;
}

function handleConfirmTurn(): void {
  if (isGameOver.value) return;

  if (pendingClosePreview.value) {
    queueResolvedChartAnimation(pendingClosePreview.value.priceMap);
    battleFlow.executePendingClose(pendingClosePreview.value.positionId);
    return;
  }

  const payload = buildBattleConfirmedAction(activePlayer.value, actionProjection.value);
  if (!payload) return;

  queueResolvedChartAnimation(projectedBoardPrices.value);
  battleFlow.handleTurn(payload);
  actionDraft.value = createDefaultBattleActionDraft();
}

function handleClosePosition(positionId: string): void {
  if (isGameOver.value) return;
  if (!activePlayer.value.positions.some((position) => position.id === positionId)) return;
  pendingClosePositionId.value = pendingClosePositionId.value === positionId ? null : positionId;
}

function handleCancelPendingClose(): void {
  pendingClosePositionId.value = null;
}

function handleCancelForwardOrder(orderId: string): void {
  battleFlow.cancelForwardOrderWithFeint(orderId);
}

function setStockShortcut(key: StockKey): void {
  if (actionDraft.value.actionKind !== 'trade') {
    actionDraft.value = { ...actionDraft.value, actionKind: 'trade', stockKey: key };
    return;
  }
  actionDraft.value = { ...actionDraft.value, stockKey: key };
}

function setSideShortcut(side: 'buy' | 'sell'): void {
  if (actionDraft.value.actionKind !== 'trade') return;
  actionDraft.value = { ...actionDraft.value, tradeAction: side };
}

function addQuantityShortcut(amount: number): void {
  if (actionDraft.value.actionKind !== 'trade') return;
  const next = Math.max(0, Number(actionDraft.value.quantity ?? 0) + amount);
  actionDraft.value = { ...actionDraft.value, quantity: next };
}

function toggleOrderTypeShortcut(): void {
  if (actionDraft.value.actionKind !== 'trade') return;
  actionDraft.value = {
    ...actionDraft.value,
    orderType: actionDraft.value.orderType === 'market' ? 'forward' : 'market',
  };
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

function handleKeydown(event: KeyboardEvent): void {
  if (isGameOver.value) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  const key = event.key.toLowerCase();
  const ownKey: StockKey = state.currentPlayer === 'player1' ? 'p1' : 'p2';
  const rivalKey: StockKey = state.currentPlayer === 'player1' ? 'p2' : 'p1';

  switch (key) {
    case 'p':
      event.preventDefault();
      setStockShortcut(ownKey);
      return;
    case 'r':
      event.preventDefault();
      setStockShortcut(rivalKey);
      return;
    case 'm':
      event.preventDefault();
      setStockShortcut('market');
      return;
    case 'b':
      event.preventDefault();
      setSideShortcut('buy');
      return;
    case 's':
      event.preventDefault();
      setSideShortcut('sell');
      return;
    case '1':
      event.preventDefault();
      addQuantityShortcut(1000);
      return;
    case '5':
      event.preventDefault();
      addQuantityShortcut(5000);
      return;
    case '0':
      event.preventDefault();
      addQuantityShortcut(10000);
      return;
    case 'f':
      event.preventDefault();
      toggleOrderTypeShortcut();
      return;
    case 'enter':
      event.preventDefault();
      handleConfirmTurn();
      return;
    case 'c':
      event.preventDefault();
      if (pendingClosePreview.value) handleConfirmTurn();
      return;
    case 'escape':
      event.preventDefault();
      handleCancelPendingClose();
      return;
    default:
      return;
  }
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
  <div
    ref="battleScreenRoot"
    class="battle-screen"
    :class="[`is-${state.currentPlayer}`, { 'is-game-over': isGameOver }]"
    :data-current-player="state.currentPlayer"
  >
    <div class="battle-topbar">
      <button type="button" class="menu-return-button" @click="goBackToMenu">← メニュー</button>

      <TradeHudCorner
        class="hud-slot"
        side="left"
        :player="leftPlayer"
        :is-active="!isGameOver && state.currentPlayer === 'player1'"
        :victory-value="leftVictoryValue"
        :victory-diff="leftVictoryDiff"
        :position-rows="leftPlayerRows"
        :pending-close-position-id="
          state.currentPlayer === 'player1' ? pendingClosePositionId : null
        "
        @close-position="handleClosePosition"
      />

      <div class="turn-announce-slot">
        <Transition name="turn-announce" mode="out-in">
          <div
            v-if="!isGameOver"
            :key="turnAnnouncementKey"
            class="turn-announce"
            :class="state.currentPlayer"
            data-turn-announce
          >
            <span class="turn-announce__side-dot" aria-hidden="true"></span>
            <span class="turn-announce__label">NOW</span>
            <strong class="turn-announce__name">{{ activePlayer.name }}</strong>
            <span class="turn-announce__turn">T {{ displayTurn }} / {{ MAX_TURNS }}</span>
          </div>
        </Transition>
        <span v-if="isGameOver" class="finish-badge">GAME OVER</span>
      </div>

      <TradeHudCorner
        class="hud-slot"
        side="right"
        :player="rightPlayer"
        :is-active="!isGameOver && state.currentPlayer === 'player2'"
        :victory-value="rightVictoryValue"
        :victory-diff="rightVictoryDiff"
        :position-rows="rightPlayerRows"
        :pending-close-position-id="
          state.currentPlayer === 'player2' ? pendingClosePositionId : null
        "
        @close-position="handleClosePosition"
      />
    </div>

    <div class="battle-stage">
      <StockBoard
        class="chart-surface"
        :stocks="state.stocks"
        :turn="displayTurn"
        :projected-prices="projectedBoardPrices"
        :order-markers="activePositionMarkers"
        :interactive-player-id="!isGameOver ? state.currentPlayer : null"
        :resolved-animation="resolvedChartAnimation"
        :resolved-animation-duration-ms="RESOLVED_CHART_ANIMATION_DURATION_MS"
        @close-position="handleClosePosition"
      />
    </div>

    <div v-if="!isGameOver" class="battle-rail">
      <CpuSentimentBar class="rail-item" :cpu-stats="cpuStats" />
      <TradeTimelineStrip
        class="rail-item"
        :current-turn="displayTurn"
        :max-turns="MAX_TURNS"
        :forward-orders="forwardOrderRows"
        :revealed-events="revealedEvents"
        :current-player-id="state.currentPlayer"
        @cancel-forward-order="handleCancelForwardOrder"
      />
    </div>

    <TradeCockpit
      v-if="!isGameOver"
      class="cockpit-slot"
      :current-player="activePlayer"
      :player-names="playerNames"
      :draft="actionDraft"
      :projection="actionProjection"
      :pending-close="pendingCloseSummary"
      @update:draft="handleDraftChange"
      @confirm="handleConfirmTurn"
      @cancel-pending-close="handleCancelPendingClose"
    />

    <section v-else class="cockpit-slot result-card" :class="battleResult?.tone">
      <div class="result-title">ゲーム終了</div>
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
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 6px 8px 8px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 6px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% -5%, rgba(76, 132, 255, 0.12), transparent 38%),
    radial-gradient(circle at 85% -5%, rgba(255, 88, 108, 0.1), transparent 34%),
    linear-gradient(180deg, #030819 0%, #02060f 100%);
  transition: box-shadow 0.5s ease;
}

.battle-screen::before,
.battle-screen::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 180px;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.battle-screen::before {
  left: 0;
  background: linear-gradient(
    90deg,
    rgba(99, 163, 255, 0.22) 0%,
    rgba(99, 163, 255, 0.04) 45%,
    transparent 100%
  );
}

.battle-screen::after {
  right: 0;
  background: linear-gradient(
    -90deg,
    rgba(255, 110, 138, 0.22) 0%,
    rgba(255, 110, 138, 0.04) 45%,
    transparent 100%
  );
}

.battle-screen.is-player1:not(.is-game-over)::before {
  opacity: 1;
}

.battle-screen.is-player2:not(.is-game-over)::after {
  opacity: 1;
}

.battle-screen > * {
  position: relative;
  z-index: 1;
}

.battle-topbar {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) auto minmax(220px, 1fr);
  align-items: start;
  gap: 8px;
  min-height: 0;
}

.menu-return-button {
  appearance: none;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #c4d7fb;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  align-self: center;
  white-space: nowrap;
}

.menu-return-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.hud-slot {
  min-width: 0;
}

.hud-slot ~ .hud-slot {
  justify-self: end;
}

.turn-announce-slot {
  align-self: start;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.turn-announce {
  position: relative;
  padding: 7px 18px 7px 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(122, 171, 255, 0.3);
  background: linear-gradient(180deg, rgba(11, 22, 44, 0.92), rgba(6, 14, 30, 0.96));
  white-space: nowrap;
  overflow: hidden;
}

.turn-announce::before {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent);
  transform: skewX(-14deg);
  animation: turn-announce-sweep 0.7s ease-out;
  pointer-events: none;
}

.turn-announce.player1 {
  border-color: rgba(124, 180, 255, 0.62);
  box-shadow:
    0 0 0 1px rgba(99, 163, 255, 0.16) inset,
    0 0 26px rgba(99, 163, 255, 0.36);
}

.turn-announce.player2 {
  border-color: rgba(255, 150, 171, 0.62);
  box-shadow:
    0 0 0 1px rgba(255, 110, 138, 0.16) inset,
    0 0 26px rgba(255, 110, 138, 0.36);
}

.turn-announce__side-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
  box-shadow: 0 0 10px currentColor;
  animation: turn-announce-dot-pulse 1.4s ease-in-out infinite;
}

.turn-announce.player1 .turn-announce__side-dot {
  background: #7eb3ff;
  color: #7eb3ff;
}

.turn-announce.player2 .turn-announce__side-dot {
  background: #ff8ea3;
  color: #ff8ea3;
}

.turn-announce__label {
  color: rgba(214, 228, 255, 0.72);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.turn-announce__name {
  color: #f7fbff;
  font-size: 14px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
}

.turn-announce__turn {
  color: #c9d8ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  padding-left: 10px;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
}

@keyframes turn-announce-sweep {
  0% {
    left: -40%;
  }

  100% {
    left: 120%;
  }
}

@keyframes turn-announce-dot-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.25);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .turn-announce::before,
  .turn-announce__side-dot {
    animation: none;
  }
}

.finish-badge {
  background: rgba(255, 196, 86, 0.18);
  color: #ffd894;
  font-size: 10px;
  font-weight: 900;
  padding: 5px 14px;
  border-radius: 999px;
  letter-spacing: 0.12em;
}

.battle-stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.chart-surface {
  position: absolute;
  inset: 0;
  height: 100%;
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
  transform: translateY(-4px);
}

.battle-rail {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
}

.rail-item {
  min-width: 0;
}

.cockpit-slot {
  min-height: 0;
}

.result-card {
  display: grid;
  gap: 10px;
  padding: 22px;
  border-radius: 12px;
  border: 1px solid rgba(122, 171, 255, 0.22);
  background: linear-gradient(180deg, rgba(9, 18, 40, 0.94), rgba(5, 11, 26, 0.98));
  color: #f7fbff;
  text-align: center;
}

.result-card.player1 {
  border-color: rgba(124, 180, 255, 0.55);
}
.result-card.player2 {
  border-color: rgba(255, 150, 171, 0.55);
}
.result-card.draw {
  border-color: rgba(255, 213, 128, 0.45);
}

.result-title {
  font-size: 11px;
  letter-spacing: 0.14em;
  opacity: 0.7;
  font-weight: 800;
}

.result-winner {
  font-size: 20px;
  font-weight: 900;
}

.result-score-row {
  display: flex;
  justify-content: center;
  gap: 48px;
  font-variant-numeric: tabular-nums;
}

.result-score-item {
  display: grid;
  gap: 4px;
}

.result-name {
  font-size: 10px;
  opacity: 0.7;
  letter-spacing: 0.1em;
}

.result-score-item strong {
  font-size: 16px;
  font-weight: 800;
}
</style>
