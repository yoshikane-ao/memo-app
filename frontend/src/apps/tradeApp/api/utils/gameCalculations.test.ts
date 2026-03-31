import { describe, expect, it } from 'vitest'
import type { PlayerState, StockState } from '../types/game'
import { calculateManagementEvaluation, calculatePlayerSnapshot } from './gameCalculations'

function createStocks(): StockState[] {
  return [
    {
      key: 'p1',
      name: 'プレイヤー1会社株',
      currentPrice: 100,
      previousPrice: 100,
      bubbleUpper: 180,
      bubbleLower: 60,
      history: [100],
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
      currentPrice: 80,
      previousPrice: 80,
      bubbleUpper: 160,
      bubbleLower: 50,
      history: [80],
      shortInterest: 0,
      correlationNote: '',
    },
  ]
}

function createPlayer(): PlayerState {
  return {
    id: 'player1',
    name: 'プレイヤー1',
    cash: 12000,
    companyFunds: 3000,
    managementStakeShares: 30,
    startingOwnStockPrice: 100,
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
    lastSnapshotCash: 12000,
  }
}

describe('calculatePlayerSnapshot', () => {
  it('matches the initial cash at battle start when holdings and valuation are flat', () => {
    const stocks = createStocks()
    const player = createPlayer()

    const snapshot = calculatePlayerSnapshot(player, stocks)

    expect(snapshot.managementEvaluation).toBe(0)
    expect(snapshot.totalAssets).toBe(12000)
  })

  it('adds holdings, open pnl, and management valuation without counting company funds', () => {
    const stocks = createStocks()
    stocks[0].currentPrice = 112
    stocks[1].currentPrice = 95
    stocks[2].currentPrice = 70

    const player = createPlayer()
    player.companyFunds = 50000
    player.holdings.market = { quantity: 10, avgPrice: 60 }
    player.shorts.p2 = { quantity: 5, avgPrice: 100 }
    player.speculation = [
      {
        stockKey: 'p2',
        side: 'buy',
        quantity: 4,
        entryPrice: 90,
        settlementTurn: 3,
      },
    ]

    const managementEvaluation = calculateManagementEvaluation(player, stocks)
    const snapshot = calculatePlayerSnapshot(player, stocks)

    expect(managementEvaluation).toBe((112 - 100) * 30)
    expect(snapshot.longValue).toBe(700)
    expect(snapshot.shortPnL).toBe(25)
    expect(snapshot.speculationPnL).toBe(20)
    expect(snapshot.totalAssets).toBe(12000 + 700 + 25 + 20 + 360)
  })
})
