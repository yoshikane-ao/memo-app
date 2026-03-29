import { reactive, readonly } from 'vue'

export type TradeDifficulty = 'easy' | 'normal' | 'hard'
export type FirstPlayer = 'p1' | 'p2'

export interface TradeStartSettings {
  playerName: string
  difficulty: TradeDifficulty
  firstPlayer: FirstPlayer
}

export interface BattlePlayerState {
  name: string
  cash: number
  totalAssets: number
}

export interface BattleStockState {
  p1: number
  p2: number
  market: number
}

export interface BattleCpuState {
  participants: number
  totalInvestment: number
  withdrawals: number
}

export interface BattleState {
  turn: number
  currentPlayer: FirstPlayer
  players: {
    p1: BattlePlayerState
    p2: BattlePlayerState
  }
  stocks: BattleStockState
  cpu: BattleCpuState
  bubbleLimit: {
    p1: number
    p2: number
    market: number
  }
  floorLimit: {
    p1: number
    p2: number
    market: number
  }
}

interface TradeGameState {
  isInitialized: boolean
  startedAt: string | null
  settings: TradeStartSettings
  battle: BattleState | null
}

const createDefaultSettings = (): TradeStartSettings => ({
  playerName: 'PLAYER 1',
  difficulty: 'normal',
  firstPlayer: 'p1',
})

const createInitialBattleState = (
  settings: TradeStartSettings,
): BattleState => {
  const presets = {
    easy: {
      p1Cash: 120000,
      p2Cash: 90000,
      p1Stock: 105,
      p2Stock: 95,
      marketStock: 100,
      cpuParticipants: 48,
      cpuInvestment: 78000,
      cpuWithdrawals: 3,
      bubble: 180,
      floor: 45,
    },
    normal: {
      p1Cash: 100000,
      p2Cash: 100000,
      p1Stock: 100,
      p2Stock: 100,
      marketStock: 100,
      cpuParticipants: 63,
      cpuInvestment: 114723,
      cpuWithdrawals: 6,
      bubble: 200,
      floor: 40,
    },
    hard: {
      p1Cash: 95000,
      p2Cash: 115000,
      p1Stock: 98,
      p2Stock: 108,
      marketStock: 102,
      cpuParticipants: 81,
      cpuInvestment: 156400,
      cpuWithdrawals: 9,
      bubble: 220,
      floor: 35,
    },
  } as const

  const preset = presets[settings.difficulty]

  return {
    turn: 1,
    currentPlayer: settings.firstPlayer,
    players: {
      p1: {
        name: settings.playerName || 'PLAYER 1',
        cash: preset.p1Cash,
        totalAssets: preset.p1Cash,
      },
      p2: {
        name: 'CPU',
        cash: preset.p2Cash,
        totalAssets: preset.p2Cash,
      },
    },
    stocks: {
      p1: preset.p1Stock,
      p2: preset.p2Stock,
      market: preset.marketStock,
    },
    cpu: {
      participants: preset.cpuParticipants,
      totalInvestment: preset.cpuInvestment,
      withdrawals: preset.cpuWithdrawals,
    },
    bubbleLimit: {
      p1: preset.bubble,
      p2: preset.bubble,
      market: preset.bubble,
    },
    floorLimit: {
      p1: preset.floor,
      p2: preset.floor,
      market: preset.floor,
    },
  }
}

const state = reactive<TradeGameState>({
  isInitialized: false,
  startedAt: null,
  settings: createDefaultSettings(),
  battle: null,
})

export const useTradeGameStore = () => {
  const initializeGame = (partialSettings?: Partial<TradeStartSettings>) => {
    const mergedSettings: TradeStartSettings = {
      ...createDefaultSettings(),
      ...partialSettings,
    }

    state.isInitialized = true
    state.startedAt = new Date().toISOString()
    state.settings = mergedSettings
    state.battle = createInitialBattleState(mergedSettings)
  }

  const resetGame = () => {
    state.isInitialized = false
    state.startedAt = null
    state.settings = createDefaultSettings()
    state.battle = null
  }

  const nextTurn = () => {
    if (!state.battle) return

    state.battle.turn += 1
    state.battle.currentPlayer =
      state.battle.currentPlayer === 'p1' ? 'p2' : 'p1'
  }

  return {
    state: readonly(state),
    initializeGame,
    resetGame,
    nextTurn,
  }
}
