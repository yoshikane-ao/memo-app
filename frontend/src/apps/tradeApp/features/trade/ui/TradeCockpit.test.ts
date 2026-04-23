import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
  type PlayerState,
  type StockState,
} from '../types';
import { buildBattleActionProjection, createDefaultBattleActionDraft } from '../model/tradeBattle';
import TradeCockpit from './TradeCockpit.vue';

function createStocks(): StockState[] {
  return [
    {
      key: 'p1',
      name: 'Player1会社',
      basePrice: 1000000,
      currentPrice: 1000000,
      previousPrice: 1000000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000],
      shortInterest: 0,
      correlationNote: '',
      cpuPool: [],
    },
    {
      key: 'p2',
      name: 'Player2会社',
      basePrice: 1000000,
      currentPrice: 1000000,
      previousPrice: 1000000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000],
      shortInterest: 0,
      correlationNote: '',
      cpuPool: [],
    },
    {
      key: 'market',
      name: 'マーケット',
      basePrice: 1000000,
      currentPrice: 1000000,
      previousPrice: 1000000,
      bubbleUpper: 0,
      bubbleLower: 0,
      history: [1000000],
      shortInterest: 0,
      correlationNote: '',
      cpuPool: [],
    },
  ];
}

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
      [AD_CAMPAIGN_ACTION]: 1,
      [BUYBACK_ACTION]: 0,
      [FACILITY_INVESTMENT_ACTION]: 2,
    },
    feintTokens: 2,
    recentCashChange: 0,
    recentNetChange: 0,
    marketBias: 0,
    lastSnapshotAssets: 0,
    lastSnapshotCash: 100000,
  };
}

function buildProjectionWithDraft(
  overrides: Partial<ReturnType<typeof createDefaultBattleActionDraft>> = {},
) {
  const draft = { ...createDefaultBattleActionDraft(), ...overrides };
  const player = createPlayer();
  const stocks = createStocks();
  const projection = buildBattleActionProjection(player, stocks, draft);
  return { draft: projection.draft, projection, player };
}

describe('TradeCockpit', () => {
  it('renders three tabs and shows trade row by default', () => {
    const { draft, projection, player } = buildProjectionWithDraft();
    const wrapper = mount(TradeCockpit, {
      props: {
        currentPlayer: player,
        playerNames: { p1: 'プレイヤー1', p2: 'プレイヤー2' },
        draft,
        projection,
      },
    });
    const tabs = wrapper.findAll('.tab-btn');
    expect(tabs).toHaveLength(3);
    expect(wrapper.find('.cockpit-row--trade').exists()).toBe(true);
  });

  it('emits draft update when changing order type to forward', async () => {
    const { draft, projection, player } = buildProjectionWithDraft();
    const wrapper = mount(TradeCockpit, {
      props: {
        currentPlayer: player,
        playerNames: { p1: 'プレイヤー1', p2: 'プレイヤー2' },
        draft,
        projection,
      },
    });

    const orderButtons = wrapper
      .findAll('.ck-group--order .seg-btn')
      .filter((btn) => btn.text().includes('予約'));
    expect(orderButtons).toHaveLength(1);
    await orderButtons[0].trigger('click');

    const updates = wrapper.emitted('update:draft') ?? [];
    expect(updates.length).toBeGreaterThan(0);
    expect(updates.at(-1)?.[0]).toMatchObject({ orderType: 'forward' });
  });

  it('disables company action buttons with zero charges', async () => {
    const { draft, projection, player } = buildProjectionWithDraft({ actionKind: 'company' });
    const wrapper = mount(TradeCockpit, {
      props: {
        currentPlayer: player,
        playerNames: { p1: 'プレイヤー1', p2: 'プレイヤー2' },
        draft,
        projection,
      },
    });

    const buyback = wrapper
      .findAll('.seg-btn--company')
      .find((btn) => btn.text().includes('自社買い'));
    expect(buyback).toBeDefined();
    expect(buyback!.attributes('disabled')).toBeDefined();
  });

  it('renders pending close view and emits cancel / confirm events', async () => {
    const { draft, projection, player } = buildProjectionWithDraft();
    const wrapper = mount(TradeCockpit, {
      props: {
        currentPlayer: player,
        playerNames: { p1: 'プレイヤー1', p2: 'プレイヤー2' },
        draft,
        projection,
        pendingClose: {
          stockName: 'マーケット',
          side: 'buy',
          executionPriceText: '1,000,200円',
          projectedPnlText: '+200円',
          returnedCashText: '10,200円',
        },
      },
    });

    const text = wrapper.text();
    expect(text).toContain('決済プレビュー');
    expect(text).toContain('マーケット');

    const cancelButton = wrapper.findAll('.ck-btn').find((btn) => btn.text() === '取消');
    const confirmButton = wrapper.findAll('.ck-btn').find((btn) => btn.text() === '決済確定');
    expect(cancelButton).toBeDefined();
    expect(confirmButton).toBeDefined();

    await confirmButton!.trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();

    await cancelButton!.trigger('click');
    expect(wrapper.emitted('cancelPendingClose')).toBeTruthy();
  });
});
