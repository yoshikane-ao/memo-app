import { defineStore } from "pinia";
import { reactive, readonly } from "vue";
import { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "./quiz.types";

export const useQuizSessionStore = defineStore("quizSession", () => {
  const settings = reactive<QuizSettings>({ ...DEFAULT_QUIZ_SETTINGS });

  const applySettings = (incoming: QuizSettings) => {
    Object.assign(settings, incoming);
  };

  return {
    settings: readonly(settings),
    applySettings,
  };
});
