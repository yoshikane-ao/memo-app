import type { TradeProfile } from '../store/useTradeProfileStore'
import type { PlayerIdentity, PlayerSlot } from '../types/playerIdentity'
import { createCpuIdentity, createGuestIdentity } from '../types/playerIdentity'
import { roundToStockPriceTick, STOCK_PRICE_TICK } from './tradeImpact'

export type BattleMode = 'pvp' | 'pvc' | 'cvc'
export type FirstPlayer = 'p1' | 'p2' | 'random'
export type ResolvedFirstPlayer = 'p1' | 'p2'
export type StartingCashMode = 'same' | 'separate'
export type MarketStartingPriceMode = 'fixed' | 'random'

export const DEFAULT_PLAYER_STOCK_STARTING_PRICE = 1000000
export const DEFAULT_MARKET_STOCK_STARTING_PRICE = 10000
export const RANDOM_MARKET_STOCK_MIN = 8000
export const RANDOM_MARKET_STOCK_MAX = 12000

export type GameStartSettings = {
  battleMode: BattleMode
  player1Name: string
  player2Name: string
  firstPlayer: FirstPlayer
  marketCpuCount: number
  player1StartingCash: number
  player2StartingCash: number
  marketStartingPrice: number
}

export type TradeSetupDraft = {
  battleMode: BattleMode
  firstPlayer: FirstPlayer
  startingCashMode: StartingCashMode
  sharedStartingCash: number
  player1StartingCash: number
  player2StartingCash: number
  weakCpuCount: number
  strongCpuCount: number
  marketStartingPriceMode: MarketStartingPriceMode
  marketStartingPrice: number
  p1Identity: PlayerIdentity
  p2Identity: PlayerIdentity
}

export type TradeSessionSnapshot = {
  settings: GameStartSettings
  resolvedFirstPlayer: ResolvedFirstPlayer
  player1Identity: PlayerIdentity
  player2Identity: PlayerIdentity
  battleModeLabel: string
  firstPlayerLabel: string
  totalCpuCount: number
}

type TradeStartPlayerViewModel = {
  identity: PlayerIdentity
  displayIdentity: PlayerIdentity
  profile: TradeProfile | null
  resolvedName: string
  resolvedCash: number
  disabled: boolean
}

export type TradeStartViewModel = {
  battleModeLabel: string
  firstPlayerLabel: string
  totalCpuCount: number
  canStart: boolean
  player1: TradeStartPlayerViewModel
  player2: TradeStartPlayerViewModel
}

const DEFAULT_STARTING_CASH = 12000

const battleModeLabels: Record<BattleMode, string> = {
  pvp: 'P1 vs P2',
  pvc: 'P1 vs CPU',
  cvc: 'CPU vs CPU',
}

function normalizeName(value: string, fallback: string): string {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : fallback
}

export function normalizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

export function normalizeCash(value: number, fallback = DEFAULT_STARTING_CASH): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.floor(value))
}

export function normalizeCpuCount(value: number): number {
  return normalizeNonNegativeInt(value)
}

export function normalizeMarketStartingPrice(
  value: number,
  fallback = DEFAULT_MARKET_STOCK_STARTING_PRICE,
): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return roundToStockPriceTick(value)
}

function resolveMarketStartingPrice(draft: TradeSetupDraft): number {
  if (draft.marketStartingPriceMode === 'random') {
    const min = roundToStockPriceTick(RANDOM_MARKET_STOCK_MIN)
    const max = roundToStockPriceTick(RANDOM_MARKET_STOCK_MAX)
    const stepCount = Math.floor((max - min) / STOCK_PRICE_TICK)
    return min + Math.floor(Math.random() * (stepCount + 1)) * STOCK_PRICE_TICK
  }

  return normalizeMarketStartingPrice(draft.marketStartingPrice)
}

export function createDefaultTradeSetupDraft(): TradeSetupDraft {
  return {
    battleMode: 'pvp',
    firstPlayer: 'random',
    startingCashMode: 'same',
    sharedStartingCash: DEFAULT_STARTING_CASH,
    player1StartingCash: DEFAULT_STARTING_CASH,
    player2StartingCash: DEFAULT_STARTING_CASH,
    weakCpuCount: 42,
    strongCpuCount: 21,
    marketStartingPriceMode: 'fixed',
    marketStartingPrice: DEFAULT_MARKET_STOCK_STARTING_PRICE,
    p1Identity: createGuestIdentity('p1'),
    p2Identity: createGuestIdentity('p2'),
  }
}

export function syncIdentitiesForBattleMode(
  mode: BattleMode,
  p1Identity: PlayerIdentity,
  p2Identity: PlayerIdentity,
): Pick<TradeSetupDraft, 'p1Identity' | 'p2Identity'> {
  if (mode === 'cvc') {
    return {
      p1Identity: createCpuIdentity(),
      p2Identity: createCpuIdentity(),
    }
  }

  if (mode === 'pvc') {
    return {
      p1Identity: p1Identity.kind === 'cpu' ? createGuestIdentity('p1') : p1Identity,
      p2Identity: createCpuIdentity(),
    }
  }

  return {
    p1Identity: p1Identity.kind === 'cpu' ? createGuestIdentity('p1') : p1Identity,
    p2Identity: p2Identity.kind === 'cpu' ? createGuestIdentity('p2') : p2Identity,
  }
}

export function resolveSetupProfile(
  identity: PlayerIdentity,
  profiles: TradeProfile[],
): TradeProfile | null {
  if (identity.kind !== 'profile') {
    return null
  }

  return profiles.find((profile) => profile.id === identity.profileId) ?? null
}

function resolveDisplayIdentity(
  mode: BattleMode,
  slot: PlayerSlot,
  identity: PlayerIdentity,
): PlayerIdentity {
  if (mode === 'cvc') {
    return createCpuIdentity()
  }

  if (mode === 'pvc' && slot === 'p2') {
    return createCpuIdentity()
  }

  return identity
}

function resolvePlayerDisabled(mode: BattleMode, slot: PlayerSlot): boolean {
  if (mode === 'cvc') {
    return true
  }

  return mode === 'pvc' && slot === 'p2'
}

function resolvePlayerName(
  mode: BattleMode,
  slot: PlayerSlot,
  identity: PlayerIdentity,
  profile: TradeProfile | null,
): string {
  if (mode === 'cvc') {
    return slot === 'p1' ? 'CPU 1' : 'CPU 2'
  }

  if (mode === 'pvc' && slot === 'p2') {
    return 'CPU'
  }

  if (identity.kind === 'profile') {
    return normalizeName(profile?.name ?? '', slot === 'p1' ? 'PLAYER 1' : 'PLAYER 2')
  }

  return normalizeName(identity.label, slot === 'p1' ? 'PLAYER 1' : 'PLAYER 2')
}

function resolvePlayerCash(draft: TradeSetupDraft, slot: PlayerSlot): number {
  if (draft.startingCashMode === 'same') {
    return normalizeCash(draft.sharedStartingCash)
  }

  return slot === 'p1'
    ? normalizeCash(draft.player1StartingCash)
    : normalizeCash(draft.player2StartingCash)
}

function resolveFirstPlayerLabel(
  firstPlayer: FirstPlayer,
  player1Name: string,
  player2Name: string,
): string {
  if (firstPlayer === 'random') {
    return 'Random'
  }

  return firstPlayer === 'p1' ? player1Name : player2Name
}

export function buildTradeStartViewModel(
  draft: TradeSetupDraft,
  profiles: TradeProfile[],
): TradeStartViewModel {
  const player1Profile = resolveSetupProfile(draft.p1Identity, profiles)
  const player2Profile = resolveSetupProfile(draft.p2Identity, profiles)

  const player1DisplayIdentity = resolveDisplayIdentity(draft.battleMode, 'p1', draft.p1Identity)
  const player2DisplayIdentity = resolveDisplayIdentity(draft.battleMode, 'p2', draft.p2Identity)

  const player1Name = resolvePlayerName(draft.battleMode, 'p1', draft.p1Identity, player1Profile)
  const player2Name = resolvePlayerName(draft.battleMode, 'p2', draft.p2Identity, player2Profile)
  const totalCpuCount =
    normalizeCpuCount(draft.weakCpuCount) + normalizeCpuCount(draft.strongCpuCount)

  return {
    battleModeLabel: battleModeLabels[draft.battleMode],
    firstPlayerLabel: resolveFirstPlayerLabel(draft.firstPlayer, player1Name, player2Name),
    totalCpuCount,
    canStart: totalCpuCount <= 100,
    player1: {
      identity: draft.p1Identity,
      displayIdentity: player1DisplayIdentity,
      profile: player1Profile,
      resolvedName: player1Name,
      resolvedCash: resolvePlayerCash(draft, 'p1'),
      disabled: resolvePlayerDisabled(draft.battleMode, 'p1'),
    },
    player2: {
      identity: draft.p2Identity,
      displayIdentity: player2DisplayIdentity,
      profile: draft.battleMode === 'pvp' ? player2Profile : null,
      resolvedName: player2Name,
      resolvedCash: resolvePlayerCash(draft, 'p2'),
      disabled: resolvePlayerDisabled(draft.battleMode, 'p2'),
    },
  }
}

export function buildTradeSessionSnapshot(
  draft: TradeSetupDraft,
  profiles: TradeProfile[],
): TradeSessionSnapshot {
  const viewModel = buildTradeStartViewModel(draft, profiles)
  const resolvedFirstPlayer =
    draft.firstPlayer === 'random'
      ? Math.random() < 0.5
        ? 'p1'
        : 'p2'
      : draft.firstPlayer

  return {
    settings: {
      battleMode: draft.battleMode,
      player1Name: viewModel.player1.resolvedName,
      player2Name: viewModel.player2.resolvedName,
      firstPlayer: draft.firstPlayer,
      marketCpuCount: viewModel.totalCpuCount,
      player1StartingCash: viewModel.player1.resolvedCash,
      player2StartingCash: viewModel.player2.resolvedCash,
      marketStartingPrice: resolveMarketStartingPrice(draft),
    },
    resolvedFirstPlayer,
    player1Identity: viewModel.player1.identity,
    player2Identity: viewModel.player2.identity,
    battleModeLabel: viewModel.battleModeLabel,
    firstPlayerLabel:
      draft.firstPlayer === 'random'
        ? `${viewModel.firstPlayerLabel} -> ${
            resolvedFirstPlayer === 'p1'
              ? viewModel.player1.resolvedName
              : viewModel.player2.resolvedName
          }`
        : viewModel.firstPlayerLabel,
    totalCpuCount: viewModel.totalCpuCount,
  }
}
