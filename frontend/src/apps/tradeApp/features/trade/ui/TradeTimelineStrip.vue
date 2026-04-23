<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerId, RevealedEvent, StockKey, TradeAction } from '../types';

type ForwardRow = {
  id: string;
  playerId: PlayerId;
  stockKey: StockKey;
  triggerTurn: number;
  tradeAction: TradeAction;
  orderAmount: number;
  reservationFee: number;
  canCancel: boolean;
};

const props = defineProps<{
  currentTurn: number;
  maxTurns: number;
  forwardOrders: ForwardRow[];
  revealedEvents: RevealedEvent[];
  currentPlayerId: PlayerId;
}>();

const emit = defineEmits<{
  cancelForwardOrder: [orderId: string];
}>();

type TickMarker =
  | {
      kind: 'forward';
      playerId: PlayerId;
      stockKey: StockKey;
      tradeAction: TradeAction;
      orderAmount: number;
      id: string;
      canCancel: boolean;
    }
  | {
      kind: 'event';
      title: string;
      status: RevealedEvent['status'];
    };

type Tick = {
  turn: number;
  isCurrent: boolean;
  isPast: boolean;
  markers: TickMarker[];
};

function stockAbbr(key: StockKey): string {
  if (key === 'p1') return 'P1';
  if (key === 'p2') return 'P2';
  return 'Mkt';
}

function actionLabel(action: TradeAction): string {
  return action === 'buy' ? '買' : '売';
}

function shortYen(value: number): string {
  if (value >= 10000) return `${Math.round(value / 1000)}k`;
  return `${Math.round(value / 1000)}k`;
}

const ticks = computed<Tick[]>(() => {
  const arr: Tick[] = [];
  for (let t = 1; t <= props.maxTurns; t += 1) {
    const markers: TickMarker[] = [];
    for (const order of props.forwardOrders) {
      if (order.triggerTurn === t) {
        markers.push({
          kind: 'forward',
          playerId: order.playerId,
          stockKey: order.stockKey,
          tradeAction: order.tradeAction,
          orderAmount: order.orderAmount,
          id: order.id,
          canCancel: order.canCancel,
        });
      }
    }
    for (const event of props.revealedEvents) {
      if (event.triggerTurn === t && event.status !== 'expired') {
        markers.push({
          kind: 'event',
          title: event.card.title,
          status: event.status,
        });
      }
    }
    arr.push({
      turn: t,
      isCurrent: t === props.currentTurn,
      isPast: t < props.currentTurn,
      markers,
    });
  }
  return arr;
});
</script>

<template>
  <div class="timeline-strip" data-timeline-strip>
    <div
      v-for="tick in ticks"
      :key="tick.turn"
      class="tl-tick"
      :class="{
        'is-current': tick.isCurrent,
        'is-past': tick.isPast,
        'has-markers': tick.markers.length > 0,
      }"
    >
      <span class="tl-turn">T{{ tick.turn }}</span>
      <div v-if="tick.markers.length" class="tl-markers">
        <template v-for="(marker, idx) in tick.markers" :key="`${tick.turn}-${idx}`">
          <button
            v-if="marker.kind === 'forward'"
            type="button"
            class="tl-marker tl-marker--forward"
            :class="[`is-${marker.playerId}`, { 'is-cancellable': marker.canCancel }]"
            :disabled="!marker.canCancel"
            :title="marker.canCancel ? 'ブラフチップで取消' : '予約注文'"
            @click="marker.canCancel && emit('cancelForwardOrder', marker.id)"
          >
            <span class="tl-player-dot"></span>
            <span class="tl-marker-text">
              {{ stockAbbr(marker.stockKey) }}{{ actionLabel(marker.tradeAction) }}
              {{ shortYen(marker.orderAmount) }}
            </span>
          </button>
          <span
            v-else
            class="tl-marker tl-marker--event"
            :class="[`is-${marker.status}`]"
            :title="marker.title"
          >
            ⚡ {{ marker.title }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(36px, 1fr);
  gap: 3px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(122, 171, 255, 0.14);
  background: linear-gradient(90deg, rgba(7, 14, 32, 0.8), rgba(12, 24, 50, 0.8));
  color: #e7eefd;
  font-size: 9px;
  overflow-x: auto;
  min-height: 30px;
  align-items: center;
}

.tl-tick {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 3px;
  justify-items: center;
  padding: 3px 4px;
  border-radius: 6px;
  position: relative;
  border: 1px solid transparent;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.tl-tick.is-past {
  opacity: 0.35;
}

.tl-tick.is-current {
  border-color: rgba(255, 213, 128, 0.45);
  background: rgba(255, 196, 86, 0.08);
}

.tl-tick.has-markers:not(.is-current) {
  border-color: rgba(122, 171, 255, 0.22);
  background: rgba(60, 100, 180, 0.06);
}

.tl-turn {
  font-size: 9px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  opacity: 0.65;
}

.tl-tick.is-current .tl-turn {
  color: #ffd894;
  opacity: 1;
}

.tl-markers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.tl-marker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 4px;
  border: none;
  cursor: default;
  line-height: 1.1;
  background: rgba(255, 255, 255, 0.05);
  color: #e7eefd;
  text-align: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.tl-marker--forward.is-player1 {
  background: rgba(99, 163, 255, 0.18);
  color: #d6e7ff;
}

.tl-marker--forward.is-player2 {
  background: rgba(255, 130, 160, 0.18);
  color: #ffd6de;
}

.tl-marker--forward.is-cancellable {
  cursor: pointer;
  outline: 1px dashed rgba(255, 213, 128, 0.6);
}

.tl-marker--forward.is-cancellable:hover {
  filter: brightness(1.2);
}

.tl-player-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.75;
}

.tl-marker--event {
  background: rgba(255, 196, 86, 0.12);
  color: #ffd894;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tl-marker--event.is-fired {
  background: rgba(180, 190, 210, 0.1);
  color: rgba(220, 230, 250, 0.55);
}

.tl-marker--event.is-expired {
  opacity: 0.35;
}
</style>
