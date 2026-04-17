<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";
import type {
  BulkQuizLabelAction,
  BulkUpdateQuizLabelsInput,
} from "../model/quiz.types";
import QuizToggleGroup from "./QuizToggleGroup.vue";

type OperationMode = "skip" | BulkQuizLabelAction;

const props = defineProps<{
  selectedIds: number[];
  isSubmitting: boolean;
  availableTags: string[];
  availableGroups: string[];
}>();

const emit = defineEmits<{
  (event: "submit", input: BulkUpdateQuizLabelsInput): void;
  (event: "close"): void;
  (event: "addTag", value: string): void;
  (event: "addGroup", value: string): void;
}>();

const tagMode = ref<OperationMode>("skip");
const groupMode = ref<OperationMode>("skip");
const selectedTags = ref<string[]>([]);
const selectedGroups = ref<string[]>([]);

const actionOptions: { value: OperationMode; label: string }[] = [
  { value: "skip", label: "Do nothing" },
  { value: "add", label: "Add" },
  { value: "remove", label: "Remove" },
  { value: "replace", label: "Replace" },
  { value: "clear", label: "Clear all" },
];

const needsValues = (mode: OperationMode) =>
  mode === "add" || mode === "remove" || mode === "replace";

const isSaveDisabled = computed(() => {
  const hasTagOp = tagMode.value !== "skip";
  const hasGroupOp = groupMode.value !== "skip";

  if (!hasTagOp && !hasGroupOp) {
    return true;
  }

  if (needsValues(tagMode.value) && selectedTags.value.length === 0) {
    return true;
  }

  if (needsValues(groupMode.value) && selectedGroups.value.length === 0) {
    return true;
  }

  return props.isSubmitting;
});

const buildOperation = (
  mode: OperationMode,
  values: string[]
): BulkUpdateQuizLabelsInput["tags"] | undefined => {
  if (mode === "skip") {
    return undefined;
  }

  if (mode === "clear") {
    return { action: "clear" };
  }

  return {
    action: mode,
    values,
  };
};

const handleSubmit = () => {
  if (isSaveDisabled.value) {
    return;
  }

  emit("submit", {
    quizIds: props.selectedIds,
    tags: buildOperation(tagMode.value, selectedTags.value),
    groups: buildOperation(groupMode.value, selectedGroups.value),
  });
};

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit("close");
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div class="bulk-edit__overlay" @click="handleOverlayClick">
      <div class="bulk-edit__dialog" role="dialog" aria-modal="true">
        <header class="bulk-edit__header">
          <div>
            <h2 class="bulk-edit__title">Bulk Edit</h2>
            <p class="bulk-edit__subtitle">{{ selectedIds.length }} quizzes selected</p>
          </div>
          <button type="button" class="bulk-edit__close" aria-label="Close" @click="emit('close')">
            &times;
          </button>
        </header>

        <div class="bulk-edit__body">
          <section class="bulk-edit__section">
            <div class="bulk-edit__section-head">
              <h3 class="bulk-edit__section-title">Tags</h3>
              <select v-model="tagMode" class="bulk-edit__select">
                <option
                  v-for="option in actionOptions"
                  :key="`tag-${option.value}`"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <p v-if="tagMode === 'clear'" class="bulk-edit__hint">
              This removes all tags from the selected quizzes.
            </p>

            <QuizToggleGroup
              v-else-if="needsValues(tagMode)"
              label="Tag values"
              :options="availableTags"
              :selected="selectedTags"
              :multiple="true"
              new-placeholder="+ Add tag"
              @update:selected="selectedTags = $event"
              @add-new="emit('addTag', $event)"
            />
          </section>

          <section class="bulk-edit__section">
            <div class="bulk-edit__section-head">
              <h3 class="bulk-edit__section-title">Groups</h3>
              <select v-model="groupMode" class="bulk-edit__select">
                <option
                  v-for="option in actionOptions"
                  :key="`group-${option.value}`"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <p v-if="groupMode === 'clear'" class="bulk-edit__hint">
              This removes all groups from the selected quizzes.
            </p>

            <QuizToggleGroup
              v-else-if="needsValues(groupMode)"
              label="Group values"
              :options="availableGroups"
              :selected="selectedGroups"
              :multiple="true"
              new-placeholder="+ Add group"
              @update:selected="selectedGroups = $event"
              @add-new="emit('addGroup', $event)"
            />
          </section>
        </div>

        <footer class="bulk-edit__footer">
          <BaseButton @click="emit('close')">Cancel</BaseButton>
          <BaseButton class="btn-primary" :disabled="isSaveDisabled" @click="handleSubmit">
            {{ isSubmitting ? "Saving..." : "Apply changes" }}
          </BaseButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.bulk-edit__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 220;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(8px) saturate(1.6);
  -webkit-backdrop-filter: blur(8px) saturate(1.6);
  animation: quiz-fade-in 0.22s ease both;
}

.bulk-edit__dialog {
  width: min(640px, 94vw);
  max-height: 86vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border-radius: 20px;
  background: rgba(30, 30, 32, 0.92);
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.5),
    0 0 0 0.5px rgba(255, 255, 255, 0.08),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.06);
  color: var(--quiz-text);
  overflow: hidden;
}

.bulk-edit__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 18px;
}

.bulk-edit__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.bulk-edit__subtitle {
  margin: 4px 0 0;
  color: var(--quiz-text-muted);
  font-size: 0.84rem;
}

.bulk-edit__close {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bulk-edit__close:hover {
  background: rgba(255, 69, 58, 0.14);
  color: #ff6961;
}

.bulk-edit__body {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0 28px 28px;
}

.bulk-edit__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--quiz-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.bulk-edit__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bulk-edit__section-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
}

.bulk-edit__select {
  min-width: 160px;
  padding: 8px 12px;
  border: 1px solid var(--quiz-border);
  border-radius: 10px;
  background: var(--quiz-surface-input);
  color: var(--quiz-text);
  font: inherit;
}

.bulk-edit__hint {
  margin: 0;
  color: var(--quiz-text-muted);
  font-size: 0.8rem;
}

.bulk-edit__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.12);
}

@media (max-width: 640px) {
  .bulk-edit__header {
    padding: 20px 20px 14px;
  }

  .bulk-edit__body {
    padding: 0 20px 24px;
  }

  .bulk-edit__section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .bulk-edit__select {
    width: 100%;
  }

  .bulk-edit__footer {
    padding: 14px 20px;
  }
}
</style>
