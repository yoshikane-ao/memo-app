import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
  type PlayerState,
} from '../types';
import TradeHudCorner from './TradeHudCorner.vue';

function createPlayer(): PlayerState {
  return {
    id: 'player1',
    name: 'プレイヤー1',
    cash: 100000,
    companyFunds: 3000,
    managementStakeShares: 30,
    startingOwnStockPrice: 1000000,
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
    companyActionCharges: {
      [CAPITAL_INCREASE_ACTION]: 2,
      [AD_CAMPAIGN_ACTION]: 2,
      [BUYBACK_ACTION]: 2,
      [FACILITY_INVESTMENT_ACTION]: 2,
    },
    feintTokens: 2,
    recentCashChange: 0,
    recentNetChange: 0,
    marketBias: 0,
    lastSnapshotAssets: 0,
    lastSnapshotCash: 0,
  };
}

describe('TradeHudCorner', () => {
  it('renders player name, cash and total assets', () => {
    const wrapper = mount(TradeHudCorner, {
      props: {
        player: createPlayer(),
        victoryValue: 1_100_000,
        victoryDiff: 0,
        isActive: true,
        side: 'left',
      },
    });
    const text = wrapper.text().replace(/\s+/g, '');
    expect(text).toContain('プレイヤー1');
    expect(text).toContain('100,000円');
    expect(text).toContain('1,100,000円');
    expect(wrapper.find('[data-turn-flag]').exists()).toBe(true);
  });

  it('omits the NOW flag when not active', () => {
    const wrapper = mount(TradeHudCorner, {
      props: {
        player: createPlayer(),
        victoryValue: 1_100_000,
        victoryDiff: -500,
        isActive: false,
        side: 'right',
      },
    });
    expect(wrapper.find('[data-turn-flag]').exists()).toBe(false);
    expect(wrapper.text()).toContain('-500');
  });

  it('tags the HUD with player id and side classes', () => {
    const wrapper = mount(TradeHudCorner, {
      props: {
        player: createPlayer(),
        victoryValue: 0,
        victoryDiff: 0,
        isActive: false,
        side: 'left',
      },
    });
    const classes = wrapper.classes().join(' ');
    expect(classes).toContain('is-left');
    expect(classes).toContain('is-player1');
  });
});
