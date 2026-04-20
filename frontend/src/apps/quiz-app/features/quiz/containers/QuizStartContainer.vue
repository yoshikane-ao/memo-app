<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStart } from '../application/useQuizStart';
import { useQuizSessionStore } from '../model/useQuizSessionStore';
import type { QuizSettings } from '../model/quiz.types';
import QuizSettingsPanel from '../ui/QuizSettingsPanel.vue';

const router = useRouter();
const sessionStore = useQuizSessionStore();
const {
  quizCount,
  tagNames,
  groups,
  settings,
  isLoading,
  availableAnswerMethods,
  loadQuizStartOptions,
  updateSettings,
} = useQuizStart();

onMounted(() => {
  void loadQuizStartOptions();
});

const handleUpdate = (key: keyof QuizSettings, value: QuizSettings[keyof QuizSettings]) => {
  updateSettings(key, value);
};

const handleStart = () => {
  sessionStore.applySettings(settings);
  router.push({ name: 'quiz-answer' });
};
</script>

<template>
  <QuizSettingsPanel
    :settings="settings"
    :quiz-count="quizCount"
    :tag-names="tagNames"
    :groups="groups"
    :available-answer-methods="availableAnswerMethods"
    :is-loading="isLoading"
    @update="handleUpdate"
    @start="handleStart"
  />
</template>
