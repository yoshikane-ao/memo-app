import type {
  PlayerId,
  PlayerState,
  StockKey,
  StockState,
  TradePositionEntry,
  TurnActionPayload,
} from '../../api/types/game'
import {
  AD_CAMPAIGN_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
} from '../../api/types/game'
import {
  calculateTradePositionCloseImpactAmount,
  calculateTradePositionPnL,
  calculateTradePositionSettlementCash,
  formatCurrency,
  formatSignedCurrency,
} from '../../api/utils/gameCalculations'
import type { BattleActionDraft, BattleActionProjection } from '../../lib/tradeBattle'
import { calculateTradeImpactAmounts, resolvePriceAfterDelta } from '../../lib/tradeImpact'
import { resolveOwnStockKey } from '../../lib/tradeBattleState'

export type BattleClosePreview = {
  positionId: string
  stockKey: StockKey
  stockName: string
  side: TradePositionEntry['side']
  executionPrice: number
  realizedPnl: number
  returnedCash: number
  priceMap: Record<StockKey, number>
}

export type PendingCloseSummary = {
  stockName: string
  side: TradePositionEntry['side']
  executionPriceText: string
  projectedPnlText: string
  returnedCashText: string
}

export type BattleResultSummary = {
  title: string
  tone: 'player1' | 'player2' | 'draw'
}

export type ChartOrderMarker = {
  id: string
  stockKey: StockKey
  playerId: PlayerId
  positionId?: string
  pnl?: number
  side: 'buy' | 'sell'
  isPendingClose?: boolean
  executionPrice: number
  historyIndex: number
  turn: number
}

function getStock(stocks: StockState[], stockKey: StockKey): StockState {
  const stock = stocks.find((item) => item.key === stockKey)
  if (!stock) {
    throw new Error(`Stock not found: ${stockKey}`)
  }

  return stock
}

export function createCurrentPriceMap(stocks: StockState[]): Record<StockKey, number> {
  return stocks.reduce<Record<StockKey, number>>(
    (acc, stock) => {
      acc[stock.key] = stock.currentPrice
      return acc
    },
    { p1: 0, p2: 0, market: 0 },
  )
}

export function cloneStockSnapshots(stocks: StockState[]): StockState[] {
  return stocks.map((stock) => ({
    ...stock,
    history: [...stock.history],
  }))
}

export function hasProjectedChartMovement(
  projectedPrices: Partial<Record<StockKey, number>> | null,
  stocks: StockState[],
): projectedPrices is Partial<Record<StockKey, number>> {
  if (!projectedPrices) {
    return false
  }

  const currentPrices = createCurrentPriceMap(stocks)

  return (['market', 'p1', 'p2'] as StockKey[]).some((key) => {
    const projectedPrice = projectedPrices[key]
    if (projectedPrice == null) {
      return false
    }

    return Math.round(projectedPrice) !== Math.round(currentPrices[key])
  })
}

function moveProjectedPrice(
  priceMap: Record<StockKey, number>,
  stock: StockState,
  rawDelta: number,
): void {
  priceMap[stock.key] = resolvePriceAfterDelta(
    priceMap[stock.key],
    stock.basePrice,
    stock.bubbleUpper,
    stock.bubbleLower,
    rawDelta,
  ).nextPrice
}

function applyProjectedTradeEffectToPriceMap(
  priceMap: Record<StockKey, number>,
  stocks: StockState[],
  playerId: PlayerId,
  stockKey: StockKey,
  tradeAction: TurnActionPayload['tradeAction'],
  orderAmount: number,
): void {
  const stock = getStock(stocks, stockKey)
  const impactAmounts = calculateTradeImpactAmounts(
    playerId,
    stockKey,
    tradeAction,
    orderAmount,
    priceMap[stockKey],
    stock.basePrice,
  )

  if (impactAmounts.p1 !== 0) {
    moveProjectedPrice(priceMap, getStock(stocks, 'p1'), impactAmounts.p1)
  }
  if (impactAmounts.p2 !== 0) {
    moveProjectedPrice(priceMap, getStock(stocks, 'p2'), impactAmounts.p2)
  }
  if (impactAmounts.market !== 0) {
    moveProjectedPrice(priceMap, getStock(stocks, 'market'), impactAmounts.market)
  }
}

export function buildPendingClosePreview(options: {
  isGameOver: boolean
  pendingClosePositionId: string | null
  player: PlayerState
  stocks: StockState[]
}): BattleClosePreview | null {
  const { isGameOver, pendingClosePositionId, player, stocks } = options

  if (isGameOver || pendingClosePositionId == null) {
    return null
  }

  const position = player.positions.find((item) => item.id === pendingClosePositionId)
  if (!position) {
    return null
  }

  const priceMap = createCurrentPriceMap(stocks)
  const executionPrice = priceMap[position.stockKey]
  const realizedPnl = calculateTradePositionPnL(position, executionPrice)
  const closeAction = position.side === 'buy' ? 'sell' : 'buy'
  const closeImpactAmount = calculateTradePositionCloseImpactAmount(position, executionPrice)

  applyProjectedTradeEffectToPriceMap(
    priceMap,
    stocks,
    player.id,
    position.stockKey,
    closeAction,
    closeImpactAmount,
  )

  return {
    positionId: position.id,
    stockKey: position.stockKey,
    stockName: getStock(stocks, position.stockKey).name,
    side: position.side,
    executionPrice,
    realizedPnl,
    returnedCash: calculateTradePositionSettlementCash(position, executionPrice),
    priceMap,
  }
}

export function buildProjectedBoardPrices(options: {
  isGameOver: boolean
  pendingClosePreview: BattleClosePreview | null
  currentPlayer: PlayerState
  actionDraft: BattleActionDraft
  actionProjection: BattleActionProjection
  stocks: StockState[]
}): Partial<Record<StockKey, number>> | null {
  const {
    isGameOver,
    pendingClosePreview,
    currentPlayer,
    actionDraft,
    actionProjection,
    stocks,
  } = options

  if (isGameOver) {
    return null
  }

  if (pendingClosePreview) {
    return pendingClosePreview.priceMap
  }

  const priceMap = createCurrentPriceMap(stocks)

  if (actionDraft.actionKind === 'wait') {
    return priceMap
  }

  if (actionDraft.actionKind === 'company') {
    const targetKey = resolveOwnStockKey(currentPlayer.id)
    const targetStock = getStock(stocks, targetKey)

    if (
      actionDraft.companyAction === CAPITAL_INCREASE_ACTION
      && currentPlayer.cooldowns[CAPITAL_INCREASE_ACTION] <= 0
    ) {
      moveProjectedPrice(priceMap, targetStock, -12)
    } else if (
      actionDraft.companyAction === AD_CAMPAIGN_ACTION
      && currentPlayer.cooldowns[AD_CAMPAIGN_ACTION] <= 0
      && currentPlayer.companyFunds >= 600
    ) {
      moveProjectedPrice(priceMap, targetStock, 6)
    } else if (
      actionDraft.companyAction === FACILITY_INVESTMENT_ACTION
      && currentPlayer.cooldowns[FACILITY_INVESTMENT_ACTION] <= 0
      && currentPlayer.companyFunds >= 700
    ) {
      moveProjectedPrice(priceMap, targetStock, 4)
    }

    return priceMap
  }

  if (!actionProjection.canSubmitTrade) {
    return null
  }

  applyProjectedTradeEffectToPriceMap(
    priceMap,
    stocks,
    currentPlayer.id,
    actionProjection.draft.stockKey,
    actionProjection.draft.tradeAction,
    actionProjection.orderAmount,
  )

  return priceMap
}

export function buildBattleResult(options: {
  isGameOver: boolean
  leftPlayer: PlayerState
  rightPlayer: PlayerState
  leftVictoryValue: number
  rightVictoryValue: number
}): BattleResultSummary | null {
  const {
    isGameOver,
    leftPlayer,
    rightPlayer,
    leftVictoryValue,
    rightVictoryValue,
  } = options

  if (!isGameOver) {
    return null
  }

  if (leftVictoryValue > rightVictoryValue) {
    return {
      title: `${leftPlayer.name} \u306e\u52dd\u5229`,
      tone: 'player1',
    }
  }

  if (rightVictoryValue > leftVictoryValue) {
    return {
      title: `${rightPlayer.name} \u306e\u52dd\u5229`,
      tone: 'player2',
    }
  }

  return {
    title: '\u5f15\u304d\u5206\u3051',
    tone: 'draw',
  }
}

export function buildPendingCloseSummary(
  pendingClosePreview: BattleClosePreview | null,
): PendingCloseSummary | null {
  if (!pendingClosePreview) {
    return null
  }

  return {
    stockName: pendingClosePreview.stockName,
    side: pendingClosePreview.side,
    executionPriceText: formatCurrency(pendingClosePreview.executionPrice),
    projectedPnlText: formatSignedCurrency(pendingClosePreview.realizedPnl),
    returnedCashText: formatCurrency(pendingClosePreview.returnedCash),
  }
}

export function buildActivePositionMarkers(options: {
  players: PlayerState[]
  stocks: StockState[]
  stockHistoryPointIds: Record<StockKey, number[]>
  pendingClosePreview: BattleClosePreview | null
  pendingClosePositionId: string | null
}): ChartOrderMarker[] {
  const {
    players,
    stocks,
    stockHistoryPointIds,
    pendingClosePreview,
    pendingClosePositionId,
  } = options

  const currentPriceMap = createCurrentPriceMap(stocks)

  return players.flatMap((player) =>
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

      const executionPrice =
        pendingClosePreview?.positionId === position.id
          ? pendingClosePreview.executionPrice
          : currentPriceMap[position.stockKey]

      return [{
        id: `position-marker-${position.id}`,
        stockKey: position.stockKey,
        playerId: player.id,
        positionId: position.id,
        pnl: calculateTradePositionPnL(position, executionPrice),
        side: position.side,
        isPendingClose: pendingClosePositionId === position.id,
        executionPrice: position.entryPrice,
        historyIndex,
        turn: position.openedTurn,
      }]
    }),
  )
}
