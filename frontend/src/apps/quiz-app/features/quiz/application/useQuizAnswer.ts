import { computed, ref, watch } from "vue";
import { fetchQuizList, toggleFavorite } from "../infrastructure/quiz.repository";
import { useQuizSessionStore } from "../model/useQuizSessionStore";
import type { MatchingPair, MultipleCorrectPair, QuizItem } from "../model/quiz.types";
import {
  generateBestAnswerChoices,
  generateErrorCorrectionWrong,
  generateFillInBlank,
  generateFourChoices,
  generateMatchingPairs,
  generateMultipleCorrectPairs,
  generateTrueFalseStatement,
} from "./choiceGenerator";
import { addAcceptedAnswer, isAcceptedAnswer } from "../infrastructure/acceptedAnswers";

const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useQuizAnswer = () => {
  const sessionStore = useQuizSessionStore();
  const settings = sessionStore.settings;

  const items = ref<QuizItem[]>([]);
  const currentIndex = ref(0);
  const userAnswer = ref("");
  const isAnswered = ref(false);
  const isCorrect = ref<boolean | null>(null);
  const correctCount = ref(0);
  const isFinished = ref(false);
  const isLoading = ref(false);

  // ── Written (self-judge) state ──
  const isRevealed = ref(false);
  const fillInBlankDisplay = ref("");
  const errorCorrectionWrongAnswer = ref("");

  // ── Four-choice state ──
  const choices = ref<string[]>([]);

  // ── True-false state ──
  const trueFalseShownAnswer = ref("");
  const isStatementCorrect = ref(true);

  // ── Multiple-correct state ──
  const multipleCorrectPairs = ref<MultipleCorrectPair[]>([]);
  const multipleCorrectSelected = ref<Set<number>>(new Set());

  // ── Best-answer state ──
  const bestAnswerChoices = ref<string[]>([]);
  const bestAnswerSelectedChoice = ref("");
  const bestAnswerRevealed = ref(false);

  // ── Matching state ──
  const matchingPairs = ref<MatchingPair[]>([]);
  const matchingShuffledAnswers = ref<string[]>([]);
  const matchingUserPairs = ref<Map<string, string>>(new Map());
  const matchingSelectedPromptId = ref<string | null>(null);

  const currentItem = computed(() => items.value[currentIndex.value] ?? null);

  /** Resolve which face of the card is the prompt and which is the answer. */
  const resolveDirection = () => {
    if (settings.direction === "meaning-to-word") return "meaning-to-word" as const;
    if (settings.direction === "word-to-meaning") return "word-to-meaning" as const;
    return Math.random() < 0.5 ? ("word-to-meaning" as const) : ("meaning-to-word" as const);
  };

  const sessionDirection = resolveDirection();

  const effectiveDirection = computed(() => {
    if (!settings.reverseMode) return sessionDirection;
    return sessionDirection === "word-to-meaning" ? "meaning-to-word" : "word-to-meaning";
  });

  const prompt = computed(() => {
    if (!currentItem.value) return "";
    return effectiveDirection.value === "word-to-meaning"
      ? currentItem.value.word
      : currentItem.value.mean;
  });

  const correctAnswer = computed(() => {
    if (!currentItem.value) return "";
    return effectiveDirection.value === "word-to-meaning"
      ? currentItem.value.mean
      : currentItem.value.word;
  });

  // ── Prepare format-specific data for current question ──

  const prepareCurrentQuestion = () => {
    const item = currentItem.value;
    if (!item) return;

    if (settings.questionFormat === "four-choice") {
      choices.value = generateFourChoices(item, items.value, effectiveDirection.value);
    } else if (settings.questionFormat === "true-false") {
      const result = generateTrueFalseStatement(item, items.value, effectiveDirection.value);
      trueFalseShownAnswer.value = result.shownAnswer;
      isStatementCorrect.value = result.isStatementCorrect;
    } else if (settings.questionFormat === "multiple-correct") {
      multipleCorrectPairs.value = generateMultipleCorrectPairs(
        item, items.value, effectiveDirection.value,
      );
      multipleCorrectSelected.value = new Set();
    } else if (settings.questionFormat === "best-answer") {
      bestAnswerChoices.value = generateBestAnswerChoices(item, items.value, effectiveDirection.value);
      bestAnswerSelectedChoice.value = "";
      bestAnswerRevealed.value = false;
    } else if (settings.questionFormat === "matching") {
      const pairs = generateMatchingPairs(item, items.value, effectiveDirection.value);
      matchingPairs.value = pairs;
      matchingShuffledAnswers.value = shuffle(pairs.map((p) => p.answerText));
      matchingUserPairs.value = new Map();
      matchingSelectedPromptId.value = null;
    } else if (settings.questionFormat === "fill-in-blank") {
      fillInBlankDisplay.value = generateFillInBlank(correctAnswer.value);
    } else if (settings.questionFormat === "error-correction") {
      errorCorrectionWrongAnswer.value = generateErrorCorrectionWrong(
        item, items.value, effectiveDirection.value,
      );
    }
    // write-answer needs no special preparation — just prompt + correctAnswer
  };

  watch(currentIndex, () => {
    prepareCurrentQuestion();
  });

  // ── Scope filtering ──

  const filterByScope = (all: QuizItem[]): QuizItem[] => {
    switch (settings.scope) {
      case "favorite":
        return all.filter((item) => item.isFavorite);
      case "tag": {
        const tags = settings.selectedTags;
        if (tags.length === 0) return all;
        return all.filter((item) =>
          item.quizTagsRelations.some((r) => tags.includes(r.quizTag.tagName)),
        );
      }
      case "group": {
        const groups = settings.selectedGroups;
        if (groups.length === 0) return all;
        return all.filter((item) => {
          const itemGroups = item.groupName
            ? item.groupName.split(",").map((g) => g.trim())
            : [];
          return itemGroups.some((g) => groups.includes(g));
        });
      }
      default:
        return all;
    }
  };

  const applyQuestionCount = (list: QuizItem[]): QuizItem[] => {
    if (settings.questionCount === "all") return list;
    return list.slice(0, settings.questionCount);
  };

  const loadAndPrepare = async () => {
    isLoading.value = true;
    try {
      const all = await fetchQuizList();
      const scoped = filterByScope(all);
      const ordered = settings.randomOrder ? shuffle(scoped) : scoped;
      items.value = applyQuestionCount(ordered);
      prepareCurrentQuestion();
    } finally {
      isLoading.value = false;
    }
  };

  // ── Submit handlers ──

  const submitAnswer = () => {
    if (!currentItem.value || userAnswer.value.trim() === "" || isAnswered.value) {
      return;
    }
    isAnswered.value = true;
    isCorrect.value =
      userAnswer.value.trim().toLowerCase() === correctAnswer.value.trim().toLowerCase();
    if (isCorrect.value) {
      correctCount.value++;
    }
  };

  const submitChoice = (choice: string) => {
    if (!currentItem.value || isAnswered.value) return;
    userAnswer.value = choice;
    isAnswered.value = true;
    isCorrect.value = choice === correctAnswer.value;
    if (isCorrect.value) {
      correctCount.value++;
    }
  };

  const submitTrueFalse = (answer: boolean) => {
    if (!currentItem.value || isAnswered.value) return;
    isAnswered.value = true;
    isCorrect.value = answer === isStatementCorrect.value;
    if (isCorrect.value) {
      correctCount.value++;
    }
  };

  const toggleMultipleCorrectSelection = (index: number) => {
    if (isAnswered.value) return;
    const next = new Set(multipleCorrectSelected.value);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    multipleCorrectSelected.value = next;
  };

  const submitMultipleCorrect = () => {
    if (!currentItem.value || isAnswered.value) return;
    isAnswered.value = true;
    const pairs = multipleCorrectPairs.value;
    const selected = multipleCorrectSelected.value;
    const allCorrect = pairs.every(
      (pair, i) => pair.isCorrect === selected.has(i),
    );
    isCorrect.value = allCorrect;
    if (allCorrect) {
      correctCount.value++;
    }
  };

  const selectMatchingPrompt = (promptId: string) => {
    if (isAnswered.value) return;
    matchingSelectedPromptId.value = promptId;
  };

  const selectMatchingAnswer = (answerText: string) => {
    if (isAnswered.value) return;
    const promptId = matchingSelectedPromptId.value;
    if (!promptId) return;

    const next = new Map(matchingUserPairs.value);
    // Remove any existing pairing that uses this answer
    for (const [key, val] of next) {
      if (val === answerText) next.delete(key);
    }
    next.set(promptId, answerText);
    matchingUserPairs.value = next;
    matchingSelectedPromptId.value = null;
  };

  const submitMatching = () => {
    if (!currentItem.value || isAnswered.value) return;
    if (matchingUserPairs.value.size < matchingPairs.value.length) return;
    isAnswered.value = true;
    const allCorrect = matchingPairs.value.every(
      (pair) => matchingUserPairs.value.get(pair.id) === pair.answerText,
    );
    isCorrect.value = allCorrect;
    if (allCorrect) {
      correctCount.value++;
    }
  };

  // ── Best-answer handlers ──

  const selectBestAnswer = (choice: string) => {
    if (!currentItem.value || bestAnswerRevealed.value) return;
    bestAnswerSelectedChoice.value = choice;
    bestAnswerRevealed.value = true;
  };

  const judgeBestAnswer = (correct: boolean) => {
    if (!currentItem.value || isAnswered.value || !bestAnswerRevealed.value) return;
    const item = currentItem.value;
    const selected = bestAnswerSelectedChoice.value;

    isAnswered.value = true;
    isCorrect.value = correct;
    if (correct) {
      correctCount.value++;
      // Persist user-accepted answer so future quizzes treat it as correct
      if (!isAcceptedAnswer(item.id, selected, correctAnswer.value)) {
        addAcceptedAnswer(item.id, selected);
      }
    }
  };

  // ── Self-judge (written formats) ──

  const revealAnswer = () => {
    if (!currentItem.value || isRevealed.value) return;
    isRevealed.value = true;
  };

  const selfJudge = (correct: boolean) => {
    if (!currentItem.value || isAnswered.value || !isRevealed.value) return;
    isAnswered.value = true;
    isCorrect.value = correct;
    if (correct) {
      correctCount.value++;
    }
  };

  // ── Navigation ──

  const next = () => {
    if (currentIndex.value + 1 >= items.value.length) {
      isFinished.value = true;
      return;
    }
    currentIndex.value++;
    userAnswer.value = "";
    isAnswered.value = false;
    isCorrect.value = null;
    isRevealed.value = false;
    bestAnswerSelectedChoice.value = "";
    bestAnswerRevealed.value = false;
  };

  const toggleCurrentFavorite = async () => {
    const item = items.value[currentIndex.value];
    if (!item) return;
    const result = await toggleFavorite(item.id);
    item.isFavorite = result.isFavorite;
  };

  const retry = () => {
    items.value = settings.randomOrder ? shuffle(items.value) : items.value;
    currentIndex.value = 0;
    userAnswer.value = "";
    isAnswered.value = false;
    isCorrect.value = null;
    correctCount.value = 0;
    isFinished.value = false;
    isRevealed.value = false;
    prepareCurrentQuestion();
  };

  return {
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
    questionFormat: computed(() => settings.questionFormat),
    // Four-choice
    choices,
    submitChoice,
    // True-false
    trueFalseShownAnswer,
    isStatementCorrect,
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
  };
};
