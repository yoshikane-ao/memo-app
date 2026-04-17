<script setup lang="ts">
import { computed } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";

const props = defineProps<{
  prompt: string;
  direction: "word-to-meaning" | "meaning-to-word";
  currentIndex: number;
  totalCount: number;
  userAnswer: string;
  isRevealed: boolean;
  isAnswered: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
  isFavorite: boolean;
}>();

defineEmits<{
  (event: "update:userAnswer", value: string): void;
  (event: "reveal"): void;
  (event: "selfJudge", correct: boolean): void;
  (event: "next"): void;
  (event: "toggleFavorite"): void;
}>();

const progressPercent = (current: number, total: number) =>
  total > 0 ? ((current + 1) / total) * 100 : 0;

const inputPlaceholder = computed(() =>
  props.direction === "word-to-meaning"
    ? "意味を自分の言葉で入力してください"
    : "単語を入力してください",
);
</script>

<template>
  <section class="wa-answer">
    <div class="wa-answer__progress-bar">
      <div
        class="wa-answer__progress-fill"
        :style="{ width: `${progressPercent(currentIndex, totalCount)}%` }"
      />
    </div>

    <div class="wa-answer__meta">
      <span class="wa-answer__counter">{{ currentIndex + 1 }} / {{ totalCount }}</span>
    </div>

    <div class="wa-answer__card">
      <span class="wa-answer__kicker">正解を作る</span>
      <p class="wa-answer__word">{{ prompt }}</p>
    </div>

    <div class="wa-answer__input-area">
      <label class="wa-answer__field">
        <span class="wa-answer__label">あなたの解答</span>
        <textarea
          :value="userAnswer"
          :placeholder="inputPlaceholder"
          :disabled="isRevealed"
          rows="3"
          @input="$emit('update:userAnswer', ($event.target as HTMLTextAreaElement).value)"
          @keydown.enter.ctrl="!isRevealed && $emit('reveal')"
        />
      </label>
    </div>

    <Transition name="result">
      <div v-if="isRevealed" class="wa-answer__reveal">
        <p class="wa-answer__reveal-label">正解:</p>
        <p class="wa-answer__reveal-text">{{ correctAnswer }}</p>
      </div>
    </Transition>

    <Transition name="result">
      <div v-if="isAnswered && isCorrect" class="wa-answer__result wa-answer__result--correct">
        <span class="wa-answer__result-icon">&#10003;</span>
        <span>正解！</span>
      </div>
      <div
        v-else-if="isAnswered && isCorrect === false"
        class="wa-answer__result wa-answer__result--incorrect"
      >
        <span class="wa-answer__result-icon">&#10007;</span>
        <span>不正解</span>
      </div>
    </Transition>

    <div class="wa-answer__actions">
      <BaseButton
        v-if="!isRevealed"
        class="btn-primary"
        @click="$emit('reveal')"
      >
        答え合わせ
      </BaseButton>

      <template v-else-if="!isAnswered">
        <BaseButton
          class="wa-answer__judge-btn wa-answer__judge-btn--correct"
          @click="$emit('selfJudge', true)"
        >
          正解
        </BaseButton>
        <BaseButton
          class="wa-answer__judge-btn wa-answer__judge-btn--wrong"
          @click="$emit('selfJudge', false)"
        >
          不正解
        </BaseButton>
      </template>

      <template v-else>
        <button
          type="button"
          class="wa-answer__fav-btn"
          :class="{ 'wa-answer__fav-btn--on': isFavorite }"
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
.wa-answer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 540px;
  animation: quiz-slide-in-right 0.4s ease both;
}

.wa-answer__progress-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--quiz-surface-strong);
  overflow: hidden;
}

.wa-answer__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--quiz-accent), var(--quiz-accent-strong));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.wa-answer__meta {
  display: flex;
  justify-content: flex-end;
}

.wa-answer__counter {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
}

.wa-answer__card {
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

.wa-answer__kicker {
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.wa-answer__word {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.wa-answer__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.wa-answer__label {
  color: var(--quiz-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.wa-answer__field textarea {
  resize: vertical;
  min-height: 60px;
}

/* ── Reveal ── */

.wa-answer__reveal {
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  background: rgba(200, 106, 56, 0.08);
  border: 1px solid rgba(200, 106, 56, 0.2);
  animation: quiz-scale-in 0.3s ease;
}

.wa-answer__reveal-label {
  margin: 0 0 4px;
  color: var(--quiz-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.wa-answer__reveal-text {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.1rem;
  font-weight: 700;
}

/* ── Result ── */

.wa-answer__result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  font-weight: 700;
}

.wa-answer__result--correct {
  background: var(--quiz-success-soft);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--quiz-success);
  animation: quiz-pop 0.35s ease;
}

.wa-answer__result--incorrect {
  background: var(--quiz-danger-soft);
  border: 1px solid rgba(232, 85, 85, 0.25);
  color: var(--quiz-danger);
  animation: quiz-shake 0.4s ease;
}

.wa-answer__result-icon {
  font-size: 1.1rem;
}

/* ── Actions ── */

.wa-answer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wa-answer__judge-btn {
  flex: 1;
  padding: 12px 16px;
  font-size: 0.9rem;
  border-radius: var(--quiz-radius);
  font-weight: 700;
  animation: quiz-fade-in 0.2s ease both;
}

.wa-answer__judge-btn--correct {
  border: 1.5px solid rgba(74, 222, 128, 0.4);
  background: rgba(74, 222, 128, 0.08);
  color: var(--quiz-success);
}

.wa-answer__judge-btn--correct:hover {
  background: rgba(74, 222, 128, 0.15);
}

.wa-answer__judge-btn--wrong {
  border: 1.5px solid rgba(232, 85, 85, 0.4);
  background: rgba(232, 85, 85, 0.08);
  color: var(--quiz-danger);
}

.wa-answer__judge-btn--wrong:hover {
  background: rgba(232, 85, 85, 0.15);
}

.wa-answer__fav-btn {
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
}

.wa-answer__fav-btn:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.wa-answer__fav-btn--on {
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
