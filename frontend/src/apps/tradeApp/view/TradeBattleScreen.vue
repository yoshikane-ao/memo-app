<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StockBoard from './StockBoard.vue'
import PlayerPanel from './PlayerPanel.vue'
import ActionPanel from './ActionPanel.vue'

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
    TradePositionEntry,
    TurnActionPayload,
} from '../api/types/game'
import {
    AD_CAMPAIGN_ACTION,
    BUYBACK_ACTION,
    CAPITAL_INCREASE_ACTION,
    COOLDOWN_ACTIONS,
    DEFAULT_MANAGEMENT_STAKE_SHARES,
    FACILITY_INVESTMENT_ACTION,
    NO_COMPANY_ACTION,
} from '../api/types/game'
import {
    calculatePlayerVictoryValue,
    calculateTradePositionPnL,
    calculateTradePositionSettlementCash,
    formatCurrency,
    formatSignedCurrency,
} from '../api/utils/gameCalculations'
import {
    buildBattleActionProjection,
    buildBattleConfirmedAction,
    createDefaultBattleActionDraft,
    isBattleTurnComplete,
    resolveNextBattlePlayer,
    resolveTurnLeadPlayer,
    type BattleActionDraft,
} from '../lib/tradeBattle'
import {
    DEFAULT_MARKET_STOCK_STARTING_PRICE,
    DEFAULT_PLAYER_STOCK_STARTING_PRICE,
} from '../lib/tradeSetup'
import {
    calculateTradeImpactAmounts,
    MIN_TRADE_ORDER_AMOUNT,
    resolvePriceAfterDelta,
} from '../lib/tradeImpact'

import '../css/style.css'

const gameStore = useTradeGameStore()
const router = useRouter()
const sessionSnapshot = computed(() => gameStore.state.session)
const startSettings = computed(() => sessionSnapshot.value?.settings ?? null)

const state = reactive(createInitialGameState())

const DEFAULT_STARTING_CASH = 100000
const STARTING_COMPANY_FUNDS = 3000
const MAX_TURNS = 10

type TurnActionWithWait = TurnActionPayload & {
    metaAction?: 'wait'
}

type PendingClosePreview = {
    positionId: string
    stockKey: StockKey
    stockName: string
    side: TradePositionEntry['side']
    executionPrice: number
    realizedPnl: number
    returnedCash: number
    priceMap: Record<StockKey, number>
}

type ChartOrderMarker = {
    id: string
    stockKey: StockKey
    playerId: PlayerId
    side: 'buy' | 'sell'
    executionPrice: number
    historyIndex: number
    turn: number
}

const actionDraft = ref<BattleActionDraft>(createDefaultBattleActionDraft())
const pendingClosePositionId = ref<string | null>(null)
const lastClosedPositionTurn = ref<number | null>(null)
const isGameOver = ref(false)
const stockHistoryPointIds = reactive<Record<StockKey, number[]>>({
    p1: [],
    p2: [],
    market: [],
})
const stockHistoryPointCounters = reactive<Record<StockKey, number>>({
    p1: 0,
    p2: 0,
    market: 0,
})

let logSequence = 1000
let positionSequence = 0

function resetBook(book: Record<string, HoldingPosition>): void {
    Object.values(book).forEach((position) => {
        position.quantity = 0
        position.avgPrice = 0
    })
}

function createEmptyBook(): Record<StockKey, HoldingPosition> {
    return {
        p1: { quantity: 0, avgPrice: 0 },
        p2: { quantity: 0, avgPrice: 0 },
        market: { quantity: 0, avgPrice: 0 },
    }
}

function syncPlayerBooksFromPositions(player: PlayerState): void {
    const holdings = createEmptyBook()
    const shorts = createEmptyBook()

    player.positions.forEach((position) => {
        const book = position.side === 'buy' ? holdings : shorts
        const slot = book[position.stockKey]
        const nextQuantity = normalizePositionUnits(slot.quantity + position.quantity)
        const totalCost = slot.avgPrice * slot.quantity + position.entryPrice * position.quantity

        slot.quantity = nextQuantity
        slot.avgPrice = nextQuantity > 0 ? totalCost / nextQuantity : 0
    })

        ; (['p1', 'p2', 'market'] as StockKey[]).forEach((key) => {
            player.holdings[key].quantity = holdings[key].quantity
            player.holdings[key].avgPrice = holdings[key].avgPrice
            player.shorts[key].quantity = shorts[key].quantity
            player.shorts[key].avgPrice = shorts[key].avgPrice
        })
}

function normalizePositionUnits(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
        return 0
    }

    return Math.round(value * 10000) / 10000
}

function formatPositionUnits(value: number): string {
    const normalized = normalizePositionUnits(value)
    return normalized.toLocaleString('ja-JP', {
        minimumFractionDigits: normalized % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    })
}

function resolveStartingPrice(stockKey: StockKey): number {
    if (stockKey === 'market') {
        return startSettings.value?.marketStartingPrice ?? DEFAULT_MARKET_STOCK_STARTING_PRICE
    }

    return DEFAULT_PLAYER_STOCK_STARTING_PRICE
}

function calculateCurrentTotalAssets(): number {
    return state.players.reduce((total, player) => total + player.cash, 0)
}

function recalculateDynamicLines(): void {
    state.stocks.forEach((stock) => {
        stock.bubbleUpper = 0
        stock.bubbleLower = 0
    })
}

function resetStocksForBattleStart(): void {
    state.stocks.forEach((stock) => {
        const startingPrice = resolveStartingPrice(stock.key)
        stock.basePrice = startingPrice
        stock.currentPrice = startingPrice
        stock.previousPrice = startingPrice
        stock.bubbleUpper = 0
        stock.bubbleLower = 0
        stock.history = [startingPrice]
        stock.shortInterest = 0
        stockHistoryPointCounters[stock.key] = 1
        stockHistoryPointIds[stock.key] = [1]
    })
}

function normalizePlayersForBattleStart(): void {
    const settings = startSettings.value
    const player1 = getPlayer('player1')
    const player2 = getPlayer('player2')

    player1.name = settings?.player1Name ?? 'PLAYER 1'
    player2.name = settings?.player2Name ?? 'PLAYER 2'

    state.turn = 1
    state.currentPlayer = resolveTurnLeadPlayer(state.turn)

    state.logs = []
    logSequence = 1000
    positionSequence = 0
    isGameOver.value = false
    resetStocksForBattleStart()

    state.players.forEach((player) => {
        const startingCash =
            player.id === 'player1'
                ? settings?.player1StartingCash ?? DEFAULT_STARTING_CASH
                : settings?.player2StartingCash ?? DEFAULT_STARTING_CASH

        player.cash = startingCash
        player.companyFunds = STARTING_COMPANY_FUNDS
        player.managementStakeShares = DEFAULT_MANAGEMENT_STAKE_SHARES
        player.startingOwnStockPrice = getStock(ownStockKey(player.id)).currentPrice
        player.positions = []
        player.speculation = []
        player.marketBias = 0
        player.recentNetChange = 0
        player.recentCashChange = 0

        resetBook(player.holdings as Record<string, HoldingPosition>)
        resetBook(player.shorts as Record<string, HoldingPosition>)

        COOLDOWN_ACTIONS.forEach((action) => {
            player.cooldowns[action] = 0
        })

        player.lastSnapshotAssets = player.cash
        player.lastSnapshotCash = player.cash
    })

    state.initialTotalAssets = Math.max(1, calculateCurrentTotalAssets())
    recalculateDynamicLines()
}

normalizePlayersForBattleStart()

const leftPlayer = computed(() => getPlayer('player1'))
const rightPlayer = computed(() => getPlayer('player2'))
const activePlayer = computed(() => getPlayer(state.currentPlayer))
const actionProjection = computed(() =>
    buildBattleActionProjection(activePlayer.value, state.stocks, actionDraft.value),
)

watch(
    () => state.currentPlayer,
    () => {
        actionDraft.value = createDefaultBattleActionDraft()
        pendingClosePositionId.value = null
        lastClosedPositionTurn.value = null
    },
)

const leftVictoryValue = computed(() => calculatePlayerVictoryValue(leftPlayer.value, state.stocks))
const rightVictoryValue = computed(() => calculatePlayerVictoryValue(rightPlayer.value, state.stocks))
const leftVictoryDiff = computed(() => leftVictoryValue.value - rightVictoryValue.value)
const rightVictoryDiff = computed(() => rightVictoryValue.value - leftVictoryValue.value)
const displayTurn = computed(() => Math.min(state.turn, MAX_TURNS))

function createCurrentPriceMap(): Record<StockKey, number> {
    return state.stocks.reduce<Record<StockKey, number>>(
        (acc, stock) => {
            acc[stock.key] = stock.currentPrice
            return acc
        },
        { p1: 0, p2: 0, market: 0 },
    )
}

function moveProjectedPrice(
    priceMap: Record<StockKey, number>,
    stockKey: StockKey,
    rawDelta: number,
): void {
    const stock = getStock(stockKey)
    priceMap[stockKey] = resolvePriceAfterDelta(
        priceMap[stockKey],
        stock.basePrice,
        stock.bubbleUpper,
        stock.bubbleLower,
        rawDelta,
    ).nextPrice
}

function applyProjectedTradeEffectToPriceMap(
    priceMap: Record<StockKey, number>,
    playerId: PlayerId,
    stockKey: StockKey,
    tradeAction: TurnActionPayload['tradeAction'],
    orderAmount: number,
): void {
    const stock = getStock(stockKey)
    const impactAmounts = calculateTradeImpactAmounts(
        playerId,
        stockKey,
        tradeAction,
        orderAmount,
        priceMap[stockKey],
        stock.basePrice,
    )

    if (impactAmounts.p1 !== 0) moveProjectedPrice(priceMap, 'p1', impactAmounts.p1)
    if (impactAmounts.p2 !== 0) moveProjectedPrice(priceMap, 'p2', impactAmounts.p2)
    if (impactAmounts.market !== 0) moveProjectedPrice(priceMap, 'market', impactAmounts.market)
}

const pendingClosePreview = computed<PendingClosePreview | null>(() => {
    if (isGameOver.value || pendingClosePositionId.value == null) {
        return null
    }

    const player = activePlayer.value
    const position = player.positions.find((item) => item.id === pendingClosePositionId.value)
    if (!position) {
        return null
    }

    const priceMap = createCurrentPriceMap()
    const executionPrice = priceMap[position.stockKey]
    const closeAction = position.side === 'buy' ? 'sell' : 'buy'
    applyProjectedTradeEffectToPriceMap(priceMap, player.id, position.stockKey, closeAction, position.orderAmount)

    return {
        positionId: position.id,
        stockKey: position.stockKey,
        stockName: getStock(position.stockKey).name,
        side: position.side,
        executionPrice,
        realizedPnl: calculateTradePositionPnL(position, executionPrice),
        returnedCash: calculateTradePositionSettlementCash(position, executionPrice),
        priceMap,
    }
})

const projectedBoardPrices = computed<Partial<Record<StockKey, number>> | null>(() => {
    if (isGameOver.value) {
        return null
    }

    if (pendingClosePreview.value) {
        return pendingClosePreview.value.priceMap
    }

    const currentPlayer = activePlayer.value
    const priceMap = createCurrentPriceMap()

    if (actionDraft.value.actionKind === 'wait') {
        return priceMap
    }

    if (actionDraft.value.actionKind === 'company') {
        const targetKey = ownStockKey(currentPlayer.id)
        if (actionDraft.value.companyAction === CAPITAL_INCREASE_ACTION && currentPlayer.cooldowns[CAPITAL_INCREASE_ACTION] <= 0) {
            moveProjectedPrice(priceMap, targetKey, -12)
        } else if (actionDraft.value.companyAction === AD_CAMPAIGN_ACTION && currentPlayer.cooldowns[AD_CAMPAIGN_ACTION] <= 0 && currentPlayer.companyFunds >= 600) {
            moveProjectedPrice(priceMap, targetKey, 6)
        } else if (actionDraft.value.companyAction === FACILITY_INVESTMENT_ACTION && currentPlayer.cooldowns[FACILITY_INVESTMENT_ACTION] <= 0 && currentPlayer.companyFunds >= 700) {
            moveProjectedPrice(priceMap, targetKey, 4)
        }

        return priceMap
    }

    if (!actionProjection.value.canSubmitTrade) {
        return null
    }

    applyProjectedTradeEffectToPriceMap(
        priceMap,
        currentPlayer.id,
        actionProjection.value.draft.stockKey,
        actionProjection.value.draft.tradeAction,
        actionProjection.value.orderAmount,
    )

    return priceMap
})
const battleResult = computed(() => {
    if (!isGameOver.value) {
        return null
    }

    if (leftVictoryValue.value > rightVictoryValue.value) {
        return {
            title: `${leftPlayer.value.name} の勝利`,
            tone: 'player1' as const,
        }
    }

    if (rightVictoryValue.value > leftVictoryValue.value) {
        return {
            title: `${rightPlayer.value.name} の勝利`,
            tone: 'player2' as const,
        }
    }

    return {
        title: '引き分け',
        tone: 'draw' as const,
    }
})

const pendingCloseSummary = computed(() => {
    if (!pendingClosePreview.value) {
        return null
    }

    return {
        stockName: pendingClosePreview.value.stockName,
        side: pendingClosePreview.value.side,
        executionPriceText: formatCurrency(pendingClosePreview.value.executionPrice),
        projectedPnlText: formatSignedCurrency(pendingClosePreview.value.realizedPnl),
        returnedCashText: formatCurrency(pendingClosePreview.value.returnedCash),
    }
})

const activePositionMarkers = computed<ChartOrderMarker[]>(() =>
    state.players.flatMap((player) =>
        player.positions.flatMap((position) => {
            if (position.entryHistoryPointId == null) {
                return []
            }

            const historyIndex = stockHistoryPointIds[position.stockKey].findIndex(
                (pointId) => pointId === position.entryHistoryPointId,
            )
            if (historyIndex < 0) {
                return []
            }

            return [{
                id: `position-marker-${position.id}`,
                stockKey: position.stockKey,
                playerId: player.id,
                side: position.side,
                executionPrice: position.entryPrice,
                historyIndex,
                turn: position.openedTurn,
            }]
        }),
    ),
)

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

function createTradePosition(
    stockKey: StockKey,
    side: TradePositionEntry['side'],
    quantity: number,
    entryPrice: number,
    entryHistoryPointId: number,
    orderAmount: number,
): TradePositionEntry {
    positionSequence += 1

    return {
        id: `position-${positionSequence}`,
        stockKey,
        side,
        quantity: normalizePositionUnits(quantity),
        entryPrice,
        entryHistoryPointId,
        orderAmount,
        openedTurn: state.turn,
    }
}

function appendTradePosition(
    player: PlayerState,
    stockKey: StockKey,
    side: TradePositionEntry['side'],
    quantity: number,
    entryPrice: number,
    entryHistoryPointId: number,
    orderAmount: number,
): void {
    player.positions.push(createTradePosition(stockKey, side, quantity, entryPrice, entryHistoryPointId, orderAmount))
    syncPlayerBooksFromPositions(player)
}

type ConsumedPositionEntry = {
    id: string
    stockKey: StockKey
    side: TradePositionEntry['side']
    quantity: number
    entryPrice: number
    entryHistoryPointId?: number
    orderAmount: number
}

function extractTradePositionById(
    player: PlayerState,
    positionId: string,
): ConsumedPositionEntry | null {
    const targetPosition = player.positions.find((position) => position.id === positionId)
    if (!targetPosition) {
        return null
    }

    player.positions = player.positions.filter((position) => position.id !== positionId)
    syncPlayerBooksFromPositions(player)

    return {
        id: targetPosition.id,
        stockKey: targetPosition.stockKey,
        side: targetPosition.side,
        quantity: targetPosition.quantity,
        entryPrice: targetPosition.entryPrice,
        entryHistoryPointId: targetPosition.entryHistoryPointId,
        orderAmount: targetPosition.orderAmount,
    }
}

function closeOpenPosition(
    player: PlayerState,
    positionId: string,
    logs: LogEntry[],
): boolean {
    const position = player.positions.find((item) => item.id === positionId)
    if (!position) {
        pushLog(logs, 'system', 'ポジション不足', `${player.name}が決済しようとしたポジションが見つかりません。`, 'warn')
        return false
    }

    const stock = getStock(position.stockKey)
    const closeAction = position.side === 'buy' ? 'sell' : 'buy'
    const executionPrice = stock.currentPrice
    const settled = extractTradePositionById(player, positionId)

    if (!settled) {
        pushLog(logs, 'system', 'ポジション不足', `${player.name}の${stock.name}ポジションを決済できませんでした。`, 'warn')
        return false
    }

    if (settled.side === 'buy') {
        const returnedCash = calculateTradePositionSettlementCash(settled, executionPrice)
        const pnl = calculateTradePositionPnL(settled, executionPrice)
        player.cash += returnedCash

        pushLog(
            logs,
            'player',
            'ポジション決済',
            `${player.name}が${stock.name}の買いポジションを決済。回収 ${formatCurrency(returnedCash)} / 損益 ${formatSignedCurrency(pnl)}`,
            pnl >= 0 ? 'up' : 'warn',
        )
        applyTradePriceEffect(player.id, settled.stockKey, closeAction, settled.orderAmount, logs)
        return true
    }

    const realized = calculateTradePositionPnL(settled, executionPrice)
    const returnedCash = calculateTradePositionSettlementCash(settled, executionPrice)
    player.cash += returnedCash
    stock.shortInterest = Math.max(0, stock.shortInterest - settled.quantity)

    pushLog(
        logs,
        'player',
        'ポジション決済',
        `${player.name}が${stock.name}の売りポジションを決済。回収 ${formatCurrency(returnedCash)} / 損益 ${formatSignedCurrency(realized)}`,
        realized >= 0 ? 'up' : 'warn',
    )
    applyTradePriceEffect(player.id, settled.stockKey, closeAction, settled.orderAmount, logs)
    return true
}

function moveStockPrice(stockKey: StockKey, rawDelta: number, _logs: LogEntry[]): number {
    const stock = getStock(stockKey)
    const before = stock.currentPrice
    const resolved = resolvePriceAfterDelta(
        before,
        stock.basePrice,
        stock.bubbleUpper,
        stock.bubbleLower,
        rawDelta,
    )

    stock.previousPrice = before
    stock.currentPrice = resolved.nextPrice
    stock.history = [...stock.history.slice(-(12 - resolved.historyTrail.length)), ...resolved.historyTrail]
    const nextHistoryPointIds = resolved.historyTrail.map(() => {
        stockHistoryPointCounters[stockKey] += 1
        return stockHistoryPointCounters[stockKey]
    })
    stockHistoryPointIds[stockKey] = [
        ...stockHistoryPointIds[stockKey].slice(-(12 - nextHistoryPointIds.length)),
        ...nextHistoryPointIds,
    ]
    return resolved.nextPrice - before
}

function applyTradePriceEffect(
    playerId: PlayerId,
    stockKey: StockKey,
    tradeAction: TurnActionPayload['tradeAction'],
    executedAmount: number,
    logs: LogEntry[],
): void {
    const targetStock = getStock(stockKey)
    const impactAmounts = calculateTradeImpactAmounts(
        playerId,
        stockKey,
        tradeAction,
        executedAmount,
        targetStock.currentPrice,
        targetStock.basePrice,
    )

    if (impactAmounts.p1 !== 0) moveStockPrice('p1', impactAmounts.p1, logs)
    if (impactAmounts.p2 !== 0) moveStockPrice('p2', impactAmounts.p2, logs)
    if (impactAmounts.market !== 0) moveStockPrice('market', impactAmounts.market, logs)
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

        player.cash += position.committedCash + pnl

        pushLog(
            logs,
            'system',
            '短期決済',
            `${player.name}の${getStock(position.stockKey).name} ${position.side === 'buy' ? '買い' : '売り'}ポジション 約${formatPositionUnits(position.quantity)}口を決済しました。返却 ${formatCurrency(position.committedCash)} / 損益 ${formatSignedCurrency(pnl)}`,
            pnl >= 0 ? 'up' : 'warn',
        )
    }
}

function resolveOrderQuantity(openPrice: number, rawAmount: number): number {
    const amount = Math.max(0, Math.floor(rawAmount))
    if (amount < MIN_TRADE_ORDER_AMOUNT) return 0
    if (openPrice <= 0) return 0
    return normalizePositionUnits(amount / openPrice)
}

function applyPlayerOrder(
    player: PlayerState,
    payload: TurnActionPayload,
    logs: LogEntry[],
): void {
    const stock = getStock(payload.stockKey)
    const openPrice = stock.currentPrice
    const orderAmount = Math.max(0, Math.floor(payload.quantity))
    const quantity = resolveOrderQuantity(openPrice, orderAmount)
    const requiredCash = orderAmount

    if (quantity <= 0) {
        const shortageMessage = orderAmount > 0 && orderAmount < MIN_TRADE_ORDER_AMOUNT
            ? `${player.name}の注文額 ${formatCurrency(orderAmount)} は最低注文額 ${formatCurrency(MIN_TRADE_ORDER_AMOUNT)} を下回っています。`
            : `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を約定できません。`
        pushLog(
            logs,
            'system',
            '注文額不足',
            shortageMessage,
            'warn',
        )
        return
    }

    if ((payload.tradeAction === 'buy' || payload.tradeAction === 'sell') && player.cash < requiredCash) {
        pushLog(
            logs,
            'system',
            '資金不足',
            `${player.name}は${stock.name}の注文に必要な現金が不足しています。`,
            'warn',
        )
        return
    }

    const executedAmount = orderAmount

    if (payload.tradeMode === 'speculation') {
        if (payload.tradeAction !== 'buy' && payload.tradeAction !== 'sell') {
            pushLog(logs, 'system', '短期ルール', '短期では買いか売りのみ選べます。', 'warn')
            return
        }

        applyTradePriceEffect(player.id, payload.stockKey, payload.tradeAction, executedAmount, logs)
        const executionPrice = getStock(payload.stockKey).currentPrice
        const executedUnits = resolveOrderQuantity(executionPrice, orderAmount)
        if (executedUnits <= 0) {
            pushLog(logs, 'system', '注文額不足', `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を建てられません。`, 'warn')
            return
        }

        player.cash -= requiredCash
        player.speculation.push({
            stockKey: payload.stockKey,
            side: payload.tradeAction,
            quantity: executedUnits,
            entryPrice: executionPrice,
            committedCash: requiredCash,
            settlementTurn: state.turn + 2,
        })

        if (payload.tradeAction === 'buy') {
            pushLog(logs, 'player', '短期', `${player.name}が${stock.name}を買いで ${formatCurrency(orderAmount)} 注文。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`, 'up')
            return
        }

        stock.shortInterest += executedUnits
        pushLog(logs, 'player', '短期', `${player.name}が${stock.name}を売りで ${formatCurrency(orderAmount)} 注文。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`, 'down')
        return
    }

    switch (payload.tradeAction) {
        case 'buy': {
            const cost = requiredCash
            applyTradePriceEffect(player.id, payload.stockKey, payload.tradeAction, cost, logs)
            const executionPrice = getStock(payload.stockKey).currentPrice
            const entryHistoryPointId =
                stockHistoryPointIds[payload.stockKey][stockHistoryPointIds[payload.stockKey].length - 1]
                ?? stockHistoryPointCounters[payload.stockKey]
            const executedUnits = resolveOrderQuantity(executionPrice, cost)
            if (executedUnits <= 0) {
                pushLog(logs, 'system', '注文額不足', `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を建てられません。`, 'warn')
                return
            }

            player.cash -= cost
            appendTradePosition(player, payload.stockKey, 'buy', executedUnits, executionPrice, entryHistoryPointId, cost)

            pushLog(logs, 'player', '買い', `${player.name}が${stock.name}を ${formatCurrency(cost)} で買い。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`, 'up')
            return
        }

        case 'sell': {
            applyTradePriceEffect(player.id, payload.stockKey, payload.tradeAction, requiredCash, logs)
            const executionPrice = getStock(payload.stockKey).currentPrice
            const entryHistoryPointId =
                stockHistoryPointIds[payload.stockKey][stockHistoryPointIds[payload.stockKey].length - 1]
                ?? stockHistoryPointCounters[payload.stockKey]
            const executedUnits = resolveOrderQuantity(executionPrice, requiredCash)
            if (executedUnits <= 0) {
                pushLog(logs, 'system', '注文額不足', `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を売りで建てられません。`, 'warn')
                return
            }

            player.cash -= requiredCash
            appendTradePosition(player, payload.stockKey, 'sell', executedUnits, executionPrice, entryHistoryPointId, requiredCash)
            stock.shortInterest += executedUnits

            pushLog(logs, 'player', '売り', `${player.name}が${stock.name}を ${formatCurrency(requiredCash)} で売り。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`, 'down')
            return
        }
    }
}

function applyCompanyAction(
    player: PlayerState,
    action: TurnActionPayload['companyAction'],
    logs: LogEntry[],
): void {
    if (action === NO_COMPANY_ACTION) return

    if (player.cooldowns[action] > 0) {
        pushLog(logs, 'system', 'クールダウン', `${player.name}の${action}はあと${player.cooldowns[action]}ターン使えません。`, 'warn')
        return
    }

    if (action === BUYBACK_ACTION) {
        pushLog(logs, 'system', '未使用の追加操作', 'この操作は現在のルールでは使用できません。', 'warn')
        return
    }

    const stockKey = ownStockKey(player.id)

    switch (action) {
        case CAPITAL_INCREASE_ACTION: {
            player.companyFunds += 1500
            moveStockPrice(stockKey, -12, logs)
            player.cooldowns[action] = 3
            pushLog(logs, 'player', '追加操作', `${player.name}が資金調整を実行。予備資金 +${formatCurrency(1500)}、自分レートはやや下向きです。`, 'warn')
            break
        }

        case AD_CAMPAIGN_ACTION: {
            const cost = 600
            if (player.companyFunds < cost) {
                pushLog(logs, 'system', '予備資金不足', `${player.name}は注目集めに必要な予備資金が不足しています。`, 'warn')
                return
            }

            player.companyFunds -= cost
            player.cash += 220
            moveStockPrice(stockKey, 6, logs)
            player.cooldowns[action] = 2
            pushLog(logs, 'player', '追加操作', `${player.name}が注目集めを実行。予備資金 -${formatCurrency(cost)}、現金 +${formatCurrency(220)}。`, 'up')
            break
        }

        case FACILITY_INVESTMENT_ACTION: {
            const cost = 700
            if (player.companyFunds < cost) {
                pushLog(logs, 'system', '予備資金不足', `${player.name}は安定化に必要な予備資金が不足しています。`, 'warn')
                return
            }

            player.companyFunds -= cost
            moveStockPrice(stockKey, 4, logs)
            player.cooldowns[action] = 2
            pushLog(logs, 'player', '追加操作', `${player.name}が安定化を実行。自分レートが上向きました。`, 'up')
            break
        }
    }
}

function reduceCooldowns(player: PlayerState): void {
    COOLDOWN_ACTIONS.forEach((action) => {
        player.cooldowns[action] = Math.max(0, player.cooldowns[action] - 1)
    })
}

function advanceTurn(): boolean {
    const completedTurn = isBattleTurnComplete(state.currentPlayer, state.turn)
    const nextPlayer = resolveNextBattlePlayer(state.currentPlayer, state.turn)

    if (!completedTurn) {
        state.currentPlayer = nextPlayer
        return true
    }

    if (state.turn >= MAX_TURNS) {
        isGameOver.value = true
        return false
    }

    state.turn += 1
    state.currentPlayer = nextPlayer

    if (state.turn % 4 === 0) {
        state.marketCondition = state.marketCondition === 'bull'
            ? 'sideways'
            : state.marketCondition === 'sideways'
                ? 'bear'
                : 'bull'
    }

    return true
}

function handleDraftChange(nextDraft: BattleActionDraft): void {
    actionDraft.value = nextDraft
}

function handleConfirmTurn(): void {
    if (isGameOver.value) {
        return
    }

    if (pendingClosePreview.value) {
        executePendingClose(pendingClosePreview.value.positionId)
        return
    }

    const payload = buildBattleConfirmedAction(activePlayer.value, actionProjection.value)
    if (!payload) {
        return
    }

    handleTurn(payload)
    actionDraft.value = createDefaultBattleActionDraft()
}

function executePendingClose(positionId: string): void {
    if (isGameOver.value) {
        return
    }

    if (lastClosedPositionTurn.value === state.turn) {
        return
    }

    const logs: LogEntry[] = []
    const player = getPlayer(state.currentPlayer)
    settleSpeculation(player, logs)
    recalculateDynamicLines()

    const didClose = closeOpenPosition(player, positionId, logs)
    if (!didClose) {
        pendingClosePositionId.value = null
        state.logs.unshift(...logs.reverse())
        state.logs = state.logs.slice(0, 36)
        return
    }

    lastClosedPositionTurn.value = state.turn
    reduceCooldowns(player)
    recalculateDynamicLines()

    state.logs.unshift(...logs.reverse())
    state.logs = state.logs.slice(0, 36)

    advanceTurn()
    pendingClosePositionId.value = null
    actionDraft.value = createDefaultBattleActionDraft()
}

function handleClosePosition(positionId: string): void {
    if (isGameOver.value) {
        return
    }

    pendingClosePositionId.value = pendingClosePositionId.value === positionId
        ? null
        : positionId
}

async function goBackToMenu(): Promise<void> {
    try {
        await router.push('/menu/workspace/trade')
    } catch {
        window.location.href = '/menu/workspace/trade'
    }
}

function handleTurn(payload: TurnActionWithWait): void {
    if (isGameOver.value) {
        return
    }

    const logs: LogEntry[] = []
    const player = getPlayer(state.currentPlayer)
    settleSpeculation(player, logs)
    recalculateDynamicLines()

    if (payload.metaAction === 'wait') {
        pushLog(logs, 'player', '待機', `${player.name}はこのターンを待機し、大きな行動を見送りました。`, 'up')
    } else if (payload.companyAction !== NO_COMPANY_ACTION) {
        applyCompanyAction(player, payload.companyAction, logs)
    } else {
        applyPlayerOrder(player, payload, logs)
    }

    reduceCooldowns(getPlayer('player1'))
    reduceCooldowns(getPlayer('player2'))
    recalculateDynamicLines()

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

            <div class="battle-status">
                <span class="turn-badge">TURN {{ displayTurn }} / {{ MAX_TURNS }}</span>
                <span v-if="isGameOver" class="finish-badge">終了</span>
            </div>
        </div>

        <PlayerPanel class="left-panel" :player="leftPlayer" :stocks="state.stocks"
            :projected-prices="projectedBoardPrices" :pending-close="pendingClosePreview"
            :is-active="!isGameOver && state.currentPlayer === 'player1'" :victory-value="leftVictoryValue"
            :victory-diff="leftVictoryDiff" @close-position="handleClosePosition" />

        <StockBoard class="chart-panel" :stocks="state.stocks" :turn="displayTurn"
            :projected-prices="projectedBoardPrices" :order-markers="activePositionMarkers" />

        <PlayerPanel class="right-panel" :player="rightPlayer" :stocks="state.stocks"
            :projected-prices="projectedBoardPrices" :pending-close="pendingClosePreview"
            :is-active="!isGameOver && state.currentPlayer === 'player2'" :victory-value="rightVictoryValue"
            :victory-diff="rightVictoryDiff" @close-position="handleClosePosition" />

        <ActionPanel v-if="!isGameOver" class="action-panel-slot" :current-player="activePlayer" :draft="actionDraft"
            :projection="actionProjection" :pending-close="pendingCloseSummary" @update:draft="handleDraftChange"
            @confirm="handleConfirmTurn" />

        <section v-else class="action-panel-slot result-card" :class="battleResult?.tone">
            <div class="result-title">10ターン終了</div>
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
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    max-height: 100%;
    padding: 7px 8px 8px;
    display: grid;
    grid-template-columns: minmax(208px, 1fr) minmax(0, 4.8fr) minmax(208px, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
        'topbar topbar topbar'
        'left chart right'
        'action action action';
    gap: 9px;
    align-items: stretch;
    align-content: stretch;
    overflow: hidden;
}

.battle-topbar,
.action-panel-slot {
    min-height: 0;
    min-width: 0;
    height: auto;
}

.left-panel,
.chart-panel,
.right-panel {
    min-height: 0;
    min-width: 0;
    height: 100%;
    position: relative;
    z-index: 1;
}

.battle-topbar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 0;
}

.battle-status {
    display: flex;
    align-items: center;
    gap: 8px;
}

.turn-badge,
.finish-badge {
    height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
}

.turn-badge {
    border: 1px solid rgba(122, 171, 255, 0.26);
    background: rgba(14, 23, 44, 0.92);
    color: #dfeaff;
}

.finish-badge {
    border: 1px solid rgba(255, 143, 143, 0.26);
    background: rgba(68, 18, 28, 0.92);
    color: #ffd6dc;
}

.menu-return-button {
    position: relative;
    z-index: 3;
    height: 30px;
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

.action-panel-slot {
    grid-area: action;
    align-self: end;
    justify-self: stretch;
    position: relative;
    z-index: 2;
    height: auto;
    width: 100%;
    max-width: 1420px;
    margin: 0 auto;
}

.result-card {
    border-radius: 18px;
    border: 1px solid rgba(120, 156, 228, 0.2);
    background:
        linear-gradient(180deg, rgba(6, 12, 28, 0.98) 0%, rgba(4, 9, 21, 0.94) 100%),
        radial-gradient(circle at top, rgba(78, 131, 255, 0.12), transparent 42%);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.04),
        0 16px 36px rgba(0, 0, 0, 0.28);
    padding: 14px 18px;
    display: grid;
    gap: 10px;
}

.result-card.player1 {
    border-color: rgba(99, 163, 255, 0.42);
}

.result-card.player2 {
    border-color: rgba(255, 110, 138, 0.4);
}

.result-card.draw {
    border-color: rgba(190, 205, 232, 0.28);
}

.result-title {
    color: rgba(213, 227, 255, 0.74);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.result-winner {
    color: #f5f8ff;
    font-size: 20px;
    font-weight: 900;
    line-height: 1.1;
}

.result-score-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.result-score-item {
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    padding: 10px 12px;
    display: grid;
    gap: 4px;
}

.result-name {
    color: rgba(201, 216, 255, 0.72);
    font-size: 10px;
    font-weight: 700;
}

.result-score-item strong {
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
}

@media (min-width: 1700px) {
    .battle-screen {
        grid-template-columns: minmax(224px, 0.98fr) minmax(0, 5.4fr) minmax(224px, 0.98fr);
        grid-template-rows: auto minmax(0, 1fr) auto;
    }
}

@media (max-width: 1480px) {
    .battle-screen {
        grid-template-columns: minmax(188px, 0.92fr) minmax(0, 4.2fr) minmax(188px, 0.92fr);
        grid-template-rows: auto minmax(0, 1fr) auto;
        gap: 7px;
        padding: 7px 8px 8px;
    }

    .action-panel-slot {
        max-width: 1320px;
    }
}

@media (max-width: 1180px) {
    .battle-screen {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: auto minmax(0, 0.92fr) auto auto;
        grid-template-areas:
            'topbar topbar'
            'chart chart'
            'left right'
            'action action';
    }

    .left-panel,
    .right-panel {
        height: auto;
    }

    .action-panel-slot {
        width: 100%;
        max-width: none;
    }
}

@media (max-width: 760px) {
    .battle-screen {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(220px, auto) auto auto auto;
        grid-template-areas:
            'topbar'
            'chart'
            'left'
            'right'
            'action';
        padding: 6px;
    }

    .battle-topbar {
        flex-wrap: wrap;
    }

    .battle-status,
    .result-score-row {
        width: 100%;
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
