import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { PlayerPanelPositionRow, PlayerState } from '../types';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
} from '../types';
import { formatSignedCurrency } from '../../../../../shared/format/currency';
import PlayerPanel from './PlayerPanel.vue';

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
  };
}

function normalizedText(wrapper: ReturnType<typeof mount>): string {
  return wrapper.text().replace(/\s+/g, '');
}

describe('PlayerPanel', () => {
  it('renders pending close row with zero realized pnl and release label', () => {
    const positionRows: PlayerPanelPositionRow[] = [
      {
        id: 'position-1',
        targetLabel: 'Player1会社',
        orderAmountText: '10,000円',
        directionText: '買い',
        pnl: 0,
        projectedPnl: 0,
        projectedPnlLabel: '決済損益',
        isPendingClose: true,
        closeButtonLabel: '保留解除',
      },
    ];

    const wrapper = mount(PlayerPanel, {
      props: {
        player: createPlayer(),
        positionRows,
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
    expect(wrapper.find('[data-turn-flag]').exists()).toBe(true);
  });

  it('shows the precomputed projected pnl for active positions', () => {
    const positionRows: PlayerPanelPositionRow[] = [
      {
        id: 'position-1',
        targetLabel: 'マーケット',
        orderAmountText: '5,000円',
        directionText: '買い',
        pnl: 0,
        projectedPnl: -5000,
        projectedPnlLabel: '行動後',
        isPendingClose: false,
        closeButtonLabel: 'ポジション決済',
      },
    ];

    const wrapper = mount(PlayerPanel, {
      props: {
        player: createPlayer(),
        positionRows,
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
