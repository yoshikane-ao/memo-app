<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  label: string;
  options: string[];
  selected: string[];
  multiple: boolean;
  newPlaceholder?: string;
  deletable?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:selected", value: string[]): void;
  (event: "addNew", value: string): void;
  (event: "delete", value: string): void;
}>();

const isDeleteMode = ref(false);

const handleDelete = (option: string) => {
  emit("delete", option);
};

const isExpanded = ref(false);
const newValue = ref("");

const selectedCount = computed(() => props.selected.length);
const hasOptions = computed(() => props.options.length > 0);

const toggle = (option: string) => {
  if (props.multiple) {
    const next = props.selected.includes(option)
      ? props.selected.filter((s) => s !== option)
      : [...props.selected, option];
    emit("update:selected", next);
  } else {
    emit("update:selected", props.selected.includes(option) ? [] : [option]);
  }
};

const removeSelected = (option: string) => {
  emit("update:selected", props.selected.filter((s) => s !== option));
};

const handleAddNew = () => {
  const value = newValue.value.trim();
  if (value === "") return;
  emit("addNew", value);
  newValue.value = "";
};
</script>

<template>
  <div class="tg">
    <!-- Header: label + count + expand toggle -->
    <button type="button" class="tg__header" @click="isExpanded = !isExpanded">
      <span class="tg__label">{{ label }}</span>
      <span v-if="selectedCount > 0" class="tg__badge">{{ selectedCount }}</span>
      <span class="tg__chevron" :class="{ 'tg__chevron--open': isExpanded }">&#9662;</span>
    </button>

    <!-- Selected summary (always visible when items are selected) -->
    <div v-if="selectedCount > 0 && !isExpanded" class="tg__summary">
      <button
        v-for="item in selected"
        :key="item"
        type="button"
        class="tg__selected-chip"
        @click="removeSelected(item)"
      >
        {{ item }}
        <span class="tg__selected-chip-x">&times;</span>
      </button>
    </div>

    <!-- Expandable panel -->
    <div v-if="isExpanded" class="tg__panel">
      <!-- Selected section -->
      <div v-if="selectedCount > 0" class="tg__section">
        <span class="tg__section-label">選択中</span>
        <div class="tg__chips">
          <button
            v-for="item in selected"
            :key="item"
            type="button"
            class="tg__chip tg__chip--active"
            @click="toggle(item)"
          >
            {{ item }}
            <span class="tg__chip-icon">&times;</span>
          </button>
        </div>
      </div>

      <!-- All options (scrollable) -->
      <div class="tg__section">
        <div class="tg__section-header">
          <span class="tg__section-label">{{ hasOptions ? '候補' : '候補なし' }}</span>
          <button
            v-if="deletable && hasOptions"
            type="button"
            class="tg__delete-toggle"
            :class="{ 'tg__delete-toggle--on': isDeleteMode }"
            @click="isDeleteMode = !isDeleteMode"
          >
            {{ isDeleteMode ? '完了' : '削除' }}
          </button>
        </div>
        <div v-if="hasOptions" class="tg__scroll-area">
          <div class="tg__chips">
            <span
              v-for="option in options"
              :key="option"
              class="tg__chip-wrap"
            >
              <button
                type="button"
                class="tg__chip"
                :class="{ 'tg__chip--active': selected.includes(option) }"
                @click="toggle(option)"
              >
                {{ option }}
              </button>
              <button
                v-if="deletable && isDeleteMode"
                type="button"
                class="tg__chip-del"
                title="削除"
                @click="handleDelete(option)"
              >
                &times;
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- New input -->
      <div class="tg__add-row">
        <input
          v-model="newValue"
          type="text"
          class="tg__add-input"
          :placeholder="newPlaceholder ?? '+ 新規追加'"
          @keydown.enter.prevent="handleAddNew"
        />
        <button
          type="button"
          class="tg__add-btn"
          :disabled="newValue.trim() === ''"
          @click="handleAddNew"
        >
          追加
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tg {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-sm);
  background: var(--quiz-surface-strong);
  overflow: hidden;
  transition: border-color var(--quiz-transition);
}

.tg:has(.tg__panel) {
  border-color: rgba(200, 106, 56, 0.2);
}

/* ── Header ── */

.tg__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--quiz-text-soft);
  font-family: var(--quiz-font);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--quiz-transition);
  text-align: left;
}

.tg__header:hover {
  color: var(--quiz-text);
}

.tg__label {
  flex: 1;
  letter-spacing: 0.02em;
}

.tg__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.68rem;
  font-weight: 800;
}

.tg__chevron {
  font-size: 0.62rem;
  color: var(--quiz-text-muted);
  transition: transform 0.2s ease;
}

.tg__chevron--open {
  transform: rotate(180deg);
}

/* ── Summary (collapsed state, selected items) ── */

.tg__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 0 14px 10px;
  animation: quiz-fade-in 0.15s ease both;
}

.tg__selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--quiz-border-focus);
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-family: var(--quiz-font);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--quiz-transition),
    transform var(--quiz-transition);
}

.tg__selected-chip:hover {
  background: rgba(200, 106, 56, 0.22);
  transform: translateY(-1px);
}

.tg__selected-chip-x {
  font-size: 0.82rem;
  line-height: 1;
  opacity: 0.6;
}

/* ── Expandable panel ── */

.tg__panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 14px 12px;
  border-top: 1px solid var(--quiz-border);
  animation: quiz-fade-up 0.2s ease both;
}

.tg__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
}

.tg__section-label {
  color: var(--quiz-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Scrollable chip area ── */

.tg__scroll-area {
  max-height: 120px;
  overflow-y: auto;
  padding-right: 4px;
}

.tg__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* ── Chip (inside panel) ── */

.tg__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 11px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-pill);
  background: rgba(255, 255, 255, 0.03);
  color: var(--quiz-text-soft);
  font-family: var(--quiz-font);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--quiz-transition),
    border-color var(--quiz-transition),
    color var(--quiz-transition),
    transform var(--quiz-transition);
}

.tg__chip:hover {
  border-color: rgba(200, 106, 56, 0.3);
  background: rgba(200, 106, 56, 0.06);
  color: var(--quiz-accent-strong);
  transform: translateY(-1px);
}

.tg__chip--active {
  border-color: var(--quiz-border-focus);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
}

.tg__chip--active:hover {
  background: rgba(200, 106, 56, 0.22);
}

.tg__chip-icon {
  font-size: 0.78rem;
  line-height: 1;
  opacity: 0.7;
}

.tg__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tg__delete-toggle {
  padding: 3px 10px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-pill);
  background: transparent;
  color: var(--quiz-text-muted);
  font-family: var(--quiz-font);
  font-size: 0.66rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--quiz-transition),
    border-color var(--quiz-transition),
    color var(--quiz-transition);
}

.tg__delete-toggle:hover {
  border-color: rgba(232, 85, 85, 0.4);
  color: rgba(232, 85, 85, 0.8);
}

.tg__delete-toggle--on {
  border-color: rgba(232, 85, 85, 0.5);
  background: rgba(232, 85, 85, 0.12);
  color: #ff6961;
}

.tg__chip-wrap {
  display: inline-flex;
  align-items: center;
}

.tg__chip-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: -4px;
  border: none;
  border-radius: 50%;
  background: rgba(232, 85, 85, 0.18);
  color: #ff6961;
  font-size: 0.78rem;
  line-height: 1;
  cursor: pointer;
  animation: quiz-fade-in 0.15s ease both;
  transition:
    background var(--quiz-transition),
    transform var(--quiz-transition);
}

.tg__chip-del:hover {
  background: rgba(232, 85, 85, 0.35);
  transform: scale(1.15);
}

/* ── Add new row ── */

.tg__add-row {
  display: flex;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.tg__add-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-surface-input);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.76rem;
  outline: none;
  transition:
    border-color var(--quiz-transition),
    box-shadow var(--quiz-transition);
}

.tg__add-input:focus {
  border-color: var(--quiz-border-focus);
  box-shadow: 0 0 0 2px var(--quiz-accent-glow);
}

.tg__add-input::placeholder {
  color: var(--quiz-text-muted);
}

.tg__add-btn {
  padding: 6px 12px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-surface-soft);
  color: var(--quiz-text-soft);
  font-family: var(--quiz-font);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--quiz-transition),
    border-color var(--quiz-transition),
    color var(--quiz-transition);
}

.tg__add-btn:hover:not(:disabled) {
  background: var(--quiz-accent-soft);
  border-color: rgba(200, 106, 56, 0.3);
  color: var(--quiz-accent-strong);
}

.tg__add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
