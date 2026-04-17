<script setup lang="ts">
import BaseButton from "../../../../../shared/ui/BaseButton.vue";

defineEmits<{
  (event: "goToCreate"): void;
  (event: "goToAnswer"): void;
}>();

defineProps<{
  quizCount: number;
}>();
</script>

<template>
  <section class="quiz-start">
    <div class="quiz-start__hero">
      <div class="quiz-start__glow" />
      <p class="quiz-start__kicker">QUIZ APP</p>
      <h1 class="quiz-start__title">クイズで学ぼう</h1>
      <p class="quiz-start__description">
        登録した単語と意味をクイズ形式で復習できます。
      </p>
      <div class="quiz-start__stats">
        <span class="quiz-start__pill">{{ quizCount }} 問 登録済み</span>
      </div>
    </div>

    <div class="quiz-start__actions">
      <BaseButton class="btn-primary quiz-start__btn" @click="$emit('goToCreate')">
        問題を作成する
      </BaseButton>
      <BaseButton
        class="quiz-start__btn"
        :disabled="quizCount === 0"
        @click="$emit('goToAnswer')"
      >
        クイズに解答する
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.quiz-start {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 640px;
  animation: quiz-fade-up 0.5s ease both;
}

.quiz-start__hero {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 28px 24px;
  border-radius: 22px;
  border: 1px solid var(--quiz-border);
  background:
    radial-gradient(circle at top right, rgba(200, 106, 56, 0.16), transparent 24%),
    radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.04), transparent 32%),
    linear-gradient(135deg, rgba(24, 24, 28, 0.98), rgba(8, 8, 10, 0.98));
  box-shadow: var(--quiz-shadow);
  overflow: hidden;
}

.quiz-start__glow {
  position: absolute;
  top: -48px;
  right: -32px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 106, 56, 0.22), transparent 66%);
  filter: blur(10px);
  animation: quiz-orbit 8s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes quiz-orbit {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(-12px, 16px, 0) scale(1.08); }
}

.quiz-start__kicker {
  margin: 0;
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.quiz-start__title {
  margin: 0;
  color: var(--quiz-text);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.quiz-start__description {
  margin: 0;
  color: var(--quiz-text-soft);
  font-size: 0.88rem;
  line-height: 1.7;
}

.quiz-start__stats {
  display: flex;
  gap: 8px;
}

.quiz-start__pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: var(--quiz-radius-pill);
  border: 1px solid rgba(200, 106, 56, 0.22);
  background: rgba(255, 255, 255, 0.04);
  color: var(--quiz-accent-strong);
  font-size: 0.76rem;
  font-weight: 700;
}

.quiz-start__actions {
  display: flex;
  gap: 10px;
  animation: quiz-fade-up 0.5s ease 0.15s both;
}

.quiz-start__btn {
  padding: 10px 20px;
  font-size: 0.88rem;
}

@media (max-width: 768px) {
  .quiz-start__hero {
    padding: 20px 16px;
    border-radius: 18px;
  }

  .quiz-start__actions {
    flex-direction: column;
  }
}
</style>
