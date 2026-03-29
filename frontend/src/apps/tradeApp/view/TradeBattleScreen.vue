<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import StockBoard from './StockBoard.vue'
import PlayerPanel from './PlayerPanel.vue'
import ActionPanel from './ActionPanel.vue'
import ActionHistoryPanel from './ActionHistoryPanel.vue'

import { createInitialGameState } from '../api/data/mockGame'
import type {
    HoldingPosition,
    LogEntry,
    PlayerId,
    PlayerState,
    SpeculationPosition,
    StockKey,
    StockState,
    TurnActionPayload,
} from '../api/types/game'
import { COOLDOWN_ACTIONS, MODE_LABELS, STOCK_LABELS, TRADE_LABELS } from '../api/types/game'
import {
    calculatePlayerSnapshot,
    formatCurrency,
    formatSignedCurrency,
} from '../api/utils/gameCalculations'

import '../css/style.css'

const state = reactive(createInitialGameState())

const STARTING_CASH = 12000
const STARTING_COMPANY_FUNDS = 3000

type ActionTimelineEntry = {
    id: number
    turn: number
    playerId: 'player1' | 'player2'
    playerName: string
    kind: string
    summary: string
}

type TurnActionWithWait = TurnActionPayload & {
    metaAction?: 'wait'
}

const actionTimeline = ref<ActionTimelineEntry[]>([])

let logSequence = 1000

function resetBook(book: Record<string, HoldingPosition>): void {
    Object.values(book).forEach((position) => {
        position.quantity = 0
        position.avgPrice = 0
    })
}

function normalizePlayersForBattleStart(): void {
    state.players.forEach((player) => {
        player.cash = STARTING_CASH
        player.companyFunds = STARTING_COMPANY_FUNDS
        player.speculation = []
        player.marketBias = 0
        player.recentNetChange = 0
        player.recentCashChange = 0

        resetBook(player.holdings as Record<string, HoldingPosition>)
        resetBook(player.shorts as Record<string, HoldingPosition>)

        COOLDOWN_ACTIONS.forEach((action) => {
            player.cooldowns[action] = 0
        })

        player.lastSnapshotAssets = calculatePlayerSnapshot(player, state.stocks).totalAssets
        player.lastSnapshotCash = player.cash
    })
}

normalizePlayersForBattleStart()

const TOTAL_CPU = 100

const leftPlayer = computed(() => getPlayer('player1'))
const rightPlayer = computed(() => getPlayer('player2'))
const activePlayer = computed(() => getPlayer(state.currentPlayer))

const leftPlayerAssets = computed(() => calculatePlayerSnapshot(leftPlayer.value, state.stocks).totalAssets)
const rightPlayerAssets = computed(() => calculatePlayerSnapshot(rightPlayer.value, state.stocks).totalAssets)
const leftAssetDiff = computed(() => leftPlayerAssets.value - rightPlayerAssets.value)
const rightAssetDiff = computed(() => rightPlayerAssets.value - leftPlayerAssets.value)

function recentMomentum(stockKey: StockKey): number {
    const history = getStock(stockKey).history
    const last = history[history.length - 1] ?? 0
    const prev = history[history.length - 2] ?? last
    return last - prev
}

const cpuMarketStats = computed(() => {
    const conditionBase = state.marketCondition === 'bull'
        ? 78
        : state.marketCondition === 'bear'
            ? 46
            : 62

    const marketMomentum = recentMomentum('market')
    const p1Momentum = recentMomentum('p1')
    const p2Momentum = recentMomentum('p2')
    const volatility = Math.abs(marketMomentum) + Math.abs(p1Momentum) + Math.abs(p2Momentum)
    const averagePrice = Math.round(state.stocks.reduce((sum, stock) => sum + stock.currentPrice, 0) / Math.max(state.stocks.length, 1))

    const participantCount = Math.max(18, Math.min(100, conditionBase + Math.round((marketMomentum + p1Momentum + p2Momentum) / 3) + Math.round(volatility / 5)))
    const withdrawalCount = Math.max(0, TOTAL_CPU - participantCount)
    const investmentTotal = Math.max(0, Math.round(participantCount * (averagePrice * 15 + 120 + volatility * 8)))

    return {
        participantCount,
        withdrawalCount,
        investmentTotal,
    }
})

function getPlayer(playerId: PlayerId): PlayerState {
    const player = state.players.find((item) => item.id === playerId)
    if (!player) {
        throw new Error(`Player not found: ${playerId}`)
    }
    return player
}

function getStock(stockKey: StockKey): StockState {
    const stock = state.stocks.find((item) => item.key === stockKey)
    if (!stock) {
        throw new Error(`Stock not found: ${stockKey}`)
    }
    return stock
}

function ownStockKey(playerId: PlayerId): StockKey {
    return playerId === 'player1' ? 'p1' : 'p2'
}

function pushTimeline(player: PlayerState, payload: TurnActionWithWait): void {
    if (payload.metaAction === 'wait') {
        const waitEntry: ActionTimelineEntry = {
            id: logSequence += 1,
            turn: state.turn,
            playerId: player.id,
            playerName: player.name,
            kind: '待機',
            summary: '何も仕掛けず様子見',
        }

        actionTimeline.value.unshift(waitEntry)
        actionTimeline.value = actionTimeline.value.slice(0, 48)
        return
    }

    const isCompany = payload.companyAction !== 'なし'
    const selectedStock = getStock(payload.stockKey)
    const estimatedShares = Math.max(0, Math.floor(payload.quantity / Math.max(selectedStock.currentPrice, 1)))

    const entry: ActionTimelineEntry = {
        id: logSequence += 1,
        turn: state.turn,
        playerId: player.id,
        playerName: player.name,
        kind: isCompany ? '会社行動' : MODE_LABELS[payload.tradeMode],
        summary: isCompany
            ? `${payload.companyAction}`
            : `${STOCK_LABELS[payload.stockKey]} / ${TRADE_LABELS[payload.tradeAction]} / ${Math.max(0, Math.floor(payload.quantity)).toLocaleString()}円 / 約${estimatedShares}株`,
    }

    actionTimeline.value.unshift(entry)
    actionTimeline.value = actionTimeline.value.slice(0, 48)
}

function pushLog(
    logs: LogEntry[],
    type: LogEntry['type'],
    label: string,
    message: string,
    tone: LogEntry['tone'],
): void {
    logs.push({
        id: logSequence += 1,
        turn: state.turn,
        type,
        label,
        message,
        tone,
    })
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function addToPosition(position: HoldingPosition, quantity: number, price: number): void {
    const totalCost = position.avgPrice * position.quantity + price * quantity
    position.quantity += quantity
    position.avgPrice = position.quantity > 0 ? totalCost / position.quantity : 0
}

function reducePosition(
    position: HoldingPosition,
    quantity: number,
): { executed: number; avgPrice: number } {
    const executed = Math.min(position.quantity, quantity)
    const avgPrice = position.avgPrice

    position.quantity -= executed
    if (position.quantity <= 0) {
        position.quantity = 0
        position.avgPrice = 0
    }

    return { executed, avgPrice }
}

function moveStockPrice(stockKey: StockKey, rawDelta: number, logs: LogEntry[]): number {
    const stock = getStock(stockKey)
    const before = stock.currentPrice
    let next = Math.max(12, before + rawDelta)

    if (next >= stock.bubbleUpper) {
        next = Math.max(Math.floor(next / 2), stock.bubbleLower + 12)
        pushLog(
            logs,
            'system',
            'バブル',
            `${stock.name}がバブル上限に到達。価格が半減し ${formatCurrency(before)} → ${formatCurrency(next)}。`,
            'warn',
        )
    } else if (next <= stock.bubbleLower) {
        next = stock.bubbleLower + 16
        pushLog(
            logs,
            'system',
            '下限損失',
            `${stock.name}がバブル下限に接触。大損失処理が発生し ${formatCurrency(before)} → ${formatCurrency(next)}。`,
            'warn',
        )
    }

    stock.currentPrice = next
    stock.history = [...stock.history.slice(-11), next]
    return next - before
}

function applyCorrelation(sourceKey: StockKey, sourceDelta: number, logs: LogEntry[]): void {
    if ((sourceKey === 'p1' || sourceKey === 'p2') && sourceDelta > 0) {
        const pressure = -Math.max(2, Math.floor(sourceDelta / 2))
        moveStockPrice('market', pressure, logs)

        pushLog(
            logs,
            'market',
            '相関',
            `${STOCK_LABELS[sourceKey]}の上昇に引っ張られ、市場株へ下押し圧力が発生。`,
            'down',
        )
    }
}

function settleSpeculation(player: PlayerState, logs: LogEntry[]): void {
    const settled: SpeculationPosition[] = []
    const remaining: SpeculationPosition[] = []

    for (const position of player.speculation) {
        if (position.settlementTurn <= state.turn) {
            settled.push(position)
        } else {
            remaining.push(position)
        }
    }

    player.speculation = remaining

    for (const position of settled) {
        const currentPrice = getStock(position.stockKey).currentPrice
        const pnl =
            position.side === 'buy'
                ? (currentPrice - position.entryPrice) * position.quantity
                : (position.entryPrice - currentPrice) * position.quantity

        player.cash += pnl

        pushLog(
            logs,
            'system',
            '強制決済',
            `${player.name}の${STOCK_LABELS[position.stockKey]} ${position.side === 'buy' ? '買い投機' : '空売り投機'} ${position.quantity}株が決済。損益 ${formatSignedCurrency(pnl)}。`,
            pnl >= 0 ? 'up' : 'warn',
        )
    }
}

function resolveOrderQuantity(openPrice: number, rawAmount: number): number {
    const amount = Math.max(0, Math.floor(rawAmount))
    if (amount < openPrice) return 0
    return Math.floor(amount / openPrice)
}

function applyPlayerOrder(player: PlayerState, payload: TurnActionPayload, logs: LogEntry[]): void {
    const stock = getStock(payload.stockKey)
    const openPrice = stock.currentPrice
    const orderAmount = Math.max(0, Math.floor(payload.quantity))
    const quantity = resolveOrderQuantity(openPrice, orderAmount)

    if (quantity <= 0) {
        pushLog(
            logs,
            'system',
            '注文金額不足',
            `${player.name}の注文金額 ${formatCurrency(orderAmount)} では${stock.name}を1株も取引できません。`,
            'warn',
        )
        return
    }

    const baseImpact = Math.max(1, Math.round(quantity / 8))

    if (payload.tradeMode === 'speculation') {
        if (payload.tradeAction !== 'buy' && payload.tradeAction !== 'short') {
            pushLog(logs, 'system', '入力制限', '投機では「買う」または「空売り」のみ選択できます。', 'warn')
            return
        }

        player.speculation.push({
            stockKey: payload.stockKey,
            side: payload.tradeAction === 'buy' ? 'buy' : 'short',
            quantity,
            entryPrice: openPrice,
            settlementTurn: state.turn + 2,
        })

        if (payload.tradeAction === 'buy') {
            const delta = moveStockPrice(payload.stockKey, baseImpact, logs)
            pushLog(logs, 'player', '投機', `${player.name}が${stock.name}を投機買い。注文金額 ${formatCurrency(orderAmount)} / 約${quantity}株。`, 'up')
            applyCorrelation(payload.stockKey, delta, logs)
            return
        }

        stock.shortInterest += quantity
        const delta = moveStockPrice(payload.stockKey, -baseImpact, logs)
        pushLog(logs, 'player', '投機', `${player.name}が${stock.name}を投機空売り。注文金額 ${formatCurrency(orderAmount)} / 約${quantity}株。`, 'down')
        applyCorrelation(payload.stockKey, delta, logs)
        return
    }

    switch (payload.tradeAction) {
        case 'buy': {
            const cost = openPrice * quantity
            if (player.cash < cost) {
                pushLog(logs, 'system', '資金不足', `${player.name}は${stock.name}を${formatCurrency(orderAmount)}ぶん買うには現金が不足しています。`, 'warn')
                return
            }

            player.cash -= cost
            addToPosition(player.holdings[payload.stockKey], quantity, openPrice)

            const delta = moveStockPrice(payload.stockKey, baseImpact, logs)
            pushLog(logs, 'player', '注文', `${player.name}が${stock.name}を買い。注文金額 ${formatCurrency(cost)} / ${quantity}株。価格 ${formatCurrency(openPrice)} → ${formatCurrency(getStock(payload.stockKey).currentPrice)}。`, 'up')
            applyCorrelation(payload.stockKey, delta, logs)
            break
        }

        case 'sell': {
            const { executed } = reducePosition(player.holdings[payload.stockKey], quantity)
            if (executed <= 0) {
                pushLog(logs, 'system', '保有不足', `${player.name}は${stock.name}を売るだけの保有株がありません。`, 'warn')
                return
            }

            player.cash += openPrice * executed
            const impact = Math.max(1, Math.round(executed / 8))
            const delta = moveStockPrice(payload.stockKey, -impact, logs)

            pushLog(logs, 'player', '注文', `${player.name}が${stock.name}を売り。約${formatCurrency(openPrice * executed)} / ${executed}株。価格 ${formatCurrency(openPrice)} → ${formatCurrency(getStock(payload.stockKey).currentPrice)}。`, 'down')
            applyCorrelation(payload.stockKey, delta, logs)
            break
        }

        case 'short': {
            addToPosition(player.shorts[payload.stockKey], quantity, openPrice)
            stock.shortInterest += quantity

            const delta = moveStockPrice(payload.stockKey, -baseImpact, logs)
            pushLog(logs, 'player', '空売り', `${player.name}が${stock.name}を空売り。注文金額 ${formatCurrency(orderAmount)} / 約${quantity}株。`, 'down')
            applyCorrelation(payload.stockKey, delta, logs)
            break
        }

        case 'cover': {
            const shortPosition = player.shorts[payload.stockKey]
            if (shortPosition.quantity <= 0) {
                pushLog(logs, 'system', '建玉なし', `${player.name}は${stock.name}の空売り建玉を持っていません。`, 'warn')
                return
            }

            const { executed, avgPrice } = reducePosition(shortPosition, quantity)
            const realized = (avgPrice - openPrice) * executed
            player.cash += realized
            stock.shortInterest = Math.max(0, stock.shortInterest - executed)

            const impact = Math.max(1, Math.round(executed / 8))
            const delta = moveStockPrice(payload.stockKey, impact, logs)

            pushLog(logs, 'player', '買い戻し', `${player.name}が${stock.name}を買い戻し。約${formatCurrency(openPrice * executed)} / ${executed}株。実現損益 ${formatSignedCurrency(realized)}。`, realized >= 0 ? 'up' : 'warn')
            applyCorrelation(payload.stockKey, delta, logs)
            break
        }
    }
}

function applyCompanyAction(
    player: PlayerState,
    action: TurnActionPayload['companyAction'],
    logs: LogEntry[],
): void {
    if (action === 'なし') return

    if (player.cooldowns[action] > 0) {
        pushLog(logs, 'system', 'クールダウン', `${player.name}の${action}は、あと${player.cooldowns[action]}ターン使用できません。`, 'warn')
        return
    }

    if (action === '自社株買い') {
        pushLog(logs, 'system', '無効な会社行動', '自社株買いはこのルールでは使用しません。', 'warn')
        return
    }

    const stockKey = ownStockKey(player.id)

    switch (action) {
        case '増資': {
            player.companyFunds += 1500
            moveStockPrice(stockKey, -12, logs)
            player.cooldowns[action] = 3
            pushLog(logs, 'player', '会社', `${player.name}が増資を実施。会社資金 +${formatCurrency(1500)}、自社株には希薄化圧力。`, 'warn')
            break
        }

        case '配当': {
            const cost = 600
            if (player.companyFunds < cost) {
                pushLog(logs, 'system', '会社資金不足', `${player.name}は配当に必要な会社資金が不足しています。`, 'warn')
                return
            }

            player.companyFunds -= cost
            player.cash += 220
            const delta = moveStockPrice(stockKey, 6, logs)
            player.cooldowns[action] = 2
            pushLog(logs, 'player', '会社', `${player.name}が配当を実施。会社資金 -${formatCurrency(cost)}、個人現金 +${formatCurrency(220)}。`, 'up')
            applyCorrelation(stockKey, delta, logs)
            break
        }

        case '設備投資': {
            const cost = 700
            if (player.companyFunds < cost) {
                pushLog(logs, 'system', '会社資金不足', `${player.name}は設備投資に必要な会社資金が不足しています。`, 'warn')
                return
            }

            player.companyFunds -= cost
            player.marketBias += 2
            moveStockPrice(stockKey, 4, logs)
            player.cooldowns[action] = 2
            pushLog(logs, 'player', '会社', `${player.name}が設備投資を実施。中期成長期待で自社株に追い風。`, 'up')
            break
        }
    }
}

function reduceCooldowns(player: PlayerState): void {
    COOLDOWN_ACTIONS.forEach((action) => {
        player.cooldowns[action] = Math.max(0, player.cooldowns[action] - 1)
    })
}

function applyCpuNoise(logs: LogEntry[]): void {
    const marketCondition = state.marketCondition
    const marketShift =
        marketCondition === 'bull'
            ? randomBetween(2, 8)
            : marketCondition === 'bear'
                ? randomBetween(-8, -2)
                : randomBetween(-4, 4)

    moveStockPrice('market', marketShift, logs)

    const playerOneShift = randomBetween(-7, 8) + getPlayer('player1').marketBias
    const playerTwoShift = randomBetween(-7, 8) + getPlayer('player2').marketBias

    moveStockPrice('p1', playerOneShift, logs)
    moveStockPrice('p2', playerTwoShift, logs)

    getPlayer('player1').marketBias = Math.trunc(getPlayer('player1').marketBias * 0.5)
    getPlayer('player2').marketBias = Math.trunc(getPlayer('player2').marketBias * 0.5)
}

function advanceTurn(): void {
    state.turn += 1
    state.currentPlayer = state.currentPlayer === 'player1' ? 'player2' : 'player1'

    if (state.turn % 4 === 0) {
        state.marketCondition = state.marketCondition === 'bull'
            ? 'sideways'
            : state.marketCondition === 'sideways'
                ? 'bear'
                : 'bull'
    }
}

function handleTurn(payload: TurnActionWithWait): void {
    const logs: LogEntry[] = []
    const player = getPlayer(state.currentPlayer)

    pushTimeline(player, payload)
    settleSpeculation(player, logs)

    if (payload.metaAction === 'wait') {
        pushLog(logs, 'player', '待機', `${player.name}はこのターン、様子見を選択。大きな行動は起こしていません。`, 'up')
    } else if (payload.companyAction !== 'なし') {
        applyCompanyAction(player, payload.companyAction, logs)
    } else {
        applyPlayerOrder(player, payload, logs)
    }

    applyCpuNoise(logs)
    reduceCooldowns(getPlayer('player1'))
    reduceCooldowns(getPlayer('player2'))

    state.logs.unshift(...logs.reverse())
    state.logs = state.logs.slice(0, 36)

    advanceTurn()
}
</script>

<template>
    <div class="battle-screen">
        <PlayerPanel
            class="left-panel"
            :player="leftPlayer"
            :stocks="state.stocks"
            :is-active="state.currentPlayer === 'player1'"
            :asset-diff="leftAssetDiff"
        />

        <StockBoard
            class="chart-panel"
            :stocks="state.stocks"
            :turn="state.turn"
            :cpu-participant-count="cpuMarketStats.participantCount"
            :cpu-investment-total="cpuMarketStats.investmentTotal"
            :cpu-withdrawal-count="cpuMarketStats.withdrawalCount"
        />

        <PlayerPanel
            class="right-panel"
            :player="rightPlayer"
            :stocks="state.stocks"
            :is-active="state.currentPlayer === 'player2'"
            :asset-diff="rightAssetDiff"
        />

        <ActionHistoryPanel class="history-panel" :entries="actionTimeline" />

        <ActionPanel
            class="action-panel-slot"
            :current-player="activePlayer"
            :stocks="state.stocks"
            @confirm="handleTurn"
        />
    </div>
</template>


<style scoped>
.battle-screen {
    height: 100%;
    width: 100%;
    min-height: 0;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(170px, 0.95fr) minmax(0, 4.4fr) minmax(170px, 0.95fr) minmax(210px, 1.18fr);
    grid-template-rows: minmax(0, 54fr) minmax(0, 46fr);
    grid-template-areas:
        'left chart right history'
        'action action action action';
    gap: 8px;
    align-items: stretch;
    overflow: hidden;
}

.left-panel,
.chart-panel,
.right-panel,
.history-panel,
.action-panel-slot {
    min-height: 0;
    min-width: 0;
    height: 100%;
}

.left-panel { grid-area: left; }
.chart-panel { grid-area: chart; }
.right-panel { grid-area: right; }
.history-panel { grid-area: history; }
.action-panel-slot { grid-area: action; }

@media (min-width: 1700px) {
    .battle-screen {
        grid-template-columns: minmax(180px, 1fr) minmax(0, 4.8fr) minmax(180px, 1fr) minmax(220px, 1.2fr);
    }
}
</style>
