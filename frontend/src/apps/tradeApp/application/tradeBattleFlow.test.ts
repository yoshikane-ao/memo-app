import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import {
  AD_CAMPAIGN_ACTION,
  createDefaultBattleActionDraft,
  createInitialGameState,
  findPlayerById,
  findStockByKey,
  NO_COMPANY_ACTION,
  type StockKey,
} from '../features/trade';
import { createTradeBattleFlow } from './tradeBattleFlow';

function createFlowContext() {
  const state = createInitialGameState();
  const stockHistory = {
    pointCounters: { p1: 0, p2: 0, market: 0 } as Record<StockKey, number>,
    pointIds: { p1: [], p2: [], market: [] } as Record<StockKey, number[]>,
  };
  const actionDraft = ref(createDefaultBattleActionDraft());
  const pendingClosePositionId = ref<string | null>(null);
  const lastClosedPositionTurn = ref<number | null>(null);
  const isGameOver = ref(false);
  const recalculateDynamicLines = vi.fn();
  const flow = createTradeBattleFlow({
    state,
    startSettings: ref(null),
    stockHistory,
    actionDraft,
    pendingClosePositionId,
    lastClosedPositionTurn,
    isGameOver,
    recalculateDynamicLines,
  });

  flow.normalizePlayersForBattleStart();

  return {
    state,
    actionDraft,
    pendingClosePositionId,
    lastClosedPositionTurn,
    isGameOver,
    recalculateDynamicLines,
    flow,
  };
}

describe('tradeBattleFlow', () => {
  it('handles wait turns as application orchestration and advances the battle', () => {
    const { state, isGameOver, recalculateDynamicLines, flow } = createFlowContext();
    const player1 = findPlayerById(state, 'player1');
    const player2 = findPlayerById(state, 'player2');

    player1.cooldowns[AD_CAMPAIGN_ACTION] = 2;
    player2.cooldowns[AD_CAMPAIGN_ACTION] = 1;

    flow.handleTurn({
      stockKey: 'market',
      tradeAction: 'buy',
      tradeMode: 'investment',
      quantity: 0,
      companyAction: NO_COMPANY_ACTION,
      metaAction: 'wait',
    });

    expect(state.turn).toBe(1);
    expect(state.currentPlayer).toBe('player2');
    expect(isGameOver.value).toBe(false);
    expect(player1.cooldowns[AD_CAMPAIGN_ACTION]).toBe(1);
    expect(player2.cooldowns[AD_CAMPAIGN_ACTION]).toBe(0);
    expect(state.logs[0]).toMatchObject({
      type: 'player',
      tone: 'up',
    });
    expect(recalculateDynamicLines).toHaveBeenCalledTimes(3);
  });

  it('executes pending closes and resets local screen state through the application flow', () => {
    const {
      state,
      actionDraft,
      pendingClosePositionId,
      lastClosedPositionTurn,
      recalculateDynamicLines,
      flow,
    } = createFlowContext();
    const player1 = findPlayerById(state, 'player1');
    const marketStock = findStockByKey(state, 'market');

    player1.positions = [
      {
        id: 'position-1',
        stockKey: 'market',
        side: 'buy',
        quantity: 1,
        entryPrice: 1_000_000,
        entryHistoryPointId: 1,
        orderAmount: 10_000,
        openedTurn: 1,
      },
    ];
    pendingClosePositionId.value = 'position-1';
    marketStock.currentPrice = 1_000_200;

    actionDraft.value = {
      ...actionDraft.value,
      quantity: 2500,
    };

    flow.executePendingClose('position-1');

    expect(player1.positions).toEqual([]);
    expect(state.currentPlayer).toBe('player2');
    expect(lastClosedPositionTurn.value).toBe(1);
    expect(pendingClosePositionId.value).toBe(null);
    expect(actionDraft.value).toEqual(createDefaultBattleActionDraft());
    expect(state.logs[0]).toMatchObject({
      type: 'player',
      tone: 'up',
    });
    expect(marketStock.currentPrice).toBeLessThan(1_000_200);
    expect(recalculateDynamicLines).toHaveBeenCalled();
  });
});
