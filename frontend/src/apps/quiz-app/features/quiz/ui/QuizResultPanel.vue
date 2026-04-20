<script setup lang="ts">
import { computed } from 'vue';
import BaseButton from '../../../../../shared/ui/BaseButton.vue';

const props = defineProps<{
  correctCount: number;
  totalCount: number;
}>();

defineEmits<{
  (event: 'retry'): void;
  (event: 'goHome'): void;
}>();

const scorePercent = computed(() =>
  props.totalCount > 0 ? Math.round((props.correctCount / props.totalCount) * 100) : 0,
);

const gradeLabel = computed(() => {
  if (scorePercent.value === 100) return 'パーフェクト！';
  if (scorePercent.value >= 80) return '素晴らしい！';
  if (scorePercent.value >= 60) return 'よくできました！';
  if (scorePercent.value >= 40) return 'もう少し！';
  return '頑張りましょう！';
});
</script>

<template>
  <section class="quiz-result">
    <div class="quiz-result__card">
      <div class="quiz-result__glow" />
      <p class="quiz-result__kicker">結果発表</p>

      <div class="quiz-result__score-ring">
        <svg class="quiz-result__ring" viewBox="0 0 120 120">
          <circle
            class="quiz-result__ring-bg"
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke-width="8"
          />
          <circle
            class="quiz-result__ring-fill"
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke-width="8"
            :stroke-dasharray="`${(scorePercent / 100) * 327} 327`"
            stroke-linecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div class="quiz-result__score-text">
          <span class="quiz-result__percent">{{ scorePercent }}</span>
          <span class="quiz-result__percent-sign">%</span>
        </div>
      </div>

      <p class="quiz-result__grade">{{ gradeLabel }}</p>

      <p class="quiz-result__detail">{{ totalCount }} 問中 {{ correctCount }} 問正解</p>
    </div>

    <div class="quiz-result__actions">
      <BaseButton class="btn-primary quiz-result__btn" @click="$emit('retry')">
        もう一度挑戦する
      </BaseButton>
      <BaseButton class="quiz-result__btn" @click="$emit('goHome')"> トップに戻る </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.quiz-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 480px;
  margin: 0 auto;
  animation: quiz-scale-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.quiz-result__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 32px 24px;
  border: 1px solid var(--quiz-border);
  border-radius: 22px;
  background: var(--quiz-hero-bg-vertical);
  box-shadow: var(--quiz-shadow);
  overflow: hidden;
}

.quiz-result__glow {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 106, 56, 0.2), transparent 60%);
  filter: blur(16px);
  pointer-events: none;
}

.quiz-result__kicker {
  margin: 0;
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.quiz-result__score-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.quiz-result__ring {
  width: 100%;
  height: 100%;
}

.quiz-result__ring-bg {
  stroke: var(--quiz-surface-strong);
}

.quiz-result__ring-fill {
  stroke: var(--quiz-accent-strong);
  transition: stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.quiz-result__score-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quiz-result__percent {
  color: var(--quiz-text);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.quiz-result__percent-sign {
  color: var(--quiz-text-muted);
  font-size: 1rem;
  font-weight: 600;
  margin-left: 2px;
}

.quiz-result__grade {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.3rem;
  font-weight: 700;
  animation: quiz-pop 0.5s ease 0.3s both;
}

.quiz-result__detail {
  margin: 0;
  color: var(--quiz-text-soft);
  font-size: 0.88rem;
}

.quiz-result__actions {
  display: flex;
  gap: 10px;
  animation: quiz-fade-up 0.4s ease 0.2s both;
}

.quiz-result__btn {
  padding: 10px 20px;
  font-size: 0.86rem;
}
</style>
