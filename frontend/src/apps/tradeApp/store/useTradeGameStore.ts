import { reactive } from 'vue'
import { defineStore } from 'pinia'

export type BattleMode = 'pvp' | 'pvc' | 'cvc'
export type FirstPlayer = 'p1' | 'p2' | 'random'
export type ResolvedFirstPlayer = 'p1' | 'p2'

export type GameStartSettings = {
  battleMode: BattleMode
  player1Name: string
  player2Name: string
  firstPlayer: FirstPlayer
  marketCpuCount: number
  player1StartingCash: number
  player2StartingCash: number
}

type TradeGameStoreState = {
  isInitialized: boolean
  settings: GameStartSettings | null
  resolvedFirstPlayer: ResolvedFirstPlayer
}

function normalizeName(value: string, fallback: string): string {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : fallback
}

function normalizeCash(value: number, fallback = 12000): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.floor(value))
}

function normalizeCpuCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.floor(value)))
}

export const useTradeGameStore = defineStore('tradeGame', () => {
  const state = reactive<TradeGameStoreState>({
    isInitialized: false,
    settings: null,
    resolvedFirstPlayer: 'p1',
  })

  function initializeGame(settings: GameStartSettings): void {
    const normalizedSettings: GameStartSettings = {
      battleMode: settings.battleMode,
      player1Name: normalizeName(settings.player1Name, 'PLAYER 1'),
      player2Name: normalizeName(settings.player2Name, 'PLAYER 2'),
      firstPlayer: settings.firstPlayer,
      marketCpuCount: normalizeCpuCount(settings.marketCpuCount),
      player1StartingCash: normalizeCash(settings.player1StartingCash),
      player2StartingCash: normalizeCash(settings.player2StartingCash),
    }

    state.settings = normalizedSettings
    state.resolvedFirstPlayer =
      normalizedSettings.firstPlayer === 'random'
        ? Math.random() < 0.5
          ? 'p1'
          : 'p2'
        : normalizedSettings.firstPlayer

    state.isInitialized = true
  }

  function resetGame(): void {
    state.isInitialized = false
    state.settings = null
    state.resolvedFirstPlayer = 'p1'
  }

  return {
    state,
    initializeGame,
    resetGame,
  }
})
