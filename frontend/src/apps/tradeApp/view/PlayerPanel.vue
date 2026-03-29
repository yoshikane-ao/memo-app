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
    <aside class="player-panel" :class="{ active: isActive }">
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
    height: 100%;
    min-height: 0;
    min-width: 0;
    border-radius: 16px;
    border: 1px solid rgba(120, 156, 228, 0.14);
    background:
        linear-gradient(180deg, rgba(2, 10, 28, 0.96) 0%, rgba(2, 8, 22, 0.92) 100%),
        radial-gradient(circle at top, rgba(78, 131, 255, 0.06), transparent 42%);
    padding: 6px;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    gap: 5px;
    overflow: hidden;
}

.player-panel.active {
    border-color: rgba(99, 163, 255, 0.4);
    box-shadow: inset 0 0 18px rgba(83, 128, 255, 0.06);
}
.panel-head { display: flex; justify-content: space-between; align-items: center; gap: 5px; }
.player-name { color: #f4f8ff; font-size: 11px; font-weight: 800; line-height: 1.05; }
.turn-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, 0.16); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1); flex: 0 0 auto; }
.turn-dot.active { background: #63a3ff; box-shadow: 0 0 10px rgba(99, 163, 255, 0.5); }
.summary-grid { display: grid; grid-template-columns: 1fr; gap: 4px; }
.metric-card, .positions-details { border-radius: 10px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); }
.metric-card { padding: 5px 6px 4px; display: grid; gap: 1px; }
.metric-label, .sub-label { color: rgba(193, 214, 255, 0.7); font-size: 8px; line-height: 1; }
.metric-value { color: #f7fbff; font-size: 11px; font-weight: 800; line-height: 1.08; }
.metric-value.positive, .sub-value.positive { color: #79d3a6; }
.metric-value.negative, .sub-value.negative { color: #ff8a8a; }
.metric-value.flat, .sub-value.flat { color: #c8d7f2; }
.positions-details {
    min-height: 0;
    padding: 0 6px 6px;
    overflow: hidden;
}
.positions-details[open] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
}
.positions-details summary { cursor: pointer; list-style: none; color: #edf4ff; font-size: 9px; font-weight: 800; padding: 6px 0; }
.positions-details summary::-webkit-details-marker { display: none; }
.positions-list {
    min-height: 0;
    display: grid;
    gap: 5px;
    overflow: auto;
    padding-right: 2px;
}
.position-card { border-radius: 8px; padding: 5px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.04); display: grid; gap: 4px; }
.position-top { display: flex; justify-content: space-between; align-items: center; gap: 4px; }
.position-label, .position-qty { color: #eef5ff; font-size: 8px; font-weight: 800; }
.position-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
.sub-value { color: #f7fbff; font-size: 9px; font-weight: 800; line-height: 1.15; }
</style>
