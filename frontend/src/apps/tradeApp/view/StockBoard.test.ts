import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { StockState } from '../api/types/game'
import StockBoard from './StockBoard.vue'

function createStocks(): StockState[] {
  return [
    {
      key: 'market',
      name: 'Market Corp',
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
      name: 'Player1 Inc',
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
      name: 'Player2 Inc',
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

function createCommittedStocks(): StockState[] {
  return [
    {
      ...createStocks()[0],
      currentPrice: 1015000,
      previousPrice: 1010000,
      history: [1000000, 1020000, 998000, 1010000, 1015000],
    },
    {
      ...createStocks()[1],
      currentPrice: 1055000,
      previousPrice: 1040000,
      history: [1000000, 1020000, 998000, 1040000, 1055000],
    },
    {
      ...createStocks()[2],
      currentPrice: 986000,
      previousPrice: 993000,
      history: [1000000, 970000, 999000, 993000, 986000],
    },
  ]
}

function createLongHistoryStocks(): StockState[] {
  return [
    {
      key: 'market',
      name: 'Market Corp',
      basePrice: 1000000,
      currentPrice: 1080000,
      previousPrice: 1070000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000, 1010000, 1020000, 1030000, 1040000, 1050000, 1060000, 1070000, 1080000],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p1',
      name: 'Player1 Inc',
      basePrice: 1000000,
      currentPrice: 1090000,
      previousPrice: 1080000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000, 1015000, 1030000, 1045000, 1055000, 1065000, 1075000, 1080000, 1090000],
      shortInterest: 0,
      correlationNote: '',
    },
    {
      key: 'p2',
      name: 'Player2 Inc',
      basePrice: 1000000,
      currentPrice: 980000,
      previousPrice: 985000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000, 998000, 995000, 992000, 990000, 988000, 986000, 985000, 980000],
      shortInterest: 0,
      correlationNote: '',
    },
  ]
}

describe('StockBoard', () => {
  it('renders one shared chart with active markers and top labels without showing marker detail by default', () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: createProjectedPrices(),
        interactivePlayerId: 'player1',
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            positionId: 'position-1',
            pnl: 12000,
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
            pnl: -8000,
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
    const chartSvgStyle = wrapper.find('.chart-svg').attributes('style')
    expect(wrapper.findAll('.chart-svg')).toHaveLength(1)
    expect(wrapper.find('.shared-chart').attributes('data-preview-zoom')).toBe('true')
    expect(chartSvgStyle).toContain('--chart-commit-duration')
    expect(wrapper.find('[data-chart-backdrop]').exists()).toBe(true)
    expect(wrapper.findAll('[data-series]')).toHaveLength(3)
    expect(wrapper.findAll('[data-order-marker]')).toHaveLength(2)
    expect(wrapper.findAll('[data-series-label]')).toHaveLength(3)
    expect(wrapper.findAll('[data-series-projection]')).toHaveLength(3)
    expect(quoteNames).toContain('Player1')
    expect(quoteNames).toContain('Player2')
    expect(legendNames).toContain('Player1')
    expect(legendNames).toContain('Player2')
    expect(wrapper.find('[data-series-label="market"]').text()).toContain('1,010,000')
    expect(wrapper.find('[data-series-label="p1"]').text()).toContain('1,040,000')
    expect(wrapper.findAll('.price-label').map((node) => node.text())).toEqual(['1,050,000', '1,000,000'])
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-player-marker')).toBe('P1')
    expect(wrapper.find('[data-order-marker="marker-1"]').attributes('data-marker-clickable')).toBe('true')
    expect(wrapper.find('[data-order-marker="marker-1"]').classes()).toContain('is-pending-close')
    expect(wrapper.find('[data-order-marker="marker-1"] .order-marker__pending-ring').exists()).toBe(false)
    expect(wrapper.find('[data-order-marker="marker-1"] .order-marker__pending-ring-mover').exists()).toBe(true)
    expect(wrapper.find('[data-order-marker="marker-1"] .order-marker__pending-ring-mover animate[attributeName="cx"]').exists()).toBe(true)
    expect(wrapper.find('[data-order-marker="marker-1"] .order-marker__pending-ring-mover animate[attributeName="cy"]').exists()).toBe(true)
    expect(wrapper.find('[data-order-marker="marker-2"]').attributes('data-player-marker')).toBe('P2')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').exists()).toBe(true)
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').attributes('d')).toContain('L')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__path').attributes('d')).not.toContain('C')
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__halo').exists()).toBe(true)
    expect(wrapper.find('[data-series-projection="market"] .chart-projection__ripple').exists()).toBe(true)
    expect(wrapper.find('[data-series-projection="p1"] .chart-projection__point').exists()).toBe(true)
    expect(wrapper.find('[data-commit-line="market"]').exists()).toBe(false)
    expect(wrapper.find('[data-selected-marker-summary="marker-1"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('P1')
  })

  it('renders commit overlay along the projected line only while resolved animation is active', () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createCommittedStocks(),
        turn: 3,
        projectedPrices: null,
        resolvedAnimation: {
          id: 9,
          stocks: createStocks(),
          projectedPrices: createProjectedPrices(),
        },
        resolvedAnimationDurationMs: 760,
      },
    })

    expect(wrapper.find('.shared-chart').attributes('data-commit-animation')).toBe('true')
    expect(wrapper.find('.chart-svg').attributes('style')).toContain('--chart-commit-duration: 760ms')
    expect(wrapper.find('[data-commit-line="market"] .chart-commit__main').attributes('pathLength')).toBe('100')
    expect(wrapper.find('[data-commit-line="p1"]').exists()).toBe(true)
    expect(wrapper.find('[data-series-label="market"]').text()).toContain('1,010,000')
  })

  it('emits close-position when the active player marker label is clicked', async () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: createProjectedPrices(),
        interactivePlayerId: 'player1',
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            positionId: 'position-1',
            pnl: 12000,
            side: 'buy',
            executionPrice: 1040000,
            historyIndex: 3,
            turn: 2,
          },
          {
            id: 'marker-2',
            stockKey: 'p2',
            playerId: 'player2',
            positionId: 'position-2',
            pnl: -8000,
            side: 'sell',
            executionPrice: 993000,
            historyIndex: 3,
            turn: 3,
          },
        ],
      },
    })

    expect(wrapper.find('[data-selected-marker-summary="marker-1"]').exists()).toBe(false)

    await wrapper.find('[data-order-marker="marker-1"] .order-marker__text').trigger('click')

    expect(wrapper.emitted('close-position')).toEqual([['position-1']])
    const markerDetail = wrapper.find('[data-selected-marker-summary="marker-1"]')
    expect(markerDetail.exists()).toBe(true)
    expect(markerDetail.text()).toContain('1,040,000')
    expect(markerDetail.text()).toContain('+12,000')
    const connector = markerDetail.find('.marker-detail__connector')
    expect(Number(connector.attributes('y2'))).toBeGreaterThan(Number(connector.attributes('y1')))
  })

  it('closes marker detail when another place is clicked', async () => {
    const wrapper = mount(StockBoard, {
      attachTo: document.body,
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: createProjectedPrices(),
        interactivePlayerId: 'player1',
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            positionId: 'position-1',
            pnl: 12000,
            side: 'buy',
            executionPrice: 1040000,
            historyIndex: 3,
            turn: 2,
          },
          {
            id: 'marker-2',
            stockKey: 'p2',
            playerId: 'player2',
            positionId: 'position-2',
            pnl: -8000,
            side: 'sell',
            executionPrice: 993000,
            historyIndex: 3,
            turn: 3,
          },
        ],
      },
    })

    try {
      await wrapper.find('[data-order-marker="marker-1"] .order-marker__text').trigger('click')
      expect(wrapper.find('[data-selected-marker-summary="marker-1"]').exists()).toBe(true)

      await wrapper.find('.shared-chart').trigger('click')
      expect(wrapper.find('[data-selected-marker-summary="marker-1"]').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('closes marker detail when the same marker is clicked again', async () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: createProjectedPrices(),
        interactivePlayerId: 'player1',
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            positionId: 'position-1',
            pnl: 12000,
            side: 'buy',
            executionPrice: 1040000,
            historyIndex: 3,
            turn: 2,
          },
        ],
      },
    })

    const markerText = wrapper.find('[data-order-marker="marker-1"] .order-marker__text')

    await markerText.trigger('click')
    expect(wrapper.find('[data-selected-marker-summary="marker-1"]').exists()).toBe(true)

    await markerText.trigger('click')

    expect(wrapper.emitted('close-position')).toEqual([['position-1'], ['position-1']])
    expect(wrapper.find('[data-selected-marker-summary="marker-1"]').exists()).toBe(false)
  })

  it('dims other series, markers, price tags, and projections when a focus target is selected', async () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createStocks(),
        turn: 3,
        projectedPrices: createProjectedPrices(),
        interactivePlayerId: 'player1',
        orderMarkers: [
          {
            id: 'marker-1',
            stockKey: 'p1',
            playerId: 'player1',
            positionId: 'position-1',
            pnl: 12000,
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

  it('keeps older history visible without rendering chart navigation controls', () => {
    const wrapper = mount(StockBoard, {
      props: {
        stocks: createLongHistoryStocks(),
        turn: 5,
        projectedPrices: null,
        interactivePlayerId: 'player1',
        orderMarkers: [
          {
            id: 'marker-old',
            stockKey: 'p1',
            playerId: 'player1',
            positionId: 'position-old',
            pnl: 6000,
            side: 'buy',
            executionPrice: 1000000,
            historyIndex: 0,
            turn: 1,
          },
        ],
      },
    })

    expect(wrapper.find('[data-history-controls]').exists()).toBe(false)
    expect(wrapper.find('[data-order-marker="marker-old"]').exists()).toBe(true)
    expect(wrapper.find('[data-series="market"] path.line-main').attributes('d')).toContain('L')
  })
})
