<script setup lang="ts">
import { computed, ref } from 'vue'
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

type ChartSeries = StockState & {
  color: string
  label: string
  visibleHistory: number[]
  visibleStartIndex: number
  offset: number
  projectedPrice: number | null
}

type ChartOrderMarkerViewModel = OrderMarker & {
  playerLabel: string
  markerLabel: string
  accentColor: string
  badgeFill: string
  pointX: number
  pointY: number
  stemY1: number
  stemY2: number
  badgeX: number
  badgeY: number
  badgeWidth: number
  badgeHeight: number
  textX: number
  textY: number
  arrowPoints: string
}

type ChartPriceLabelViewModel = {
  key: StockKey
  label: string
  priceText: string
  color: string
  boxFill: string
  pointX: number
  pointY: number
  connectorX1: number
  connectorY1: number
  connectorX2: number
  connectorY2: number
  boxX: number
  boxY: number
  boxWidth: number
  boxHeight: number
  textX: number
  textY: number
}

type ChartProjectionViewModel = {
  key: StockKey
  color: string
  path: string
  pointX: number
  pointY: number
}

type SharedChartViewModel = {
  series: ChartSeries[]
  visibleCount: number
  plotCount: number
  ticks: number[]
  chartMin: number
  chartMax: number
  orderMarkers: ChartOrderMarkerViewModel[]
  projections: ChartProjectionViewModel[]
  priceLabels: ChartPriceLabelViewModel[]
}

const props = defineProps<{
  stocks: StockState[]
  turn: number
  projectedPrices?: Partial<Record<StockKey, number>> | null
  orderMarkers?: OrderMarker[]
}>()

const focusedSeriesKey = ref<StockKey | null>(null)

const viewWidth = 860
const viewHeight = 254
const padTop = 18
const padRight = 136
const padBottom = 22
const padLeft = 42
const chartWidth = viewWidth - padLeft - padRight
const chartHeight = viewHeight - padTop - padBottom
const maxVisiblePoints = 8
const labelBoxHeight = 18
const labelBoxInset = 10
const labelBoxWidth = padRight - labelBoxInset - 8

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

function y(value: number, chart: Pick<SharedChartViewModel, 'chartMin' | 'chartMax'>): number {
  const range = Math.max(1, chart.chartMax - chart.chartMin)
  return padTop + chartHeight - ((value - chart.chartMin) / range) * chartHeight
}

function buildTicks(chartMin: number, chartMax: number, step: number): number[] {
  const ticks: number[] = []
  for (let value = chartMax; value >= chartMin; value -= step) {
    ticks.push(value)
  }
  if (ticks[ticks.length - 1] !== chartMin) {
    ticks.push(chartMin)
  }
  return ticks
}

function buildSharedSeries(): ChartSeries[] {
  const maxHistoryLength = props.stocks.reduce(
    (max, stock) => Math.max(max, stock.history.length, 1),
    1,
  )
  const visibleCount = Math.min(maxVisiblePoints, maxHistoryLength)

  return chartOrder.map((key) => {
    const stock = props.stocks.find((item) => item.key === key)
    if (!stock) {
      throw new Error(`Stock not found: ${key}`)
    }

    const visibleHistory = stock.history.slice(-visibleCount)

    return {
      ...stock,
      color: colorMap[key],
      label: labelMap[key],
      visibleHistory,
      visibleStartIndex: Math.max(0, stock.history.length - visibleHistory.length),
      offset: Math.max(0, visibleCount - visibleHistory.length),
      projectedPrice: props.projectedPrices?.[key] ?? null,
    }
  })
}

function buildLastPoint(
  series: ChartSeries,
  sharedChart: Pick<SharedChartViewModel, 'plotCount' | 'chartMin' | 'chartMax'>,
): { x: number; y: number; value: number } {
  const plotIndex = series.visibleHistory.length - 1 + series.offset
  const lastValue = series.visibleHistory[series.visibleHistory.length - 1] ?? series.currentPrice

  return {
    x: x(plotIndex, sharedChart.plotCount),
    y: y(lastValue, sharedChart),
    value: lastValue,
  }
}

function buildVisibleOrderMarkers(
  sharedChart: Pick<SharedChartViewModel, 'series' | 'visibleCount' | 'plotCount' | 'chartMin' | 'chartMax'>,
): ChartOrderMarkerViewModel[] {
  const laneMap = new Map<string, number>()

  return (props.orderMarkers ?? [])
    .filter((marker) => sharedChart.series.some((series) => series.key === marker.stockKey))
    .filter((marker) => {
      const series = sharedChart.series.find((item) => item.key === marker.stockKey)
      if (!series) {
        return false
      }

      return (
        marker.historyIndex >= series.visibleStartIndex
        && marker.historyIndex < series.visibleStartIndex + series.visibleHistory.length
      )
    })
    .slice(-10)
    .map((marker) => {
      const series = sharedChart.series.find((item) => item.key === marker.stockKey)
      if (!series) {
        throw new Error(`Marker stock not found: ${marker.stockKey}`)
      }

      const localIndex = marker.historyIndex - series.visibleStartIndex + series.offset
      const pointX = x(localIndex, sharedChart.plotCount)
      const pointY = y(marker.executionPrice, sharedChart)
      const laneKey = `${localIndex}-${marker.side}`
      const laneIndex = laneMap.get(laneKey) ?? 0
      laneMap.set(laneKey, laneIndex + 1)

      const badgeWidth = 54
      const badgeHeight = 14
      const offset = 18 + laneIndex * 14
      const badgeY = marker.side === 'buy'
        ? clamp(pointY + offset, padTop + 4, padTop + chartHeight - badgeHeight - 4)
        : clamp(pointY - offset - badgeHeight, padTop + 4, padTop + chartHeight - badgeHeight - 4)
      const badgeX = clamp(pointX - badgeWidth / 2, padLeft + 2, viewWidth - padRight - badgeWidth - 2)
      const stemY1 = marker.side === 'buy' ? badgeY : badgeY + badgeHeight
      const stemY2 = marker.side === 'buy' ? pointY + 8 : pointY - 8
      const arrowPoints = marker.side === 'buy'
        ? `${pointX - 4},${pointY + 8} ${pointX + 4},${pointY + 8} ${pointX},${pointY + 2}`
        : `${pointX - 4},${pointY - 8} ${pointX + 4},${pointY - 8} ${pointX},${pointY - 2}`

      return {
        ...marker,
        playerLabel: playerLabelMap[marker.playerId],
        markerLabel: sideLabelMap[marker.side],
        accentColor: playerAccentMap[marker.playerId],
        badgeFill: playerBadgeFillMap[marker.playerId],
        pointX,
        pointY,
        stemY1,
        stemY2,
        badgeX,
        badgeY,
        badgeWidth,
        badgeHeight,
        textX: badgeX + badgeWidth / 2,
        textY: badgeY + badgeHeight / 2 + 2.1,
        arrowPoints,
      }
    })
}

function buildProjectionSegments(
  sharedChart: Pick<SharedChartViewModel, 'series' | 'plotCount' | 'chartMin' | 'chartMax'>,
): ChartProjectionViewModel[] {
  return sharedChart.series.flatMap((series) => {
    if (series.projectedPrice == null) {
      return []
    }

    const currentPoint = buildLastPoint(series, sharedChart)
    const currentValue = Math.round(currentPoint.value)
    const projectedValue = Math.round(series.projectedPrice)
    if (currentValue === projectedValue) {
      return []
    }

    const projectedIndex = series.visibleHistory.length + series.offset
    const projectedPoint = {
      x: x(projectedIndex, sharedChart.plotCount),
      y: y(series.projectedPrice, sharedChart),
    }

    return [{
      key: series.key,
      color: series.color,
      path: `M ${currentPoint.x} ${currentPoint.y} L ${projectedPoint.x} ${projectedPoint.y}`,
      pointX: projectedPoint.x,
      pointY: projectedPoint.y,
    }]
  })
}

function buildPriceLabels(
  sharedChart: Pick<SharedChartViewModel, 'series' | 'plotCount' | 'chartMin' | 'chartMax'>,
): ChartPriceLabelViewModel[] {
  const labelX = viewWidth - padRight + labelBoxInset
  const minCenterY = padTop + labelBoxHeight / 2 + 4
  const maxCenterY = padTop + chartHeight - labelBoxHeight / 2 - 4
  const minGap = labelBoxHeight + 6

  const anchors = sharedChart.series
    .map((series) => {
      const point = buildLastPoint(series, sharedChart)
      return {
        series,
        point,
        desiredCenterY: clamp(point.y, minCenterY, maxCenterY),
      }
    })
    .sort((left, right) => left.desiredCenterY - right.desiredCenterY)

  const adjustedCenters = anchors.map((anchor) => anchor.desiredCenterY)

  for (let index = 1; index < adjustedCenters.length; index += 1) {
    adjustedCenters[index] = Math.max(adjustedCenters[index], adjustedCenters[index - 1] + minGap)
  }

  if (adjustedCenters.length > 0 && adjustedCenters[adjustedCenters.length - 1] > maxCenterY) {
    adjustedCenters[adjustedCenters.length - 1] = maxCenterY

    for (let index = adjustedCenters.length - 2; index >= 0; index -= 1) {
      adjustedCenters[index] = Math.min(adjustedCenters[index], adjustedCenters[index + 1] - minGap)
    }
  }

  if (adjustedCenters.length > 0 && adjustedCenters[0] < minCenterY) {
    adjustedCenters[0] = minCenterY

    for (let index = 1; index < adjustedCenters.length; index += 1) {
      adjustedCenters[index] = Math.max(adjustedCenters[index], adjustedCenters[index - 1] + minGap)
    }
  }

  return anchors.map((anchor, index) => {
    const centerY = adjustedCenters[index]
    const boxY = centerY - labelBoxHeight / 2

    return {
      key: anchor.series.key,
      label: anchor.series.label,
      priceText: `${formatPrice(anchor.point.value)}円`,
      color: anchor.series.color,
      boxFill: 'rgba(8, 18, 36, 0.94)',
      pointX: anchor.point.x,
      pointY: anchor.point.y,
      connectorX1: anchor.point.x + 8,
      connectorY1: anchor.point.y,
      connectorX2: labelX - 6,
      connectorY2: centerY,
      boxX: labelX,
      boxY,
      boxWidth: labelBoxWidth,
      boxHeight: labelBoxHeight,
      textX: labelX + 8,
      textY: centerY + 2.2,
    }
  })
}

const chart = computed<SharedChartViewModel>(() => {
  const series = buildSharedSeries()
  const visibleCount = Math.max(...series.map((item) => item.visibleHistory.length), 1)
  const hasProjectedMove = series.some((item) => (
    item.projectedPrice != null && Math.round(item.projectedPrice) !== Math.round(item.currentPrice)
  ))
  const plotCount = visibleCount + (hasProjectedMove ? 1 : 0)
  const values = series.flatMap((item) => item.visibleHistory)
  const projectedValues = series
    .map((item) => item.projectedPrice)
    .filter((value): value is number => value != null)
  const min = Math.min(...values, ...projectedValues)
  const max = Math.max(...values, ...projectedValues)
  const spread = Math.max(100, max - min)
  const step = niceStep(spread / 4)
  const chartMin = Math.floor((min - step * 0.35) / step) * step
  const chartMax = Math.ceil((max + step * 0.35) / step) * step
  const ticks = buildTicks(chartMin, chartMax, step)

  const baseChart = {
    series,
    visibleCount,
    plotCount,
    ticks,
    chartMin,
    chartMax,
    orderMarkers: [] as ChartOrderMarkerViewModel[],
    projections: [] as ChartProjectionViewModel[],
    priceLabels: [] as ChartPriceLabelViewModel[],
  }

  return {
    ...baseChart,
    orderMarkers: buildVisibleOrderMarkers(baseChart),
    projections: buildProjectionSegments(baseChart),
    priceLabels: buildPriceLabels(baseChart),
  }
})

function buildPath(series: ChartSeries): string {
  if (series.visibleHistory.length === 0) {
    return ''
  }

  return series.visibleHistory
    .map((value, index) => {
      const plotIndex = index + series.offset
      return `${index === 0 ? 'M' : 'L'} ${x(plotIndex, chart.value.plotCount)} ${y(value, chart.value)}`
    })
    .join(' ')
}

function lastPoint(series: ChartSeries): { x: number; y: number } {
  const point = buildLastPoint(series, chart.value)

  return {
    x: point.x,
    y: point.y,
  }
}

function toggleSeriesFocus(key: StockKey): void {
  focusedSeriesKey.value = focusedSeriesKey.value === key ? null : key
}

function isSeriesFocused(key: StockKey): boolean {
  return focusedSeriesKey.value === key
}

function isSeriesDimmed(key: StockKey): boolean {
  return focusedSeriesKey.value !== null && focusedSeriesKey.value !== key
}
</script>

<template>
  <section class="board-wrap">
    <header class="board-head">
      <div class="title-copy">
        <div class="board-title">価格ボード</div>
        <div class="board-note">マーケット / Player1 / Player2 を同一チャートで比較</div>
      </div>
      <div class="turn-chip">T{{ turn }}</div>
    </header>

    <div class="quote-pills">
      <button
        v-for="series in chart.series"
        :key="series.key"
        type="button"
        class="quote-pill"
        :class="{ 'is-focused': isSeriesFocused(series.key), 'is-dimmed': isSeriesDimmed(series.key) }"
        :style="{ '--line-color': series.color }"
        :aria-pressed="isSeriesFocused(series.key) ? 'true' : 'false'"
        :data-focus-toggle="series.key"
        @click="toggleSeriesFocus(series.key)"
      >
        <span class="quote-dot" :style="{ background: series.color }"></span>
        <span class="quote-name">{{ series.label }}</span>
        <div class="quote-values">
          <strong>{{ formatPrice(series.currentPrice) }}円</strong>
          <span v-if="series.projectedPrice !== null" class="quote-landing">
            → {{ formatPrice(series.projectedPrice) }}円
          </span>
        </div>
      </button>
    </div>

    <article class="shared-chart">
      <div class="shared-chart__head">
        <div class="shared-chart__legend">
          <button
            v-for="series in chart.series"
            :key="`${series.key}-legend`"
            type="button"
            class="legend-chip"
            :class="{ 'is-focused': isSeriesFocused(series.key), 'is-dimmed': isSeriesDimmed(series.key) }"
            :style="{ '--legend-color': series.color }"
            :aria-pressed="isSeriesFocused(series.key) ? 'true' : 'false'"
            :data-legend-toggle="series.key"
            @click="toggleSeriesFocus(series.key)"
          >
            <span class="legend-chip__dot"></span>
            <span class="legend-chip__label">{{ series.label }}</span>
          </button>
        </div>
      </div>

      <svg :viewBox="`0 0 ${viewWidth} ${viewHeight}`" preserveAspectRatio="none" class="chart-svg">
        <rect :x="padLeft" :y="padTop" :width="chartWidth" :height="chartHeight" class="plot-frame" />

        <line
          v-for="tick in chart.ticks"
          :key="`tick-${tick}`"
          class="grid-line"
          :x1="padLeft"
          :x2="viewWidth - padRight"
          :y1="y(tick, chart)"
          :y2="y(tick, chart)"
        />

        <g
          v-for="series in chart.series"
          :key="series.key"
          class="chart-series"
          :class="{ 'is-focused': isSeriesFocused(series.key), 'is-dimmed': isSeriesDimmed(series.key) }"
          :data-series="series.key"
        >
          <path :d="buildPath(series)" class="line-under" :stroke="series.color" />
          <path :d="buildPath(series)" class="line-main" :stroke="series.color" />
          <path :d="buildPath(series)" class="line-highlight" :stroke="series.color" />
          <circle
            class="line-dot"
            :cx="lastPoint(series).x"
            :cy="lastPoint(series).y"
            r="4.2"
            :fill="series.color"
          />
        </g>

        <g
          v-for="projection in chart.projections"
          :key="`${projection.key}-projection`"
          class="chart-projection"
          :class="{ 'is-dimmed': isSeriesDimmed(projection.key), 'is-focused': isSeriesFocused(projection.key) }"
          :data-series-projection="projection.key"
        >
          <path
            class="chart-projection__path"
            :d="projection.path"
            :stroke="projection.color"
          />
          <circle
            class="chart-projection__point"
            :cx="projection.pointX"
            :cy="projection.pointY"
            r="4.2"
            :fill="projection.color"
          />
        </g>

        <g
          v-for="marker in chart.orderMarkers"
          :key="marker.id"
          class="order-marker"
          :class="[
            `order-marker--${marker.playerId}`,
            `order-marker--${marker.side}`,
            { 'is-dimmed': isSeriesDimmed(marker.stockKey) },
          ]"
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
          <circle class="order-marker__point" :cx="marker.pointX" :cy="marker.pointY" r="4.4" :fill="marker.accentColor" />
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
            {{ marker.playerLabel }} {{ marker.markerLabel }}
          </text>
        </g>

        <g
          v-for="priceLabel in chart.priceLabels"
          :key="`${priceLabel.key}-price-label`"
          class="price-tag"
          :class="{ 'is-dimmed': isSeriesDimmed(priceLabel.key) }"
          :data-series-label="priceLabel.key"
        >
          <line
            class="price-tag__connector"
            :x1="priceLabel.connectorX1"
            :y1="priceLabel.connectorY1"
            :x2="priceLabel.connectorX2"
            :y2="priceLabel.connectorY2"
            :stroke="priceLabel.color"
          />
          <rect
            class="price-tag__box"
            :x="priceLabel.boxX"
            :y="priceLabel.boxY"
            :width="priceLabel.boxWidth"
            :height="priceLabel.boxHeight"
            rx="7"
            :fill="priceLabel.boxFill"
            :stroke="priceLabel.color"
          />
          <text class="price-tag__text" :x="priceLabel.textX" :y="priceLabel.textY">
            {{ priceLabel.label }} {{ priceLabel.priceText }}
          </text>
        </g>

        <text
          v-for="tick in chart.ticks"
          :key="`price-${tick}`"
          class="price-label"
          :x="padLeft - 4"
          :y="y(tick, chart) + 2"
        >
          {{ formatPrice(tick) }}
        </text>
      </svg>
    </article>
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
  appearance: none;
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
  cursor: pointer;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.quote-pill:hover {
  transform: translateY(-1px);
}

.quote-pill.is-focused {
  border-color: color-mix(in srgb, var(--line-color) 72%, white 10%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--line-color) 34%, transparent),
    0 10px 22px rgba(0, 0, 0, 0.24);
}

.quote-pill.is-dimmed {
  opacity: 0.4;
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

.shared-chart {
  min-height: 0;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(4, 11, 28, 0.98) 0%, rgba(3, 8, 21, 0.94) 100%),
    radial-gradient(circle at right, rgba(255, 255, 255, 0.04), transparent 46%);
  padding: 8px 10px 10px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
  overflow: hidden;
}

.shared-chart__head {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.shared-chart__legend {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.legend-chip {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #dfe8ff;
  font-size: 8px;
  font-weight: 800;
  cursor: pointer;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.legend-chip:hover {
  transform: translateY(-1px);
}

.legend-chip.is-focused {
  border-color: color-mix(in srgb, var(--legend-color) 72%, white 10%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--legend-color) 28%, transparent);
}

.legend-chip.is-dimmed {
  opacity: 0.4;
}

.legend-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--legend-color);
  box-shadow: 0 0 12px color-mix(in srgb, var(--legend-color) 72%, transparent);
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
  font-size: 5.6px;
  font-weight: 700;
  fill: rgba(217, 229, 255, 0.58);
  text-anchor: end;
}

.chart-series,
.chart-projection,
.order-marker,
.price-tag {
  transition: opacity 0.18s ease;
}

.chart-series.is-dimmed,
.chart-projection.is-dimmed,
.order-marker.is-dimmed,
.price-tag.is-dimmed {
  opacity: 0.2;
}

.chart-series.is-focused .line-main {
  stroke-width: 4.2;
}

.chart-series.is-focused .line-under {
  opacity: 0.28;
}

.line-under {
  fill: none;
  stroke-width: 6.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.22;
}

.line-main {
  fill: none;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 12px rgba(90, 144, 255, 0.18));
}

.line-highlight {
  fill: none;
  stroke-width: 0.95;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.2;
}

.line-dot {
  stroke: rgba(0, 10, 26, 0.98);
  stroke-width: 1.6;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.18));
}

.chart-projection {
  pointer-events: none;
}

.chart-projection__path {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: 5 4;
  opacity: 0.42;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.12));
}

.chart-projection__point {
  stroke: rgba(0, 10, 26, 0.72);
  stroke-width: 1.2;
  opacity: 0.3;
}

.chart-projection.is-focused .chart-projection__path {
  stroke-width: 2.9;
  opacity: 0.58;
}

.chart-projection.is-focused .chart-projection__point {
  opacity: 0.46;
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

.price-tag {
  pointer-events: none;
}

.price-tag__connector {
  stroke-width: 1.4;
  opacity: 0.88;
}

.price-tag__box {
  stroke-width: 1.2;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.28));
}

.price-tag__text {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 5.9px;
  font-weight: 900;
  fill: #f4f8ff;
  letter-spacing: 0.01em;
}

@media (max-width: 960px) {
  .shared-chart__head {
    justify-content: flex-start;
  }

  .shared-chart__legend {
    justify-content: flex-start;
  }
}
</style>
