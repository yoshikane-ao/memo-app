import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_MARKET_STOCK_STARTING_PRICE,
  buildTradeSessionSnapshot,
  createDefaultTradeSetupDraft,
} from './tradeSetup';

describe('buildTradeSessionSnapshot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('always uses the fixed market opening price', () => {
    const draft = createDefaultTradeSetupDraft();
    draft.marketStartingPriceMode = 'fixed';
    draft.marketStartingPrice = 13540;

    const session = buildTradeSessionSnapshot(draft, []);

    expect(session.settings.marketStartingPrice).toBe(DEFAULT_MARKET_STOCK_STARTING_PRICE);
  });

  it('ignores random mode and keeps the market opening price fixed', () => {
    const draft = createDefaultTradeSetupDraft();
    draft.marketStartingPriceMode = 'random';
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const session = buildTradeSessionSnapshot(draft, []);

    expect(session.settings.marketStartingPrice).toBe(DEFAULT_MARKET_STOCK_STARTING_PRICE);
  });
});
