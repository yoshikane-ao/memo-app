<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import StockBoard from './StockBoard.vue'
import PlayerPanel from './PlayerPanel.vue'
import ActionPanel from './ActionPanel.vue'
import ActionHistoryPanel from './ActionHistoryPanel.vue'

import { createInitialGameState } from '../api/data/mockGame'
import { useTradeGameStore } from '../store/useTradeGameStore'
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

const gameStore = useTradeGameStore()
const startSettings = computed(() => gameStore.state.settings)

const state = reactive(createInitialGameState())

const DEFAULT_STARTING_CASH = 12000
const DEFAULT_MARKET_CPU_COUNT = 63
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

type PreviewImpactLevel = 'strong-up' | 'up' | 'neutral' | 'down' | 'strong-down'

type PreviewImpactItem = {
    key: StockKey
    title: string
    subtitle: string
    level: PreviewImpactLevel
    headline: string
    detail: string
}

type PreviewSummaryItem = {
    label: string
    value: string
}

type ActionPreviewState = {
    actionKind: 'trade' | 'company' | 'wait'
    bannerTitle: string
    overviewTitle: string
    overviewSub: string
    stockImpactPreview: PreviewImpactItem[]
    companySummaryItems: PreviewSummaryItem[]
    actionChips: string[]
    decisionLabel: string
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
    const settings = startSettings.value
    const player1 = getPlayer('player1')
    const player2 = getPlayer('player2')

    player1.name = settings?.player1Name ?? 'PLAYER 1'
    player2.name = settings?.player2Name ?? 'PLAYER 2'

    state.turn = 1
    state.currentPlayer = gameStore.state.resolvedFirstPlayer === 'p2'
        ? 'player2'
        : 'player1'

    state.logs = []
    actionTimeline.value = []
    logSequence = 1000

    state.players.forEach((player) => {
        const startingCash =
            player.id === 'player1'
                ? settings?.player1StartingCash ?? DEFAULT_STARTING_CASH
                : settings?.player2StartingCash ?? DEFAULT_STARTING_CASH

        player.cash = startingCash
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

const configuredMarketCpuCount = computed(() => {
    return startSettings.value?.marketCpuCount ?? DEFAULT_MARKET_CPU_COUNT
})

const leftPlayer = computed(() => getPlayer('player1'))
const rightPlayer = computed(() => getPlayer('player2'))
const activePlayer = computed(() => getPlayer(state.currentPlayer))

const actionPreview = ref<ActionPreviewState>({
    actionKind: 'trade',
    bannerTitle: '今回の影響まとめ',
    overviewTitle: '入力待ち',
    overviewSub: '行動を選ぶと今回の値動き予測を表示',
    stockImpactPreview: [],
    companySummaryItems: [],
    actionChips: [],
    decisionLabel: '行動を決定',
})

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
    const totalCpu = configuredMarketCpuCount.value

    if (totalCpu <= 0) {
        return {
            participantCount: 0,
            withdrawalCount: 0,
            investmentTotal: 0,
            weakParticipantCount: 0,
            strongParticipantCount: 0,
            p1ParticipantCount: 0,
            p2ParticipantCount: 0,
            p1InvestmentTotal: 0,
            p2InvestmentTotal: 0,
        }
    }

    const conditionBase = state.marketCondition === 'bull'
        ? 78
        : state.marketCondition === 'bear'
            ? 46
            : 62

    const marketMomentum = recentMomentum('market')
    const p1Momentum = recentMomentum('p1')
    const p2Momentum = recentMomentum('p2')
    const volatility = Math.abs(marketMomentum) + Math.abs(p1Momentum) + Math.abs(p2Momentum)
    const averagePrice = Math.round(
        state.stocks.reduce((sum, stock) => sum + stock.currentPrice, 0) / Math.max(state.stocks.length, 1)
    )

    const rawParticipantCount =
        conditionBase +
        Math.round((marketMomentum + p1Momentum + p2Momentum) / 3) +
        Math.round(volatility / 5)

    const participantCount = Math.max(0, Math.min(totalCpu, rawParticipantCount))
    const withdrawalCount = Math.max(0, totalCpu - participantCount)
    const investmentTotal = Math.max(
        0,
        Math.round(participantCount * (averagePrice * 15 + 120 + volatility * 8))
    )

    const sentimentBias = state.marketCondition === 'bull'
        ? 0.08
        : state.marketCondition === 'bear'
            ? -0.06
            : 0.02
    const strongRatio = clamp(
        0.34 + sentimentBias + marketMomentum / 42 + Math.max(p1Momentum, p2Momentum) / 80,
        0.18,
        0.62,
    )
    const strongParticipantCount = Math.round(participantCount * strongRatio)
    const weakParticipantCount = Math.max(0, participantCount - strongParticipantCount)

    const p1Price = getStock('p1').currentPrice
    const p2Price = getStock('p2').currentPrice

    const p1Appeal = clamp(1 + p1Momentum / 14 + (p1Price - p2Price) / 80, 0.55, 1.95)
    const p2Appeal = clamp(1 + p2Momentum / 14 + (p2Price - p1Price) / 80, 0.55, 1.95)

    const companyParticipantPool = Math.max(0, Math.round(participantCount * 0.72))
    const appealTotal = p1Appeal + p2Appeal

    const p1ParticipantCount = Math.max(
        0,
        Math.min(companyParticipantPool, Math.round(companyParticipantPool * (p1Appeal / appealTotal))),
    )
    const p2ParticipantCount = Math.max(0, companyParticipantPool - p1ParticipantCount)

    const p1InvestmentTotal = Math.max(
        0,
        Math.round(p1ParticipantCount * (p1Price * 11 + 140 + Math.max(p1Momentum, 0) * 18)),
    )
    const p2InvestmentTotal = Math.max(
        0,
        Math.round(p2ParticipantCount * (p2Price * 11 + 140 + Math.max(p2Momentum, 0) * 18)),
    )

    return {
        participantCount,
        withdrawalCount,
        investmentTotal,
        weakParticipantCount,
        strongParticipantCount,
        p1ParticipantCount,
        p2ParticipantCount,
        p1InvestmentTotal,
        p2InvestmentTotal,
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

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
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

function handlePreviewChange(payload: ActionPreviewState): void {
    actionPreview.value = payload
}

async function goBackToMenu(): Promise<void> {
    try {
        await router.push('/menu/workspace/trade')
    } catch {
        window.location.href = '/menu/workspace/trade'
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
        <div class="battle-topbar">
            <button type="button" class="menu-return-button" @click="goBackToMenu">
                メニューへ戻る
            </button>
        </div>

        <PlayerPanel class="left-panel" :player="leftPlayer" :stocks="state.stocks"
            :is-active="state.currentPlayer === 'player1'" :asset-diff="leftAssetDiff" />

        <StockBoard class="chart-panel" :stocks="state.stocks" :turn="state.turn"
            :cpu-participant-count="cpuMarketStats.participantCount"
            :cpu-investment-total="cpuMarketStats.investmentTotal"
            :cpu-withdrawal-count="cpuMarketStats.withdrawalCount" />

        <PlayerPanel class="right-panel" :player="rightPlayer" :stocks="state.stocks"
            :is-active="state.currentPlayer === 'player2'" :asset-diff="rightAssetDiff" />

        <ActionHistoryPanel class="history-panel" :preview="actionPreview" :player1-name="leftPlayer.name"
            :player2-name="rightPlayer.name" :cpu-stats="cpuMarketStats" />

        <ActionPanel class="action-panel-slot" :current-player="activePlayer" :stocks="state.stocks"
            @preview-change="handlePreviewChange" @confirm="handleTurn" />
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
    padding: 10px 12px 12px;
    display: grid;
    grid-template-columns: minmax(168px, 0.92fr) minmax(0, 3.9fr) minmax(168px, 0.92fr) minmax(250px, 1.18fr);
    grid-template-rows: 38px minmax(0, 1fr) minmax(170px, 0.62fr);
    grid-template-areas:
        'topbar topbar topbar topbar'
        'left chart right history'
        'action action action action';
    gap: 8px;
    align-items: stretch;
    overflow: hidden;
}

.battle-topbar,
.left-panel,
.chart-panel,
.right-panel,
.history-panel,
.action-panel-slot {
    min-height: 0;
    min-width: 0;
    height: 100%;
}

.battle-topbar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 0;
}

.menu-return-button {
    position: relative;
    z-index: 3;
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: linear-gradient(135deg, rgba(10, 17, 32, 0.92), rgba(14, 23, 44, 0.96));
    color: #edf3ff;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease;
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

.history-panel {
    grid-area: history;
}

.action-panel-slot {
    grid-area: action;
}

@media (min-width: 1700px) {
    .battle-screen {
        grid-template-columns: minmax(176px, 0.95fr) minmax(0, 4.2fr) minmax(176px, 0.95fr) minmax(262px, 1.24fr);
        grid-template-rows: 40px minmax(0, 1fr) minmax(178px, 0.66fr);
    }
}

@media (max-width: 1480px) {
    .battle-screen {
        grid-template-columns: minmax(156px, 0.86fr) minmax(0, 3.4fr) minmax(156px, 0.86fr) minmax(228px, 1.04fr);
        grid-template-rows: 38px minmax(0, 1fr) minmax(162px, 0.58fr);
        gap: 7px;
        padding: 8px 10px 10px;
    }
}
</style>
