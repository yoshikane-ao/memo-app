import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TradeTimelineStrip from './TradeTimelineStrip.vue';

describe('TradeTimelineStrip', () => {
  it('renders a tick for every turn and marks the current turn', () => {
    const wrapper = mount(TradeTimelineStrip, {
      props: {
        currentTurn: 4,
        maxTurns: 12,
        forwardOrders: [],
        revealedEvents: [],
        currentPlayerId: 'player1',
      },
    });

    const ticks = wrapper.findAll('.tl-tick');
    expect(ticks).toHaveLength(12);
    expect(ticks[3].classes()).toContain('is-current');
    expect(ticks[0].classes()).toContain('is-past');
  });

  it('shows forward orders on their trigger turn and emits cancel event', async () => {
    const wrapper = mount(TradeTimelineStrip, {
      props: {
        currentTurn: 3,
        maxTurns: 12,
        forwardOrders: [
          {
            id: 'forward-1',
            playerId: 'player1',
            stockKey: 'market',
            triggerTurn: 5,
            tradeAction: 'buy',
            orderAmount: 10000,
            reservationFee: 300,
            canCancel: true,
          },
        ],
        revealedEvents: [],
        currentPlayerId: 'player1',
      },
    });

    const marker = wrapper.find('.tl-marker--forward');
    expect(marker.exists()).toBe(true);
    expect(marker.text()).toContain('Mkt');
    expect(marker.text()).toContain('買');

    await marker.trigger('click');
    const emitted = wrapper.emitted('cancelForwardOrder') ?? [];
    expect(emitted.length).toBe(1);
    expect(emitted[0]?.[0]).toBe('forward-1');
  });

  it('marks revealed events on their trigger turn and hides past events once fired', () => {
    const wrapper = mount(TradeTimelineStrip, {
      props: {
        currentTurn: 5,
        maxTurns: 12,
        forwardOrders: [],
        revealedEvents: [
          {
            card: {
              id: 'event-1',
              title: 'マーケット急騰',
              description: '',
              effect: 'market_boom',
            },
            revealedTurn: 3,
            triggerTurn: 5,
            status: 'fired',
          },
        ],
        currentPlayerId: 'player1',
      },
    });

    const eventMarker = wrapper.find('.tl-marker--event');
    expect(eventMarker.exists()).toBe(true);
    expect(eventMarker.classes()).toContain('is-fired');
  });
});
