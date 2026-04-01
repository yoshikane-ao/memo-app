import { describe, expect, it } from 'vitest'
import type { PlayerState, StockState } from '../api/types/game'
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
} from '../api/types/game'
import {
  buildBattleActionProjection,
  createDefaultBattleActionDraft,
  isBattleTurnComplete,
  resolveEffectiveTradeAction,
  resolveNextBattlePlayer,
  resolveTurnLeadPlayer,
} from './tradeBattle'
import {
  calculateTradeImpactAmounts,
  calculateDynamicPriceLines,
  calculateTradePriceImpact,
  MIN_TRADE_ORDER_AMOUNT,
  resolveTradeImpactPattern,
} from './tradeImpact'

function createStocks(): StockState[] {
  return [
    {
      key: 'p1',
      name: 'Player1会社',
      basePrice: 10000,
      currentPrice: 10000,
      previousPrice: 10000,
      bubbleUpper: 30000,
      bubbleLower: 7200,
      history: [10000],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p2',
      name: 'Player2会社',
      basePrice: 10000,
      currentPrice: 10000,
      previousPrice: 10000,
      bubbleUpper: 30000,
      bubbleLower: 6600,
      history: [10000],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'market',
      name: 'マーケット',
      basePrice: 10000,
      currentPrice: 10000,
      previousPrice: 10000,
      bubbleUpper: 30000,
      bubbleLower: 7800,
      history: [10000],
      shortInterest: 0,
      correlationNote: '',
    },
  ]
}

function createPlayer(): PlayerState {
  return {
    id: 'player1',
    name: 'PLAYER 1',
    cash: 20000,
    companyFunds: 3000,
    managementStakeShares: 30,
    startingOwnStockPrice: 10000,
    holdings: {
      p1: { quantity: 0, avgPrice: 0 },
      p2: { quantity: 0, avgPrice: 0 },
      market: { quantity: 0, avgPrice: 0 },
    },
    shorts: {
      p1: { quantity: 0, avgPrice: 0 },
      p2: { quantity: 0, avgPrice: 0 },
      market: { quantity: 0, avgPrice: 0 },
    },
    positions: [],
    speculation: [],
    cooldowns: {
      [CAPITAL_INCREASE_ACTION]: 0,
      [AD_CAMPAIGN_ACTION]: 0,
      [BUYBACK_ACTION]: 0,
      [FACILITY_INVESTMENT_ACTION]: 0,
    },
    recentCashChange: 0,
    recentNetChange: 0,
    marketBias: 0,
    lastSnapshotAssets: 0,
    lastSnapshotCash: 20000,
  }
}

describe('buildBattleActionProjection', () => {
  it('moves price by the full invested amount', () => {
    expect(calculateTradePriceImpact(10000, 10000, 10000)).toBe(10000)
    expect(calculateTradePriceImpact(25000, 10000, 10000)).toBe(25000)
    expect(calculateTradePriceImpact(9000, 10000, 10000)).toBe(9000)
    expect(calculateTradePriceImpact(1000, 1000, 1000)).toBe(1000)
    expect(calculateTradePriceImpact(100, 100, 100)).toBe(100)
    expect(calculateTradePriceImpact(200000, 100000, 100000)).toBe(200000)
  })

  it('uses the exact self-buy percentages for player1', () => {
    expect(calculateTradeImpactAmounts('player1', 'p1', 'buy', 10000, 10000, 10000)).toEqual({
      p1: 10000,
      p2: -2500,
      market: -5000,
    })
  })

  it('uses the exact rival-buy percentages for player1', () => {
    expect(calculateTradeImpactAmounts('player1', 'p2', 'buy', 10000, 10000, 10000)).toEqual({
      p1: -5000,
      p2: 10000,
      market: -5000,
    })
  })

  it('uses the exact market-buy percentages for player1', () => {
    expect(calculateTradeImpactAmounts('player1', 'market', 'buy', 10000, 10000, 10000)).toEqual({
      p1: 5000,
      p2: 5000,
      market: 10000,
    })
  })

  it('uses the exact reverse percentages for sell', () => {
    expect(calculateTradeImpactAmounts('player1', 'p1', 'sell', 10000, 10000, 10000)).toEqual({
      p1: -10000,
      p2: 2500,
      market: 5000,
    })
  })

  it('disables bubble and bottom lines', () => {
    const lines = calculateDynamicPriceLines(10000, 24000, 24000, 24000)

    expect(lines.bubbleLine).toBe(0)
    expect(lines.bottomReboundLine).toBe(0)
    expect(lines.bubbleBand).toBe(0)
    expect(lines.bottomBand).toBe(0)
  })

  it('keeps the same threshold when only the available cash changes', () => {
    const linesA = calculateDynamicPriceLines(10000, 24000, 24000, 0)
    const linesB = calculateDynamicPriceLines(10000, 24000, 24000, 12000)

    expect(linesA.bubbleLine).toBe(linesB.bubbleLine)
    expect(linesA.bottomReboundLine).toBe(linesB.bottomReboundLine)
  })

  it('keeps line values disabled even if totals change', () => {
    const lines = calculateDynamicPriceLines(10000, 24000, 12000, 6000)

    expect(lines.bubbleLine).toBe(0)
    expect(lines.bottomReboundLine).toBe(0)
  })

  it('scales the threshold with total game funds', () => {
    const lines = calculateDynamicPriceLines(10000, 100000, 100000, 100000)

    expect(lines.bubbleLine).toBe(0)
    expect(lines.bottomReboundLine).toBe(0)
  })

  it('guards against zero totals without producing invalid numbers', () => {
    const lines = calculateDynamicPriceLines(1000, 0, 0, 0)

    expect(Number.isFinite(lines.assetHeat)).toBe(true)
    expect(Number.isFinite(lines.bubbleLine)).toBe(true)
    expect(Number.isFinite(lines.bottomReboundLine)).toBe(true)
    expect(lines.bubbleLine).toBe(0)
    expect(lines.bottomReboundLine).toBe(0)
  })

  it('uses the moved price as the projected execution price', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = 10000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.projectedExecutionPrice).toBe(20000)
    expect(projection.estimatedShares).toBeCloseTo(0.5, 4)
  })

  it('keeps a 5000 yen buy move on million-yen charts at exactly 5000 yen', () => {
    const highPriceStocks = createStocks().map((stock) => ({
      ...stock,
      basePrice: 1000000,
      currentPrice: 1000000,
      previousPrice: 1000000,
      history: [1000000],
    }))

    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = 5000

    const projection = buildBattleActionProjection(createPlayer(), highPriceStocks, draft)

    expect(projection.projectedExecutionPrice).toBe(1005000)
  })

  it('keeps a 5000 yen sell move on million-yen charts at exactly 5000 yen', () => {
    const highPriceStocks = createStocks().map((stock) => ({
      ...stock,
      basePrice: 1000000,
      currentPrice: 1005000,
      previousPrice: 1005000,
      history: [1005000],
    }))

    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'sell'
    draft.quantity = 5000

    const projection = buildBattleActionProjection(createPlayer(), highPriceStocks, draft)

    expect(projection.projectedExecutionPrice).toBe(1000000)
  })

  it('uses the exact player1 self-buy pattern', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'p1'
    draft.tradeAction = 'buy'
    draft.quantity = 20000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)
    const previewLevels = Object.fromEntries(
      projection.preview.stockImpactPreview.map((item) => [item.key, item.level]),
    )

    expect(resolveTradeImpactPattern('player1', 'p1', 'buy')).toEqual({
      p1: 1,
      p2: -0.25,
      market: -0.5,
    })
    expect(previewLevels).toEqual({ p1: 'strong-up', p2: 'strong-down', market: 'strong-down' })
  })

  it('uses the exact player2 self-buy pattern', () => {
    expect(resolveTradeImpactPattern('player2', 'p2', 'buy')).toEqual({
      p1: -0.25,
      p2: 1,
      market: -0.5,
    })
  })

  it('treats sell as the exact reverse of buy for all linked charts', () => {
    expect(resolveTradeImpactPattern('player1', 'p1', 'sell')).toEqual({
      p1: -1,
      p2: 0.25,
      market: 0.5,
    })
    expect(resolveTradeImpactPattern('player1', 'market', 'sell')).toEqual({
      p1: -0.5,
      p2: -0.5,
      market: -1,
    })
  })

  it('moves both player charts up by half when buying market', () => {
    expect(resolveTradeImpactPattern('player1', 'market', 'buy')).toEqual({
      p1: 0.5,
      p2: 0.5,
      market: 1,
    })
  })

  it('uses the stronger self-down pattern when buying the rival rate', () => {
    expect(resolveTradeImpactPattern('player1', 'p2', 'buy')).toEqual({
      p1: -0.5,
      p2: 1,
      market: -0.5,
    })
  })

  it('uses the exact player2 rival-buy pattern', () => {
    expect(resolveTradeImpactPattern('player2', 'p1', 'buy')).toEqual({
      p1: 1,
      p2: -0.5,
      market: -0.5,
    })
  })

  it('keeps sell as an explicit downward action', () => {
    const player = createPlayer()
    player.shorts.market = { quantity: 1, avgPrice: 100 }

    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'sell'
    draft.quantity = 10000

    const projection = buildBattleActionProjection(player, createStocks(), draft)
    const marketPreview = projection.preview.stockImpactPreview.find((item) => item.key === 'market')

    expect(resolveEffectiveTradeAction(player, 'market', 'sell')).toBe('sell')
    expect(marketPreview?.level).toBe('strong-down')
  })

  it('allows buy while a short position exists on the same chart if cash is sufficient', () => {
    const player = createPlayer()
    player.shorts.market = { quantity: 1, avgPrice: 10000 }

    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = 5000

    const projection = buildBattleActionProjection(player, createStocks(), draft)

    expect(projection.selectedShortQuantity).toBeGreaterThan(0)
    expect(projection.isCashInsufficient).toBe(false)
    expect(projection.canSubmitTrade).toBe(true)
  })

  it('allows sell while a buy position exists on the same chart if cash is sufficient', () => {
    const player = createPlayer()
    player.holdings.market = { quantity: 1, avgPrice: 10000 }

    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'sell'
    draft.quantity = 5000

    const projection = buildBattleActionProjection(player, createStocks(), draft)

    expect(projection.selectedHoldingQuantity).toBeGreaterThan(0)
    expect(projection.isCashInsufficient).toBe(false)
    expect(projection.canSubmitTrade).toBe(true)
  })

  it('allows an order below the current chart price and still moves by the full order amount', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'p1'
    draft.tradeAction = 'buy'
    draft.quantity = 5000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.estimatedShares).toBeGreaterThan(0)
    expect(projection.canSubmitTrade).toBe(true)
    expect(projection.projectedExecutionPrice).toBe(15000)
    expect(projection.estimatedShares).toBeCloseTo(5000 / 15000, 4)
  })

  it('blocks buy orders that exceed available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = 30000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(true)
    expect(projection.canSubmitTrade).toBe(false)
  })

  it('allows buy orders that fit within available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = 10000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(false)
    expect(projection.canSubmitTrade).toBe(true)
  })

  it('blocks sell orders that exceed available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'sell'
    draft.quantity = 30000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(true)
    expect(projection.canSubmitTrade).toBe(false)
  })

  it('allows sell orders that fit within available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'sell'
    draft.quantity = 10000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(false)
    expect(projection.canSubmitTrade).toBe(true)
  })

  it('blocks trade orders below the minimum investment amount', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = MIN_TRADE_ORDER_AMOUNT - 1

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.estimatedShares).toBe(0)
    expect(projection.executedAmount).toBe(MIN_TRADE_ORDER_AMOUNT - 1)
    expect(projection.canSubmitTrade).toBe(false)
  })

  it('starts odd turns with player1 and even turns with player2', () => {
    expect(resolveTurnLeadPlayer(1)).toBe('player1')
    expect(resolveTurnLeadPlayer(2)).toBe('player2')
    expect(resolveTurnLeadPlayer(3)).toBe('player1')
    expect(resolveTurnLeadPlayer(4)).toBe('player2')
  })

  it('switches to the other player after the first action of a turn', () => {
    expect(resolveNextBattlePlayer('player1', 1)).toBe('player2')
    expect(resolveNextBattlePlayer('player2', 2)).toBe('player1')
  })

  it('moves to the next turn starter after the second action of a turn', () => {
    expect(resolveNextBattlePlayer('player2', 1)).toBe('player2')
    expect(resolveNextBattlePlayer('player1', 2)).toBe('player1')
    expect(resolveNextBattlePlayer('player2', 3)).toBe('player2')
    expect(resolveNextBattlePlayer('player1', 4)).toBe('player1')
  })

  it('treats the second player action as the end of the turn', () => {
    expect(isBattleTurnComplete('player1', 1)).toBe(false)
    expect(isBattleTurnComplete('player2', 1)).toBe(true)
    expect(isBattleTurnComplete('player2', 2)).toBe(false)
    expect(isBattleTurnComplete('player1', 2)).toBe(true)
  })
})
