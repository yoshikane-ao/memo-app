import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { PlayerState, StockState } from '../types';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
} from '../types';
import { formatSignedCurrency } from '../model/gameCalculations';
import PlayerPanel from './PlayerPanel.vue';

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
  ];
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
  };
}

function normalizedText(wrapper: ReturnType<typeof mount>): string {
  return wrapper.text().replace(/\s+/g, '');
}

describe('PlayerPanel', () => {
  it('removes projected price labels and uses current pnl for pending close positions', () => {
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
    });

    const text = normalizedText(wrapper);

    expect(text).toContain('総資産');
    expect(text).toContain('決済保留中');
    expect(text).toContain('決済損益');
    expect(text).toContain(formatSignedCurrency(0).replace(/\s+/g, ''));
    expect(text).toContain('保留解除');
    expect(text).not.toContain('行動後価格');
    expect(text).not.toContain('決済価格');
    expect(text).not.toContain(formatSignedCurrency(-500).replace(/\s+/g, ''));
    expect(wrapper.find('[data-turn-flag]').exists()).toBe(true);
  });

  it('ignores pending close projected pnl and keeps the current pnl for sell positions', () => {
    const player = createPlayer();
    player.positions = [
      {
        id: 'position-2',
        stockKey: 'p2',
        side: 'sell',
        quantity: 1,
        entryPrice: 10000,
        orderAmount: 10000,
        openedTurn: 1,
      },
    ];

    const wrapper = mount(PlayerPanel, {
      props: {
        player,
        stocks: createStocks(),
        pendingClose: {
          positionId: 'position-2',
          executionPrice: 9700,
          realizedPnl: 500,
        },
        isActive: true,
        victoryValue: 20000,
        victoryDiff: 0,
      },
    });

    const text = normalizedText(wrapper);

    expect(text).toContain('決済損益');
    expect(text).toContain(formatSignedCurrency(200).replace(/\s+/g, ''));
    expect(text).not.toContain(formatSignedCurrency(500).replace(/\s+/g, ''));
  });

  it('shows a 5000 yen projected loss on million-yen charts without doubling it', () => {
    const player = createPlayer();
    player.positions = [
      {
        id: 'position-1',
        stockKey: 'market',
        side: 'buy',
        quantity: 1,
        entryPrice: 1005000,
        orderAmount: 5000,
        openedTurn: 1,
      },
    ];

    const stocks = createStocks().map((stock) =>
      stock.key === 'market'
        ? {
            ...stock,
            basePrice: 1000000,
            currentPrice: 1005000,
            previousPrice: 1005000,
            history: [1005000],
          }
        : stock,
    );

    const wrapper = mount(PlayerPanel, {
      props: {
        player,
        stocks,
        projectedPrices: {
          market: 1000000,
        },
        isActive: false,
        victoryValue: 20000,
        victoryDiff: 0,
      },
    });

    const text = normalizedText(wrapper);

    expect(text).toContain('行動後');
    expect(text).not.toContain('行動後価格');
    expect(text).toContain('-5,000円');
    expect(wrapper.find('[data-turn-flag]').exists()).toBe(false);
  });
});
