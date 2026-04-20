<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizAnswer } from '../application/useQuizAnswer';
import QuizAnswerPanel from '../ui/QuizAnswerPanel.vue';
import FourChoiceAnswerPanel from '../ui/FourChoiceAnswerPanel.vue';
import TrueFalseAnswerPanel from '../ui/TrueFalseAnswerPanel.vue';
import MultipleCorrectAnswerPanel from '../ui/MultipleCorrectAnswerPanel.vue';
import MatchingAnswerPanel from '../ui/MatchingAnswerPanel.vue';
import FillInBlankAnswerPanel from '../ui/FillInBlankAnswerPanel.vue';
import WriteAnswerPanel from '../ui/WriteAnswerPanel.vue';
import ErrorCorrectionAnswerPanel from '../ui/ErrorCorrectionAnswerPanel.vue';
import BestAnswerAnswerPanel from '../ui/BestAnswerAnswerPanel.vue';
import QuizResultPanel from '../ui/QuizResultPanel.vue';

const router = useRouter();
const {
  items,
  currentIndex,
  userAnswer,
  isAnswered,
  isCorrect,
  correctCount,
  isFinished,
  isLoading,
  loadAndPrepare,
  currentItem,
  prompt,
  correctAnswer,
  effectiveDirection,
  questionFormat,
  // Four-choice
  choices,
  submitChoice,
  // True-false
  trueFalseShownAnswer,
  submitTrueFalse,
  // Multiple-correct
  multipleCorrectPairs,
  multipleCorrectSelected,
  toggleMultipleCorrectSelection,
  submitMultipleCorrect,
  // Matching
  matchingPairs,
  matchingShuffledAnswers,
  matchingUserPairs,
  matchingSelectedPromptId,
  selectMatchingPrompt,
  selectMatchingAnswer,
  submitMatching,
  // Best-answer
  bestAnswerChoices,
  bestAnswerSelectedChoice,
  bestAnswerRevealed,
  selectBestAnswer,
  judgeBestAnswer,
  // Written (self-judge)
  isRevealed,
  fillInBlankDisplay,
  errorCorrectionWrongAnswer,
  revealAnswer,
  selfJudge,
  // Text-input (auto-judge)
  submitAnswer,
  // Navigation
  next,
  retry,
  toggleCurrentFavorite,
} = useQuizAnswer();

onMounted(() => {
  void loadAndPrepare();
});

const goHome = () => {
  router.push({ name: 'quiz-start' });
};
</script>

<template>
  <div v-if="isLoading" class="quiz-answer-status">
    <p class="quiz-answer-status__text">読み込み中...</p>
  </div>
  <div v-else-if="items.length === 0" class="quiz-answer-status">
    <p class="quiz-answer-status__text">問題が登録されていません。まずは問題を作成してください。</p>
  </div>

  <QuizResultPanel
    v-else-if="isFinished"
    :correct-count="correctCount"
    :total-count="items.length"
    @retry="retry"
    @go-home="goHome"
  />

  <template v-else-if="currentItem">
    <!-- ── Selection formats ── -->

    <FourChoiceAnswerPanel
      v-if="questionFormat === 'four-choice'"
      :prompt="prompt"
      :choices="choices"
      :current-index="currentIndex"
      :total-count="items.length"
      :selected-choice="userAnswer"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :correct-answer="correctAnswer"
      :is-favorite="currentItem.isFavorite"
      @select-choice="submitChoice"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <TrueFalseAnswerPanel
      v-else-if="questionFormat === 'true-false'"
      :prompt="prompt"
      :shown-answer="trueFalseShownAnswer"
      :current-index="currentIndex"
      :total-count="items.length"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :correct-answer="correctAnswer"
      :is-favorite="currentItem.isFavorite"
      @answer="submitTrueFalse"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <MultipleCorrectAnswerPanel
      v-else-if="questionFormat === 'multiple-correct'"
      :pairs="multipleCorrectPairs"
      :selected="multipleCorrectSelected"
      :current-index="currentIndex"
      :total-count="items.length"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :is-favorite="currentItem.isFavorite"
      @toggle="toggleMultipleCorrectSelection"
      @submit="submitMultipleCorrect"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <MatchingAnswerPanel
      v-else-if="questionFormat === 'matching'"
      :pairs="matchingPairs"
      :shuffled-answers="matchingShuffledAnswers"
      :user-pairs="matchingUserPairs"
      :selected-prompt-id="matchingSelectedPromptId"
      :current-index="currentIndex"
      :total-count="items.length"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :is-favorite="currentItem.isFavorite"
      @select-prompt="selectMatchingPrompt"
      @select-answer="selectMatchingAnswer"
      @submit="submitMatching"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <BestAnswerAnswerPanel
      v-else-if="questionFormat === 'best-answer'"
      :prompt="prompt"
      :choices="bestAnswerChoices"
      :current-index="currentIndex"
      :total-count="items.length"
      :selected-choice="bestAnswerSelectedChoice"
      :is-revealed="bestAnswerRevealed"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :correct-answer="correctAnswer"
      :is-favorite="currentItem.isFavorite"
      @select-choice="selectBestAnswer"
      @judge="judgeBestAnswer"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <!-- ── Written formats (self-judge) ── -->

    <FillInBlankAnswerPanel
      v-else-if="questionFormat === 'fill-in-blank'"
      :prompt="prompt"
      :direction="effectiveDirection"
      :blank-display="fillInBlankDisplay"
      :current-index="currentIndex"
      :total-count="items.length"
      :user-answer="userAnswer"
      :is-revealed="isRevealed"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :correct-answer="correctAnswer"
      :is-favorite="currentItem.isFavorite"
      @update:user-answer="userAnswer = $event"
      @reveal="revealAnswer"
      @self-judge="selfJudge"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <WriteAnswerPanel
      v-else-if="questionFormat === 'write-answer'"
      :prompt="prompt"
      :direction="effectiveDirection"
      :current-index="currentIndex"
      :total-count="items.length"
      :user-answer="userAnswer"
      :is-revealed="isRevealed"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :correct-answer="correctAnswer"
      :is-favorite="currentItem.isFavorite"
      @update:user-answer="userAnswer = $event"
      @reveal="revealAnswer"
      @self-judge="selfJudge"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <ErrorCorrectionAnswerPanel
      v-else-if="questionFormat === 'error-correction'"
      :prompt="prompt"
      :direction="effectiveDirection"
      :wrong-answer="errorCorrectionWrongAnswer"
      :current-index="currentIndex"
      :total-count="items.length"
      :user-answer="userAnswer"
      :is-revealed="isRevealed"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :correct-answer="correctAnswer"
      :is-favorite="currentItem.isFavorite"
      @update:user-answer="userAnswer = $event"
      @reveal="revealAnswer"
      @self-judge="selfJudge"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />

    <!-- ── Fallback: text-input (auto-judge) ── -->

    <QuizAnswerPanel
      v-else
      :prompt="prompt"
      :direction="effectiveDirection"
      :current-index="currentIndex"
      :total-count="items.length"
      :user-answer="userAnswer"
      :is-answered="isAnswered"
      :is-correct="isCorrect"
      :correct-answer="correctAnswer"
      :is-favorite="currentItem.isFavorite"
      @update:user-answer="userAnswer = $event"
      @submit="submitAnswer"
      @next="next"
      @toggle-favorite="toggleCurrentFavorite"
    />
  </template>
</template>

<style scoped>
.quiz-answer-status {
  animation: quiz-fade-up 0.4s ease both;
}

.quiz-answer-status__text {
  color: var(--quiz-text-muted);
  font-size: 0.88rem;
}
</style>
