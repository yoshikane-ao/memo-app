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
  it('renders all rate lines on one shared chart with active position markers, edge labels, and projected guides', () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: {
          market: 9900,
          p1: 10100,
          p2: 10080,
        },
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            side: 'buy',
            isPendingClose: true,
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

    expect(wrapper.findAll('.chart-svg')).toHaveLength(1)
    expect(wrapper.findAll('[data-series]')).toHaveLength(3)
    expect(wrapper.findAll('[data-order-marker]')).toHaveLength(2)
    expect(wrapper.findAll('[data-series-label]')).toHaveLength(3)
    expect(wrapper.findAll('[data-series-projection]')).toHaveLength(3)
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-player-marker')).toBe('P1')
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-side')).toBe('buy')
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-pending-close')).toBe('true')
    expect(wrapper.find('[data-order-marker="marker-1"]').classes()).toContain('is-pending-close')
    expect(wrapper.find('[data-order-marker="marker-1"] .order-marker__pending-ring').exists()).toBe(true)
    expect(wrapper.find('[data-order-marker="marker-2"]').attributes('data-player-marker')).toBe('P2')
    expect(wrapper.find('[data-order-marker="marker-2"]').attributes('data-side')).toBe('sell')
    expect(wrapper.find('[data-order-marker="marker-2"]').attributes('data-pending-close')).toBe('false')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').exists()).toBe(true)
    expect(wrapper.find('[data-series-projection="p1"] .chart-projection__point').exists()).toBe(true)
    expect(wrapper.text()).toContain('P1 買い 保留')
  })

  it('dims other series, pending markers, and projected guides when a focus target is selected', async () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: {
          market: 9900,
          p1: 10100,
          p2: 10080,
        },
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            side: 'buy',
            isPendingClose: true,
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

    const focusButton = wrapper.find('[data-focus-toggle="p1"]')
    await focusButton.trigger('click')

    expect(focusButton.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-series="p1"]').classes()).toContain('is-focused')
    expect(wrapper.find('[data-series="market"]').classes()).toContain('is-dimmed')
    expect(wrapper.find('[data-series="p2"]').classes()).toContain('is-dimmed')
    expect(wrapper.find('[data-series-label="market"]').classes()).toContain('is-dimmed')
    expect(wrapper.find('[data-series-label="p2"]').classes()).toContain('is-dimmed')
    expect(wrapper.find('[data-series-projection="market"]').classes()).toContain('is-dimmed')
    expect(wrapper.find('[data-series-projection="p2"]').classes()).toContain('is-dimmed')
    expect(wrapper.find('[data-order-marker="marker-2"]').classes()).toContain('is-dimmed')
    expect(wrapper.find('[data-order-marker="marker-1"]').classes()).not.toContain('is-dimmed')
  })
})
