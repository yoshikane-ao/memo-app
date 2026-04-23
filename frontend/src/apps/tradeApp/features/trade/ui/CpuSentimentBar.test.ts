import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CpuSentimentBar from './CpuSentimentBar.vue';

describe('CpuSentimentBar', () => {
  it('renders participant, withdrawal and sentiment counts', () => {
    const wrapper = mount(CpuSentimentBar, {
      props: {
        cpuStats: {
          participantCount: 24,
          withdrawalCount: 12,
          investmentTotal: 120000,
          weakParticipantCount: 8,
          strongParticipantCount: 9,
          p1ParticipantCount: 7,
          p2ParticipantCount: 9,
          p1InvestmentTotal: 40000,
          p2InvestmentTotal: 52000,
        },
      },
    });
    const text = wrapper.text();
    expect(text).toContain('24');
    expect(text).toContain('12');
    expect(text).toContain('強気');
    expect(text).toContain('弱気');
    expect(text).toContain('参加率');
  });

  it('renders zero-size segments without crashing when no CPUs are active', () => {
    const wrapper = mount(CpuSentimentBar, {
      props: {
        cpuStats: {
          participantCount: 0,
          withdrawalCount: 0,
          investmentTotal: 0,
          weakParticipantCount: 0,
          strongParticipantCount: 0,
          p1ParticipantCount: 0,
          p2ParticipantCount: 0,
          p1InvestmentTotal: 0,
          p2InvestmentTotal: 0,
        },
      },
    });
    expect(wrapper.find('[data-seg="bullish"]').exists()).toBe(true);
    expect(wrapper.find('[data-seg="bearish"]').exists()).toBe(true);
  });
});
