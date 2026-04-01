import { mount } from '@vue/test-utils'
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
} from '../lib/tradeBattle'
import ActionPanel from './ActionPanel.vue'

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
      currentPrice: 10000,
      previousPrice: 10000,
      bubbleUpper: 0,
      bubbleLower: 0,
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
    lastSnapshotAssets: 20000,
    lastSnapshotCash: 20000,
  }
}

describe('ActionPanel', () => {
  it('renders all trade input blocks and helper information', () => {
    const currentPlayer = createPlayer()
    const draft = createDefaultBattleActionDraft()
    draft.quantity = 10000
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft)

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        draft,
        projection,
      },
    })
    const normalizedText = wrapper.text().replace(/\s+/g, '')

    expect(wrapper.findAll('.trade-grid > .card')).toHaveLength(5)
    expect(normalizedText).toContain('1行動')
    expect(normalizedText).toContain('2対象レート')
    expect(normalizedText).toContain('3方式/操作')
    expect(normalizedText).toContain('4注文金額')
    expect(normalizedText).toContain('5確認')
    expect(normalizedText).toContain('現在10,000円')
    expect(normalizedText).toContain('注文額10,000円')
  })

  it('renders pending close confirmation summary', () => {
    const currentPlayer = createPlayer()
    const draft = createDefaultBattleActionDraft()
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft)

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        draft,
        projection,
        pendingClose: {
          stockName: 'マーケット',
          side: 'buy',
          executionPriceText: '9,500円',
          projectedPnlText: '+500円',
          returnedCashText: '10,500円',
        },
      },
    })
    const normalizedText = wrapper.text().replace(/\s+/g, '')

    expect(normalizedText).toContain('マーケットの買いポジションを決済')
    expect(normalizedText).toContain('想定約定9,500円')
    expect(normalizedText).toContain('回収10,500円')
    expect(normalizedText).toContain('損益+500円')
    expect(normalizedText).toContain('ポジション決済を確定')
  })

  it('allows selecting sell even when a buy position remains open', async () => {
    const currentPlayer = createPlayer()
    currentPlayer.holdings.market = { quantity: 1, avgPrice: 10000 }
    const draft = createDefaultBattleActionDraft()
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft)

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        draft,
        projection,
      },
    })

    const tradeActionSegments = wrapper.findAll('.mode-card .segment.segment-2')
    const tradeActionButtons = tradeActionSegments[1]?.findAll('button') ?? []
    const sellButton = tradeActionButtons[1]

    expect(sellButton).toBeDefined()
    expect(sellButton?.attributes('disabled')).toBeUndefined()

    await sellButton?.trigger('click')

    const updates = wrapper.emitted('update:draft') ?? []
    expect(updates.length).toBeGreaterThan(0)
    expect(updates.at(-1)?.[0]).toMatchObject({ tradeAction: 'sell' })
  })
})
