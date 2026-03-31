import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PlayerState, StockState } from '../api/types/game'
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
} from '../api/types/game'
import PlayerPanel from './PlayerPanel.vue'

function createStocks(): StockState[] {
  return [
    {
      key: 'p1',
      name: 'Player1会社',
      basePrice: 10000,
      currentPrice: 10000,
      previousPrice: 10000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [10000],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p2',
      name: 'Player2会社',
      basePrice: 10000,
      currentPrice: 9800,
      previousPrice: 9800,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [9800],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'market',
      name: 'マーケット',
      basePrice: 10000,
      currentPrice: 10000,
      previousPrice: 10000,
      bubbleUpper: 0,
      bubbleLower: 0,
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
      p1: { quantity: 1, avgPrice: 10000 },
      p2: { quantity: 0, avgPrice: 0 },
      market: { quantity: 0, avgPrice: 0 },
    },
    shorts: {
      p1: { quantity: 0, avgPrice: 0 },
      p2: { quantity: 0, avgPrice: 0 },
      market: { quantity: 0, avgPrice: 0 },
    },
    positions: [
      {
        id: 'position-1',
        stockKey: 'p1',
        side: 'buy',
        quantity: 1,
        entryPrice: 10000,
        orderAmount: 10000,
        openedTurn: 1,
      },
    ],
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
    lastSnapshotAssets: 20000,
    lastSnapshotCash: 20000,
  }
}

describe('PlayerPanel', () => {
  it('shows pending close state and projected close price', () => {
    const wrapper = mount(PlayerPanel, {
      props: {
        player: createPlayer(),
        stocks: createStocks(),
        projectedPrices: {
          p1: 9500,
        },
        pendingClose: {
          positionId: 'position-1',
          executionPrice: 9500,
          realizedPnl: -500,
        },
        isActive: true,
        victoryValue: 20000,
        victoryDiff: 0,
      },
    })
    const normalizedText = wrapper.text().replace(/\s+/g, '')

    expect(normalizedText).toContain('決済保留中')
    expect(normalizedText).toContain('決済価格')
    expect(normalizedText).toContain('9,500円')
    expect(normalizedText).toContain('決済損益')
    expect(normalizedText).toContain('-500円')
    expect(normalizedText).toContain('保留解除')
  })
})
