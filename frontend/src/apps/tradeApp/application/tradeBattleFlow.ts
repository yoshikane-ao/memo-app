import type { Ref } from 'vue'

import type { GameState, LogEntry, TurnActionPayload } from '../api/types/game'
import { NO_COMPANY_ACTION } from '../api/types/game'
import { createTradeBattleRuntime } from '../domain/tradeBattle/tradeBattleRuntime'
import { createDefaultBattleActionDraft, type BattleActionDraft } from '../lib/tradeBattle'
import type { GameStartSettings } from '../lib/tradeSetup'
import {
  advanceBattleTurnState,
  findPlayerById,
  initializeBattleState,
  MAX_BATTLE_TURNS,
  reducePlayerCooldowns as reduceCooldowns,
  type BattleStockHistoryRuntime,
} from '../lib/tradeBattleState'

export type TurnActionWithWait = TurnActionPayload & {
  metaAction?: 'wait'
}

type BattleFlowOptions = {
  state: GameState
  startSettings: Ref<GameStartSettings | null>
  stockHistory: BattleStockHistoryRuntime
  actionDraft: Ref<BattleActionDraft>
  pendingClosePositionId: Ref<string | null>
  lastClosedPositionTurn: Ref<number | null>
  isGameOver: Ref<boolean>
  recalculateDynamicLines: () => void
  maxTurns?: number
}

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
  } = options

  const sequences = {
    logSequence: 1000,
    positionSequence: 0,
  }

  const runtime = createTradeBattleRuntime({
    state,
    sequences,
    stockHistory,
  })

  const getPlayer = (playerId: GameState['currentPlayer']) => findPlayerById(state, playerId)

  const appendLogs = (logs: LogEntry[]) => {
    state.logs.unshift(...logs.reverse())
    state.logs = state.logs.slice(0, 36)
  }

  const advanceTurn = () => {
    const nextTurn = advanceBattleTurnState(state, maxTurns)
    isGameOver.value = nextTurn.isGameOver
    return nextTurn.didAdvance
  }

  const normalizePlayersForBattleStart = () => {
    const normalizedBattleState = initializeBattleState(state, {
      settings: startSettings.value,
      stockHistory,
    })

    sequences.logSequence = normalizedBattleState.logSequence
    sequences.positionSequence = normalizedBattleState.positionSequence
    isGameOver.value = normalizedBattleState.isGameOver
    recalculateDynamicLines()
  }

  const executePendingClose = (positionId: string) => {
    if (isGameOver.value) {
      return
    }

    if (lastClosedPositionTurn.value === state.turn) {
      return
    }

    const logs: LogEntry[] = []
    const player = getPlayer(state.currentPlayer)

    runtime.settleSpeculation(player, logs)
    recalculateDynamicLines()

    const didClose = runtime.closeOpenPosition(player, positionId, logs)
    if (!didClose) {
      pendingClosePositionId.value = null
      appendLogs(logs)
      return
    }

    lastClosedPositionTurn.value = state.turn
    reduceCooldowns(player)
    recalculateDynamicLines()

    appendLogs(logs)
    advanceTurn()
    pendingClosePositionId.value = null
    actionDraft.value = createDefaultBattleActionDraft()
  }

  const handleTurn = (payload: TurnActionWithWait) => {
    if (isGameOver.value) {
      return
    }

    const logs: LogEntry[] = []
    const player = getPlayer(state.currentPlayer)

    runtime.settleSpeculation(player, logs)
    recalculateDynamicLines()

    if (payload.metaAction === 'wait') {
      runtime.pushLog(logs, 'player', '待機', `${player.name}はこのターンを待機し、大きな行動を見送りました。`, 'up')
    } else if (payload.companyAction !== NO_COMPANY_ACTION) {
      runtime.applyCompanyAction(player, payload.companyAction, logs)
    } else {
      runtime.applyPlayerOrder(player, payload, logs)
    }

    reduceCooldowns(getPlayer('player1'))
    reduceCooldowns(getPlayer('player2'))
    recalculateDynamicLines()

    appendLogs(logs)
    advanceTurn()
  }

  return {
    normalizePlayersForBattleStart,
    executePendingClose,
    handleTurn,
  }
}
