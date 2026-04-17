<script setup lang="ts">
import { computed } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";

const props = defineProps<{
  prompt: string;
  direction: "word-to-meaning" | "meaning-to-word";
  currentIndex: number;
  totalCount: number;
  userAnswer: string;
  isAnswered: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
  isFavorite: boolean;
}>();

defineEmits<{
  (event: "update:userAnswer", value: string): void;
  (event: "submit"): void;
  (event: "next"): void;
  (event: "toggleFavorite"): void;
}>();

const progressPercent = (current: number, total: number) =>
  total > 0 ? ((current + 1) / total) * 100 : 0;

const inputPlaceholder = computed(() =>
  props.direction === "word-to-meaning" ? "意味を入力してください" : "単語を入力してください",
);
</script>

<template>
  <section class="quiz-answer">
    <div class="quiz-answer__progress-bar">
      <div
        class="quiz-answer__progress-fill"
        :style="{ width: `${progressPercent(currentIndex, totalCount)}%` }"
      />
    </div>

    <div class="quiz-answer__meta">
      <span class="quiz-answer__counter">{{ currentIndex + 1 }} / {{ totalCount }}</span>
    </div>

    <div class="quiz-answer__card">
      <span class="quiz-answer__kicker">問題</span>
      <p class="quiz-answer__word">{{ prompt }}</p>
    </div>

    <div class="quiz-answer__input-area">
      <label class="quiz-answer__field">
        <span class="quiz-answer__label">あなたの解答</span>
        <input
          :value="userAnswer"
          type="text"
          :placeholder="inputPlaceholder"
          :disabled="isAnswered"
          @input="$emit('update:userAnswer', ($event.target as HTMLInputElement).value)"
          @keyup.enter="isAnswered ? $emit('next') : $emit('submit')"
        />
      </label>
    </div>

    <Transition name="result">
      <div v-if="isAnswered && isCorrect" class="quiz-answer__result quiz-answer__result--correct">
        <span class="quiz-answer__result-icon">&#10003;</span>
        <span>正解！</span>
      </div>
      <div
        v-else-if="isAnswered && !isCorrect"
        class="quiz-answer__result quiz-answer__result--incorrect"
      >
        <div class="quiz-answer__result-main">
          <span class="quiz-answer__result-icon">&#10007;</span>
          <span>不正解</span>
        </div>
        <p class="quiz-answer__correct-label">
          正解: <strong>{{ correctAnswer }}</strong>
        </p>
      </div>
    </Transition>

    <div class="quiz-answer__actions">
      <BaseButton
        v-if="!isAnswered"
        class="btn-primary"
        :disabled="userAnswer.trim() === ''"
        @click="$emit('submit')"
      >
        解答する
      </BaseButton>
      <template v-else>
        <button
          type="button"
          class="quiz-answer__fav-btn"
          :class="{ 'quiz-answer__fav-btn--on': isFavorite }"
          :title="isFavorite ? 'お気に入り解除' : 'お気に入りに追加'"
          @click="$emit('toggleFavorite')"
        >
          {{ isFavorite ? '\u2605' : '\u2606' }}
        </button>
        <BaseButton
          class="btn-primary"
          @click="$emit('next')"
        >
          {{ currentIndex + 1 < totalCount ? '次の問題へ' : '結果を見る' }}
        </BaseButton>
      </template>
    </div>
  </section>
</template>

<style scoped>
.quiz-answer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 540px;
  animation: quiz-slide-in-right 0.4s ease both;
}

.quiz-answer__progress-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--quiz-surface-strong);
  overflow: hidden;
}

.quiz-answer__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--quiz-accent), var(--quiz-accent-strong));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.quiz-answer__meta {
  display: flex;
  justify-content: flex-end;
}

.quiz-answer__counter {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
}

.quiz-answer__card {
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

.quiz-answer__kicker {
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.quiz-answer__word {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.quiz-answer__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quiz-answer__label {
  color: var(--quiz-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

/* ── Result feedback ── */

.quiz-answer__result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  font-weight: 700;
}

.quiz-answer__result--correct {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background: var(--quiz-success-soft);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--quiz-success);
  animation: quiz-pop 0.35s ease;
}

.quiz-answer__result--incorrect {
  background: var(--quiz-danger-soft);
  border: 1px solid rgba(232, 85, 85, 0.25);
  color: var(--quiz-danger);
  animation: quiz-shake 0.4s ease;
}

.quiz-answer__result-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quiz-answer__result-icon {
  font-size: 1.1rem;
}

.quiz-answer__correct-label {
  margin: 0;
  color: var(--quiz-text-soft);
  font-size: 0.84rem;
  font-weight: 400;
}

.quiz-answer__correct-label strong {
  color: var(--quiz-text);
}

.quiz-answer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
}

.quiz-answer__fav-btn {
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

.quiz-answer__fav-btn:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.quiz-answer__fav-btn:active {
  transform: scale(0.9);
}

.quiz-answer__fav-btn--on {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  animation: fav-pop 0.35s cubic-bezier(0.17, 0.67, 0.21, 1.2);
}

.quiz-answer__fav-btn--on:hover {
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
