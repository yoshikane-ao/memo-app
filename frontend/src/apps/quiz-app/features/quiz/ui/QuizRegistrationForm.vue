<script setup lang="ts">
import BaseButton from "../../../../../shared/ui/BaseButton.vue";
import QuizToggleGroup from "./QuizToggleGroup.vue";

defineProps<{
  word: string;
  mean: string;
  selectedTags: string[];
  selectedGroup: string[];
  availableTags: string[];
  availableGroups: string[];
  keepTags: boolean;
  keepGroups: boolean;
  isFavorite: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (event: "update:word", value: string): void;
  (event: "update:mean", value: string): void;
  (event: "update:selectedTags", value: string[]): void;
  (event: "update:selectedGroup", value: string[]): void;
  (event: "update:keepTags", value: boolean): void;
  (event: "update:keepGroups", value: boolean): void;
  (event: "addTag", value: string): void;
  (event: "addGroup", value: string): void;
  (event: "deleteTag", value: string): void;
  (event: "deleteGroup", value: string): void;
  (event: "update:isFavorite", value: boolean): void;
  (event: "submit"): void;
}>();
</script>

<template>
  <section class="quiz-form">
    <div class="quiz-form__primary">
      <h2 class="quiz-form__title">クイズ登録</h2>

      <div class="quiz-form__input-row">
        <label class="quiz-form__field">
          <span class="quiz-form__label">単語</span>
          <input
            :value="word"
            type="text"
            placeholder="単語を入力"
            @input="emit('update:word', ($event.target as HTMLInputElement).value)"
            @keyup.enter="emit('submit')"
          />
        </label>

        <label class="quiz-form__field">
          <span class="quiz-form__label">意味</span>
          <input
            :value="mean"
            type="text"
            placeholder="意味を入力"
            @input="emit('update:mean', ($event.target as HTMLInputElement).value)"
            @keyup.enter="emit('submit')"
          />
        </label>
      </div>
    </div>

    <div class="quiz-form__meta">
      <div class="quiz-form__meta-panel">
        <QuizToggleGroup
          label="タグ"
          :options="availableTags"
          :selected="selectedTags"
          :multiple="true"
          :deletable="true"
          new-placeholder="+ タグを追加"
          @update:selected="emit('update:selectedTags', $event)"
          @add-new="emit('addTag', $event)"
          @delete="emit('deleteTag', $event)"
        />

        <label class="quiz-form__sticky-toggle">
          <input
            :checked="keepTags"
            type="checkbox"
            @change="emit('update:keepTags', ($event.target as HTMLInputElement).checked)"
          />
          <span>次回以降もこのタグを使う</span>
        </label>
      </div>

      <div class="quiz-form__meta-panel">
        <QuizToggleGroup
          label="グループ"
          :options="availableGroups"
          :selected="selectedGroup"
          :multiple="true"
          :deletable="true"
          new-placeholder="+ グループを追加"
          @update:selected="emit('update:selectedGroup', $event)"
          @add-new="emit('addGroup', $event)"
          @delete="emit('deleteGroup', $event)"
        />

        <label class="quiz-form__sticky-toggle">
          <input
            :checked="keepGroups"
            type="checkbox"
            @change="emit('update:keepGroups', ($event.target as HTMLInputElement).checked)"
          />
          <span>次回以降もこのグループを使う</span>
        </label>
      </div>
    </div>

    <div class="quiz-form__footer">
      <button
        type="button"
        class="quiz-form__favorite"
        :class="{ 'quiz-form__favorite--on': isFavorite }"
        :title="isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'"
        @click="emit('update:isFavorite', !isFavorite)"
      >
        {{ isFavorite ? "\u2605" : "\u2606" }}
      </button>
      <BaseButton class="btn-primary" :disabled="isSubmitDisabled" @click="emit('submit')">
        {{ isSubmitting ? "保存中..." : "登録する" }}
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.quiz-form {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  background: var(--quiz-surface);
  overflow: hidden;
  animation: quiz-fade-up 0.45s ease both;
}

.quiz-form__primary {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.quiz-form__title {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.quiz-form__input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quiz-form__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quiz-form__label {
  color: var(--quiz-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.quiz-form__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 1px solid var(--quiz-border);
}

.quiz-form__meta > :first-child {
  border-right: 1px solid var(--quiz-border);
}

.quiz-form__meta-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quiz-form__sticky-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 14px;
  color: var(--quiz-text-muted);
  font-size: 0.74rem;
  font-weight: 600;
}

.quiz-form__sticky-toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--quiz-accent-strong);
}

.quiz-form__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--quiz-border);
  background: var(--quiz-surface-strong);
}

.quiz-form__favorite {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--quiz-border);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.25);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.quiz-form__favorite:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.quiz-form__favorite:active {
  transform: scale(0.9);
}

.quiz-form__favorite--on {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  animation: fav-pop 0.35s cubic-bezier(0.17, 0.67, 0.21, 1.2);
}

.quiz-form__favorite--on:hover {
  background: rgba(255, 193, 7, 0.22);
  color: #ffca28;
}

@keyframes fav-pop {
  0% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.3);
  }

  100% {
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .quiz-form__input-row {
    grid-template-columns: 1fr;
  }

  .quiz-form__meta {
    grid-template-columns: 1fr;
  }

  .quiz-form__meta > :first-child {
    border-right: none;
    border-bottom: 1px solid var(--quiz-border);
  }
}
</style>
