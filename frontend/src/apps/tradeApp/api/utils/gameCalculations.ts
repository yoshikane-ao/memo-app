import type { PlayerState, StockKey, StockState } from '../types/game'

export interface PlayerSnapshot {
  totalAssets: number
  unrealizedPnL: number
  longValue: number
  longPnL: number
  shortPnL: number
  speculationPnL: number
}

export function getPriceMap(stocks: StockState[]): Record<StockKey, number> {
  return stocks.reduce(
    (acc, stock) => {
      acc[stock.key] = stock.currentPrice
      return acc
    },
    { p1: 0, p2: 0, market: 0 } as Record<StockKey, number>,
  )
}

export function calculatePlayerSnapshot(
  player: PlayerState,
  stocks: StockState[],
): PlayerSnapshot {
  const priceMap = getPriceMap(stocks)

  let longValue = 0
  let longPnL = 0
  let shortPnL = 0
  let speculationPnL = 0

  for (const [key, position] of Object.entries(player.holdings) as [
    StockKey,
    PlayerState['holdings'][StockKey],
  ][]) {
    const currentPrice = priceMap[key]
    longValue += currentPrice * position.quantity
    longPnL += (currentPrice - position.avgPrice) * position.quantity
  }

  for (const [key, position] of Object.entries(player.shorts) as [
    StockKey,
    PlayerState['shorts'][StockKey],
  ][]) {
    const currentPrice = priceMap[key]
    shortPnL += (position.avgPrice - currentPrice) * position.quantity
  }

  for (const position of player.speculation) {
    const currentPrice = priceMap[position.stockKey]
    speculationPnL +=
      position.side === 'buy'
        ? (currentPrice - position.entryPrice) * position.quantity
        : (position.entryPrice - currentPrice) * position.quantity
  }

  const unrealizedPnL = longPnL + shortPnL + speculationPnL
  const totalAssets = player.cash + player.companyFunds + longValue + shortPnL + speculationPnL

  return {
    totalAssets,
    unrealizedPnL,
    longValue,
    longPnL,
    shortPnL,
    speculationPnL,
  }
}

export function formatCurrency(value: number): string {
  return `¥${Math.round(value).toLocaleString('ja-JP')}`
}

export function formatSignedNumber(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '±'
  return `${sign}${Math.abs(rounded).toLocaleString('ja-JP')}`
}

export function formatSignedCurrency(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '±'
  return `${sign}¥${Math.abs(rounded).toLocaleString('ja-JP')}`
}

export function describeDelta(value: number): {
  arrow: string
  label: string
  className: 'is-up' | 'is-down' | 'is-flat'
} {
  if (value > 0) {
    return {
      arrow: '▲',
      label: '上昇',
      className: 'is-up',
    }
  }

  if (value < 0) {
    return {
      arrow: '▼',
      label: '下落',
      className: 'is-down',
    }
  }

  return {
    arrow: '→',
    label: '横ばい',
    className: 'is-flat',
  }
}