<script setup lang="ts">
import { computed } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";
import type { MatchingPair } from "../model/quiz.types";

const props = defineProps<{
  pairs: MatchingPair[];
  shuffledAnswers: string[];
  userPairs: Map<string, string>;
  selectedPromptId: string | null;
  currentIndex: number;
  totalCount: number;
  isAnswered: boolean;
  isCorrect: boolean | null;
  isFavorite: boolean;
}>();

defineEmits<{
  (event: "selectPrompt", id: string): void;
  (event: "selectAnswer", text: string): void;
  (event: "submit"): void;
  (event: "next"): void;
  (event: "toggleFavorite"): void;
}>();

const progressPercent = (current: number, total: number) =>
  total > 0 ? ((current + 1) / total) * 100 : 0;

const allPaired = computed(() => props.userPairs.size >= props.pairs.length);

const pairedAnswerForPrompt = (id: string) => props.userPairs.get(id) ?? null;

const isAnswerUsed = (text: string) =>
  [...props.userPairs.values()].includes(text);

const promptState = (pair: MatchingPair) => {
  if (!props.isAnswered) {
    if (props.selectedPromptId === pair.id) return "active";
    if (props.userPairs.has(pair.id)) return "paired";
    return "default";
  }
  // After submit
  return props.userPairs.get(pair.id) === pair.answerText ? "correct" : "wrong";
};

const answerState = (text: string) => {
  if (!props.isAnswered) {
    if (isAnswerUsed(text)) return "paired";
    return "default";
  }
  // After submit — find which prompt was paired with this answer
  for (const pair of props.pairs) {
    if (props.userPairs.get(pair.id) === text) {
      return text === pair.answerText ? "correct" : "wrong";
    }
  }
  return "default";
};

/** Get a short label (A, B, C…) for paired connections. */
const pairLabel = (id: string) => {
  const entries = [...props.userPairs.entries()];
  const idx = entries.findIndex(([key]) => key === id);
  return idx >= 0 ? String.fromCharCode(65 + idx) : "";
};

const pairLabelForAnswer = (text: string) => {
  const entries = [...props.userPairs.entries()];
  const idx = entries.findIndex(([, val]) => val === text);
  return idx >= 0 ? String.fromCharCode(65 + idx) : "";
};
</script>

<template>
  <section class="match-answer">
    <div class="match-answer__progress-bar">
      <div
        class="match-answer__progress-fill"
        :style="{ width: `${progressPercent(currentIndex, totalCount)}%` }"
      />
    </div>

    <div class="match-answer__meta">
      <span class="match-answer__counter">{{ currentIndex + 1 }} / {{ totalCount }}</span>
    </div>

    <div class="match-answer__card">
      <span class="match-answer__kicker">ペアリング</span>
      <p class="match-answer__instruction">左の項目と右の項目を正しく結びつけてください</p>
    </div>

    <div class="match-answer__board">
      <!-- Prompts column -->
      <div class="match-answer__column">
        <button
          v-for="pair in pairs"
          :key="pair.id"
          type="button"
          class="match-answer__item"
          :class="{
            'match-answer__item--active': promptState(pair) === 'active',
            'match-answer__item--paired': promptState(pair) === 'paired',
            'match-answer__item--correct': promptState(pair) === 'correct',
            'match-answer__item--wrong': promptState(pair) === 'wrong',
          }"
          :disabled="isAnswered"
          @click="$emit('selectPrompt', pair.id)"
        >
          <span class="match-answer__item-text">{{ pair.promptText }}</span>
          <span
            v-if="pairedAnswerForPrompt(pair.id)"
            class="match-answer__pair-badge"
          >
            {{ pairLabel(pair.id) }}
          </span>
        </button>
      </div>

      <!-- Answers column -->
      <div class="match-answer__column">
        <button
          v-for="answer in shuffledAnswers"
          :key="answer"
          type="button"
          class="match-answer__item match-answer__item--answer"
          :class="{
            'match-answer__item--paired': answerState(answer) === 'paired',
            'match-answer__item--correct': answerState(answer) === 'correct',
            'match-answer__item--wrong': answerState(answer) === 'wrong',
            'match-answer__item--disabled': !selectedPromptId && !isAnswerUsed(answer) && !isAnswered,
          }"
          :disabled="isAnswered || !selectedPromptId"
          @click="$emit('selectAnswer', answer)"
        >
          <span
            v-if="isAnswerUsed(answer)"
            class="match-answer__pair-badge"
          >
            {{ pairLabelForAnswer(answer) }}
          </span>
          <span class="match-answer__item-text">{{ answer }}</span>
        </button>
      </div>
    </div>

    <Transition name="result">
      <div v-if="isAnswered && isCorrect" class="match-answer__result match-answer__result--correct">
        <span class="match-answer__result-icon">&#10003;</span>
        <span>全問正解！</span>
      </div>
      <div
        v-else-if="isAnswered && !isCorrect"
        class="match-answer__result match-answer__result--incorrect"
      >
        <span class="match-answer__result-icon">&#10007;</span>
        <span>不正解 — 正しいペアを確認してください</span>
      </div>
    </Transition>

    <div class="match-answer__actions">
      <BaseButton
        v-if="!isAnswered"
        class="btn-primary"
        :disabled="!allPaired"
        @click="$emit('submit')"
      >
        解答する
      </BaseButton>
      <template v-else>
        <button
          type="button"
          class="match-answer__fav-btn"
          :class="{ 'match-answer__fav-btn--on': isFavorite }"
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
.match-answer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 600px;
  animation: quiz-slide-in-right 0.4s ease both;
}

.match-answer__progress-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--quiz-surface-strong);
  overflow: hidden;
}

.match-answer__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--quiz-accent), var(--quiz-accent-strong));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.match-answer__meta {
  display: flex;
  justify-content: flex-end;
}

.match-answer__counter {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
}

.match-answer__card {
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

.match-answer__kicker {
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.match-answer__instruction {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.1rem;
  font-weight: 600;
}

/* ── Board ── */

.match-answer__board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.match-answer__column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match-answer__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1.5px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  background: var(--quiz-surface-strong);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.match-answer__item:hover:not(:disabled) {
  border-color: rgba(200, 106, 56, 0.35);
  background: rgba(200, 106, 56, 0.06);
  transform: translateY(-1px);
}

.match-answer__item--answer {
  text-align: right;
  justify-content: flex-end;
}

.match-answer__item-text {
  flex: 1;
  min-width: 0;
}

.match-answer__pair-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.68rem;
  font-weight: 800;
  flex-shrink: 0;
}

/* ── Item states ── */

.match-answer__item--active {
  border-color: var(--quiz-accent);
  background: rgba(200, 106, 56, 0.12);
  box-shadow: 0 0 0 2px var(--quiz-accent-glow);
}

.match-answer__item--paired {
  border-color: rgba(200, 106, 56, 0.35);
  background: rgba(200, 106, 56, 0.06);
}

.match-answer__item--disabled {
  opacity: 0.5;
  cursor: default;
}

.match-answer__item--correct {
  border-color: rgba(74, 222, 128, 0.5);
  background: rgba(74, 222, 128, 0.1);
  animation: quiz-pop 0.35s ease;
}

.match-answer__item--correct .match-answer__pair-badge {
  background: rgba(74, 222, 128, 0.2);
  color: var(--quiz-success);
}

.match-answer__item--wrong {
  border-color: rgba(232, 85, 85, 0.5);
  background: rgba(232, 85, 85, 0.1);
  animation: quiz-shake 0.4s ease;
}

.match-answer__item--wrong .match-answer__pair-badge {
  background: rgba(232, 85, 85, 0.2);
  color: var(--quiz-danger);
}

/* ── Result feedback ── */

.match-answer__result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  font-weight: 700;
}

.match-answer__result--correct {
  background: var(--quiz-success-soft);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--quiz-success);
  animation: quiz-pop 0.35s ease;
}

.match-answer__result--incorrect {
  background: var(--quiz-danger-soft);
  border: 1px solid rgba(232, 85, 85, 0.25);
  color: var(--quiz-danger);
  animation: quiz-shake 0.4s ease;
}

.match-answer__result-icon {
  font-size: 1.1rem;
}

/* ── Actions ── */

.match-answer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.match-answer__fav-btn {
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

.match-answer__fav-btn:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.match-answer__fav-btn:active {
  transform: scale(0.9);
}

.match-answer__fav-btn--on {
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

/* ── Mobile ── */

@media (max-width: 480px) {
  .match-answer__board {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .match-answer__item--answer {
    text-align: left;
    justify-content: flex-start;
  }
}
</style>
