import type { Ref } from 'vue';

import type { GameState, LogEntry, TurnActionPayload } from '../types';
import { NO_COMPANY_ACTION } from '../types';
import type { BattleActionDraft } from '../model/tradeBattle';
import { createDefaultBattleActionDraft } from '../model/tradeBattle';
import type { BattleStockHistoryRuntime } from '../model/tradeBattleState';
import {
  advanceBattleTurnState,
  findPlayerById,
  initializeBattleState,
  MAX_BATTLE_TURNS,
} from '../model/tradeBattleState';
import { createTradeBattleRuntime } from '../model/tradeBattleRuntime';
import type { GameStartSettings } from '../model/tradeSetup';

export type TurnActionWithWait = TurnActionPayload & {
  metaAction?: 'wait';
};

type BattleFlowOptions = {
  state: GameState;
  startSettings: Ref<GameStartSettings | null>;
  stockHistory: BattleStockHistoryRuntime;
  actionDraft: Ref<BattleActionDraft>;
  pendingClosePositionId: Ref<string | null>;
  lastClosedPositionTurn: Ref<number | null>;
  isGameOver: Ref<boolean>;
  recalculateDynamicLines: () => void;
  maxTurns?: number;
};

export function createTradeBattleFlow(options: BattleFlowOptions) {
  const {
    state,
    startSettings,
    stockHistory,
    actionDraft,
    pendingClosePositionId,
    lastClosedPositionTurn,
    isGameOver,
    recalculateDynamicLines,
    maxTurns = MAX_BATTLE_TURNS,
  } = options;

  const sequences = {
    logSequence: 1000,
    positionSequence: 0,
    forwardSequence: 0,
  };

  const runtime = createTradeBattleRuntime({
    state,
    sequences,
    stockHistory,
  });

  const getPlayer = (playerId: GameState['currentPlayer']) => findPlayerById(state, playerId);

  const appendLogs = (logs: LogEntry[]) => {
    state.logs.unshift(...logs.reverse());
    state.logs = state.logs.slice(0, 36);
  };

  const advanceTurn = () => {
    const nextTurn = advanceBattleTurnState(state, maxTurns);
    isGameOver.value = nextTurn.isGameOver;
    return nextTurn.didAdvance;
  };

  const normalizePlayersForBattleStart = () => {
    const normalizedBattleState = initializeBattleState(state, {
      settings: startSettings.value,
      stockHistory,
    });

    sequences.logSequence = normalizedBattleState.logSequence;
    sequences.positionSequence = normalizedBattleState.positionSequence;
    sequences.forwardSequence = normalizedBattleState.forwardSequence;
    isGameOver.value = normalizedBattleState.isGameOver;
    recalculateDynamicLines();
  };

  const resolveTurnHead = (logs: LogEntry[]) => {
    runtime.revealEventsForTurn(logs);
    runtime.fireDueEvents(logs);
    runtime.settleForwardOrdersForTurn(logs);
  };

  const executePendingClose = (positionId: string) => {
    if (isGameOver.value) return;
    if (lastClosedPositionTurn.value === state.turn) return;

    const logs: LogEntry[] = [];
    const player = getPlayer(state.currentPlayer);

    resolveTurnHead(logs);
    runtime.settleSpeculation(player, logs);
    recalculateDynamicLines();

    const didClose = runtime.closeOpenPosition(player, positionId, logs);
    if (!didClose) {
      pendingClosePositionId.value = null;
      appendLogs(logs);
      return;
    }

    lastClosedPositionTurn.value = state.turn;
    recalculateDynamicLines();

    appendLogs(logs);
    advanceTurn();
    pendingClosePositionId.value = null;
    actionDraft.value = createDefaultBattleActionDraft();
  };

  const handleTurn = (payload: TurnActionWithWait) => {
    if (isGameOver.value) return;

    const logs: LogEntry[] = [];
    const player = getPlayer(state.currentPlayer);

    resolveTurnHead(logs);
    runtime.settleSpeculation(player, logs);
    recalculateDynamicLines();

    if (payload.metaAction === 'wait') {
      runtime.pushLog(
        logs,
        'player',
        '待機',
        `${player.name}はこのターンを待機し、大きな行動を見送りました。`,
        'up',
      );
    } else if (payload.companyAction !== NO_COMPANY_ACTION) {
      runtime.applyCompanyAction(player, payload.companyAction, logs);
    } else if (payload.orderType === 'forward') {
      runtime.placeForwardOrder(player, payload, logs);
    } else {
      runtime.applyPlayerOrder(player, payload, logs);
    }

    recalculateDynamicLines();

    appendLogs(logs);
    advanceTurn();
  };

  const cancelForwardOrderWithFeint = (orderId: string) => {
    if (isGameOver.value) return false;
    const logs: LogEntry[] = [];
    const player = getPlayer(state.currentPlayer);
    const didCancel = runtime.cancelForwardOrderWithFeint(player, orderId, logs);
    appendLogs(logs);
    recalculateDynamicLines();
    return didCancel;
  };

  return {
    normalizePlayersForBattleStart,
    executePendingClose,
    handleTurn,
    cancelForwardOrderWithFeint,
  };
}
