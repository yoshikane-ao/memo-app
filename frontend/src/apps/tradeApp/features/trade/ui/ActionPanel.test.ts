import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { PlayerState, StockState } from '../types';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
} from '../types';
import { buildBattleActionProjection, createDefaultBattleActionDraft } from '../model/tradeBattle';
import ActionPanel from './ActionPanel.vue';

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
  };
}

function createPlayerNames() {
  return {
    p1: 'PLAYER 1',
    p2: 'PLAYER 2',
  };
}

function normalizedText(wrapper: ReturnType<typeof mount>): string {
  return wrapper.text().replace(/\s+/g, '');
}

describe('ActionPanel', () => {
  it('renders all trade input blocks and the current turn summary without stock meta pills', () => {
    const currentPlayer = createPlayer();
    const draft = createDefaultBattleActionDraft();
    draft.quantity = 10000;
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft);

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        playerNames: createPlayerNames(),
        draft,
        projection,
      },
    });
    const text = normalizedText(wrapper);

    expect(wrapper.findAll('.trade-grid > .card')).toHaveLength(5);
    expect(text).toContain('1行動');
    expect(text).toContain('2対象レート');
    expect(text).toContain('3売買/取引');
    expect(text).toContain('4注文額');
    expect(text).toContain('5確認');
    expect(text).toContain('PLAYER1のターン');
    expect(wrapper.find('.meta-pills').exists()).toBe(false);
    expect(wrapper.find('.amount-card .helper-line').exists()).toBe(false);
    expect(wrapper.find('.trade-summary .summary-banner-sub').exists()).toBe(false);
    expect(wrapper.find('[data-turn-strip]').exists()).toBe(true);
    expect(wrapper.find('.action-panel').attributes('data-current-player')).toBe('player1');
  });

  it('renders pending close confirmation summary', () => {
    const currentPlayer = createPlayer();
    const draft = createDefaultBattleActionDraft();
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft);

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        playerNames: createPlayerNames(),
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
    });

    const text = normalizedText(wrapper);

    expect(text).toContain('マーケットの買いポジションを決済');
    expect(text).toContain('想定約定9,500円');
    expect(text).toContain('回収10,500円');
    expect(text).toContain('損益+500円');
    expect(text).toContain('ポジション決済を確定');
  });

  it('shows player1 and player2 target buttons in fixed left-to-center order and keeps stock selection aligned', async () => {
    const currentPlayer = createPlayer();
    currentPlayer.id = 'player2';
    currentPlayer.name = 'PLAYER 2';
    const draft = createDefaultBattleActionDraft();
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft);

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        playerNames: createPlayerNames(),
        draft,
        projection,
      },
    });

    const targetButtons = wrapper.findAll('.stock-choice-list .stock-choice');
    const targetLabels = wrapper
      .findAll('.stock-choice-list .stock-choice-main')
      .map((node) => node.text());

    expect(targetLabels[0]).toBe('PLAYER 1を買う');
    expect(targetLabels[1]).toBe('PLAYER 2を買う');

    await targetButtons[0]?.trigger('click');
    await targetButtons[1]?.trigger('click');

    const updates = wrapper.emitted('update:draft') ?? [];
    expect(updates[0]?.[0]).toMatchObject({ stockKey: 'p1' });
    expect(updates[1]?.[0]).toMatchObject({ stockKey: 'p2' });
  });

  it('allows selecting sell even when a buy position remains open', async () => {
    const currentPlayer = createPlayer();
    currentPlayer.holdings.market = { quantity: 1, avgPrice: 10000 };
    const draft = createDefaultBattleActionDraft();
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft);

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        playerNames: createPlayerNames(),
        draft,
        projection,
      },
    });

    const tradeActionSegments = wrapper.findAll('.mode-card .segment.segment-2');
    const tradeActionButtons = tradeActionSegments[1]?.findAll('button') ?? [];
    const sellButton = tradeActionButtons[1];

    expect(sellButton).toBeDefined();
    expect(sellButton?.attributes('disabled')).toBeUndefined();

    await sellButton?.trigger('click');

    const updates = wrapper.emitted('update:draft') ?? [];
    expect(updates.length).toBeGreaterThan(0);
    expect(updates.at(-1)?.[0]).toMatchObject({ tradeAction: 'sell' });
  });

  it('shows insufficient balance on the confirm button when the order exceeds cash', () => {
    const currentPlayer = createPlayer();
    currentPlayer.cash = 5000;
    const draft = createDefaultBattleActionDraft();
    draft.quantity = 10000;
    const projection = buildBattleActionProjection(currentPlayer, createStocks(), draft);

    const wrapper = mount(ActionPanel, {
      props: {
        currentPlayer,
        playerNames: createPlayerNames(),
        draft,
        projection,
      },
    });

    expect(wrapper.find('.trade-grid .confirm-button').text()).toBe('残高不足');
    expect(wrapper.find('.trade-grid .confirm-button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.amount-card .helper-line').exists()).toBe(false);
  });
});
