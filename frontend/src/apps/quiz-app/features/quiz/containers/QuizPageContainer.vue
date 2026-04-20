<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import BaseButton from '../../../../../shared/ui/BaseButton.vue';
import { useQuizPage } from '../application/useQuizPage';
import QuizBulkEditModal from '../ui/QuizBulkEditModal.vue';
import QuizEditModal from '../ui/QuizEditModal.vue';
import QuizListTable from '../ui/QuizListTable.vue';
import QuizRegistrationForm from '../ui/QuizRegistrationForm.vue';

const {
  items,
  draft,
  availableTags,
  availableGroups,
  keepTags,
  keepGroups,
  isLoading,
  isSubmitting,
  errorMessage,
  noticeMessage,
  editingItem,
  selectedQuizIds,
  isBulkEditOpen,
  isSubmitDisabled,
  loadQuizPageData,
  loadQuizzes,
  submitQuiz,
  setSelectedTags,
  setSelectedGroup,
  setKeepTags,
  setKeepGroups,
  addTag,
  addGroup,
  removeTag,
  removeGroup,
  openEdit,
  closeEdit,
  setSelectedQuizIds,
  clearSelectedQuizIds,
  openBulkEdit,
  closeBulkEdit,
  submitUpdate,
  submitBulkUpdate,
  removeQuiz,
  toggleQuizFavorite,
  dispose,
} = useQuizPage();

onMounted(() => {
  void loadQuizPageData();
});

onBeforeUnmount(() => {
  dispose();
});
</script>

<template>
  <div class="quiz-page">
    <QuizRegistrationForm
      :word="draft.word"
      :mean="draft.mean"
      :selected-tags="draft.selectedTags"
      :selected-group="draft.selectedGroup"
      :available-tags="availableTags"
      :available-groups="availableGroups"
      :keep-tags="keepTags"
      :keep-groups="keepGroups"
      :is-favorite="draft.isFavorite"
      :is-submit-disabled="isSubmitDisabled"
      :is-submitting="isSubmitting"
      @update:word="draft.word = $event"
      @update:mean="draft.mean = $event"
      @update:selected-tags="setSelectedTags"
      @update:selected-group="setSelectedGroup"
      @update:keep-tags="setKeepTags"
      @update:keep-groups="setKeepGroups"
      @update:is-favorite="draft.isFavorite = $event"
      @add-tag="addTag"
      @add-group="addGroup"
      @delete-tag="removeTag"
      @delete-group="removeGroup"
      @submit="submitQuiz"
    />

    <Transition name="feedback" mode="out-in">
      <div v-if="errorMessage" key="error" class="quiz-page__feedback quiz-page__feedback--error">
        {{ errorMessage }}
      </div>
      <div
        v-else-if="noticeMessage"
        key="notice"
        class="quiz-page__feedback quiz-page__feedback--success"
      >
        {{ noticeMessage }}
      </div>
    </Transition>

    <div class="quiz-page__toolbar">
      <div class="quiz-page__toolbar-actions">
        <BaseButton :disabled="isLoading" @click="loadQuizzes">
          {{ isLoading ? 'Loading...' : 'Reload' }}
        </BaseButton>
        <BaseButton
          v-if="selectedQuizIds.length > 0"
          class="btn-primary"
          :disabled="isSubmitting"
          @click="openBulkEdit"
        >
          Bulk edit {{ selectedQuizIds.length }}
        </BaseButton>
        <BaseButton
          v-if="selectedQuizIds.length > 0"
          :disabled="isSubmitting"
          @click="clearSelectedQuizIds"
        >
          Clear selection
        </BaseButton>
      </div>
    </div>

    <QuizListTable
      :items="items"
      :is-loading="isLoading"
      :selected-ids="selectedQuizIds"
      @update:selected-ids="setSelectedQuizIds"
      @edit="openEdit"
      @delete="removeQuiz"
      @toggle-favorite="toggleQuizFavorite"
    />

    <QuizEditModal
      v-if="editingItem"
      :item="editingItem"
      :is-submitting="isSubmitting"
      :available-tags="availableTags"
      :available-groups="availableGroups"
      @save="submitUpdate"
      @close="closeEdit"
      @add-tag="addTag"
      @add-group="addGroup"
      @delete-tag="removeTag"
      @delete-group="removeGroup"
    />

    <QuizBulkEditModal
      v-if="isBulkEditOpen"
      :selected-ids="selectedQuizIds"
      :is-submitting="isSubmitting"
      :available-tags="availableTags"
      :available-groups="availableGroups"
      @submit="submitBulkUpdate"
      @close="closeBulkEdit"
      @add-tag="addTag"
      @add-group="addGroup"
    />
  </div>
</template>

<style scoped>
.quiz-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 56rem;
}

.quiz-page__feedback {
  padding: 10px 14px;
  border-radius: var(--quiz-radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  animation: quiz-fade-up 0.3s ease both;
}

.quiz-page__feedback--error {
  background: var(--quiz-danger-soft);
  border: 1px solid rgba(232, 85, 85, 0.3);
  color: #ff9999;
}

.quiz-page__feedback--success {
  background: var(--quiz-success-soft);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--quiz-success);
}

.quiz-page__toolbar {
  display: flex;
  justify-content: flex-start;
}

.quiz-page__toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.feedback-enter-active {
  animation: quiz-fade-up 0.3s ease;
}

.feedback-leave-active {
  animation: quiz-fade-in 0.15s ease reverse;
}
</style>
