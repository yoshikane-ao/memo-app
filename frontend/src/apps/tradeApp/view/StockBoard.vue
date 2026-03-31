<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerId, StockKey, StockState } from '../api/types/game'

type OrderMarker = {
  id: string
  stockKey: StockKey
  playerId: PlayerId
  side: 'buy' | 'sell'
  executionPrice: number
  historyIndex: number
  turn: number
}

const props = defineProps<{
  stocks: StockState[]
  turn: number
  projectedPrices?: Partial<Record<StockKey, number>> | null
  orderMarkers?: OrderMarker[]
}>()

const viewWidth = 860
const viewHeight = 92
const padTop = 14
const padRight = 28
const padBottom = 18
const padLeft = 12
const chartWidth = viewWidth - padLeft - padRight
const chartHeight = viewHeight - padTop - padBottom

const chartOrder: StockKey[] = ['market', 'p1', 'p2']

const colorMap: Record<StockKey, string> = {
  market: '#58d0ff',
  p1: '#6f8fff',
  p2: '#ff708b',
}

const labelMap: Record<StockKey, string> = {
  market: 'マーケット',
  p1: 'Player1',
  p2: 'Player2',
}

const playerLabelMap: Record<PlayerId, string> = {
  player1: 'P1',
  player2: 'P2',
}

const playerAccentMap: Record<PlayerId, string> = {
  player1: '#6f8fff',
  player2: '#ff708b',
}

const playerBadgeFillMap: Record<PlayerId, string> = {
  player1: 'rgba(10, 24, 54, 0.94)',
  player2: 'rgba(52, 12, 26, 0.94)',
}

const sideLabelMap: Record<OrderMarker['side'], string> = {
  buy: '買い',
  sell: '売り',
}

type StockChartBaseViewModel = StockState & {
  color: string
  label: string
  visibleHistory: number[]
  ticks: number[]
  chartMin: number
  chartMax: number
  projectedPrice: number | null
}

type ChartOrderMarkerViewModel = OrderMarker & {
  playerLabel: string
  sideLabel: string
  badgeX: number
  badgeY: number
  badgeWidth: number
  badgeHeight: number
  textX: number
  textY: number
  pointX: number
  pointY: number
  stemY1: number
  stemY2: number
  arrowPoints: string
  accentColor: string
  badgeFill: string
}

type StockChartViewModel = StockChartBaseViewModel & {
  orderMarkers: ChartOrderMarkerViewModel[]
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(Math.round(value))
}

function niceStep(rawStep: number): number {
  const power = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))))
  const normalized = rawStep / power

  if (normalized <= 1) return power
  if (normalized <= 2) return 2 * power
  if (normalized <= 5) return 5 * power
  return 10 * power
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function x(index: number, total: number): number {
  if (total <= 1) return padLeft
  return padLeft + (chartWidth * index) / (total - 1)
}

function y(value: number, chart: StockChartBaseViewModel): number {
  const range = Math.max(1, chart.chartMax - chart.chartMin)
  return padTop + chartHeight - ((value - chart.chartMin) / range) * chartHeight
}

function buildVisibleOrderMarkers(chart: StockChartBaseViewModel): ChartOrderMarkerViewModel[] {
  const visibleStartIndex = Math.max(0, chart.history.length - chart.visibleHistory.length)
  const laneMap = new Map<string, number>()

  return (props.orderMarkers ?? [])
    .filter((marker) => marker.stockKey === chart.key)
    .filter((marker) => marker.historyIndex >= visibleStartIndex && marker.historyIndex < chart.history.length)
    .slice(-6)
    .map((marker) => {
      const localIndex = marker.historyIndex - visibleStartIndex
      const pointX = x(localIndex, chart.visibleHistory.length)
      const pointY = y(marker.executionPrice, chart)
      const laneKey = `${localIndex}-${marker.side}`
      const laneIndex = laneMap.get(laneKey) ?? 0
      laneMap.set(laneKey, laneIndex + 1)

      const badgeWidth = 50
      const badgeHeight = 14
      const offset = 16 + laneIndex * 12
      const badgeY = marker.side === 'buy'
        ? clamp(pointY + offset, padTop + 2, padTop + chartHeight - badgeHeight - 2)
        : clamp(pointY - offset - badgeHeight, padTop + 2, padTop + chartHeight - badgeHeight - 2)
      const badgeX = clamp(pointX - badgeWidth / 2, padLeft + 2, viewWidth - padRight - badgeWidth - 2)
      const stemY1 = marker.side === 'buy' ? badgeY : badgeY + badgeHeight
      const stemY2 = marker.side === 'buy' ? pointY + 8 : pointY - 8
      const arrowPoints = marker.side === 'buy'
        ? `${pointX - 4},${pointY + 8} ${pointX + 4},${pointY + 8} ${pointX},${pointY + 2}`
        : `${pointX - 4},${pointY - 8} ${pointX + 4},${pointY - 8} ${pointX},${pointY - 2}`

      return {
        ...marker,
        playerLabel: playerLabelMap[marker.playerId],
        sideLabel: sideLabelMap[marker.side],
        badgeX,
        badgeY,
        badgeWidth,
        badgeHeight,
        textX: badgeX + badgeWidth / 2,
        textY: badgeY + badgeHeight / 2 + 2.1,
        pointX,
        pointY,
        stemY1,
        stemY2,
        arrowPoints,
        accentColor: playerAccentMap[marker.playerId],
        badgeFill: playerBadgeFillMap[marker.playerId],
      }
    })
}

const charts = computed<StockChartViewModel[]>(() =>
  chartOrder.map((key) => {
    const stock = props.stocks.find((item) => item.key === key)
    if (!stock) {
      throw new Error(`Stock not found: ${key}`)
    }

    const visibleHistory = stock.history.slice(-8)
    const values = visibleHistory.length > 0 ? visibleHistory : [stock.currentPrice]
    const extraValues = props.projectedPrices?.[key] != null
      ? [...values, props.projectedPrices[key] as number]
      : values
    const min = Math.min(...extraValues)
    const max = Math.max(...extraValues)
    const spread = Math.max(12, max - min)
    const step = niceStep(spread / 4)
    const chartMin = Math.floor((min - step * 0.35) / step) * step
    const chartMax = Math.ceil((max + step * 0.35) / step) * step
    const ticks = [chartMax, Math.round((chartMax + chartMin) / 2), chartMin]

    const chartBase: StockChartBaseViewModel = {
      ...stock,
      color: colorMap[key],
      label: labelMap[key],
      visibleHistory,
      ticks,
      chartMin,
      chartMax,
      projectedPrice: props.projectedPrices?.[key] ?? null,
    }

    return {
      ...chartBase,
      orderMarkers: buildVisibleOrderMarkers(chartBase),
    }
  }),
)

function buildPath(chart: StockChartBaseViewModel): string {
  if (chart.visibleHistory.length === 0) {
    return ''
  }

  return chart.visibleHistory
    .map(
      (value, index) =>
        `${index === 0 ? 'M' : 'L'} ${x(index, chart.visibleHistory.length)} ${y(value, chart)}`,
    )
    .join(' ')
}

function lastX(chart: StockChartBaseViewModel): number {
  return x(chart.visibleHistory.length - 1, chart.visibleHistory.length)
}

function lastY(chart: StockChartBaseViewModel): number {
  return y(chart.visibleHistory[chart.visibleHistory.length - 1] ?? chart.currentPrice, chart)
}
</script>

<template>
  <section class="board-wrap">
    <header class="board-head">
      <div class="title-copy">
        <div class="board-title">価格ボード</div>
        <div class="board-note">マーケット / Player1 / Player2</div>
      </div>
      <div class="turn-chip">T{{ turn }}</div>
    </header>

    <div class="quote-pills">
      <div
        v-for="chart in charts"
        :key="chart.key"
        class="quote-pill"
        :style="{ '--line-color': chart.color }"
      >
        <span class="quote-dot" :style="{ background: chart.color }"></span>
        <span class="quote-name">{{ chart.label }}</span>
        <div class="quote-values">
          <strong>{{ formatPrice(chart.currentPrice) }}円</strong>
          <span v-if="chart.projectedPrice !== null" class="quote-landing">
            → {{ formatPrice(chart.projectedPrice) }}円
          </span>
        </div>
      </div>
    </div>

    <div class="chart-stack">
      <article
        v-for="chart in charts"
        :key="chart.key"
        class="mini-chart"
        :class="`mini-chart--${chart.key}`"
      >
        <div class="mini-chart__head">
          <div class="mini-chart__title-group">
            <strong class="mini-chart__name" :style="{ color: chart.color }">
              {{ chart.label }}
            </strong>
            <span class="mini-chart__price">{{ formatPrice(chart.currentPrice) }}円</span>
            <span v-if="chart.projectedPrice !== null" class="mini-chart__landing">
              → {{ formatPrice(chart.projectedPrice) }}円
            </span>
          </div>
        </div>

        <svg :viewBox="`0 0 ${viewWidth} ${viewHeight}`" preserveAspectRatio="none" class="chart-svg">
          <rect :x="padLeft" :y="padTop" :width="chartWidth" :height="chartHeight" class="plot-frame" />

          <line
            v-for="tick in chart.ticks"
            :key="`${chart.key}-${tick}`"
            class="grid-line"
            :x1="padLeft"
            :x2="viewWidth - padRight"
            :y1="y(tick, chart)"
            :y2="y(tick, chart)"
          />

          <path :d="buildPath(chart)" class="line-under" :stroke="chart.color" />
          <path :d="buildPath(chart)" class="line-main" :stroke="chart.color" />
          <path :d="buildPath(chart)" class="line-highlight" />

          <circle :cx="lastX(chart)" :cy="lastY(chart)" r="3.8" :fill="chart.color" class="line-dot" />

          <g
            v-for="marker in chart.orderMarkers"
            :key="marker.id"
            class="order-marker"
            :class="[`order-marker--${marker.playerId}`, `order-marker--${marker.side}`]"
            :data-order-marker="marker.id"
            :data-player-marker="marker.playerLabel"
            :data-side="marker.side"
          >
            <line
              class="order-marker__stem"
              :x1="marker.pointX"
              :x2="marker.pointX"
              :y1="marker.stemY1"
              :y2="marker.stemY2"
              :stroke="marker.accentColor"
            />
            <polygon class="order-marker__arrow" :points="marker.arrowPoints" :fill="marker.accentColor" />
            <circle
              class="order-marker__point"
              :cx="marker.pointX"
              :cy="marker.pointY"
              r="4.4"
              :fill="marker.accentColor"
            />
            <rect
              class="order-marker__badge"
              :x="marker.badgeX"
              :y="marker.badgeY"
              :width="marker.badgeWidth"
              :height="marker.badgeHeight"
              rx="6"
              :fill="marker.badgeFill"
              :stroke="marker.accentColor"
            />
            <text class="order-marker__text" :x="marker.textX" :y="marker.textY">
              {{ marker.playerLabel }} {{ marker.sideLabel }}
            </text>
          </g>

          <text
            v-for="tick in chart.ticks"
            :key="`price-${chart.key}-${tick}`"
            class="price-label"
            :x="padLeft + 2"
            :y="y(tick, chart) - 2"
          >
            {{ formatPrice(tick) }}
          </text>
        </svg>
      </article>
    </div>
  </section>
</template>

<style scoped>
.board-wrap {
  position: relative;
  isolation: isolate;
  height: 100%;
  min-height: 0;
  min-width: 0;
  border-radius: 20px;
  border: 1px solid rgba(107, 143, 255, 0.22);
  background:
    linear-gradient(180deg, rgba(3, 9, 24, 0.98) 0%, rgba(3, 7, 19, 0.95) 100%),
    radial-gradient(circle at 20% 0%, rgba(76, 132, 255, 0.16), transparent 32%),
    radial-gradient(circle at 80% 0%, rgba(255, 88, 108, 0.12), transparent 28%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 48px rgba(0, 0, 0, 0.3);
  padding: 8px 10px 10px;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 8px;
  overflow: hidden;
}

.board-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.title-copy {
  display: grid;
  gap: 2px;
}

.board-title {
  color: #f4f8ff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.board-note {
  color: rgba(201, 216, 255, 0.72);
  font-size: 8px;
  line-height: 1.15;
}

.turn-chip {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(108, 155, 255, 0.3);
  background: linear-gradient(180deg, rgba(27, 49, 91, 0.9), rgba(11, 20, 43, 0.95));
  color: #c9d8ff;
  font-size: 8px;
  font-weight: 800;
}

.quote-pills {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(156px, 1fr));
  gap: 6px;
}

.quote-pill {
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(18, 30, 58, 0.82), rgba(10, 18, 35, 0.92));
  border: 1px solid rgba(124, 150, 206, 0.2);
  color: #dfe8ff;
  font-size: 7px;
  line-height: 1;
}

.quote-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 12px color-mix(in srgb, var(--line-color) 72%, transparent);
  flex: 0 0 auto;
}

.quote-name {
  color: #c4d7fb;
  white-space: nowrap;
}

.quote-values {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.quote-pill strong {
  color: #f8fbff;
  font-size: 8px;
  font-weight: 900;
  white-space: nowrap;
}

.quote-landing {
  color: rgba(195, 213, 255, 0.84);
  font-size: 8px;
  font-weight: 900;
  white-space: nowrap;
}

.chart-stack {
  min-height: 0;
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.mini-chart {
  min-height: 0;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(4, 11, 28, 0.98) 0%, rgba(3, 8, 21, 0.94) 100%),
    radial-gradient(circle at right, rgba(255, 255, 255, 0.04), transparent 46%);
  padding: 6px 8px 8px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 5px;
  overflow: hidden;
}

.mini-chart__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-chart__title-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-chart__name {
  font-size: 11px;
  font-weight: 900;
}

.mini-chart__price {
  color: #f4f8ff;
  font-size: 10px;
  font-weight: 800;
}

.mini-chart__landing {
  color: rgba(201, 216, 255, 0.8);
  font-size: 10px;
  font-weight: 800;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.plot-frame {
  fill: rgba(255, 255, 255, 0.01);
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
}

.grid-line {
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
}

.price-label {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 5.2px;
  font-weight: 700;
  fill: rgba(217, 229, 255, 0.58);
}

.line-under {
  fill: none;
  stroke-width: 6.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.28;
}

.line-main {
  fill: none;
  stroke-width: 3.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 12px rgba(90, 144, 255, 0.26));
}

.line-highlight {
  fill: none;
  stroke: rgba(255, 255, 255, 0.24);
  stroke-width: 0.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.8;
}

.line-dot {
  stroke: rgba(0, 10, 26, 0.98);
  stroke-width: 1.6;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.18));
}

.order-marker {
  pointer-events: none;
}

.order-marker__stem {
  stroke-width: 1.9;
  stroke-linecap: round;
  opacity: 0.96;
}

.order-marker__arrow {
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.16));
}

.order-marker__point {
  stroke: rgba(0, 10, 26, 0.98);
  stroke-width: 1.6;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.18));
}

.order-marker__badge {
  stroke-width: 1.1;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.32));
}

.order-marker__text {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 5.8px;
  font-weight: 900;
  fill: #f4f8ff;
  text-anchor: middle;
  letter-spacing: 0.02em;
}

@media (max-width: 960px) {
  .mini-chart__head {
    align-items: flex-start;
  }
}
</style>
