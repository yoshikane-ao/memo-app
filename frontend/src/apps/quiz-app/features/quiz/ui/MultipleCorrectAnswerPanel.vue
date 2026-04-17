<script setup lang="ts">
import BaseButton from "../../../../../shared/ui/BaseButton.vue";
import type { MultipleCorrectPair } from "../model/quiz.types";

defineProps<{
  pairs: MultipleCorrectPair[];
  selected: Set<number>;
  currentIndex: number;
  totalCount: number;
  isAnswered: boolean;
  isCorrect: boolean | null;
  isFavorite: boolean;
}>();

defineEmits<{
  (event: "toggle", index: number): void;
  (event: "submit"): void;
  (event: "next"): void;
  (event: "toggleFavorite"): void;
}>();

const progressPercent = (current: number, total: number) =>
  total > 0 ? ((current + 1) / total) * 100 : 0;

const pairState = (
  pair: MultipleCorrectPair,
  index: number,
  isAnswered: boolean,
  selected: Set<number>,
) => {
  if (!isAnswered) return selected.has(index) ? "selected" : "default";
  const wasSelected = selected.has(index);
  if (pair.isCorrect && wasSelected) return "correct";
  if (pair.isCorrect && !wasSelected) return "missed";
  if (!pair.isCorrect && wasSelected) return "wrong";
  return "dimmed";
};
</script>

<template>
  <section class="mc-answer">
    <div class="mc-answer__progress-bar">
      <div
        class="mc-answer__progress-fill"
        :style="{ width: `${progressPercent(currentIndex, totalCount)}%` }"
      />
    </div>

    <div class="mc-answer__meta">
      <span class="mc-answer__counter">{{ currentIndex + 1 }} / {{ totalCount }}</span>
    </div>

    <div class="mc-answer__card">
      <span class="mc-answer__kicker">複数正解</span>
      <p class="mc-answer__instruction">正しい組み合わせをすべて選んでください</p>
    </div>

    <div class="mc-answer__pairs">
      <button
        v-for="(pair, i) in pairs"
        :key="i"
        type="button"
        class="mc-answer__pair"
        :class="{
          'mc-answer__pair--selected': pairState(pair, i, isAnswered, selected) === 'selected',
          'mc-answer__pair--correct': pairState(pair, i, isAnswered, selected) === 'correct',
          'mc-answer__pair--missed': pairState(pair, i, isAnswered, selected) === 'missed',
          'mc-answer__pair--wrong': pairState(pair, i, isAnswered, selected) === 'wrong',
          'mc-answer__pair--dimmed': pairState(pair, i, isAnswered, selected) === 'dimmed',
        }"
        :disabled="isAnswered"
        @click="$emit('toggle', i)"
      >
        <span class="mc-answer__pair-check">
          {{ selected.has(i) ? '&#10003;' : '' }}
        </span>
        <span class="mc-answer__pair-prompt">{{ pair.prompt }}</span>
        <span class="mc-answer__pair-arrow">&rarr;</span>
        <span class="mc-answer__pair-answer">{{ pair.answer }}</span>
      </button>
    </div>

    <Transition name="result">
      <div v-if="isAnswered && isCorrect" class="mc-answer__result mc-answer__result--correct">
        <span class="mc-answer__result-icon">&#10003;</span>
        <span>全問正解！</span>
      </div>
      <div
        v-else-if="isAnswered && !isCorrect"
        class="mc-answer__result mc-answer__result--incorrect"
      >
        <span class="mc-answer__result-icon">&#10007;</span>
        <span>不正解 — 正しい組み合わせを確認してください</span>
      </div>
    </Transition>

    <div class="mc-answer__actions">
      <BaseButton
        v-if="!isAnswered"
        class="btn-primary"
        :disabled="selected.size === 0"
        @click="$emit('submit')"
      >
        解答する
      </BaseButton>
      <template v-else>
        <button
          type="button"
          class="mc-answer__fav-btn"
          :class="{ 'mc-answer__fav-btn--on': isFavorite }"
          :title="isFavorite ? 'お気に入り解除' : 'お気に入りに追加'"
          @click="$emit('toggleFavorite')"
        >
          {{ isFavorite ? '\u2605' : '\u2606' }}
        </button>
        <BaseButton class="btn-primary" @click="$emit('next')">
          {{ currentIndex + 1 < totalCount ? '次の問題へ' : '結果を見る' }}
        </BaseButton>
      </template>
    </div>
  </section>
</template>

<style scoped>
.mc-answer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 540px;
  animation: quiz-slide-in-right 0.4s ease both;
}

.mc-answer__progress-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--quiz-surface-strong);
  overflow: hidden;
}

.mc-answer__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--quiz-accent), var(--quiz-accent-strong));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.mc-answer__meta {
  display: flex;
  justify-content: flex-end;
}

.mc-answer__counter {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
}

.mc-answer__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--quiz-border);
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(200, 106, 56, 0.08), transparent 40%),
    var(--quiz-surface);
  box-shadow: var(--quiz-shadow);
}

.mc-answer__kicker {
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.mc-answer__instruction {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.1rem;
  font-weight: 600;
}

/* ── Pairs ── */

.mc-answer__pairs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mc-answer__pair {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  background: var(--quiz-surface-strong);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.mc-answer__pair:hover:not(:disabled) {
  border-color: rgba(200, 106, 56, 0.3);
  background: rgba(200, 106, 56, 0.06);
  transform: translateY(-1px);
}

.mc-answer__pair-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1.5px solid var(--quiz-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--quiz-accent-strong);
  font-size: 0.76rem;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.mc-answer__pair--selected .mc-answer__pair-check {
  border-color: var(--quiz-accent);
  background: var(--quiz-accent-soft);
}

.mc-answer__pair-prompt {
  flex: 1;
  min-width: 0;
}

.mc-answer__pair-arrow {
  color: var(--quiz-text-muted);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.mc-answer__pair-answer {
  flex: 1;
  min-width: 0;
  text-align: right;
  color: var(--quiz-text-soft);
}

/* ── Selected state ── */

.mc-answer__pair--selected {
  border-color: rgba(200, 106, 56, 0.4);
  background: rgba(200, 106, 56, 0.08);
}

/* ── After answer states ── */

.mc-answer__pair--correct {
  border-color: rgba(74, 222, 128, 0.5);
  background: rgba(74, 222, 128, 0.1);
  animation: quiz-pop 0.35s ease;
}

.mc-answer__pair--correct .mc-answer__pair-check {
  border-color: var(--quiz-success);
  background: rgba(74, 222, 128, 0.2);
  color: var(--quiz-success);
}

.mc-answer__pair--missed {
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.05);
}

.mc-answer__pair--missed .mc-answer__pair-check {
  border-color: var(--quiz-success);
  color: var(--quiz-success);
}

.mc-answer__pair--wrong {
  border-color: rgba(232, 85, 85, 0.5);
  background: rgba(232, 85, 85, 0.1);
  animation: quiz-shake 0.4s ease;
}

.mc-answer__pair--wrong .mc-answer__pair-check {
  border-color: var(--quiz-danger);
  background: rgba(232, 85, 85, 0.2);
  color: var(--quiz-danger);
}

.mc-answer__pair--dimmed {
  opacity: 0.4;
}

/* ── Result feedback ── */

.mc-answer__result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  font-weight: 700;
}

.mc-answer__result--correct {
  background: var(--quiz-success-soft);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--quiz-success);
  animation: quiz-pop 0.35s ease;
}

.mc-answer__result--incorrect {
  background: var(--quiz-danger-soft);
  border: 1px solid rgba(232, 85, 85, 0.25);
  color: var(--quiz-danger);
  animation: quiz-shake 0.4s ease;
}

.mc-answer__result-icon {
  font-size: 1.1rem;
}

/* ── Actions ── */

.mc-answer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mc-answer__fav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--quiz-border);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.25);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
  animation: quiz-fade-in 0.25s ease both;
}

.mc-answer__fav-btn:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.mc-answer__fav-btn:active {
  transform: scale(0.9);
}

.mc-answer__fav-btn--on {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

/* ── Vue transition ── */

.result-enter-active {
  animation: quiz-scale-in 0.3s ease;
}

.result-leave-active {
  animation: quiz-fade-in 0.15s ease reverse;
}
</style>
