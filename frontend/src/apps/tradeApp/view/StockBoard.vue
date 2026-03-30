<script setup lang="ts">
import { computed } from 'vue'
import type { StockKey, StockState } from '../api/types/game'

const props = defineProps<{
    stocks: StockState[]
    turn: number
    cpuParticipantCount: number
    cpuInvestmentTotal: number
    cpuWithdrawalCount: number
}>()

const viewWidth = 860
const viewHeight = 280
const padTop = 16
const padRight = 72
const padBottom = 24
const padLeft = 18
const chartWidth = viewWidth - padLeft - padRight
const chartHeight = viewHeight - padTop - padBottom

const colorMap: Record<StockKey, string> = {
    market: '#49c6ff',
    p1: '#5b86ff',
    p2: '#ff667a',
}

const labelMap: Record<StockKey, string> = {
    market: '市場株',
    p1: 'P1株',
    p2: 'P2株',
}

const series = computed(() =>
    props.stocks.map((stock) => ({
        ...stock,
        visibleHistory: stock.history.slice(-12),
        color: colorMap[stock.key],
        shortLabel: labelMap[stock.key],
    })),
)

const turnLabels = computed(() => {
    const count = Math.max(...series.value.map((stock) => stock.visibleHistory.length), 0)
    return Array.from({ length: count }, (_, index) => index + 1)
})

const allValues = computed(() => series.value.flatMap((stock) => stock.visibleHistory))

function niceStep(rawStep: number): number {
    const power = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))))
    const normalized = rawStep / power

    if (normalized <= 1) return power
    if (normalized <= 2) return 2 * power
    if (normalized <= 5) return 5 * power
    return 10 * power
}

const tickValues = computed(() => {
    const values = allValues.value
    if (values.length === 0) return [0, 100, 200, 300, 400]

    const min = Math.min(...values)
    const max = Math.max(...values)
    const spread = Math.max(12, max - min)
    const step = niceStep(spread / 5)
    const start = Math.floor((min - step * 0.5) / step) * step
    const end = Math.ceil((max + step * 0.5) / step) * step

    const ticks: number[] = []
    for (let value = start; value <= end; value += step) {
        ticks.push(value)
    }
    return ticks
})

const minTick = computed(() => tickValues.value[0] ?? 0)
const maxTick = computed(() => tickValues.value[tickValues.value.length - 1] ?? 100)

function formatPrice(value: number): string {
    return new Intl.NumberFormat('ja-JP').format(Math.round(value))
}

function x(index: number, total: number): number {
    if (total <= 1) return padLeft
    return padLeft + (chartWidth * index) / (total - 1)
}

function y(value: number): number {
    const range = Math.max(1, maxTick.value - minTick.value)
    return padTop + chartHeight - ((value - minTick.value) / range) * chartHeight
}

function buildPath(values: number[]): string {
    if (values.length === 0) return ''

    return values
        .map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index, values.length)} ${y(value)}`)
        .join(' ')
}

function lastX(values: number[]): number {
    return x(values.length - 1, values.length)
}

function lastY(values: number[]): number {
    return y(values[values.length - 1] ?? 0)
}

type EndBadge = {
    key: StockKey
    color: string
    value: number
    rawY: number
    endX: number
    displayY: number
}

const endBadges = computed<EndBadge[]>(() => {
    const badges = series.value
        .map((stock) => ({
            key: stock.key,
            color: stock.color,
            value: stock.visibleHistory[stock.visibleHistory.length - 1] ?? 0,
            rawY: lastY(stock.visibleHistory),
            endX: lastX(stock.visibleHistory),
            displayY: lastY(stock.visibleHistory),
        }))
        .sort((a, b) => a.rawY - b.rawY)

    const minGap = 18
    const topLimit = padTop + 8
    const bottomLimit = padTop + chartHeight - 8

    for (let index = 0; index < badges.length; index += 1) {
        const previous = badges[index - 1]
        const current = badges[index]
        current.displayY = Math.max(topLimit, Math.min(bottomLimit, current.rawY))

        if (previous && current.displayY < previous.displayY + minGap) {
            current.displayY = previous.displayY + minGap
        }
    }

    for (let index = badges.length - 2; index >= 0; index -= 1) {
        const current = badges[index]
        const next = badges[index + 1]

        if (current.displayY > next.displayY - minGap) {
            current.displayY = next.displayY - minGap
        }

        current.displayY = Math.max(topLimit, Math.min(bottomLimit, current.displayY))
    }

    return badges
})
</script>

<template>
    <section class="board-wrap">
        <div class="board-head">
            <div class="title-block">
                <div class="board-title">推移</div>
                <div class="turn-chip">T{{ turn }}</div>
            </div>

            <div class="quote-pills">
                <div v-for="stock in series" :key="stock.key" class="quote-pill" :style="{ '--line-color': stock.color }">
                    <span class="quote-dot" :style="{ background: stock.color }"></span>
                    <span class="quote-name">{{ stock.shortLabel }}</span>
                    <strong>{{ formatPrice(stock.currentPrice) }}</strong>
                </div>

                <div class="quote-pill cpu-pill">
                    <span class="quote-name">市場参加CPU</span>
                    <strong>{{ cpuParticipantCount }}人</strong>
                </div>

                <div class="quote-pill cpu-pill">
                    <span class="quote-name">CPU投資総額</span>
                    <strong>{{ formatPrice(cpuInvestmentTotal) }}円</strong>
                </div>

                <div class="quote-pill cpu-pill">
                    <span class="quote-name">撤退CPU</span>
                    <strong>{{ cpuWithdrawalCount }}人</strong>
                </div>
            </div>
        </div>

        <div class="chart-shell">
            <svg :viewBox="`0 0 ${viewWidth} ${viewHeight}`" preserveAspectRatio="none" class="chart-svg">
                <defs>
                    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.8" flood-color="#80bfff" flood-opacity="0.18" />
                    </filter>
                </defs>

                <g>
                    <line
                        v-for="tick in tickValues"
                        :key="`y-${tick}`"
                        class="grid-line"
                        :x1="padLeft"
                        :x2="viewWidth - padRight"
                        :y1="y(tick)"
                        :y2="y(tick)"
                    />

                    <line
                        v-for="label in turnLabels"
                        :key="`x-${label}`"
                        class="grid-line vertical"
                        :x1="x(label - 1, turnLabels.length)"
                        :x2="x(label - 1, turnLabels.length)"
                        :y1="padTop"
                        :y2="padTop + chartHeight"
                    />
                </g>

                <rect
                    :x="padLeft"
                    :y="padTop"
                    :width="chartWidth"
                    :height="chartHeight"
                    class="plot-frame"
                />

                <g>
                    <text
                        v-for="tick in tickValues"
                        :key="`tick-${tick}`"
                        class="price-label"
                        :x="viewWidth - 7"
                        :y="y(tick) + 3"
                        text-anchor="end"
                    >
                        {{ formatPrice(tick) }}
                    </text>

                    <text
                        v-for="label in turnLabels"
                        :key="`turn-${label}`"
                        class="turn-label"
                        :x="x(label - 1, turnLabels.length)"
                        :y="viewHeight - 7"
                        text-anchor="middle"
                    >
                        {{ label }}
                    </text>
                </g>

                <g v-for="stock in series" :key="stock.key">
                    <path
                        :d="buildPath(stock.visibleHistory)"
                        class="line-under"
                        :stroke="stock.color"
                        filter="url(#softShadow)"
                    />
                    <path :d="buildPath(stock.visibleHistory)" class="line-main" :stroke="stock.color" />
                    <path :d="buildPath(stock.visibleHistory)" class="line-highlight" />
                    <circle
                        :cx="lastX(stock.visibleHistory)"
                        :cy="lastY(stock.visibleHistory)"
                        r="3.1"
                        :fill="stock.color"
                        class="line-dot"
                    />
                </g>

                <g v-for="badge in endBadges" :key="`badge-${badge.key}`">
                    <line
                        class="badge-connector"
                        :x1="badge.endX"
                        :y1="badge.rawY"
                        :x2="viewWidth - padRight + 2"
                        :y2="badge.displayY"
                        :stroke="badge.color"
                    />
                    <rect
                        :x="viewWidth - padRight + 2"
                        :y="badge.displayY - 9"
                        width="58"
                        height="18"
                        rx="6"
                        class="badge-box"
                        :stroke="badge.color"
                    />
                    <text
                        :x="viewWidth - padRight + 31"
                        :y="badge.displayY + 3"
                        class="badge-value"
                        text-anchor="middle"
                        :fill="badge.color"
                    >
                        {{ formatPrice(badge.value) }}
                    </text>
                </g>
            </svg>
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
    padding: 6px 8px 8px;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 6px;
    overflow: hidden;
}

.board-wrap::before,
.board-wrap::after {
    content: '';
    position: absolute;
    inset: auto;
    pointer-events: none;
    z-index: 0;
}

.board-wrap::before {
    top: -20%;
    left: -6%;
    width: 34%;
    height: 60%;
    background: radial-gradient(circle, rgba(84, 132, 255, 0.26), transparent 70%);
    filter: blur(18px);
    animation: auraFloat 7s ease-in-out infinite;
}

.board-wrap::after {
    right: -8%;
    bottom: -18%;
    width: 28%;
    height: 54%;
    background: radial-gradient(circle, rgba(255, 102, 122, 0.18), transparent 72%);
    filter: blur(24px);
    animation: auraFloat 8s ease-in-out infinite reverse;
}

.board-head,
.chart-shell {
    position: relative;
    z-index: 1;
}

.board-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    min-height: 0;
}

.title-block {
    display: flex;
    align-items: center;
    gap: 6px;
}

.board-title {
    color: #f4f8ff;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.turn-chip {
    padding: 3px 7px;
    border-radius: 999px;
    border: 1px solid rgba(108, 155, 255, 0.3);
    background: linear-gradient(180deg, rgba(27, 49, 91, 0.9), rgba(11, 20, 43, 0.95));
    color: #c9d8ff;
    font-size: 8px;
    font-weight: 800;
    box-shadow: inset 0 0 10px rgba(88, 130, 255, 0.14);
}

.quote-pills {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.quote-pill {
    min-width: 86px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
    padding: 3px 7px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(18, 30, 58, 0.82), rgba(10, 18, 35, 0.92));
    border: 1px solid rgba(124, 150, 206, 0.2);
    color: #dfe8ff;
    font-size: 8px;
    line-height: 1;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.quote-pill:hover {
    transform: translateY(-1px);
}

.cpu-pill {
    min-width: 104px;
    background: linear-gradient(180deg, rgba(16, 37, 68, 0.92), rgba(8, 18, 37, 0.95));
    border-color: rgba(107, 179, 255, 0.28);
}

.quote-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    box-shadow: 0 0 12px color-mix(in srgb, var(--line-color) 72%, transparent);
    flex: 0 0 auto;
    animation: dotPulse 2.8s ease-in-out infinite;
}

.quote-name {
    color: #c4d7fb;
    white-space: nowrap;
}

.quote-pill strong {
    color: #f8fbff;
    font-size: 9px;
    font-weight: 900;
}

.chart-shell {
    position: relative;
    min-height: 0;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background:
        linear-gradient(180deg, rgba(2, 7, 18, 0.96) 0%, rgba(2, 8, 21, 0.92) 100%),
        linear-gradient(90deg, rgba(78, 120, 255, 0.06), transparent 32%, rgba(255, 102, 122, 0.05) 100%);
    padding: 4px;
    overflow: hidden;
}

.chart-shell::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.04) 48%, transparent 100%);
    transform: translateX(-100%);
    animation: chartSweep 6s linear infinite;
    pointer-events: none;
}

.chart-svg { width: 100%; height: 100%; display: block; }
.plot-frame { fill: rgba(255, 255, 255, 0.01); stroke: rgba(255, 255, 255, 0.05); stroke-width: 1; }
.grid-line { stroke: rgba(255, 255, 255, 0.06); stroke-width: 1; }
.grid-line.vertical { stroke-opacity: 0.36; }
.price-label, .turn-label, .badge-value { font-family: Inter, 'Segoe UI', sans-serif; }
.price-label { font-size: 9px; font-weight: 700; fill: #d9e5ff; }
.turn-label { font-size: 8px; font-weight: 700; fill: #b4c5e6; }
.line-under {
    fill: none;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.24;
    animation: linePulse 3.2s ease-in-out infinite;
}
.line-main {
    fill: none;
    stroke-width: 2.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 10px rgba(90, 144, 255, 0.18));
}
.line-highlight { fill: none; stroke: rgba(255, 255, 255, 0.22); stroke-width: 0.9; stroke-linecap: round; stroke-linejoin: round; opacity: 0.82; }
.line-dot { stroke: rgba(0, 10, 26, 0.98); stroke-width: 1.4; filter: drop-shadow(0 0 8px rgba(255,255,255,0.12)); }
.badge-connector { stroke-width: 1; stroke-dasharray: 3 3; opacity: 0.8; }
.badge-box { fill: rgba(5, 11, 26, 0.98); stroke-width: 1; }
.badge-value { font-size: 8.5px; font-weight: 900; letter-spacing: 0.01em; }

@keyframes dotPulse {
    0%, 100% { transform: scale(0.92); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
}

@keyframes linePulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.3; }
}

@keyframes chartSweep {
    0% { transform: translateX(-115%); }
    100% { transform: translateX(115%); }
}

@keyframes auraFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(10px) scale(1.04); }
}
</style>
