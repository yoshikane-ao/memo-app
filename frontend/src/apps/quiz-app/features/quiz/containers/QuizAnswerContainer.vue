<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuizAnswer } from "../application/useQuizAnswer";
import QuizAnswerPanel from "../ui/QuizAnswerPanel.vue";
import FourChoiceAnswerPanel from "../ui/FourChoiceAnswerPanel.vue";
import TrueFalseAnswerPanel from "../ui/TrueFalseAnswerPanel.vue";
import MultipleCorrectAnswerPanel from "../ui/MultipleCorrectAnswerPanel.vue";
import MatchingAnswerPanel from "../ui/MatchingAnswerPanel.vue";
import FillInBlankAnswerPanel from "../ui/FillInBlankAnswerPanel.vue";
import WriteAnswerPanel from "../ui/WriteAnswerPanel.vue";
import ErrorCorrectionAnswerPanel from "../ui/ErrorCorrectionAnswerPanel.vue";
import BestAnswerAnswerPanel from "../ui/BestAnswerAnswerPanel.vue";
import QuizResultPanel from "../ui/QuizResultPanel.vue";

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
  router.push({ name: "quiz-start" });
};
</script>

<template>
  <div v-if="isLoading" class="quiz-answer-status">
    <p class="quiz-answer-status__text">読み込み中...</p>
  </div>
  <div v-else-if="items.length === 0" class="quiz-answer-status">
    <p class="quiz-answer-status__text">
      問題が登録されていません。まずは問題を作成してください。
    </p>
  </div>

  <QuizResultPanel
    v-else-if="isFinished"
    :correctCount="correctCount"
    :totalCount="items.length"
    @retry="retry"
    @goHome="goHome"
  />

  <template v-else-if="currentItem">
    <!-- ── Selection formats ── -->

    <FourChoiceAnswerPanel
      v-if="questionFormat === 'four-choice'"
      :prompt="prompt"
      :choices="choices"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :selectedChoice="userAnswer"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :correctAnswer="correctAnswer"
      :isFavorite="currentItem.isFavorite"
      @selectChoice="submitChoice"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <TrueFalseAnswerPanel
      v-else-if="questionFormat === 'true-false'"
      :prompt="prompt"
      :shownAnswer="trueFalseShownAnswer"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :correctAnswer="correctAnswer"
      :isFavorite="currentItem.isFavorite"
      @answer="submitTrueFalse"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <MultipleCorrectAnswerPanel
      v-else-if="questionFormat === 'multiple-correct'"
      :pairs="multipleCorrectPairs"
      :selected="multipleCorrectSelected"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :isFavorite="currentItem.isFavorite"
      @toggle="toggleMultipleCorrectSelection"
      @submit="submitMultipleCorrect"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <MatchingAnswerPanel
      v-else-if="questionFormat === 'matching'"
      :pairs="matchingPairs"
      :shuffledAnswers="matchingShuffledAnswers"
      :userPairs="matchingUserPairs"
      :selectedPromptId="matchingSelectedPromptId"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :isFavorite="currentItem.isFavorite"
      @selectPrompt="selectMatchingPrompt"
      @selectAnswer="selectMatchingAnswer"
      @submit="submitMatching"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <BestAnswerAnswerPanel
      v-else-if="questionFormat === 'best-answer'"
      :prompt="prompt"
      :choices="bestAnswerChoices"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :selectedChoice="bestAnswerSelectedChoice"
      :isRevealed="bestAnswerRevealed"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :correctAnswer="correctAnswer"
      :isFavorite="currentItem.isFavorite"
      @selectChoice="selectBestAnswer"
      @judge="judgeBestAnswer"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <!-- ── Written formats (self-judge) ── -->

    <FillInBlankAnswerPanel
      v-else-if="questionFormat === 'fill-in-blank'"
      :prompt="prompt"
      :direction="effectiveDirection"
      :blankDisplay="fillInBlankDisplay"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :userAnswer="userAnswer"
      :isRevealed="isRevealed"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :correctAnswer="correctAnswer"
      :isFavorite="currentItem.isFavorite"
      @update:userAnswer="userAnswer = $event"
      @reveal="revealAnswer"
      @selfJudge="selfJudge"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <WriteAnswerPanel
      v-else-if="questionFormat === 'write-answer'"
      :prompt="prompt"
      :direction="effectiveDirection"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :userAnswer="userAnswer"
      :isRevealed="isRevealed"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :correctAnswer="correctAnswer"
      :isFavorite="currentItem.isFavorite"
      @update:userAnswer="userAnswer = $event"
      @reveal="revealAnswer"
      @selfJudge="selfJudge"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <ErrorCorrectionAnswerPanel
      v-else-if="questionFormat === 'error-correction'"
      :prompt="prompt"
      :direction="effectiveDirection"
      :wrongAnswer="errorCorrectionWrongAnswer"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :userAnswer="userAnswer"
      :isRevealed="isRevealed"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :correctAnswer="correctAnswer"
      :isFavorite="currentItem.isFavorite"
      @update:userAnswer="userAnswer = $event"
      @reveal="revealAnswer"
      @selfJudge="selfJudge"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
    />

    <!-- ── Fallback: text-input (auto-judge) ── -->

    <QuizAnswerPanel
      v-else
      :prompt="prompt"
      :direction="effectiveDirection"
      :currentIndex="currentIndex"
      :totalCount="items.length"
      :userAnswer="userAnswer"
      :isAnswered="isAnswered"
      :isCorrect="isCorrect"
      :correctAnswer="correctAnswer"
      :isFavorite="currentItem.isFavorite"
      @update:userAnswer="userAnswer = $event"
      @submit="submitAnswer"
      @next="next"
      @toggleFavorite="toggleCurrentFavorite"
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
