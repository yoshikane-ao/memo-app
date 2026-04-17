<script setup lang="ts">
import { ref, watch } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";

const props = defineProps<{
  prompt: string;
  shownAnswer: string;
  currentIndex: number;
  totalCount: number;
  isAnswered: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
  isFavorite: boolean;
}>();

defineEmits<{
  (event: "answer", value: boolean): void;
  (event: "next"): void;
  (event: "toggleFavorite"): void;
}>();

const userSelection = ref<boolean | null>(null);

watch(() => props.currentIndex, () => {
  userSelection.value = null;
});

const progressPercent = (current: number, total: number) =>
  total > 0 ? ((current + 1) / total) * 100 : 0;
</script>

<template>
  <section class="tf-answer">
    <div class="tf-answer__progress-bar">
      <div
        class="tf-answer__progress-fill"
        :style="{ width: `${progressPercent(currentIndex, totalCount)}%` }"
      />
    </div>

    <div class="tf-answer__meta">
      <span class="tf-answer__counter">{{ currentIndex + 1 }} / {{ totalCount }}</span>
    </div>

    <div class="tf-answer__card">
      <span class="tf-answer__kicker">○×問題</span>
      <p class="tf-answer__statement">
        「<strong>{{ prompt }}</strong>」の答えは「<strong>{{ shownAnswer }}</strong>」である
      </p>
    </div>

    <div class="tf-answer__buttons">
      <button
        type="button"
        class="tf-answer__btn tf-answer__btn--true"
        :class="{
          'tf-answer__btn--selected': userSelection === true,
          'tf-answer__btn--correct': isAnswered && isCorrect && userSelection === true,
          'tf-answer__btn--wrong': isAnswered && !isCorrect && userSelection === true,
          'tf-answer__btn--dimmed': isAnswered && userSelection !== true,
        }"
        :disabled="isAnswered"
        @click="userSelection = true; $emit('answer', true)"
      >
        <span class="tf-answer__btn-symbol">&#9675;</span>
        <span class="tf-answer__btn-label">正しい</span>
      </button>
      <button
        type="button"
        class="tf-answer__btn tf-answer__btn--false"
        :class="{
          'tf-answer__btn--selected': userSelection === false,
          'tf-answer__btn--correct': isAnswered && isCorrect && userSelection === false,
          'tf-answer__btn--wrong': isAnswered && !isCorrect && userSelection === false,
          'tf-answer__btn--dimmed': isAnswered && userSelection !== false,
        }"
        :disabled="isAnswered"
        @click="userSelection = false; $emit('answer', false)"
      >
        <span class="tf-answer__btn-symbol">&times;</span>
        <span class="tf-answer__btn-label">間違い</span>
      </button>
    </div>

    <Transition name="result">
      <div v-if="isAnswered && isCorrect" class="tf-answer__result tf-answer__result--correct">
        <span class="tf-answer__result-icon">&#10003;</span>
        <span>正解！</span>
      </div>
      <div
        v-else-if="isAnswered && !isCorrect"
        class="tf-answer__result tf-answer__result--incorrect"
      >
        <div class="tf-answer__result-main">
          <span class="tf-answer__result-icon">&#10007;</span>
          <span>不正解</span>
        </div>
        <p class="tf-answer__correct-label">
          正しい答え: <strong>{{ correctAnswer }}</strong>
        </p>
      </div>
    </Transition>

    <div class="tf-answer__actions">
      <template v-if="isAnswered">
        <button
          type="button"
          class="tf-answer__fav-btn"
          :class="{ 'tf-answer__fav-btn--on': isFavorite }"
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
.tf-answer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 540px;
  animation: quiz-slide-in-right 0.4s ease both;
}

.tf-answer__progress-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--quiz-surface-strong);
  overflow: hidden;
}

.tf-answer__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--quiz-accent), var(--quiz-accent-strong));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.tf-answer__meta {
  display: flex;
  justify-content: flex-end;
}

.tf-answer__counter {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
}

.tf-answer__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 20px;
  border: 1px solid var(--quiz-border);
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(200, 106, 56, 0.08), transparent 40%),
    var(--quiz-surface);
  box-shadow: var(--quiz-shadow);
  animation: quiz-pulse-glow 3s ease-in-out infinite;
}

.tf-answer__kicker {
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.tf-answer__statement {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.6;
}

.tf-answer__statement strong {
  color: var(--quiz-accent-strong);
}

/* ── ○× ボタン ── */

.tf-answer__buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tf-answer__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 16px;
  border: 2px solid var(--quiz-border);
  border-radius: 16px;
  background: var(--quiz-surface-strong);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.tf-answer__btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.tf-answer__btn:active:not(:disabled) {
  transform: scale(0.97);
}

.tf-answer__btn--true:hover:not(:disabled) {
  border-color: rgba(74, 222, 128, 0.4);
  background: rgba(74, 222, 128, 0.06);
}

.tf-answer__btn--false:hover:not(:disabled) {
  border-color: rgba(232, 85, 85, 0.4);
  background: rgba(232, 85, 85, 0.06);
}

.tf-answer__btn-symbol {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.tf-answer__btn--true .tf-answer__btn-symbol {
  color: var(--quiz-success);
}

.tf-answer__btn--false .tf-answer__btn-symbol {
  color: var(--quiz-danger);
}

.tf-answer__btn-label {
  color: var(--quiz-text-soft);
  font-family: var(--quiz-font);
  font-size: 0.82rem;
  font-weight: 600;
}

/* ── 回答後のボタン状態 ── */

.tf-answer__btn--correct {
  border-color: rgba(74, 222, 128, 0.6);
  background: rgba(74, 222, 128, 0.12);
  animation: quiz-pop 0.35s ease;
}

.tf-answer__btn--wrong {
  border-color: rgba(232, 85, 85, 0.6);
  background: rgba(232, 85, 85, 0.12);
  animation: quiz-shake 0.4s ease;
}

.tf-answer__btn--dimmed {
  opacity: 0.35;
}

/* ── 結果フィードバック ── */

.tf-answer__result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--quiz-radius);
  font-weight: 700;
}

.tf-answer__result--correct {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background: var(--quiz-success-soft);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--quiz-success);
  animation: quiz-pop 0.35s ease;
}

.tf-answer__result--incorrect {
  background: var(--quiz-danger-soft);
  border: 1px solid rgba(232, 85, 85, 0.25);
  color: var(--quiz-danger);
  animation: quiz-shake 0.4s ease;
}

.tf-answer__result-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tf-answer__result-icon {
  font-size: 1.1rem;
}

.tf-answer__correct-label {
  margin: 0;
  color: var(--quiz-text-soft);
  font-size: 0.84rem;
  font-weight: 400;
}

.tf-answer__correct-label strong {
  color: var(--quiz-text);
}

/* ── アクション ── */

.tf-answer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
}

.tf-answer__fav-btn {
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

.tf-answer__fav-btn:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.tf-answer__fav-btn:active {
  transform: scale(0.9);
}

.tf-answer__fav-btn--on {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  animation: fav-pop 0.35s cubic-bezier(0.17, 0.67, 0.21, 1.2);
}

.tf-answer__fav-btn--on:hover {
  background: rgba(255, 193, 7, 0.22);
  color: #ffca28;
}

@keyframes fav-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* ── Vueトランジション ── */

.result-enter-active {
  animation: quiz-scale-in 0.3s ease;
}

.result-leave-active {
  animation: quiz-fade-in 0.15s ease reverse;
}
</style>
