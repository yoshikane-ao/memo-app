<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import {
    AD_CAMPAIGN_ACTION,
    BUYBACK_ACTION,
    CAPITAL_INCREASE_ACTION,
    COOLDOWN_ACTIONS,
    DEFAULT_MANAGEMENT_STAKE_SHARES,
    FACILITY_INVESTMENT_ACTION,
    MODE_LABELS,
    NO_COMPANY_ACTION,
    STOCK_LABELS,
    TRADE_LABELS,
} from '../api/types/game'
import {
    calculatePlayerSnapshot,
    formatCurrency,
    formatSignedCurrency,
} from '../api/utils/gameCalculations'
import {
    buildBattleActionProjection,
    buildBattleConfirmedAction,
    createDefaultBattleActionDraft,
    type BattleActionDraft,
} from '../lib/tradeBattle'

import '../css/style.css'

const gameStore = useTradeGameStore()
const router = useRouter()
const sessionSnapshot = computed(() => gameStore.state.session)
const startSettings = computed(() => sessionSnapshot.value?.settings ?? null)

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

const actionTimeline = ref<ActionTimelineEntry[]>([])
const actionDraft = ref<BattleActionDraft>(createDefaultBattleActionDraft())

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
    state.currentPlayer = sessionSnapshot.value?.resolvedFirstPlayer === 'p2'
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
        player.managementStakeShares = DEFAULT_MANAGEMENT_STAKE_SHARES
        player.startingOwnStockPrice = getStock(ownStockKey(player.id)).currentPrice
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
const actionProjection = computed(() =>
    buildBattleActionProjection(activePlayer.value, state.stocks, actionDraft.value),
)

watch(
    () => state.currentPlayer,
    () => {
        actionDraft.value = createDefaultBattleActionDraft()
    },
)

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
            summary: '次ターンまで様子見',
        }

        actionTimeline.value.unshift(waitEntry)
        actionTimeline.value = actionTimeline.value.slice(0, 48)
        return
    }

    const isCompany = payload.companyAction !== NO_COMPANY_ACTION
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
            'バブル崩壊',
            `${stock.name}がバブル上限を超えたため急落しました。 ${formatCurrency(before)} → ${formatCurrency(next)}`,
            'warn',
        )
    } else if (next <= stock.bubbleLower) {
        next = stock.bubbleLower + 16
        pushLog(
            logs,
            'system',
            '底値反発',
            `${stock.name}が下限近くまで下がったため反発しました。 ${formatCurrency(before)} → ${formatCurrency(next)}`,
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
            '連動',
            `${STOCK_LABELS[sourceKey]}の上昇に資金が集まり、市場株には売り圧力が出ました。`,
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

        player.cash += position.committedCash + pnl

        pushLog(
            logs,
            'system',
            '投機清算',
            `${player.name}の${STOCK_LABELS[position.stockKey]} ${position.side === 'buy' ? '買い投機' : '空売り投機'} ${position.quantity}株を清算しました。返却 ${formatCurrency(position.committedCash)} / 損益 ${formatSignedCurrency(pnl)}`,
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
    const requiredCash = openPrice * quantity

    if (quantity <= 0) {
        pushLog(
            logs,
            'system',
            '注文額不足',
            `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を約定できません。`,
            'warn',
        )
        return
    }

    if ((payload.tradeAction === 'buy' || payload.tradeAction === 'short') && player.cash < requiredCash) {
        pushLog(
            logs,
            'system',
            '資金不足',
            `${player.name}は${stock.name}の注文に必要な現金が不足しています。`,
            'warn',
        )
        return
    }

    const baseImpact = Math.max(1, Math.round(quantity / 8))

    if (payload.tradeMode === 'speculation') {
        if (payload.tradeAction !== 'buy' && payload.tradeAction !== 'short') {
            pushLog(logs, 'system', '投機ルール', '投機では買い投機か空売り投機のみ選べます。', 'warn')
            return
        }

        player.cash -= requiredCash
        player.speculation.push({
            stockKey: payload.stockKey,
            side: payload.tradeAction === 'buy' ? 'buy' : 'short',
            quantity,
            entryPrice: openPrice,
            committedCash: requiredCash,
            settlementTurn: state.turn + 2,
        })

        if (payload.tradeAction === 'buy') {
            const delta = moveStockPrice(payload.stockKey, baseImpact, logs)
            pushLog(logs, 'player', '投機', `${player.name}が${stock.name}を買い投機。注文額 ${formatCurrency(orderAmount)} / 約${quantity}株`, 'up')
            applyCorrelation(payload.stockKey, delta, logs)
            return
        }

        stock.shortInterest += quantity
        const delta = moveStockPrice(payload.stockKey, -baseImpact, logs)
        pushLog(logs, 'player', '投機', `${player.name}が${stock.name}を空売り投機。注文額 ${formatCurrency(orderAmount)} / 約${quantity}株`, 'down')
        applyCorrelation(payload.stockKey, delta, logs)
        return
    }

    switch (payload.tradeAction) {
        case 'buy': {
            const cost = requiredCash
            player.cash -= cost
            addToPosition(player.holdings[payload.stockKey], quantity, openPrice)

            const delta = moveStockPrice(payload.stockKey, baseImpact, logs)
            pushLog(logs, 'player', '売買', `${player.name}が${stock.name}を買いました。${formatCurrency(cost)} / ${quantity}株`, 'up')
            applyCorrelation(payload.stockKey, delta, logs)
            break
        }

        case 'sell': {
            const { executed } = reducePosition(player.holdings[payload.stockKey], quantity)
            if (executed <= 0) {
                pushLog(logs, 'system', '保有不足', `${player.name}は${stock.name}を売るための保有株が足りません。`, 'warn')
                return
            }

            player.cash += openPrice * executed
            const impact = Math.max(1, Math.round(executed / 8))
            const delta = moveStockPrice(payload.stockKey, -impact, logs)

            pushLog(logs, 'player', '売買', `${player.name}が${stock.name}を売りました。${formatCurrency(openPrice * executed)} / ${executed}株`, 'down')
            applyCorrelation(payload.stockKey, delta, logs)
            break
        }

        case 'short': {
            player.cash -= requiredCash
            addToPosition(player.shorts[payload.stockKey], quantity, openPrice)
            stock.shortInterest += quantity

            const delta = moveStockPrice(payload.stockKey, -baseImpact, logs)
            pushLog(logs, 'player', '空売り', `${player.name}が${stock.name}を空売りしました。注文額 ${formatCurrency(orderAmount)} / 約${quantity}株`, 'down')
            applyCorrelation(payload.stockKey, delta, logs)
            break
        }

        case 'cover': {
            const shortPosition = player.shorts[payload.stockKey]
            if (shortPosition.quantity <= 0) {
                pushLog(logs, 'system', '空売り不足', `${player.name}は${stock.name}の空売りポジションを持っていません。`, 'warn')
                return
            }

            const { executed, avgPrice } = reducePosition(shortPosition, quantity)
            const realized = (avgPrice - openPrice) * executed
            player.cash += avgPrice * executed + realized
            stock.shortInterest = Math.max(0, stock.shortInterest - executed)

            const impact = Math.max(1, Math.round(executed / 8))
            const delta = moveStockPrice(payload.stockKey, impact, logs)

            pushLog(logs, 'player', '買い戻し', `${player.name}が${stock.name}を買い戻しました。${formatCurrency(openPrice * executed)} / ${executed}株 / 実現損益 ${formatSignedCurrency(realized)}`, realized >= 0 ? 'up' : 'warn')
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
    if (action === NO_COMPANY_ACTION) return

    if (player.cooldowns[action] > 0) {
        pushLog(logs, 'system', 'クールダウン', `${player.name}の${action}はあと${player.cooldowns[action]}ターン使えません。`, 'warn')
        return
    }

    if (action === BUYBACK_ACTION) {
        pushLog(logs, 'system', '未解放の会社行動', '自社株買いはこのルールでは使用できません。', 'warn')
        return
    }

    const stockKey = ownStockKey(player.id)

    switch (action) {
        case CAPITAL_INCREASE_ACTION: {
            player.companyFunds += 1500
            moveStockPrice(stockKey, -12, logs)
            player.cooldowns[action] = 3
            pushLog(logs, 'player', '会社行動', `${player.name}が増資を実行。会社資金 +${formatCurrency(1500)}、自社株にはやや売り圧力。`, 'warn')
            break
        }

        case AD_CAMPAIGN_ACTION: {
            const cost = 600
            if (player.companyFunds < cost) {
                pushLog(logs, 'system', '会社資金不足', `${player.name}は広告に必要な会社資金が不足しています。`, 'warn')
                return
            }

            player.companyFunds -= cost
            player.cash += 220
            const delta = moveStockPrice(stockKey, 6, logs)
            player.cooldowns[action] = 2
            pushLog(logs, 'player', '会社行動', `${player.name}が広告を実行。会社資金 -${formatCurrency(cost)}、現金 +${formatCurrency(220)}。`, 'up')
            applyCorrelation(stockKey, delta, logs)
            break
        }

        case FACILITY_INVESTMENT_ACTION: {
            const cost = 700
            if (player.companyFunds < cost) {
                pushLog(logs, 'system', '会社資金不足', `${player.name}は設備投資に必要な会社資金が不足しています。`, 'warn')
                return
            }

            player.companyFunds -= cost
            player.marketBias += 2
            moveStockPrice(stockKey, 4, logs)
            player.cooldowns[action] = 2
            pushLog(logs, 'player', '会社行動', `${player.name}が設備投資を実行。中長期の期待で自社株に追い風が出ています。`, 'up')
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

function handleDraftChange(nextDraft: BattleActionDraft): void {
    actionDraft.value = nextDraft
}

function handleConfirmTurn(): void {
    const payload = buildBattleConfirmedAction(activePlayer.value, actionProjection.value)
    if (!payload) {
        return
    }

    handleTurn(payload)
    actionDraft.value = createDefaultBattleActionDraft()
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
        pushLog(logs, 'player', '待機', `${player.name}はこのターンを待機し、大きな行動を見送りました。`, 'up')
    } else if (payload.companyAction !== NO_COMPANY_ACTION) {
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

        <ActionHistoryPanel class="history-panel" :preview="actionProjection.preview" :player1-name="leftPlayer.name"
            :player2-name="rightPlayer.name" :cpu-stats="cpuMarketStats" />

        <ActionPanel class="action-panel-slot" :current-player="activePlayer" :draft="actionDraft"
            :projection="actionProjection" @update:draft="handleDraftChange" @confirm="handleConfirmTurn" />
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
    grid-template-columns: minmax(176px, 0.82fr) minmax(0, 4.8fr) minmax(176px, 0.82fr) minmax(260px, 1.08fr);
    grid-template-rows: 34px minmax(0, 1fr) minmax(206px, 0.66fr);
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

.history-panel {
    grid-area: history;
}

.action-panel-slot {
    grid-area: action;
}

@media (min-width: 1700px) {
    .battle-screen {
        grid-template-columns: minmax(188px, 0.86fr) minmax(0, 5.2fr) minmax(188px, 0.86fr) minmax(278px, 1.14fr);
        grid-template-rows: 36px minmax(0, 1fr) minmax(214px, 0.68fr);
    }
}

@media (max-width: 1480px) {
    .battle-screen {
        grid-template-columns: minmax(154px, 0.78fr) minmax(0, 4.1fr) minmax(154px, 0.78fr) minmax(234px, 0.98fr);
        grid-template-rows: 34px minmax(0, 1fr) minmax(194px, 0.62fr);
        gap: 7px;
        padding: 7px 8px 8px;
    }
}
</style>


