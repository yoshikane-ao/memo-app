<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState, StockKey, StockState } from '../api/types/game'
import { calculatePlayerSnapshot, formatCurrency, formatSignedCurrency } from '../api/utils/gameCalculations'

const props = defineProps<{
    player: PlayerState
    stocks: StockState[]
    isActive: boolean
    assetDiff: number
}>()

const snapshot = computed(() => calculatePlayerSnapshot(props.player, props.stocks))

function resolvePerspectiveLabel(stockKey: StockKey): string {
    if (stockKey === 'market') return '市場'

    const ownKey: StockKey = props.player.id === 'player1' ? 'p1' : 'p2'
    return stockKey === ownKey ? '自社' : '相手'
}

const positionRows = computed(() => {
    const orderedKeys: StockKey[] = ['market', props.player.id === 'player1' ? 'p1' : 'p2', props.player.id === 'player1' ? 'p2' : 'p1']

    return orderedKeys.map((key) => {
        const holding = props.player.holdings[key]
        const stock = props.stocks.find((item) => item.key === key)
        const currentPrice = stock?.currentPrice ?? 0
        const quantity = holding.quantity
        const costBasis = quantity > 0 ? holding.avgPrice * quantity : 0
        const pnl = quantity > 0 ? (currentPrice - holding.avgPrice) * quantity : 0

        return {
            key,
            label: resolvePerspectiveLabel(key),
            quantity,
            costBasis,
            pnl,
        }
    })
})

const totalUnrealized = computed(() => positionRows.value.reduce((sum, row) => sum + row.pnl, 0))
</script>

<template>
    <aside class="player-panel" :class="[player.id, { active: isActive }]">
        <div class="panel-head">
            <div class="player-name">{{ player.name }}</div>
            <div class="turn-dot" :class="{ active: isActive }"></div>
        </div>

        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-label">総資産</div>
                <div class="metric-value">{{ formatCurrency(snapshot.totalAssets) }}</div>
            </div>

            <div class="metric-card">
                <div class="metric-label">現金</div>
                <div class="metric-value">{{ formatCurrency(player.cash) }}</div>
            </div>

            <div class="metric-card diff-card">
                <div class="metric-label">相手との差</div>
                <div class="metric-value" :class="{
                    positive: assetDiff > 0,
                    negative: assetDiff < 0,
                    flat: assetDiff === 0,
                }">
                    {{ formatSignedCurrency(assetDiff) }}
                </div>
            </div>

            <div class="metric-card pnl-card">
                <div class="metric-label">合計損益</div>
                <div class="metric-value" :class="{
                    positive: totalUnrealized > 0,
                    negative: totalUnrealized < 0,
                    flat: totalUnrealized === 0,
                }">
                    {{ formatSignedCurrency(totalUnrealized) }}
                </div>
            </div>
        </div>

        <details class="positions-details">
            <summary>保有明細を表示</summary>

            <div class="positions-list">
                <article v-for="row in positionRows" :key="row.key" class="position-card">
                    <div class="position-top">
                        <span class="position-label">{{ row.label }}</span>
                        <span class="position-qty">{{ row.quantity }}株</span>
                    </div>

                    <div class="position-grid">
                        <div>
                            <div class="sub-label">取得額</div>
                            <div class="sub-value">{{ formatCurrency(row.costBasis) }}</div>
                        </div>
                        <div>
                            <div class="sub-label">含み</div>
                            <div class="sub-value" :class="{
                                positive: row.pnl > 0,
                                negative: row.pnl < 0,
                                flat: row.pnl === 0,
                            }">
                                {{ formatSignedCurrency(row.pnl) }}
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </details>
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
    padding: 7px;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    gap: 6px;
    overflow: hidden;
    transition:
        transform 0.22s ease,
        border-color 0.22s ease,
        box-shadow 0.22s ease;
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
    z-index: 0;
}

.player-panel.player2::before {
    background: radial-gradient(circle, rgba(255, 102, 122, 0.16), transparent 68%);
}

.player-panel > * {
    position: relative;
    z-index: 1;
}

.player-panel.player1 {
    border-color: rgba(101, 148, 255, 0.22);
}

.player-panel.player2 {
    border-color: rgba(255, 108, 128, 0.2);
}

.player-panel.active {
    transform: translateY(-1px);
    box-shadow:
        inset 0 0 24px rgba(83, 128, 255, 0.08),
        0 18px 42px rgba(0, 0, 0, 0.34);
}

.player-panel.player1.active {
    border-color: rgba(99, 163, 255, 0.54);
}

.player-panel.player2.active {
    border-color: rgba(255, 110, 138, 0.5);
}

.panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
}

.player-name {
    color: #f7fbff;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: 0.04em;
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
    animation: activePulse 2.4s ease-in-out infinite;
}

.player-panel.player2 .turn-dot.active {
    background: #ff6e8a;
    box-shadow: 0 0 12px rgba(255, 110, 138, 0.52);
}

.summary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 5px;
}

.metric-card,
.positions-details {
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.025));
    border: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(6px);
}

.metric-card {
    padding: 6px 7px 5px;
    display: grid;
    gap: 2px;
}

.diff-card {
    background: linear-gradient(180deg, rgba(92, 132, 255, 0.12), rgba(32, 45, 88, 0.18));
}

.pnl-card {
    background: linear-gradient(180deg, rgba(31, 106, 83, 0.16), rgba(11, 28, 28, 0.18));
}

.metric-label,
.sub-label {
    color: rgba(202, 220, 255, 0.72);
    font-size: 8px;
    line-height: 1;
    letter-spacing: 0.04em;
}

.metric-value {
    color: #f7fbff;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.08;
}

.metric-value.positive,
.sub-value.positive { color: #6fd6b3; }

.metric-value.negative,
.sub-value.negative { color: #ff7b8e; }

.metric-value.flat,
.sub-value.flat { color: #c8d7f2; }

.positions-details {
    min-height: 0;
    padding: 0 7px 7px;
    overflow: hidden;
}

.positions-details[open] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
}

.positions-details summary {
    cursor: pointer;
    list-style: none;
    color: #edf4ff;
    font-size: 9px;
    font-weight: 800;
    padding: 7px 0;
}

.positions-details summary::-webkit-details-marker { display: none; }

.positions-list {
    min-height: 0;
    display: grid;
    gap: 5px;
    overflow: auto;
    padding-right: 2px;
}

.position-card {
    border-radius: 10px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255,255,255,0.05);
    display: grid;
    gap: 4px;
}

.position-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
}

.position-label,
.position-qty {
    color: #eef5ff;
    font-size: 8px;
    font-weight: 900;
}

.position-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }

.sub-value {
    color: #f7fbff;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.15;
}

@keyframes activePulse {
    0%, 100% { transform: scale(0.92); opacity: 0.9; }
    50% { transform: scale(1.18); opacity: 1; }
}
</style>
