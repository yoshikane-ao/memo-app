<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { PlayerId, StockKey, StockState } from '../features/trade';
import chartBackdrop from '../assets/trade-chart-background.png';

type OrderMarker = {
  id: string;
  stockKey: StockKey;
  playerId: PlayerId;
  positionId?: string;
  pnl?: number;
  side: 'buy' | 'sell';
  isPendingClose?: boolean;
  executionPrice: number;
  historyIndex: number;
  turn: number;
};

type ChartSeries = StockState & {
  color: string;
  label: string;
  visibleHistory: number[];
  visibleStartIndex: number;
  offset: number;
  projectedPrice: number | null;
};

type ChartOrderMarkerViewModel = OrderMarker & {
  playerLabel: string;
  markerLabel: string;
  accentColor: string;
  badgeFill: string;
  badgeTextFill: string;
  isInteractive: boolean;
  pointX: number;
  pointY: number;
  currentPointX: number;
  currentPointY: number;
  stemY1: number;
  stemY2: number;
  badgeX: number;
  badgeY: number;
  badgeWidth: number;
  badgeHeight: number;
  textX: number;
  textY: number;
  arrowPoints: string;
};

type ChartPriceLabelViewModel = {
  key: StockKey;
  priceText: string;
  color: string;
  boxFill: string;
  pointX: number;
  pointY: number;
  connectorX1: number;
  connectorY1: number;
  connectorX2: number;
  connectorY2: number;
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  textX: number;
  textY: number;
};

type ChartProjectionViewModel = {
  key: StockKey;
  color: string;
  path: string;
  pointX: number;
  pointY: number;
  pointRadius: number;
  pathStrokeWidth: number;
  pathOpacity: number;
  haloRadius: number;
  rippleRadius: number;
  effectOpacity: number;
  intensity: number;
};

type SharedChartViewModel = {
  series: ChartSeries[];
  visibleCount: number;
  plotCount: number;
  ticks: number[];
  chartMin: number;
  chartMax: number;
  isPreviewZoomed: boolean;
  orderMarkers: ChartOrderMarkerViewModel[];
  projections: ChartProjectionViewModel[];
  priceLabels: ChartPriceLabelViewModel[];
};

type SelectedMarkerSummary = {
  id: string;
  label: string;
  entryPriceText: string;
  pnlText: string;
  pnlTone: 'positive' | 'negative' | 'flat';
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  labelX: number;
  labelY: number;
  priceX: number;
  priceY: number;
  pnlX: number;
  pnlY: number;
  connectorX1: number;
  connectorY1: number;
  connectorX2: number;
  connectorY2: number;
};

const props = defineProps<{
  stocks: StockState[];
  turn: number;
  projectedPrices?: Partial<Record<StockKey, number>> | null;
  orderMarkers?: OrderMarker[];
  interactivePlayerId?: PlayerId | null;
  resolvedAnimation?: {
    id: number;
    stocks: StockState[];
    projectedPrices: Partial<Record<StockKey, number>>;
  } | null;
  resolvedAnimationDurationMs?: number;
}>();

const emit = defineEmits<{
  (event: 'close-position', positionId: string): void;
}>();

const focusedSeriesKey = ref<StockKey | null>(null);
const selectedMarkerId = ref<string | null>(null);
const commitAnimationDurationMs = computed(() => props.resolvedAnimationDurationMs ?? 760);
const historySourceStocks = computed(() => props.resolvedAnimation?.stocks ?? props.stocks);
const historyVisibleCount = computed(() =>
  historySourceStocks.value.reduce((max, stock) => Math.max(max, stock.history.length, 1), 1),
);
const isCommitAnimationActive = computed(() => props.resolvedAnimation != null);

const viewWidth = 860;
const viewHeight = 254;
const padTop = 18;
const padRight = 136;
const padBottom = 22;
const padLeft = 42;
const chartWidth = viewWidth - padLeft - padRight;
const chartHeight = viewHeight - padTop - padBottom;
const labelBoxHeight = 22;
const labelBoxInset = 14;
const labelBoxWidth = 84;
const chartTickStep = 50000;
const previewZoomTargetRatio = 0.42;
const previewZoomMinRange = 60000;
const previewRecentPointCount = 3;

const chartOrder: StockKey[] = ['market', 'p1', 'p2'];

const colorMap: Record<StockKey, string> = {
  market: '#58d0ff',
  p1: '#6f8fff',
  p2: '#ff708b',
};

const labelMap: Record<StockKey, string> = {
  market: 'マーケット',
  p1: 'Player1',
  p2: 'Player2',
};

const playerLabelMap: Record<PlayerId, string> = {
  player1: 'P1',
  player2: 'P2',
};

const playerAccentMap: Record<PlayerId, string> = {
  player1: '#6f8fff',
  player2: '#ff708b',
};

const playerBadgeFillMap: Record<PlayerId, string> = {
  player1: 'rgba(10, 24, 54, 0.94)',
  player2: 'rgba(52, 12, 26, 0.94)',
};

const sideLabelMap: Record<OrderMarker['side'], string> = {
  buy: '買い',
  sell: '売り',
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(Math.round(value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function x(index: number, total: number): number {
  if (total <= 1) return padLeft;
  return padLeft + (chartWidth * index) / (total - 1);
}

function y(value: number, chart: Pick<SharedChartViewModel, 'chartMin' | 'chartMax'>): number {
  const range = Math.max(1, chart.chartMax - chart.chartMin);
  return padTop + chartHeight - ((value - chart.chartMin) / range) * chartHeight;
}

function buildTicks(chartMin: number, chartMax: number, step: number): number[] {
  const firstTick = Math.floor(chartMax / step) * step;
  const lastTick = Math.ceil(chartMin / step) * step;
  const ticks: number[] = [];
  for (let value = firstTick; value >= lastTick; value -= step) {
    ticks.push(value);
  }
  if (ticks.length === 0) {
    ticks.push(Math.round((chartMin + chartMax) / 2 / step) * step);
  }
  return ticks;
}

function resolveChartRange(
  series: ChartSeries[],
  hasProjectedMove: boolean,
): Pick<SharedChartViewModel, 'chartMin' | 'chartMax' | 'ticks' | 'isPreviewZoomed'> {
  const allValues = series.flatMap((item) =>
    item.projectedPrice != null
      ? [...item.visibleHistory, item.projectedPrice]
      : item.visibleHistory,
  );
  const allMin = Math.min(...allValues);
  const allMax = Math.max(...allValues);
  const allRange = Math.max(chartTickStep, allMax - allMin);
  const basePadding = Math.max(chartTickStep * 0.2, allRange * 0.18);
  const baseMin = allMin - basePadding;
  const baseMax = allMax + basePadding;

  if (!hasProjectedMove) {
    return {
      chartMin: baseMin,
      chartMax: baseMax,
      ticks: buildTicks(baseMin, baseMax, chartTickStep),
      isPreviewZoomed: false,
    };
  }

  const movingSeries = series.filter(
    (item) =>
      item.projectedPrice != null &&
      Math.round(item.projectedPrice) !== Math.round(item.currentPrice),
  );
  if (movingSeries.length === 0) {
    return {
      chartMin: baseMin,
      chartMax: baseMax,
      ticks: buildTicks(baseMin, baseMax, chartTickStep),
      isPreviewZoomed: false,
    };
  }

  const currentValues = movingSeries.map(
    (item) => item.visibleHistory[item.visibleHistory.length - 1] ?? item.currentPrice,
  );
  const projectedValues = movingSeries.map((item) => item.projectedPrice as number);
  const recentValues = movingSeries.flatMap((item) =>
    item.visibleHistory.slice(-previewRecentPointCount),
  );
  const maxProjectedDelta = Math.max(
    ...movingSeries.map((item) =>
      Math.abs(
        (item.projectedPrice as number) -
          (item.visibleHistory[item.visibleHistory.length - 1] ?? item.currentPrice),
      ),
    ),
  );
  const desiredRange = Math.max(previewZoomMinRange, maxProjectedDelta / previewZoomTargetRatio);
  const focusMin = Math.min(...currentValues, ...projectedValues);
  const focusMax = Math.max(...currentValues, ...projectedValues);
  const focusCenter = (focusMin + focusMax) / 2;
  let zoomMin = focusCenter - desiredRange / 2;
  let zoomMax = focusCenter + desiredRange / 2;
  const recentMin = Math.min(...recentValues);
  const recentMax = Math.max(...recentValues);
  const zoomPadding = Math.max(5000, desiredRange * 0.08);
  zoomMin = Math.min(zoomMin, recentMin - zoomPadding);
  zoomMax = Math.max(zoomMax, recentMax + zoomPadding);

  if (zoomMax - zoomMin >= baseMax - baseMin) {
    return {
      chartMin: baseMin,
      chartMax: baseMax,
      ticks: buildTicks(baseMin, baseMax, chartTickStep),
      isPreviewZoomed: false,
    };
  }

  return {
    chartMin: zoomMin,
    chartMax: zoomMax,
    ticks: buildTicks(zoomMin, zoomMax, chartTickStep),
    isPreviewZoomed: true,
  };
}

function buildSharedSeries(): ChartSeries[] {
  const sourceStocks = historySourceStocks.value;
  const sourceProjectedPrices = props.resolvedAnimation?.projectedPrices ?? props.projectedPrices;
  const visibleCount = historyVisibleCount.value;

  return chartOrder.map((key) => {
    const stock = sourceStocks.find((item) => item.key === key);
    if (!stock) {
      throw new Error(`Stock not found: ${key}`);
    }

    const visibleHistory = stock.history.slice(-visibleCount);
    const visibleCurrentPrice = visibleHistory[visibleHistory.length - 1] ?? stock.currentPrice;
    const visiblePreviousPrice = visibleHistory[visibleHistory.length - 2] ?? stock.previousPrice;

    return {
      ...stock,
      currentPrice: visibleCurrentPrice,
      previousPrice: visiblePreviousPrice,
      color: colorMap[key],
      label: labelMap[key],
      visibleHistory,
      visibleStartIndex: Math.max(0, stock.history.length - visibleHistory.length),
      offset: Math.max(0, visibleCount - visibleHistory.length),
      projectedPrice: sourceProjectedPrices?.[key] ?? null,
    };
  });
}

function buildLastPoint(
  series: ChartSeries,
  sharedChart: Pick<SharedChartViewModel, 'plotCount' | 'chartMin' | 'chartMax'>,
): { x: number; y: number; value: number } {
  const plotIndex = series.visibleHistory.length - 1 + series.offset;
  const lastValue = series.visibleHistory[series.visibleHistory.length - 1] ?? series.currentPrice;

  return {
    x: x(plotIndex, sharedChart.plotCount),
    y: y(lastValue, sharedChart),
    value: lastValue,
  };
}

function buildVisibleOrderMarkers(
  sharedChart: Pick<
    SharedChartViewModel,
    'series' | 'visibleCount' | 'plotCount' | 'chartMin' | 'chartMax'
  >,
): ChartOrderMarkerViewModel[] {
  const laneMap = new Map<string, number>();

  return (props.orderMarkers ?? [])
    .filter((marker) => sharedChart.series.some((series) => series.key === marker.stockKey))
    .filter((marker) => {
      const series = sharedChart.series.find((item) => item.key === marker.stockKey);
      if (!series) {
        return false;
      }

      return (
        marker.historyIndex >= series.visibleStartIndex &&
        marker.historyIndex < series.visibleStartIndex + series.visibleHistory.length
      );
    })
    .slice(-10)
    .map((marker) => {
      const series = sharedChart.series.find((item) => item.key === marker.stockKey);
      if (!series) {
        throw new Error(`Marker stock not found: ${marker.stockKey}`);
      }

      const localIndex = marker.historyIndex - series.visibleStartIndex + series.offset;
      const pointX = x(localIndex, sharedChart.plotCount);
      const pointY = y(marker.executionPrice, sharedChart);
      const currentPoint = buildLastPoint(series, sharedChart);
      const laneKey = `${localIndex}-${marker.side}`;
      const laneIndex = laneMap.get(laneKey) ?? 0;
      laneMap.set(laneKey, laneIndex + 1);
      const isPendingClose = marker.isPendingClose === true;

      const markerLabel = isPendingClose
        ? `${sideLabelMap[marker.side]} 保留`
        : sideLabelMap[marker.side];
      const badgeWidth = isPendingClose ? 108 : 84;
      const badgeHeight = isPendingClose ? 25 : 22;
      const offset = 24 + laneIndex * 20;
      const badgeY =
        marker.side === 'buy'
          ? clamp(pointY + offset, padTop + 4, padTop + chartHeight - badgeHeight - 4)
          : clamp(
              pointY - offset - badgeHeight,
              padTop + 4,
              padTop + chartHeight - badgeHeight - 4,
            );
      const badgeX = clamp(
        pointX - badgeWidth / 2,
        padLeft + 2,
        viewWidth - padRight - badgeWidth - 2,
      );
      const stemY1 = marker.side === 'buy' ? badgeY : badgeY + badgeHeight;
      const stemY2 = marker.side === 'buy' ? pointY + 10 : pointY - 10;
      const arrowPoints =
        marker.side === 'buy'
          ? `${pointX - 6.4},${pointY + 12} ${pointX + 6.4},${pointY + 12} ${pointX},${pointY + 3}`
          : `${pointX - 6.4},${pointY - 12} ${pointX + 6.4},${pointY - 12} ${pointX},${pointY - 3}`;

      return {
        ...marker,
        playerLabel: playerLabelMap[marker.playerId],
        markerLabel,
        accentColor: isPendingClose ? '#ffd166' : playerAccentMap[marker.playerId],
        badgeFill: isPendingClose ? 'rgba(77, 53, 6, 0.96)' : playerBadgeFillMap[marker.playerId],
        badgeTextFill: isPendingClose ? '#fff3c3' : '#f4f8ff',
        isInteractive: marker.positionId != null && marker.playerId === props.interactivePlayerId,
        pointX,
        pointY,
        currentPointX: currentPoint.x,
        currentPointY: currentPoint.y,
        stemY1,
        stemY2,
        badgeX,
        badgeY,
        badgeWidth,
        badgeHeight,
        textX: badgeX + badgeWidth / 2,
        textY: badgeY + badgeHeight / 2 + 2.75,
        arrowPoints,
      };
    });
}

function buildProjectionSegments(
  sharedChart: Pick<SharedChartViewModel, 'series' | 'plotCount' | 'chartMin' | 'chartMax'>,
): ChartProjectionViewModel[] {
  return sharedChart.series.flatMap((series) => {
    if (series.projectedPrice == null) {
      return [];
    }

    const currentPoint = buildLastPoint(series, sharedChart);
    const currentValue = Math.round(currentPoint.value);
    const projectedValue = Math.round(series.projectedPrice);
    if (currentValue === projectedValue) {
      return [];
    }

    const projectedIndex = series.visibleHistory.length + series.offset;
    const projectedPoint = {
      x: x(projectedIndex, sharedChart.plotCount),
      y: y(series.projectedPrice, sharedChart),
    };
    const moveAmount = Math.abs(projectedValue - currentValue);
    const intensity = clamp(Math.sqrt(moveAmount / chartTickStep), 0.72, 1.9);
    const pointRadius = 4.6 + intensity * 0.75;
    const pathStrokeWidth = 2.3 + intensity * 0.55;
    const pathOpacity = clamp(0.42 + intensity * 0.12, 0.42, 0.72);
    const haloRadius = pointRadius + 3 + intensity * 1.8;
    const rippleRadius = haloRadius + 5 + intensity * 2.4;
    const effectOpacity = clamp(0.36 + intensity * 0.16, 0.36, 0.72);

    return [
      {
        key: series.key,
        color: series.color,
        path: `M ${currentPoint.x} ${currentPoint.y} L ${projectedPoint.x} ${projectedPoint.y}`,
        pointX: projectedPoint.x,
        pointY: projectedPoint.y,
        pointRadius,
        pathStrokeWidth,
        pathOpacity,
        haloRadius,
        rippleRadius,
        effectOpacity,
        intensity,
      },
    ];
  });
}

function buildPriceLabels(
  sharedChart: Pick<SharedChartViewModel, 'series' | 'plotCount' | 'chartMin' | 'chartMax'>,
): ChartPriceLabelViewModel[] {
  const labelX = viewWidth - padRight + labelBoxInset;
  const minCenterY = padTop + labelBoxHeight / 2 + 4;
  const maxCenterY = padTop + chartHeight - labelBoxHeight / 2 - 4;
  const minGap = labelBoxHeight + 5;

  const anchors = sharedChart.series
    .map((series) => {
      const point = buildLastPoint(series, sharedChart);
      return {
        series,
        point,
        desiredCenterY: clamp(point.y, minCenterY, maxCenterY),
      };
    })
    .sort((left, right) => left.desiredCenterY - right.desiredCenterY);

  const adjustedCenters = anchors.map((anchor) => anchor.desiredCenterY);

  for (let index = 1; index < adjustedCenters.length; index += 1) {
    adjustedCenters[index] = Math.max(adjustedCenters[index], adjustedCenters[index - 1] + minGap);
  }

  if (adjustedCenters.length > 0 && adjustedCenters[adjustedCenters.length - 1] > maxCenterY) {
    adjustedCenters[adjustedCenters.length - 1] = maxCenterY;

    for (let index = adjustedCenters.length - 2; index >= 0; index -= 1) {
      adjustedCenters[index] = Math.min(
        adjustedCenters[index],
        adjustedCenters[index + 1] - minGap,
      );
    }
  }

  if (adjustedCenters.length > 0 && adjustedCenters[0] < minCenterY) {
    adjustedCenters[0] = minCenterY;

    for (let index = 1; index < adjustedCenters.length; index += 1) {
      adjustedCenters[index] = Math.max(
        adjustedCenters[index],
        adjustedCenters[index - 1] + minGap,
      );
    }
  }

  return anchors.map((anchor, index) => {
    const centerY = adjustedCenters[index];
    const boxY = centerY - labelBoxHeight / 2;

    return {
      key: anchor.series.key,
      priceText: `${formatPrice(anchor.point.value)}円`,
      color: anchor.series.color,
      boxFill: 'rgba(8, 18, 36, 0.94)',
      pointX: anchor.point.x,
      pointY: anchor.point.y,
      connectorX1: anchor.point.x + 8,
      connectorY1: anchor.point.y,
      connectorX2: labelX - 4,
      connectorY2: centerY,
      boxX: labelX,
      boxY,
      boxWidth: labelBoxWidth,
      boxHeight: labelBoxHeight,
      textX: labelX + 4,
      textY: centerY + 2.7,
    };
  });
}

const chart = computed<SharedChartViewModel>(() => {
  const series = buildSharedSeries();
  const visibleCount = Math.max(...series.map((item) => item.visibleHistory.length), 1);
  const hasProjectedMove = series.some(
    (item) =>
      item.projectedPrice != null &&
      Math.round(item.projectedPrice) !== Math.round(item.currentPrice),
  );
  const plotCount = visibleCount + (hasProjectedMove ? 1 : 0);
  const { chartMin, chartMax, ticks, isPreviewZoomed } = resolveChartRange(
    series,
    hasProjectedMove,
  );

  const baseChart = {
    series,
    visibleCount,
    plotCount,
    ticks,
    chartMin,
    chartMax,
    isPreviewZoomed,
    orderMarkers: [] as ChartOrderMarkerViewModel[],
    projections: [] as ChartProjectionViewModel[],
    priceLabels: [] as ChartPriceLabelViewModel[],
  };

  return {
    ...baseChart,
    orderMarkers: buildVisibleOrderMarkers(baseChart),
    projections: buildProjectionSegments(baseChart),
    priceLabels: buildPriceLabels(baseChart),
  };
});

function buildPath(series: ChartSeries): string {
  if (series.visibleHistory.length === 0) {
    return '';
  }

  return series.visibleHistory
    .map((value, index) => {
      const plotIndex = index + series.offset;
      return `${index === 0 ? 'M' : 'L'} ${x(plotIndex, chart.value.plotCount)} ${y(value, chart.value)}`;
    })
    .join(' ');
}

function buildCommitAnimationKey(projection: ChartProjectionViewModel): string {
  return `${props.resolvedAnimation?.id ?? 'idle'}-${projection.key}-${projection.path}-${projection.pointX}-${projection.pointY}`;
}

function buildProjectionAnimationKey(projection: ChartProjectionViewModel): string {
  return `${projection.key}-${projection.path}-${projection.pointX}-${projection.pointY}`;
}

function resolvePnlTone(value: number): SelectedMarkerSummary['pnlTone'] {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'flat';
}

function formatSignedPrice(value: number): string {
  const rounded = Math.round(value);
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${formatPrice(rounded)}円`;
}

function lastPoint(series: ChartSeries): { x: number; y: number } {
  const point = buildLastPoint(series, chart.value);

  return {
    x: point.x,
    y: point.y,
  };
}

function toggleSeriesFocus(key: StockKey): void {
  focusedSeriesKey.value = focusedSeriesKey.value === key ? null : key;
}

function isSeriesFocused(key: StockKey): boolean {
  return focusedSeriesKey.value === key;
}

function isSeriesDimmed(key: StockKey): boolean {
  return focusedSeriesKey.value !== null && focusedSeriesKey.value !== key;
}

function handleOrderMarkerClick(marker: ChartOrderMarkerViewModel): void {
  if (!marker.isInteractive || !marker.positionId) {
    return;
  }

  selectedMarkerId.value = selectedMarkerId.value === marker.id ? null : marker.id;
  emit('close-position', marker.positionId);
}

function handleDocumentClick(event: MouseEvent): void {
  if (!selectedMarkerId.value) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    selectedMarkerId.value = null;
    return;
  }

  const markerElement = target.closest<HTMLElement>('[data-order-marker]');
  if (markerElement?.getAttribute('data-order-marker') === selectedMarkerId.value) {
    return;
  }

  selectedMarkerId.value = null;
}

const selectedMarkerSummary = computed<SelectedMarkerSummary | null>(() => {
  const selectedMarker =
    chart.value.orderMarkers.find((marker) => marker.id === selectedMarkerId.value) ?? null;

  if (!selectedMarker) {
    return null;
  }

  const pnl = selectedMarker.pnl ?? 0;
  const boxWidth = 208;
  const boxHeight = 64;
  const minX = padLeft + 4;
  const maxX = viewWidth - padRight - boxWidth - 4;
  const boxX = clamp(
    selectedMarker.badgeX + selectedMarker.badgeWidth / 2 - boxWidth / 2,
    minX,
    maxX,
  );
  const boxY = clamp(
    selectedMarker.badgeY + selectedMarker.badgeHeight + 10,
    padTop + 4,
    padTop + chartHeight - boxHeight - 4,
  );
  return {
    id: selectedMarker.id,
    label: `${selectedMarker.playerLabel} ${selectedMarker.markerLabel}`,
    entryPriceText: `${formatPrice(selectedMarker.executionPrice)}円`,
    pnlText: formatSignedPrice(pnl),
    pnlTone: resolvePnlTone(pnl),
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    labelX: boxX + 14,
    labelY: boxY + 18,
    priceX: boxX + 14,
    priceY: boxY + 38,
    pnlX: boxX + 14,
    pnlY: boxY + 54,
    connectorX1: selectedMarker.badgeX + selectedMarker.badgeWidth / 2,
    connectorY1: selectedMarker.badgeY + selectedMarker.badgeHeight,
    connectorX2: boxX + boxWidth / 2,
    connectorY2: boxY,
  };
});

watch(
  () => chart.value.orderMarkers,
  (markers) => {
    if (markers.some((marker) => marker.id === selectedMarkerId.value)) {
      return;
    }

    selectedMarkerId.value = null;
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <section class="board-wrap">
    <header class="board-head">
      <div class="title-copy">
        <div class="board-title">価格ボード</div>
      </div>
      <div class="turn-chip">T{{ turn }}</div>
    </header>

    <div class="quote-pills">
      <button
        v-for="series in chart.series"
        :key="series.key"
        type="button"
        class="quote-pill"
        :class="{
          'is-focused': isSeriesFocused(series.key),
          'is-dimmed': isSeriesDimmed(series.key),
        }"
        :style="{ '--line-color': series.color }"
        :aria-pressed="isSeriesFocused(series.key) ? 'true' : 'false'"
        :aria-label="`${series.label} ${formatPrice(series.currentPrice)}円`"
        :title="series.label"
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

    <article
      class="shared-chart"
      :data-preview-zoom="chart.isPreviewZoomed ? 'true' : 'false'"
      :data-commit-animation="isCommitAnimationActive ? 'true' : 'false'"
    >
      <div
        class="shared-chart__backdrop"
        :style="{ '--chart-backdrop-image': `url(${chartBackdrop})` }"
        data-chart-backdrop
        aria-hidden="true"
      ></div>
      <div class="shared-chart__head">
        <div class="shared-chart__legend">
          <button
            v-for="series in chart.series"
            :key="`${series.key}-legend`"
            type="button"
            class="legend-chip"
            :class="{
              'is-focused': isSeriesFocused(series.key),
              'is-dimmed': isSeriesDimmed(series.key),
            }"
            :style="{ '--legend-color': series.color }"
            :aria-pressed="isSeriesFocused(series.key) ? 'true' : 'false'"
            :aria-label="series.label"
            :title="series.label"
            :data-legend-toggle="series.key"
            @click="toggleSeriesFocus(series.key)"
          >
            <span class="legend-chip__dot"></span>
            <span class="legend-chip__label">{{ series.label }}</span>
          </button>
        </div>
      </div>

      <svg
        :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
        preserveAspectRatio="none"
        class="chart-svg"
        :style="{ '--chart-commit-duration': `${commitAnimationDurationMs}ms` }"
      >
        <rect
          :x="padLeft"
          :y="padTop"
          :width="chartWidth"
          :height="chartHeight"
          class="plot-frame"
        />

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
          :class="{
            'is-focused': isSeriesFocused(series.key),
            'is-dimmed': isSeriesDimmed(series.key),
          }"
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
          :key="buildProjectionAnimationKey(projection)"
          class="chart-projection"
          :class="{
            'is-dimmed': isSeriesDimmed(projection.key),
            'is-focused': isSeriesFocused(projection.key),
          }"
          :data-series-projection="projection.key"
        >
          <path
            class="chart-projection__path"
            :d="projection.path"
            :stroke="projection.color"
            :stroke-width="projection.pathStrokeWidth"
            :opacity="projection.pathOpacity"
            pathLength="100"
          />
          <circle
            class="chart-projection__halo"
            :cx="projection.pointX"
            :cy="projection.pointY"
            :r="projection.haloRadius"
            :fill="projection.color"
            :opacity="projection.effectOpacity * 0.22"
          />
          <circle
            class="chart-projection__ripple"
            :cx="projection.pointX"
            :cy="projection.pointY"
            :r="projection.rippleRadius"
            :stroke="projection.color"
            :style="{
              '--projection-ripple-scale': `${1 + projection.intensity * 0.32}`,
              '--projection-ripple-opacity': `${projection.effectOpacity}`,
              '--projection-ripple-duration': `${Math.max(0.84, 1.2 - projection.intensity * 0.12)}s`,
            }"
          />
          <circle
            class="chart-projection__point"
            :cx="projection.pointX"
            :cy="projection.pointY"
            :r="projection.pointRadius"
            :fill="projection.color"
          />
        </g>

        <g
          v-for="projection in chart.projections"
          v-if="isCommitAnimationActive"
          :key="buildCommitAnimationKey(projection)"
          class="chart-commit"
          :class="{
            'is-dimmed': isSeriesDimmed(projection.key),
            'is-focused': isSeriesFocused(projection.key),
          }"
          :data-commit-line="projection.key"
        >
          <path
            class="chart-commit__under"
            :d="projection.path"
            :stroke="projection.color"
            pathLength="100"
          />
          <path
            class="chart-commit__main"
            :d="projection.path"
            :stroke="projection.color"
            pathLength="100"
          />
          <path
            class="chart-commit__highlight"
            :d="projection.path"
            :stroke="projection.color"
            pathLength="100"
          />
          <circle
            class="chart-commit__point"
            :cx="projection.pointX"
            :cy="projection.pointY"
            :r="projection.pointRadius"
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
            { 'is-pending-close': marker.isPendingClose === true },
            { 'is-interactive': marker.isInteractive },
            { 'is-dimmed': isSeriesDimmed(marker.stockKey) },
          ]"
          :data-order-marker="marker.id"
          :data-player-marker="marker.playerLabel"
          :data-side="marker.side"
          :data-pending-close="marker.isPendingClose === true ? 'true' : 'false'"
          :data-marker-clickable="marker.isInteractive ? 'true' : 'false'"
          focusable="false"
          @click="handleOrderMarkerClick(marker)"
        >
          <line
            class="order-marker__stem"
            :x1="marker.pointX"
            :x2="marker.pointX"
            :y1="marker.stemY1"
            :y2="marker.stemY2"
            :stroke="marker.accentColor"
            focusable="false"
          />
          <circle
            v-if="marker.isPendingClose"
            class="order-marker__pending-ring-mover"
            :cx="marker.pointX"
            :cy="marker.pointY"
            r="12.4"
            :stroke="marker.accentColor"
            focusable="false"
          >
            <animate
              attributeName="cx"
              :values="`${marker.pointX};${marker.currentPointX};${marker.pointX}`"
              dur="1.45s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              :values="`${marker.pointY};${marker.currentPointY};${marker.pointY}`"
              dur="1.45s"
              repeatCount="indefinite"
            />
          </circle>
          <polygon
            class="order-marker__arrow"
            :points="marker.arrowPoints"
            :fill="marker.accentColor"
            focusable="false"
          />
          <circle
            class="order-marker__point"
            :cx="marker.pointX"
            :cy="marker.pointY"
            r="6.1"
            :fill="marker.accentColor"
            focusable="false"
          />
          <rect
            v-if="marker.isInteractive"
            class="order-marker__hitbox"
            :x="marker.badgeX - 3"
            :y="marker.badgeY - 3"
            :width="marker.badgeWidth + 6"
            :height="marker.badgeHeight + 6"
            rx="8"
            focusable="false"
            @click.stop="handleOrderMarkerClick(marker)"
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
            focusable="false"
            @click.stop="handleOrderMarkerClick(marker)"
          />
          <text
            class="order-marker__text"
            :x="marker.textX"
            :y="marker.textY"
            :fill="marker.badgeTextFill"
            focusable="false"
            @click.stop="handleOrderMarkerClick(marker)"
          >
            {{ marker.playerLabel }} {{ marker.markerLabel }}
          </text>
        </g>

        <g
          v-if="selectedMarkerSummary"
          class="marker-detail"
          :data-selected-marker-summary="selectedMarkerSummary.id"
        >
          <line
            class="marker-detail__connector"
            :x1="selectedMarkerSummary.connectorX1"
            :y1="selectedMarkerSummary.connectorY1"
            :x2="selectedMarkerSummary.connectorX2"
            :y2="selectedMarkerSummary.connectorY2"
          />
          <rect
            class="marker-detail__box"
            :x="selectedMarkerSummary.boxX"
            :y="selectedMarkerSummary.boxY"
            :width="selectedMarkerSummary.boxWidth"
            :height="selectedMarkerSummary.boxHeight"
            rx="8"
          />
          <text
            class="marker-detail__label"
            :x="selectedMarkerSummary.labelX"
            :y="selectedMarkerSummary.labelY"
          >
            {{ selectedMarkerSummary.label }}
          </text>
          <text
            class="marker-detail__meta"
            :x="selectedMarkerSummary.priceX"
            :y="selectedMarkerSummary.priceY"
          >
            注文価格 {{ selectedMarkerSummary.entryPriceText }}
          </text>
          <text
            class="marker-detail__meta"
            :class="`is-${selectedMarkerSummary.pnlTone}`"
            :x="selectedMarkerSummary.pnlX"
            :y="selectedMarkerSummary.pnlY"
          >
            損益 {{ selectedMarkerSummary.pnlText }}
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
            {{ priceLabel.priceText }}
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
  font-size: 7px;
  font-weight: 800;
  white-space: nowrap;
}

.quote-values {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  margin-left: auto;
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
  position: relative;
  isolation: isolate;
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
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.shared-chart[data-preview-zoom='true'] {
  border-color: rgba(123, 168, 255, 0.2);
  box-shadow:
    inset 0 0 0 1px rgba(111, 143, 255, 0.08),
    0 14px 28px rgba(0, 0, 0, 0.18);
}

.shared-chart__backdrop {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(3, 9, 24, 0.28) 0%, rgba(3, 9, 24, 0.54) 100%),
    radial-gradient(circle at center, rgba(8, 17, 38, 0.1), rgba(3, 8, 21, 0.4) 72%),
    var(--chart-backdrop-image) center / cover no-repeat;
  filter: saturate(0.9) brightness(0.9);
  transform: scale(1.02);
  transform-origin: center;
}

.shared-chart__head {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.legend-chip__label {
  color: #dfe8ff;
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
}

.chart-svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
}

.plot-frame {
  fill: rgba(255, 255, 255, 0.01);
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
  transition:
    stroke 0.2s ease,
    fill 0.2s ease;
  opacity: 0.1;
}

.shared-chart[data-preview-zoom='true'] .plot-frame {
  fill: rgba(111, 143, 255, 0.024);
  stroke: rgba(146, 176, 255, 0.12);
}

.grid-line {
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
  transition:
    stroke 0.2s ease,
    opacity 0.2s ease;
}

.shared-chart[data-preview-zoom='true'] .grid-line {
  stroke: rgba(149, 177, 255, 0.08);
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
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.14));
  transition:
    stroke-width 0.18s ease,
    opacity 0.18s ease;
  stroke-dasharray: 8 5;
  animation: projection-drift 1.25s ease-in-out infinite;
}

.chart-projection__halo {
  transform-box: fill-box;
  transform-origin: center;
  filter: blur(1.5px);
  animation: projection-halo-pulse 0.95s ease-in-out infinite;
}

.chart-projection__ripple {
  fill: none;
  stroke-width: 1.5;
  opacity: calc(var(--projection-ripple-opacity, 0.5) * 0.54);
  transform-box: fill-box;
  transform-origin: center;
  animation: projection-ripple var(--projection-ripple-duration, 1.05s) ease-out infinite;
}

.chart-projection__point {
  stroke: rgba(0, 10, 26, 0.72);
  stroke-width: 1.2;
  opacity: 0.42;
  transform-box: fill-box;
  transform-origin: center;
  filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.26));
  animation: projection-point-pulse 0.88s ease-in-out infinite;
}

.chart-projection.is-focused .chart-projection__path {
  opacity: 0.84;
}

.chart-projection.is-focused .chart-projection__halo,
.chart-projection.is-focused .chart-projection__point,
.chart-projection.is-focused .chart-projection__ripple {
  opacity: 0.9;
}

.chart-commit {
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.chart-commit.is-dimmed {
  opacity: 0.2;
}

.chart-commit__under,
.chart-commit__main,
.chart-commit__highlight {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: chart-commit-draw var(--chart-commit-duration, 760ms) linear both;
}

.chart-commit__under {
  stroke-width: 6.4;
  opacity: 0.24;
}

.chart-commit__main {
  stroke-width: 3.2;
  filter: drop-shadow(0 0 12px rgba(90, 144, 255, 0.18));
}

.chart-commit__highlight {
  stroke-width: 0.95;
  opacity: 0.2;
}

.chart-commit__point {
  stroke: rgba(0, 10, 26, 0.98);
  stroke-width: 1.6;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.22));
  animation: chart-commit-point-in 0.22s ease-out calc(var(--chart-commit-duration, 760ms) - 120ms)
    both;
}

.chart-commit.is-focused .chart-commit__main {
  stroke-width: 4.2;
}

.chart-commit.is-focused .chart-commit__under {
  opacity: 0.3;
}

.order-marker {
  pointer-events: none;
}

.order-marker.is-interactive {
  pointer-events: auto;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.order-marker.is-interactive,
.order-marker.is-interactive *,
.order-marker.is-interactive *:focus,
.order-marker.is-interactive *:focus-visible {
  outline: none;
}

.order-marker.is-interactive .order-marker__stem,
.order-marker.is-interactive .order-marker__arrow,
.order-marker.is-interactive .order-marker__point,
.order-marker.is-interactive .order-marker__pending-ring-mover,
.order-marker.is-interactive .order-marker__badge,
.order-marker.is-interactive .order-marker__text {
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

.order-marker__pending-ring-mover {
  fill: none;
  stroke-width: 2.5;
  opacity: 0.94;
  stroke-dasharray: 5 3.2;
  filter: drop-shadow(0 0 16px rgba(255, 209, 102, 0.36));
}

.order-marker__point {
  stroke: rgba(0, 10, 26, 0.98);
  stroke-width: 2.15;
  filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.22));
}

.order-marker__hitbox {
  fill: rgba(255, 255, 255, 0.001);
  pointer-events: all;
}

.order-marker__badge {
  stroke-width: 1.4;
  filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.36));
}

.order-marker__text {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 7.8px;
  font-weight: 900;
  text-anchor: middle;
  letter-spacing: 0.01em;
}

.order-marker.is-pending-close .order-marker__stem,
.order-marker.is-pending-close .order-marker__arrow,
.order-marker.is-pending-close .order-marker__point {
  filter: drop-shadow(0 0 14px rgba(255, 209, 102, 0.32));
}

.price-tag {
  pointer-events: none;
}

.marker-detail {
  pointer-events: none;
}

.marker-detail__connector {
  stroke: rgba(223, 232, 255, 0.56);
  stroke-width: 1.35;
  stroke-dasharray: 4.2 2.8;
}

.marker-detail__box {
  fill: rgba(4, 10, 22, 0.96);
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 1.15;
  filter: drop-shadow(0 16px 26px rgba(0, 0, 0, 0.38));
}

.marker-detail__label {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 9.8px;
  font-weight: 900;
  fill: #f4f8ff;
  letter-spacing: 0.01em;
}

.marker-detail__meta {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 8.7px;
  font-weight: 900;
  fill: rgba(226, 235, 255, 0.92);
  letter-spacing: 0.008em;
}

.marker-detail__meta.is-positive {
  fill: #8bf5b5;
}

.marker-detail__meta.is-negative {
  fill: #ff9aaa;
}

.marker-detail__meta.is-flat {
  fill: #d7e4ff;
}

.price-tag__connector {
  stroke-width: 1.4;
  opacity: 0.96;
}

.price-tag__box {
  stroke-width: 1.2;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.3));
}

.price-tag__text {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 7.9px;
  font-weight: 900;
  fill: #f4f8ff;
  letter-spacing: 0;
}

@keyframes projection-drift {
  0%,
  100% {
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dashoffset: -5;
  }
}

@keyframes projection-halo-pulse {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.94);
  }

  50% {
    opacity: 0.48;
    transform: scale(1.05);
  }
}

@keyframes projection-point-pulse {
  0%,
  100% {
    opacity: 0.52;
    transform: scale(0.96);
  }

  50% {
    opacity: 0.92;
    transform: scale(1.08);
  }
}

@keyframes projection-ripple {
  0% {
    opacity: calc(var(--projection-ripple-opacity, 0.5) * 0.64);
    transform: scale(0.8);
  }

  100% {
    opacity: 0;
    transform: scale(var(--projection-ripple-scale, 1.32));
  }
}

@keyframes chart-commit-draw {
  0% {
    stroke-dashoffset: 100;
  }

  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes chart-commit-point-in {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chart-projection__path,
  .chart-projection__halo,
  .chart-projection__point,
  .chart-projection__ripple,
  .chart-commit__under,
  .chart-commit__main,
  .chart-commit__highlight,
  .chart-commit__point {
    animation: none;
  }
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
