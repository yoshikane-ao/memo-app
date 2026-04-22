<script setup lang="ts">
import { computed } from 'vue';
import type { CpuStats } from '../types';

const props = defineProps<{
  cpuStats: CpuStats;
}>();

type SegmentStyle = {
  width: string;
};

const totalActive = computed(() => props.cpuStats.participantCount);
const totalCpu = computed(() => props.cpuStats.participantCount + props.cpuStats.withdrawalCount);

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

const bullishPct = computed(() => pct(props.cpuStats.strongParticipantCount, totalActive.value));
const bearishPct = computed(() => pct(props.cpuStats.weakParticipantCount, totalActive.value));
const neutralPct = computed(() => Math.max(0, 100 - bullishPct.value - bearishPct.value));

const bullishStyle = computed<SegmentStyle>(() => ({ width: `${bullishPct.value}%` }));
const neutralStyle = computed<SegmentStyle>(() => ({ width: `${neutralPct.value}%` }));
const bearishStyle = computed<SegmentStyle>(() => ({ width: `${bearishPct.value}%` }));

const participationPct = computed(() => pct(totalActive.value, totalCpu.value));
</script>

<template>
  <div class="cpu-sentiment-bar" data-cpu-sentiment>
    <div class="sb-head">
      <span class="sb-title">市場CPU</span>
      <span class="sb-meta">
        参加 <strong>{{ cpuStats.participantCount }}</strong>
        <span class="sep">/</span>
        撤退 <strong>{{ cpuStats.withdrawalCount }}</strong>
      </span>
      <span class="sb-meta sb-meta--stocks">
        P1 <strong>{{ cpuStats.p1ParticipantCount }}</strong>
        <span class="sep">/</span>
        P2 <strong>{{ cpuStats.p2ParticipantCount }}</strong>
      </span>
      <span class="sb-meta">
        投入 <strong>{{ cpuStats.investmentTotal.toLocaleString('ja-JP') }}円</strong>
      </span>
    </div>
    <div class="sb-bar-group">
      <div
        class="sb-bar sb-bar--sentiment"
        :aria-label="`強気 ${bullishPct.toFixed(0)}% / 中立 ${neutralPct.toFixed(0)}% / 弱気 ${bearishPct.toFixed(0)}%`"
      >
        <span class="seg seg-bull" :style="bullishStyle" data-seg="bullish"></span>
        <span class="seg seg-neutral" :style="neutralStyle" data-seg="neutral"></span>
        <span class="seg seg-bear" :style="bearishStyle" data-seg="bearish"></span>
      </div>
      <div class="sb-legend">
        <span class="legend bull">強気 {{ cpuStats.strongParticipantCount }}</span>
        <span class="legend neutral"
          >中立
          {{ totalActive - cpuStats.strongParticipantCount - cpuStats.weakParticipantCount }}</span
        >
        <span class="legend bear">弱気 {{ cpuStats.weakParticipantCount }}</span>
        <span class="legend participation">参加率 {{ participationPct.toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cpu-sentiment-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 10px;
  background: linear-gradient(90deg, rgba(7, 14, 32, 0.9), rgba(12, 24, 50, 0.9));
  border: 1px solid rgba(122, 171, 255, 0.14);
  border-radius: 8px;
  color: #e7eefd;
  font-size: 10px;
  line-height: 1;
  min-height: 28px;
}

.sb-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.sb-title {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.sb-meta {
  font-size: 10px;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
}

.sb-meta strong {
  font-weight: 800;
  color: #f2f6ff;
  margin: 0 2px;
}

.sb-meta .sep {
  opacity: 0.4;
  margin: 0 2px;
}

.sb-meta--stocks {
  opacity: 0.7;
}

.sb-bar-group {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sb-bar {
  flex: 1;
  height: 10px;
  display: flex;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-width: 80px;
}

.seg {
  display: block;
  height: 100%;
  transition: width 0.4s ease;
}

.seg-bull {
  background: linear-gradient(90deg, rgba(56, 196, 162, 0.95), rgba(100, 220, 188, 0.95));
}

.seg-neutral {
  background: linear-gradient(90deg, rgba(124, 150, 206, 0.6), rgba(100, 124, 174, 0.6));
}

.seg-bear {
  background: linear-gradient(90deg, rgba(232, 88, 118, 0.95), rgba(255, 118, 146, 0.95));
}

.sb-legend {
  display: flex;
  gap: 8px;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.legend.bull {
  color: #7fe0b7;
}
.legend.bear {
  color: #ffa7b4;
}
.legend.neutral {
  color: rgba(220, 230, 250, 0.7);
}
.legend.participation {
  color: rgba(220, 230, 250, 0.85);
  font-weight: 700;
}
</style>
