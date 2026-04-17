import { computed, reactive, ref, watch } from "vue";
import {
  fetchQuizGroups,
  fetchQuizList,
  fetchQuizTags,
} from "../infrastructure/quiz.repository";
import {
  ANSWER_METHODS_BY_FORMAT,
  DEFAULT_QUIZ_SETTINGS,
  type AnswerMethod,
  type QuestionFormat,
  type QuizSettings,
  type QuizTag,
} from "../model/quiz.types";

export const useQuizStart = () => {
  const quizCount = ref(0);
  const tags = ref<QuizTag[]>([]);
  const groups = ref<string[]>([]);
  const isLoading = ref(false);

  const settings = reactive<QuizSettings>({ ...DEFAULT_QUIZ_SETTINGS });

  const tagNames = computed(() => tags.value.map((t) => t.tagName));

  const availableAnswerMethods = computed<AnswerMethod[]>(
    () => ANSWER_METHODS_BY_FORMAT[settings.questionFormat],
  );

  // Auto-correct answer method when question format changes
  watch(
    () => settings.questionFormat,
    (format: QuestionFormat) => {
      const allowed = ANSWER_METHODS_BY_FORMAT[format];
      if (!allowed.includes(settings.answerMethod)) {
        settings.answerMethod = allowed[0];
      }
    },
  );

  const updateSettings = <K extends keyof QuizSettings>(
    key: K,
    value: QuizSettings[K],
  ) => {
    settings[key] = value;
  };

  const loadQuizStartOptions = async () => {
    isLoading.value = true;
    try {
      const [items, fetchedTags, fetchedGroups] = await Promise.all([
        fetchQuizList(),
        fetchQuizTags(),
        fetchQuizGroups(),
      ]);
      quizCount.value = items.length;
      tags.value = fetchedTags;
      groups.value = fetchedGroups;
    } catch {
      quizCount.value = 0;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    quizCount,
    tags,
    groups,
    tagNames,
    settings,
    isLoading,
    availableAnswerMethods,
    loadQuizStartOptions,
    updateSettings,
  };
};
