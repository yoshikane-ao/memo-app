<script setup lang="ts">
import { computed, ref } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";
import type { QuizItem } from "../model/quiz.types";

const props = defineProps<{
  items: QuizItem[];
  isLoading: boolean;
  selectedIds: number[];
}>();

const emit = defineEmits<{
  (event: "update:selectedIds", value: number[]): void;
  (event: "edit", item: QuizItem): void;
  (event: "delete", item: QuizItem): void;
  (event: "toggleFavorite", item: QuizItem): void;
}>();

type SearchScope = "all" | "word" | "mean" | "tag" | "group" | "favorite";

const searchQuery = ref("");
const searchScope = ref<SearchScope>("all");

const scopes: { value: SearchScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "word", label: "Word" },
  { value: "mean", label: "Meaning" },
  { value: "tag", label: "Tag" },
  { value: "group", label: "Group" },
  { value: "favorite", label: "Favorite" },
];

const selectedIdSet = computed(() => new Set(props.selectedIds));

const getTagLabel = (item: QuizItem) =>
  item.quizTagsRelations.map((relation) => relation.quizTag.tagName).join(", ");

const getGroups = (item: QuizItem): string[] =>
  item.groupName
    ? item.groupName.split(",").map((group) => group.trim()).filter(Boolean)
    : [];

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (searchScope.value === "favorite") {
    const favorites = props.items.filter((item) => item.isFavorite);
    if (!query) {
      return favorites;
    }

    return favorites.filter((item) => {
      const word = item.word.toLowerCase();
      const mean = item.mean.toLowerCase();
      return word.includes(query) || mean.includes(query);
    });
  }

  if (!query) {
    return props.items;
  }

  return props.items.filter((item) => {
    const word = item.word.toLowerCase();
    const mean = item.mean.toLowerCase();
    const tags = getTagLabel(item).toLowerCase();
    const groups = getGroups(item).join(" ").toLowerCase();

    switch (searchScope.value) {
      case "word":
        return word.includes(query);
      case "mean":
        return mean.includes(query);
      case "tag":
        return tags.includes(query);
      case "group":
        return groups.includes(query);
      default:
        return word.includes(query) || mean.includes(query) || tags.includes(query) || groups.includes(query);
    }
  });
});

const isAllFilteredSelected = computed(
  () => filteredItems.value.length > 0 && filteredItems.value.every((item) => selectedIdSet.value.has(item.id))
);

const toggleSelectAllFiltered = () => {
  if (isAllFilteredSelected.value) {
    const filteredIds = new Set(filteredItems.value.map((item) => item.id));
    emit(
      "update:selectedIds",
      props.selectedIds.filter((id) => !filteredIds.has(id))
    );
    return;
  }

  emit(
    "update:selectedIds",
    [...new Set([...props.selectedIds, ...filteredItems.value.map((item) => item.id)])]
  );
};

const toggleSelected = (itemId: number) => {
  if (selectedIdSet.value.has(itemId)) {
    emit(
      "update:selectedIds",
      props.selectedIds.filter((id) => id !== itemId)
    );
    return;
  }

  emit("update:selectedIds", [...props.selectedIds, itemId]);
};

const clearSearch = () => {
  searchQuery.value = "";
};
</script>

<template>
  <section class="quiz-list">
    <div class="quiz-list__header">
      <h2 class="quiz-list__title">Quiz List</h2>
      <span class="quiz-list__count">
        {{ filteredItems.length }} / {{ items.length }}
      </span>
    </div>

    <div class="quiz-search">
      <div class="quiz-search__scopes">
        <button
          v-for="scope in scopes"
          :key="scope.value"
          type="button"
          class="quiz-search__scope"
          :class="{ 'quiz-search__scope--on': searchScope === scope.value }"
          @click="searchScope = scope.value"
        >
          {{ scope.label }}
        </button>
      </div>
      <div class="quiz-search__field">
        <input
          v-model="searchQuery"
          type="text"
          class="quiz-search__input"
          :placeholder="`Search ${scopes.find((scope) => scope.value === searchScope)?.label?.toLowerCase() ?? 'items'}...`"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="quiz-search__clear"
          @click="clearSearch"
        >
          &times;
        </button>
      </div>
    </div>

    <p v-if="isLoading" class="quiz-list__status">Loading quizzes...</p>
    <p v-else-if="items.length === 0" class="quiz-list__status">
      No quizzes yet.
    </p>
    <p v-else-if="filteredItems.length === 0" class="quiz-list__status">
      No quizzes matched the current filter.
    </p>

    <div v-else class="quiz-list__table-wrap">
      <table class="quiz-list__table">
        <thead>
          <tr>
            <th class="quiz-list__th-select">
              <input
                type="checkbox"
                class="quiz-list__checkbox"
                :checked="isAllFilteredSelected"
                @change="toggleSelectAllFiltered"
              />
            </th>
            <th class="quiz-list__th-fav"></th>
            <th>Word</th>
            <th>Meaning</th>
            <th>Tags</th>
            <th>Groups</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in filteredItems"
            :key="item.id"
            class="quiz-list__row"
            :class="{ 'quiz-list__row--selected': selectedIdSet.has(item.id) }"
            :style="{ animationDelay: `${0.03 * index}s` }"
          >
            <td class="quiz-list__cell-select">
              <input
                type="checkbox"
                class="quiz-list__checkbox"
                :checked="selectedIdSet.has(item.id)"
                @change="toggleSelected(item.id)"
              />
            </td>
            <td class="quiz-list__cell-fav">
              <button
                type="button"
                class="quiz-list__fav-btn"
                :class="{ 'quiz-list__fav-btn--on': item.isFavorite }"
                :title="item.isFavorite ? 'Remove favorite' : 'Add favorite'"
                @click="emit('toggleFavorite', item)"
              >
                {{ item.isFavorite ? "\u2605" : "\u2606" }}
              </button>
            </td>
            <td class="quiz-list__cell-word">{{ item.word }}</td>
            <td>{{ item.mean }}</td>
            <td>
              <span v-if="getTagLabel(item)" class="quiz-list__tags">{{ getTagLabel(item) }}</span>
              <span v-else class="quiz-list__empty">-</span>
            </td>
            <td>
              <div v-if="getGroups(item).length > 0" class="quiz-list__groups">
                <span
                  v-for="group in getGroups(item)"
                  :key="group"
                  class="quiz-list__group"
                >
                  {{ group }}
                </span>
              </div>
              <span v-else class="quiz-list__empty">-</span>
            </td>
            <td class="quiz-list__actions">
              <BaseButton class="quiz-list__btn" @click="emit('edit', item)">
                Edit
              </BaseButton>
              <BaseButton class="btn-danger quiz-list__btn" @click="emit('delete', item)">
                Delete
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.quiz-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: quiz-fade-up 0.45s ease 0.1s both;
}

.quiz-list__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.quiz-list__title {
  margin: 0;
  color: var(--quiz-text);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.quiz-list__count {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.74rem;
  font-weight: 700;
}

.quiz-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quiz-search__scopes {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.quiz-search__scope {
  flex: 1;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--quiz-text-muted);
  font-family: var(--quiz-font);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
  white-space: nowrap;
}

.quiz-search__scope:hover {
  color: var(--quiz-text-soft);
}

.quiz-search__scope--on {
  background: rgba(255, 255, 255, 0.08);
  color: var(--quiz-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.quiz-search__field {
  position: relative;
  display: flex;
  align-items: center;
}

.quiz-search__input {
  width: 100%;
  padding: 9px 36px 9px 14px;
  border: 1px solid var(--quiz-border);
  border-radius: 999px;
  background: var(--quiz-surface-input);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.84rem;
  outline: none;
  transition: all 0.2s ease;
}

.quiz-search__input:focus {
  border-color: var(--quiz-border-focus);
  box-shadow: 0 0 0 3px var(--quiz-accent-glow);
}

.quiz-search__input::placeholder {
  color: var(--quiz-text-muted);
}

.quiz-search__clear {
  position: absolute;
  right: 6px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quiz-search__clear:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--quiz-text);
}

.quiz-list__status {
  color: var(--quiz-text-muted);
  font-size: 0.88rem;
}

.quiz-list__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  background: var(--quiz-surface);
}

.quiz-list__table {
  width: 100%;
  border-collapse: collapse;
}

.quiz-list__table th {
  padding: 10px 12px;
  border-bottom: 1px solid var(--quiz-border);
  background: var(--quiz-surface-strong);
  color: var(--quiz-text-muted);
  font-size: 0.74rem;
  font-weight: 700;
  text-align: left;
  letter-spacing: 0.03em;
}

.quiz-list__table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--quiz-text-soft);
  font-size: 0.84rem;
}

.quiz-list__row {
  animation: quiz-fade-up 0.35s ease both;
  transition: background var(--quiz-transition);
}

.quiz-list__row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.quiz-list__row--selected {
  background: rgba(200, 106, 56, 0.08);
}

.quiz-list__cell-word {
  color: var(--quiz-text);
  font-weight: 600;
}

.quiz-list__tags {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: var(--quiz-radius-pill);
  background: rgba(200, 106, 56, 0.1);
  border: 1px solid rgba(200, 106, 56, 0.18);
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 600;
}

.quiz-list__groups {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.quiz-list__group {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: var(--quiz-radius-pill);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--quiz-text-soft);
  font-size: 0.72rem;
  font-weight: 600;
}

.quiz-list__empty {
  color: var(--quiz-text-muted);
}

.quiz-list__th-select,
.quiz-list__cell-select,
.quiz-list__th-fav,
.quiz-list__cell-fav {
  width: 40px;
  text-align: center;
}

.quiz-list__checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--quiz-accent-strong);
  cursor: pointer;
}

.quiz-list__fav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.2);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.quiz-list__fav-btn:hover {
  color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.06);
}

.quiz-list__fav-btn:active {
  transform: scale(0.85);
}

.quiz-list__fav-btn--on {
  color: #ffc107;
  background: rgba(255, 193, 7, 0.12);
  animation: fav-pop 0.35s cubic-bezier(0.17, 0.67, 0.21, 1.2);
}

.quiz-list__fav-btn--on:hover {
  color: #ffca28;
  background: rgba(255, 193, 7, 0.18);
}

@keyframes fav-pop {
  0% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.35);
  }

  100% {
    transform: scale(1);
  }
}

.quiz-list__actions {
  display: flex;
  gap: 6px;
}

.quiz-list__btn {
  padding: 5px 10px;
  font-size: 0.72rem;
}
</style>
