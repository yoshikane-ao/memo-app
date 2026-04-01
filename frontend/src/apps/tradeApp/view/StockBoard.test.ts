import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { StockState } from '../api/types/game'
import StockBoard from './StockBoard.vue'

function createStocks(): StockState[] {
  return [
    {
      key: 'market',
      name: 'マーケット',
      basePrice: 1000000,
      currentPrice: 1010000,
      previousPrice: 998000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000, 1020000, 998000, 1010000],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p1',
      name: 'Player1会社',
      basePrice: 1000000,
      currentPrice: 1040000,
      previousPrice: 998000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000, 1020000, 998000, 1040000],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p2',
      name: 'Player2会社',
      basePrice: 1000000,
      currentPrice: 993000,
      previousPrice: 999000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000, 970000, 999000, 993000],
      shortInterest: 0,
      correlationNote: '',
    },
  ]
}

function createProjectedPrices() {
  return {
    market: 1015000,
    p1: 1055000,
    p2: 986000,
  }
}

describe('StockBoard', () => {
  it('renders one shared chart with restored top labels, active markers, and price tags', () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: createProjectedPrices(),
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            side: 'buy',
            isPendingClose: true,
            executionPrice: 1040000,
            historyIndex: 3,
            turn: 2,
          },
          {
            id: 'marker-2',
            stockKey: 'p2',
            playerId: 'player2',
            side: 'sell',
            executionPrice: 993000,
            historyIndex: 3,
            turn: 3,
          },
        ],
      },
    })

    const quoteNames = wrapper.findAll('.quote-name').map((node) => node.text())
    const legendNames = wrapper.findAll('.legend-chip__label').map((node) => node.text())

    expect(wrapper.findAll('.chart-svg')).toHaveLength(1)
    expect(wrapper.find('.shared-chart').attributes('data-preview-zoom')).toBe('true')
    expect(wrapper.find('[data-chart-backdrop]').exists()).toBe(true)
    expect(wrapper.findAll('[data-series]')).toHaveLength(3)
    expect(wrapper.findAll('[data-order-marker]')).toHaveLength(2)
    expect(wrapper.findAll('[data-series-label]')).toHaveLength(3)
    expect(wrapper.findAll('[data-series-projection]')).toHaveLength(3)
    expect(wrapper.find('.board-note').exists()).toBe(false)
    expect(quoteNames).toEqual(['マーケット', 'Player1', 'Player2'])
    expect(legendNames).toEqual(['マーケット', 'Player1', 'Player2'])
    expect(wrapper.find('[data-series-label="market"]').text()).toBe('1,010,000円')
    expect(wrapper.find('[data-series-label="p1"]').text()).toBe('1,040,000円')
    expect(wrapper.findAll('.price-label').map((node) => node.text())).toEqual(['1,050,000', '1,000,000'])
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-player-marker')).toBe('P1')
    expect(wrapper.find('[data-order-marker="marker-1"]').classes()).toContain('is-pending-close')
    expect(wrapper.find('[data-order-marker="marker-1"] .order-marker__pending-ring').exists()).toBe(true)
    expect(wrapper.find('[data-order-marker="marker-2"]').attributes('data-player-marker')).toBe('P2')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').exists()).toBe(true)
    expect(wrapper.find('[data-series="market"] .line-main').attributes('pathLength')).toBe('100')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').attributes('d')).toContain('L')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').attributes('d')).not.toContain('C')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').attributes('pathLength')).toBe('100')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__halo').exists()).toBe(true)
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__ripple').exists()).toBe(true)
    expect(wrapper.find('[data-series-projection="p1"] .chart-projection__point').exists()).toBe(true)
    expect(wrapper.text()).toContain('P1 買い 保留')
  })

  it('dims other series, markers, price tags, and projections when a focus target is selected', async () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: createProjectedPrices(),
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            side: 'buy',
            isPendingClose: true,
            executionPrice: 1040000,
            historyIndex: 3,
            turn: 2,
          },
          {
            id: 'marker-2',
            stockKey: 'p2',
            playerId: 'player2',
            side: 'sell',
            executionPrice: 993000,
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
