<script setup lang="ts">
import BaseButton from "../../../../../shared/ui/BaseButton.vue";

const props = defineProps<{
  prompt: string;
  choices: string[];
  currentIndex: number;
  totalCount: number;
  selectedChoice: string;
  isRevealed: boolean;
  isAnswered: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
  isFavorite: boolean;
}>();

defineEmits<{
  (event: "selectChoice", choice: string): void;
  (event: "judge", correct: boolean): void;
  (event: "next"): void;
  (event: "toggleFavorite"): void;
}>();

const progressPercent = (current: number, total: number) =>
  total > 0 ? ((current + 1) / total) * 100 : 0;

const choiceState = (choice: string) => {
  if (!props.isRevealed) return "default";
  if (choice === props.correctAnswer && props.isAnswered && !props.isCorrect)
    return "correct";
  if (choice === props.selectedChoice) {
    if (!props.isAnswered) return "selected";
    return props.isCorrect ? "correct" : "wrong";
  }
  return "dimmed";
};
</script>

<template>
  <section class="ba-answer">
    <div class="ba-answer__progress-bar">
      <div
        class="ba-answer__progress-fill"
        :style="{ width: `${progressPercent(currentIndex, totalCount)}%` }"
      />
    </div>

    <div class="ba-answer__meta">
      <span class="ba-answer__counter">{{ currentIndex + 1 }} / {{ totalCount }}</span>
    </div>

    <div class="ba-answer__card">
      <span class="ba-answer__kicker">ベストアンサー</span>
      <p class="ba-answer__word">{{ prompt }}</p>
    </div>

    <div class="ba-answer__choices">
      <button
        v-for="(choice, i) in choices"
        :key="i"
        type="button"
        class="ba-answer__choice"
        :class="{
          'ba-answer__choice--selected': choiceState(choice) === 'selected',
          'ba-answer__choice--correct': choiceState(choice) === 'correct',
          'ba-answer__choice--wrong': choiceState(choice) === 'wrong',
          'ba-answer__choice--dimmed': choiceState(choice) === 'dimmed',
        }"
        :disabled="isRevealed"
        @click="$emit('selectChoice', choice)"
      >
        <span class="ba-answer__choice-index">{{ ['A', 'B', 'C', 'D'][i] }}</span>
        <span class="ba-answer__choice-text">{{ choice }}</span>
      </button>
    </div>

    <Transition name="result">
      <div v-if="isRevealed && !isAnswered" class="ba-answer__reveal">
        <p class="ba-answer__reveal-label">模範解答:</p>
        <p class="ba-answer__reveal-text">{{ correctAnswer }}</p>
        <p class="ba-answer__reveal-hint">あなたの解答は正解ですか？</p>
      </div>
    </Transition>

    <Transition name="result">
      <div v-if="isAnswered && isCorrect" class="ba-answer__result ba-answer__result--correct">
        <span class="ba-answer__result-icon">&#10003;</span>
        <span>正解！</span>
      </div>
      <div
        v-else-if="isAnswered && isCorrect === false"
        class="ba-answer__result ba-answer__result--incorrect"
      >
        <div class="ba-answer__result-main">
          <span class="ba-answer__result-icon">&#10007;</span>
          <span>不正解</span>
        </div>
        <p class="ba-answer__correct-label">
          模範解答: <strong>{{ correctAnswer }}</strong>
        </p>
      </div>
    </Transition>

    <div class="ba-answer__actions">
      <template v-if="isRevealed && !isAnswered">
        <BaseButton
          class="ba-answer__judge-btn ba-answer__judge-btn--correct"
          @click="$emit('judge', true)"
        >
          正解
        </BaseButton>
        <BaseButton
          class="ba-answer__judge-btn ba-answer__judge-btn--wrong"
          @click="$emit('judge', false)"
        >
          不正解
        </BaseButton>
      </template>

      <template v-if="isAnswered">
        <button
          type="button"
          class="ba-answer__fav-btn"
          :class="{ 'ba-answer__fav-btn--on': isFavorite }"
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
.ba-answer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 540px;
  animation: quiz-slide-in-right 0.4s ease both;
}

.ba-answer__progress-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--quiz-surface-strong);
  overflow: hidden;
}

.ba-answer__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--quiz-accent), var(--quiz-accent-strong));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ba-answer__meta {
  display: flex;
  justify-content: flex-end;
}

.ba-answer__counter {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
}

.ba-answer__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px 20px;
  border: 1px solid var(--quiz-border);
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(200, 106, 56, 0.08), transparent 40%),
    var(--quiz-surface);
  box-shadow: var(--quiz-shadow);
  animation: quiz-pulse-glow 3s ease-in-out infinite;
}

.ba-answer__kicker {
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.ba-answer__word {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* ── Choices ── */

.ba-answer__choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ba-answer__choice {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  background: var(--quiz-surface-strong);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.ba-answer__choice:hover:not(:disabled) {
  border-color: rgba(200, 106, 56, 0.4);
  background: rgba(200, 106, 56, 0.08);
  transform: translateY(-1px);
}

.ba-answer__choice:active:not(:disabled) {
  transform: scale(0.98);
}

.ba-answer__choice-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: var(--quiz-text-muted);
  font-size: 0.76rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ba-answer__choice-text {
  flex: 1;
  min-width: 0;
}

/* ── Choice states after reveal ── */

.ba-answer__choice--selected {
  border-color: rgba(96, 165, 250, 0.5);
  background: rgba(96, 165, 250, 0.1);
  color: rgb(147, 197, 253);
}

.ba-answer__choice--selected .ba-answer__choice-index {
  background: rgba(96, 165, 250, 0.2);
  color: rgb(147, 197, 253);
}

.ba-answer__choice--correct {
  border-color: rgba(74, 222, 128, 0.5);
  background: rgba(74, 222, 128, 0.1);
  color: var(--quiz-success);
  animation: quiz-pop 0.35s ease;
}

.ba-answer__choice--correct .ba-answer__choice-index {
  background: rgba(74, 222, 128, 0.2);
  color: var(--quiz-success);
}

.ba-answer__choice--wrong {
  border-color: rgba(232, 85, 85, 0.5);
  background: rgba(232, 85, 85, 0.1);
  color: var(--quiz-danger);
  animation: quiz-shake 0.4s ease;
}

.ba-answer__choice--wrong .ba-answer__choice-index {
  background: rgba(232, 85, 85, 0.2);
  color: var(--quiz-danger);
}

.ba-answer__choice--dimmed {
  opacity: 0.4;
}

/* ── Reveal ── */

.ba-answer__reveal {
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  background: rgba(200, 106, 56, 0.08);
  border: 1px solid rgba(200, 106, 56, 0.2);
  animation: quiz-scale-in 0.3s ease;
}

.ba-answer__reveal-label {
  margin: 0 0 4px;
  color: var(--quiz-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.ba-answer__reveal-text {
  margin: 0 0 8px;
  color: var(--quiz-text);
  font-size: 1.1rem;
  font-weight: 700;
}

.ba-answer__reveal-hint {
  margin: 0;
  color: var(--quiz-text-soft);
  font-size: 0.8rem;
}

/* ── Result feedback ── */

.ba-answer__result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  font-weight: 700;
}

.ba-answer__result--correct {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background: var(--quiz-success-soft);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--quiz-success);
  animation: quiz-pop 0.35s ease;
}

.ba-answer__result--incorrect {
  background: var(--quiz-danger-soft);
  border: 1px solid rgba(232, 85, 85, 0.25);
  color: var(--quiz-danger);
  animation: quiz-shake 0.4s ease;
}

.ba-answer__result-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ba-answer__result-icon {
  font-size: 1.1rem;
}

.ba-answer__correct-label {
  margin: 0;
  color: var(--quiz-text-soft);
  font-size: 0.84rem;
  font-weight: 400;
}

.ba-answer__correct-label strong {
  color: var(--quiz-text);
}

/* ── Actions ── */

.ba-answer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
}

.ba-answer__judge-btn {
  flex: 1;
  padding: 12px 16px;
  font-size: 0.9rem;
  border-radius: var(--quiz-radius);
  font-weight: 700;
  animation: quiz-fade-in 0.2s ease both;
}

.ba-answer__judge-btn--correct {
  border: 1.5px solid rgba(74, 222, 128, 0.4);
  background: rgba(74, 222, 128, 0.08);
  color: var(--quiz-success);
}

.ba-answer__judge-btn--correct:hover {
  background: rgba(74, 222, 128, 0.15);
}

.ba-answer__judge-btn--wrong {
  border: 1.5px solid rgba(232, 85, 85, 0.4);
  background: rgba(232, 85, 85, 0.08);
  color: var(--quiz-danger);
}

.ba-answer__judge-btn--wrong:hover {
  background: rgba(232, 85, 85, 0.15);
}

.ba-answer__fav-btn {
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

.ba-answer__fav-btn:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.ba-answer__fav-btn:active {
  transform: scale(0.9);
}

.ba-answer__fav-btn--on {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  animation: fav-pop 0.35s cubic-bezier(0.17, 0.67, 0.21, 1.2);
}

.ba-answer__fav-btn--on:hover {
  background: rgba(255, 193, 7, 0.22);
  color: #ffca28;
}

@keyframes fav-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* ── Vue transition ── */

.result-enter-active {
  animation: quiz-scale-in 0.3s ease;
}

.result-leave-active {
  animation: quiz-fade-in 0.15s ease reverse;
}
</style>
