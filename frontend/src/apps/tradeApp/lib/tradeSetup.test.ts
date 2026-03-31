import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  RANDOM_MARKET_STOCK_MAX,
  RANDOM_MARKET_STOCK_MIN,
  buildTradeSessionSnapshot,
  createDefaultTradeSetupDraft,
} from './tradeSetup'
import { STOCK_PRICE_TICK } from './tradeImpact'

describe('buildTradeSessionSnapshot', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the configured market opening price in fixed mode', () => {
    const draft = createDefaultTradeSetupDraft()
    draft.marketStartingPriceMode = 'fixed'
    draft.marketStartingPrice = 13540

    const session = buildTradeSessionSnapshot(draft, [])

    expect(session.settings.marketStartingPrice).toBe(13500)
  })

  it('resolves a market opening price inside the random range', () => {
    const draft = createDefaultTradeSetupDraft()
    draft.marketStartingPriceMode = 'random'
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const session = buildTradeSessionSnapshot(draft, [])

    expect(session.settings.marketStartingPrice).toBeGreaterThanOrEqual(RANDOM_MARKET_STOCK_MIN)
    expect(session.settings.marketStartingPrice).toBeLessThanOrEqual(RANDOM_MARKET_STOCK_MAX)
    expect(session.settings.marketStartingPrice % STOCK_PRICE_TICK).toBe(0)
  })
})
