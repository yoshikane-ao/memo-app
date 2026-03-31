import { reactive } from 'vue'
import { defineStore } from 'pinia'
import type { PlayerIdentity, PlayerSlot } from '../types/playerIdentity'
import { createGuestIdentity } from '../types/playerIdentity'
import {
  createDefaultTradeSetupDraft,
  normalizeCash,
  normalizeCpuCount,
  normalizeNonNegativeInt,
  syncIdentitiesForBattleMode,
} from '../lib/tradeSetup'
import type {
  BattleMode,
  FirstPlayer,
  TradeSessionSnapshot,
  TradeSetupDraft,
  StartingCashMode,
} from '../lib/tradeSetup'

export type {
  BattleMode,
  FirstPlayer,
  GameStartSettings,
  ResolvedFirstPlayer,
  StartingCashMode,
  TradeSessionSnapshot,
  TradeSetupDraft,
} from '../lib/tradeSetup'

type TradeGameStoreState = {
  isInitialized: boolean
  draft: TradeSetupDraft
  session: TradeSessionSnapshot | null
}

export const useTradeGameStore = defineStore('tradeGame', () => {
  const state = reactive<TradeGameStoreState>({
    isInitialized: false,
    draft: createDefaultTradeSetupDraft(),
    session: null,
  })

  function setBattleMode(mode: BattleMode): void {
    state.draft.battleMode = mode

    const synced = syncIdentitiesForBattleMode(
      mode,
      state.draft.p1Identity,
      state.draft.p2Identity,
    )

    state.draft.p1Identity = synced.p1Identity
    state.draft.p2Identity = synced.p2Identity
  }

  function setFirstPlayer(firstPlayer: FirstPlayer): void {
    state.draft.firstPlayer = firstPlayer
  }

  function setStartingCashMode(mode: StartingCashMode): void {
    state.draft.startingCashMode = mode

    if (mode !== 'same') {
      return
    }

    const base = normalizeCash(
      state.draft.sharedStartingCash
        || state.draft.player1StartingCash
        || state.draft.player2StartingCash,
    )

    state.draft.sharedStartingCash = base
    state.draft.player1StartingCash = base
    state.draft.player2StartingCash = base
  }

  function setSharedCash(value: number): void {
    const normalized = normalizeCash(value)
    state.draft.sharedStartingCash = normalized

    if (state.draft.startingCashMode !== 'same') {
      return
    }

    state.draft.player1StartingCash = normalized
    state.draft.player2StartingCash = normalized
  }

  function setPlayerCash(slot: PlayerSlot, value: number): void {
    const normalized = normalizeCash(value)

    if (slot === 'p1') {
      state.draft.player1StartingCash = normalized
      return
    }

    state.draft.player2StartingCash = normalized
  }

  function adjustCpu(target: 'weak' | 'strong', delta: number): void {
    const currentValue =
      target === 'weak'
        ? state.draft.weakCpuCount
        : state.draft.strongCpuCount

    setCpuCount(target, currentValue + delta)
  }

  function setCpuCount(target: 'weak' | 'strong', value: number): void {
    const normalized = normalizeNonNegativeInt(value)

    if (target === 'weak') {
      state.draft.weakCpuCount = normalized
      return
    }

    state.draft.strongCpuCount = normalized
  }

  function assignIdentity(slot: PlayerSlot, identity: PlayerIdentity): void {
    if (state.draft.battleMode === 'cvc') {
      return
    }

    if (state.draft.battleMode === 'pvc' && slot === 'p2') {
      return
    }

    if (slot === 'p1') {
      state.draft.p1Identity = identity
    } else {
      state.draft.p2Identity = identity
    }

    const synced = syncIdentitiesForBattleMode(
      state.draft.battleMode,
      state.draft.p1Identity,
      state.draft.p2Identity,
    )

    state.draft.p1Identity = synced.p1Identity
    state.draft.p2Identity = synced.p2Identity
  }

  function resetSlotToGuest(slot: PlayerSlot): void {
    assignIdentity(slot, createGuestIdentity(slot))
  }

  function setDraft(nextDraft: TradeSetupDraft): void {
    state.draft = nextDraft

    const synced = syncIdentitiesForBattleMode(
      state.draft.battleMode,
      state.draft.p1Identity,
      state.draft.p2Identity,
    )

    state.draft.p1Identity = synced.p1Identity
    state.draft.p2Identity = synced.p2Identity
    state.draft.sharedStartingCash = normalizeCash(state.draft.sharedStartingCash)
    state.draft.player1StartingCash = normalizeCash(state.draft.player1StartingCash)
    state.draft.player2StartingCash = normalizeCash(state.draft.player2StartingCash)
    state.draft.weakCpuCount = normalizeCpuCount(state.draft.weakCpuCount)
    state.draft.strongCpuCount = normalizeCpuCount(state.draft.strongCpuCount)
  }

  function initializeGame(session: TradeSessionSnapshot): void {
    state.session = session
    state.isInitialized = true
  }

  function resetGame(clearDraft = false): void {
    state.isInitialized = false
    state.session = null

    if (clearDraft) {
      state.draft = createDefaultTradeSetupDraft()
    }
  }

  return {
    state,
    setBattleMode,
    setFirstPlayer,
    setStartingCashMode,
    setSharedCash,
    setPlayerCash,
    adjustCpu,
    setCpuCount,
    assignIdentity,
    resetSlotToGuest,
    setDraft,
    initializeGame,
    resetGame,
  }
})
