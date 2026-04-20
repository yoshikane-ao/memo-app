<script setup lang="ts">
import type { BattleActionPreview } from '../model/tradeBattle';

type CpuIndicatorStats = {
  participantCount: number;
  withdrawalCount: number;
  investmentTotal: number;
  weakParticipantCount: number;
  strongParticipantCount: number;
  p1ParticipantCount: number;
  p2ParticipantCount: number;
  p1InvestmentTotal: number;
  p2InvestmentTotal: number;
};

const props = defineProps<{
  preview: BattleActionPreview;
  player1Name: string;
  player2Name: string;
  cpuStats: CpuIndicatorStats;
}>();

function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString()}円`;
}

function impactBadge(level: BattleActionPreview['stockImpactPreview'][number]['level']): string {
  if (level === 'strong-up') return '強↑';
  if (level === 'up') return '↑';
  if (level === 'down') return '↓';
  if (level === 'strong-down') return '強↓';
  return '→';
}
</script>

<template>
  <aside class="history-panel">
    <div class="panel-head">
      <div class="panel-title">行動予測</div>
      <div class="panel-subtitle">今回の行動でどう動くかと CPU 指標を分けて確認できます</div>
    </div>

    <section class="section-card preview-section">
      <div class="section-title">今回の行動でどう動くか</div>

      <div class="preview-banner">
        <div class="preview-banner-label">{{ preview.bannerTitle }}</div>
        <strong class="preview-banner-main">{{ preview.overviewTitle }}</strong>
        <span class="preview-banner-sub">{{ preview.overviewSub }}</span>
      </div>

      <div v-if="preview.actionChips.length" class="chip-row">
        <span v-for="chip in preview.actionChips" :key="chip" class="chip">{{ chip }}</span>
      </div>

      <div v-if="preview.actionKind === 'company'" class="company-summary-grid">
        <div
          v-for="item in preview.companySummaryItems"
          :key="item.label"
          class="company-summary-card"
        >
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value">{{ item.value }}</div>
        </div>
      </div>

      <div v-else class="impact-grid">
        <article
          v-for="item in preview.stockImpactPreview"
          :key="item.key"
          class="impact-card"
          :class="item.level"
        >
          <div class="impact-top">
            <div>
              <div class="impact-title">{{ item.title }}</div>
              <div class="impact-subtitle">{{ item.subtitle }}</div>
              <div class="impact-headline">{{ item.headline }}</div>
            </div>
            <div class="impact-badge" :class="item.level">
              {{ impactBadge(item.level) }}
            </div>
          </div>
          <div class="impact-detail">{{ item.detail }}</div>
        </article>
      </div>
    </section>

    <section class="section-card metrics-section">
      <div class="section-title">CPU指標</div>

      <div class="metrics-grid">
        <div class="metric-row">
          <div class="metric-label">{{ player1Name }}株 参加CPU</div>
          <div class="metric-value">{{ cpuStats.p1ParticipantCount }}人</div>
        </div>

        <div class="metric-row">
          <div class="metric-label">{{ player1Name }}株 CPU資金</div>
          <div class="metric-value">{{ formatCurrency(cpuStats.p1InvestmentTotal) }}</div>
        </div>

        <div class="metric-row">
          <div class="metric-label">{{ player2Name }}株 参加CPU</div>
          <div class="metric-value">{{ cpuStats.p2ParticipantCount }}人</div>
        </div>

        <div class="metric-row">
          <div class="metric-label">{{ player2Name }}株 CPU資金</div>
          <div class="metric-value">{{ formatCurrency(cpuStats.p2InvestmentTotal) }}</div>
        </div>

        <div class="metric-row">
          <div class="metric-label">撤退CPU</div>
          <div class="metric-value">{{ cpuStats.withdrawalCount }}人</div>
        </div>

        <div class="metric-row">
          <div class="metric-label">市場参加CPU 合計</div>
          <div class="metric-value">{{ cpuStats.participantCount }}人</div>
        </div>

        <div class="metric-row">
          <div class="metric-label">弱気CPU</div>
          <div class="metric-value">{{ cpuStats.weakParticipantCount }}人</div>
        </div>

        <div class="metric-row">
          <div class="metric-label">強気CPU</div>
          <div class="metric-value">{{ cpuStats.strongParticipantCount }}人</div>
        </div>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.history-panel {
  height: 100%;
  min-height: 0;
  min-width: 0;
  border-radius: 16px;
  border: 1px solid rgba(120, 156, 228, 0.16);
  background:
    linear-gradient(180deg, rgba(2, 10, 28, 0.98) 0%, rgba(2, 8, 22, 0.95) 100%),
    radial-gradient(circle at top, rgba(78, 131, 255, 0.06), transparent 48%);
  padding: 8px;
  display: grid;
  grid-template-rows: auto minmax(0, 1.2fr) minmax(0, 0.98fr);
  gap: 8px;
  overflow: hidden;
}

.panel-head {
  display: grid;
  gap: 2px;
}

.panel-title {
  color: #f4f8ff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.05;
}

.panel-subtitle {
  color: rgba(193, 214, 255, 0.68);
  font-size: 9px;
  line-height: 1.25;
}

.section-card {
  min-height: 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  display: grid;
  align-content: start;
  gap: 8px;
  overflow: hidden;
}

.preview-section {
  grid-template-rows: auto auto auto minmax(0, 1fr);
}

.metrics-section {
  grid-template-rows: auto minmax(0, 1fr);
}

.section-title {
  color: #eef5ff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.1;
}

.preview-banner {
  border-radius: 10px;
  padding: 8px;
  display: grid;
  gap: 3px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.preview-banner-label {
  color: rgba(193, 214, 255, 0.72);
  font-size: 7px;
  font-weight: 700;
}

.preview-banner-main {
  color: #f7fbff;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.15;
}

.preview-banner-sub {
  color: rgba(220, 234, 255, 0.78);
  font-size: 8px;
  line-height: 1.2;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chip {
  min-height: 21px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #edf4ff;
  font-size: 8px;
  font-weight: 800;
}

.impact-grid {
  min-height: 0;
  display: grid;
  gap: 6px;
  overflow: auto;
}

.impact-card {
  border-radius: 10px;
  padding: 7px;
  display: grid;
  gap: 4px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.impact-card.strong-up {
  border-color: rgba(91, 180, 255, 0.54);
  background: rgba(29, 63, 114, 0.24);
}

.impact-card.up {
  border-color: rgba(103, 188, 255, 0.36);
  background: rgba(24, 52, 95, 0.18);
}

.impact-card.down {
  border-color: rgba(255, 151, 151, 0.34);
  background: rgba(98, 41, 41, 0.16);
}

.impact-card.strong-down {
  border-color: rgba(255, 112, 136, 0.56);
  background: rgba(118, 30, 47, 0.24);
}

.impact-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.impact-title {
  color: #f4f8ff;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.05;
}

.impact-subtitle {
  color: rgba(193, 214, 255, 0.68);
  font-size: 7px;
  line-height: 1.1;
  margin-top: 2px;
}

.impact-headline {
  color: rgba(235, 243, 255, 0.9);
  font-size: 8px;
  font-weight: 800;
  line-height: 1.1;
  margin-top: 2px;
}

.impact-detail {
  color: rgba(220, 234, 255, 0.76);
  font-size: 7px;
  line-height: 1.2;
}

.impact-badge {
  min-width: 34px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.impact-badge.strong-up,
.impact-badge.up {
  color: #7dccff;
  background: rgba(42, 93, 166, 0.34);
}

.impact-badge.down,
.impact-badge.strong-down {
  color: #ff9aa7;
  background: rgba(140, 42, 63, 0.32);
}

.impact-badge.neutral {
  color: #d5e3fb;
  background: rgba(255, 255, 255, 0.06);
}

.company-summary-grid,
.metrics-grid {
  min-height: 0;
  display: grid;
  gap: 6px;
  overflow: auto;
}

.company-summary-card,
.metric-row {
  border-radius: 10px;
  padding: 7px 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.025);
  display: grid;
  gap: 2px;
}

.summary-label,
.metric-label {
  color: rgba(193, 214, 255, 0.72);
  font-size: 8px;
  font-weight: 700;
  line-height: 1.15;
}

.summary-value,
.metric-value {
  color: #eef5ff;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
}
</style>
