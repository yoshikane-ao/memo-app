import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { StockState } from '../api/types/game'
import StockBoard from './StockBoard.vue'

function createStocks(): StockState[] {
  return [
    {
      key: 'market',
      name: 'マーケット',
      basePrice: 10000,
      currentPrice: 10010,
      previousPrice: 9980,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [10000, 10020, 9980, 10010],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p1',
      name: 'Player1会社',
      basePrice: 10000,
      currentPrice: 10040,
      previousPrice: 9980,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [10000, 10020, 9980, 10040],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p2',
      name: 'Player2会社',
      basePrice: 10000,
      currentPrice: 9930,
      previousPrice: 9990,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [10000, 9970, 9990, 9930],
      shortInterest: 0,
      correlationNote: '',
    },
  ]
}

describe('StockBoard', () => {
  it('renders order markers with player and side labels', () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            side: 'buy',
            executionPrice: 10040,
            historyIndex: 3,
            turn: 2,
          },
          {
            id: 'marker-2',
            stockKey: 'p2',
            playerId: 'player2',
            side: 'sell',
            executionPrice: 9930,
            historyIndex: 3,
            turn: 3,
          },
        ],
      },
    })

    expect(wrapper.findAll('[data-order-marker]')).toHaveLength(2)
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-player-marker')).toBe('P1')
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-side')).toBe('buy')
    expect(wrapper.find('[data-order-marker="marker-2"]').attributes('data-player-marker')).toBe('P2')
    expect(wrapper.find('[data-order-marker="marker-2"]').attributes('data-side')).toBe('sell')
    expect(wrapper.text()).toContain('P1 買い')
    expect(wrapper.text()).toContain('P2 売り')
  })
})
