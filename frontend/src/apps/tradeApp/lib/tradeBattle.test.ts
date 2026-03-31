import { describe, expect, it } from 'vitest'
import type { PlayerState, StockState } from '../api/types/game'
import { buildBattleActionProjection, createDefaultBattleActionDraft } from './tradeBattle'

function createStocks(): StockState[] {
  return [
    {
      key: 'p1',
      name: 'プレイヤー1会社株',
      currentPrice: 120,
      previousPrice: 120,
      bubbleUpper: 180,
      bubbleLower: 60,
      history: [120],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p2',
      name: 'プレイヤー2会社株',
      currentPrice: 90,
      previousPrice: 90,
      bubbleUpper: 170,
      bubbleLower: 55,
      history: [90],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'market',
      name: '市場株',
      currentPrice: 100,
      previousPrice: 100,
      bubbleUpper: 160,
      bubbleLower: 50,
      history: [100],
      shortInterest: 0,
      correlationNote: '',
    },
  ]
}

function createPlayer(): PlayerState {
  return {
    id: 'player1',
    name: 'プレイヤー1',
    cash: 5000,
    companyFunds: 3000,
    managementStakeShares: 30,
    startingOwnStockPrice: 120,
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
    speculation: [],
    cooldowns: {
      増資: 0,
      広告: 0,
      自社株買い: 0,
      設備投資: 0,
    },
    recentCashChange: 0,
    recentNetChange: 0,
    marketBias: 0,
    lastSnapshotAssets: 0,
    lastSnapshotCash: 5000,
  }
}

describe('buildBattleActionProjection', () => {
  it('blocks buy orders that exceed available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = 10000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(true)
    expect(projection.canSubmitTrade).toBe(false)
    expect(projection.executionEstimateText).toContain('現金不足')
  })

  it('allows buy orders that fit within available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'buy'
    draft.quantity = 5000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(false)
    expect(projection.canSubmitTrade).toBe(true)
  })

  it('blocks short orders that exceed available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'short'
    draft.quantity = 10000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(true)
    expect(projection.canSubmitTrade).toBe(false)
  })

  it('allows short orders that fit within available cash', () => {
    const draft = createDefaultBattleActionDraft()
    draft.stockKey = 'market'
    draft.tradeAction = 'short'
    draft.quantity = 5000

    const projection = buildBattleActionProjection(createPlayer(), createStocks(), draft)

    expect(projection.isCashInsufficient).toBe(false)
    expect(projection.canSubmitTrade).toBe(true)
  })
})
