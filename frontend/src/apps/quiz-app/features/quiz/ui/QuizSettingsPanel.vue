<script setup lang="ts">
import { computed, ref } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";
import type {
  AnswerMethod,
  QuestionFormatCategory,
  QuizDirection,
  QuizScope,
  QuizSettings,
} from "../model/quiz.types";
import {
  FORMAT_CATEGORY_LABELS,
  QUESTION_COUNT_OPTIONS,
  QUESTION_FORMAT_OPTIONS,
} from "../model/quiz.types";
import QuizToggleGroup from "./QuizToggleGroup.vue";

const props = defineProps<{
  settings: QuizSettings;
  quizCount: number;
  tagNames: string[];
  groups: string[];
  availableAnswerMethods: AnswerMethod[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (event: "update", key: keyof QuizSettings, value: QuizSettings[keyof QuizSettings]): void;
  (event: "start"): void;
}>();

const customCount = ref("");

const scopeOptions: { value: QuizScope; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "favorite", label: "\u2605 お気に入り" },
  { value: "tag", label: "タグ指定" },
  { value: "group", label: "グループ指定" },
];

const directionOptions: { value: QuizDirection; label: string }[] = [
  { value: "word-to-meaning", label: "単語 → 意味" },
  { value: "meaning-to-word", label: "意味 → 単語" },
  { value: "random", label: "ランダム" },
];

const formatCategories: QuestionFormatCategory[] = ["selection", "written"];

const formatsByCategory = computed(() => {
  const map = new Map<QuestionFormatCategory, typeof QUESTION_FORMAT_OPTIONS>();
  for (const cat of formatCategories) {
    map.set(cat, QUESTION_FORMAT_OPTIONS.filter((f) => f.category === cat));
  }
  return map;
});

const selectedFormatOption = computed(
  () => QUESTION_FORMAT_OPTIONS.find((f) => f.value === props.settings.questionFormat),
);

const answerMethodLabels: Record<AnswerMethod, string> = {
  tap: "タップ選択",
  swipe: "スワイプ",
  "text-input": "テキスト入力",
};

const countOptions = computed(() =>
  QUESTION_COUNT_OPTIONS.map((v) => ({
    value: v,
    label: v === "all" ? "すべて" : `${v}問`,
  })),
);

const isCustomCount = computed(
  () =>
    typeof props.settings.questionCount === "number" &&
    !QUESTION_COUNT_OPTIONS.includes(props.settings.questionCount as never),
);

const handleCountSelect = (value: number | "all") => {
  customCount.value = "";
  emit("update", "questionCount", value);
};

const handleCustomCount = () => {
  const num = parseInt(customCount.value, 10);
  if (num > 0) {
    emit("update", "questionCount", num);
  }
};

const canStart = computed(
  () =>
    !props.isLoading &&
    props.quizCount > 0 &&
    (props.settings.scope === "all" ||
      props.settings.scope === "favorite" ||
      (props.settings.scope === "tag" && props.settings.selectedTags.length > 0) ||
      (props.settings.scope === "group" && props.settings.selectedGroups.length > 0)),
);
</script>

<template>
  <section class="qs">
    <!-- Header -->
    <div class="qs__header">
      <div class="qs__glow" />
      <p class="qs__kicker">QUIZ APP</p>
      <h1 class="qs__title">出題設定</h1>
      <p class="qs__description">
        出題方法・問題形式・回答方法を設定して、クイズを始めましょう。
      </p>
      <div class="qs__stats">
        <span class="qs__pill">{{ quizCount }} 問 登録済み</span>
      </div>
    </div>

    <!-- Settings sections -->
    <div class="qs__sections">
      <!-- 1. Scope -->
      <fieldset class="qs__fieldset">
        <legend class="qs__legend">出題範囲</legend>
        <div class="qs__chip-row">
          <button
            v-for="opt in scopeOptions"
            :key="opt.value"
            type="button"
            class="qs__chip"
            :class="{ 'qs__chip--active': settings.scope === opt.value }"
            @click="emit('update', 'scope', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Tag selector -->
        <div v-if="settings.scope === 'tag'" class="qs__sub-selector">
          <QuizToggleGroup
            label="タグを選択"
            :options="tagNames"
            :selected="settings.selectedTags"
            :multiple="true"
            new-placeholder="+ 新規タグ"
            @update:selected="emit('update', 'selectedTags', $event)"
          />
        </div>

        <!-- Group selector -->
        <div v-if="settings.scope === 'group'" class="qs__sub-selector">
          <QuizToggleGroup
            label="グループを選択"
            :options="groups"
            :selected="settings.selectedGroups"
            :multiple="true"
            new-placeholder="+ 新規グループ"
            @update:selected="emit('update', 'selectedGroups', $event)"
          />
        </div>
      </fieldset>

      <!-- 2. Direction -->
      <fieldset class="qs__fieldset">
        <legend class="qs__legend">出題方法</legend>
        <div class="qs__chip-row">
          <button
            v-for="opt in directionOptions"
            :key="opt.value"
            type="button"
            class="qs__chip"
            :class="{ 'qs__chip--active': settings.direction === opt.value }"
            @click="emit('update', 'direction', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </fieldset>

      <!-- 3. Question Format (categorized) -->
      <fieldset class="qs__fieldset">
        <legend class="qs__legend">問題形式</legend>
        <div
          v-for="cat in formatCategories"
          :key="cat"
          class="qs__format-category"
        >
          <span class="qs__category-label">{{ FORMAT_CATEGORY_LABELS[cat] }}</span>
          <div class="qs__chip-row qs__chip-row--tight">
            <button
              v-for="opt in formatsByCategory.get(cat)"
              :key="opt.value"
              type="button"
              class="qs__chip"
              :class="{ 'qs__chip--active': settings.questionFormat === opt.value }"
              :title="opt.description"
              @click="emit('update', 'questionFormat', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <p v-if="selectedFormatOption" class="qs__format-desc">
          {{ selectedFormatOption.description }}
        </p>
      </fieldset>

      <!-- 4. Answer Method -->
      <fieldset class="qs__fieldset">
        <legend class="qs__legend">回答方法</legend>
        <div class="qs__chip-row">
          <button
            v-for="method in availableAnswerMethods"
            :key="method"
            type="button"
            class="qs__chip"
            :class="{ 'qs__chip--active': settings.answerMethod === method }"
            @click="emit('update', 'answerMethod', method)"
          >
            {{ answerMethodLabels[method] }}
          </button>
        </div>
        <p v-if="availableAnswerMethods.length === 1" class="qs__hint">
          ※ 選択した問題形式に基づいて自動設定されます
        </p>
      </fieldset>

      <!-- 5. Question Count -->
      <fieldset class="qs__fieldset">
        <legend class="qs__legend">出題数</legend>
        <div class="qs__chip-row">
          <button
            v-for="opt in countOptions"
            :key="String(opt.value)"
            type="button"
            class="qs__chip"
            :class="{ 'qs__chip--active': settings.questionCount === opt.value && !isCustomCount }"
            @click="handleCountSelect(opt.value)"
          >
            {{ opt.label }}
          </button>
          <div class="qs__custom-count">
            <input
              v-model="customCount"
              type="text"
              inputmode="numeric"
              class="qs__custom-input"
              placeholder="任意"
              :class="{ 'qs__custom-input--active': isCustomCount }"
              @keydown.enter.prevent="handleCustomCount"
              @blur="handleCustomCount"
            />
          </div>
        </div>
      </fieldset>

      <!-- 6. Options -->
      <fieldset class="qs__fieldset">
        <legend class="qs__legend">追加オプション</legend>
        <div class="qs__toggle-list">
          <label class="qs__toggle-item">
            <div class="qs__toggle-text">
              <span class="qs__toggle-label">理由つき回答</span>
              <span class="qs__toggle-sub">答えだけでなく理由もあわせて回答する</span>
            </div>
            <button
              type="button"
              class="qs__switch"
              :class="{ 'qs__switch--on': settings.withReason }"
              role="switch"
              :aria-checked="settings.withReason"
              @click="emit('update', 'withReason', !settings.withReason)"
            >
              <span class="qs__switch-thumb" />
            </button>
          </label>
          <label class="qs__toggle-item">
            <span class="qs__toggle-label">ヒントを表示する</span>
            <button
              type="button"
              class="qs__switch"
              :class="{ 'qs__switch--on': settings.showHint }"
              role="switch"
              :aria-checked="settings.showHint"
              @click="emit('update', 'showHint', !settings.showHint)"
            >
              <span class="qs__switch-thumb" />
            </button>
          </label>
          <label class="qs__toggle-item">
            <span class="qs__toggle-label">フラッシュ表示を使う</span>
            <button
              type="button"
              class="qs__switch"
              :class="{ 'qs__switch--on': settings.flashMode }"
              role="switch"
              :aria-checked="settings.flashMode"
              @click="emit('update', 'flashMode', !settings.flashMode)"
            >
              <span class="qs__switch-thumb" />
            </button>
          </label>
          <label class="qs__toggle-item">
            <span class="qs__toggle-label">リバース出題を使う</span>
            <button
              type="button"
              class="qs__switch"
              :class="{ 'qs__switch--on': settings.reverseMode }"
              role="switch"
              :aria-checked="settings.reverseMode"
              @click="emit('update', 'reverseMode', !settings.reverseMode)"
            >
              <span class="qs__switch-thumb" />
            </button>
          </label>
          <label class="qs__toggle-item">
            <span class="qs__toggle-label">問題順をランダムにする</span>
            <button
              type="button"
              class="qs__switch"
              :class="{ 'qs__switch--on': settings.randomOrder }"
              role="switch"
              :aria-checked="settings.randomOrder"
              @click="emit('update', 'randomOrder', !settings.randomOrder)"
            >
              <span class="qs__switch-thumb" />
            </button>
          </label>
        </div>
      </fieldset>
    </div>

    <!-- Start button -->
    <div class="qs__actions">
      <BaseButton
        class="btn-primary qs__start-btn"
        :disabled="!canStart"
        @click="emit('start')"
      >
        クイズを開始する
      </BaseButton>
      <p v-if="quizCount === 0" class="qs__hint">
        ※ クイズが登録されていません。まず問題を作成してください。
      </p>
      <p
        v-else-if="settings.scope !== 'all' && !canStart && !isLoading"
        class="qs__hint"
      >
        ※ タグまたはグループを1つ以上選択してください。
      </p>
    </div>
  </section>
</template>

<style scoped>
.qs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 640px;
  animation: quiz-fade-up 0.5s ease both;
}

/* ── Header ── */

.qs__header {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 28px 24px;
  border-radius: 22px;
  border: 1px solid var(--quiz-border);
  background:
    radial-gradient(circle at top right, rgba(200, 106, 56, 0.16), transparent 24%),
    radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.04), transparent 32%),
    linear-gradient(135deg, rgba(24, 24, 28, 0.98), rgba(8, 8, 10, 0.98));
  box-shadow: var(--quiz-shadow);
  overflow: hidden;
}

.qs__glow {
  position: absolute;
  top: -48px;
  right: -32px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 106, 56, 0.22), transparent 66%);
  filter: blur(10px);
  animation: quiz-orbit 8s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes quiz-orbit {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(-12px, 16px, 0) scale(1.08); }
}

.qs__kicker {
  margin: 0;
  color: var(--quiz-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.qs__title {
  margin: 0;
  color: var(--quiz-text);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.qs__description {
  margin: 0;
  color: var(--quiz-text-soft);
  font-size: 0.88rem;
  line-height: 1.7;
}

.qs__stats {
  display: flex;
  gap: 8px;
}

.qs__pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: var(--quiz-radius-pill);
  border: 1px solid rgba(200, 106, 56, 0.22);
  background: rgba(255, 255, 255, 0.04);
  color: var(--quiz-accent-strong);
  font-size: 0.76rem;
  font-weight: 700;
}

/* ── Sections ── */

.qs__sections {
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: quiz-fade-up 0.5s ease 0.1s both;
}

.qs__fieldset {
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  background: var(--quiz-surface-strong);
  padding: 18px 20px;
  margin: 0;
  transition: border-color var(--quiz-transition);
}

.qs__fieldset:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

.qs__legend {
  color: var(--quiz-text-soft);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 0 6px;
}

/* ── Chip row ── */

.qs__chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.qs__chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-pill);
  background: rgba(255, 255, 255, 0.03);
  color: var(--quiz-text-soft);
  font-family: var(--quiz-font);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--quiz-transition),
    border-color var(--quiz-transition),
    color var(--quiz-transition),
    transform var(--quiz-transition);
}

.qs__chip:hover {
  border-color: rgba(200, 106, 56, 0.3);
  background: rgba(200, 106, 56, 0.06);
  color: var(--quiz-accent-strong);
  transform: translateY(-1px);
}

.qs__chip--active {
  border-color: var(--quiz-border-focus);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
}

.qs__chip--active:hover {
  background: rgba(200, 106, 56, 0.22);
}

/* ── Format categories ── */

.qs__format-category {
  margin-top: 10px;
}

.qs__format-category + .qs__format-category {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.qs__category-label {
  display: block;
  color: var(--quiz-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.qs__chip-row--tight {
  margin-top: 6px;
}

.qs__format-desc {
  margin: 10px 0 0;
  padding: 8px 12px;
  border-radius: var(--quiz-radius-sm);
  background: rgba(200, 106, 56, 0.06);
  border: 1px solid rgba(200, 106, 56, 0.12);
  color: var(--quiz-text-soft);
  font-size: 0.76rem;
  line-height: 1.6;
  animation: quiz-fade-in 0.15s ease both;
}

/* ── Sub-selector (tag / group picker) ── */

.qs__sub-selector {
  margin-top: 12px;
  animation: quiz-fade-up 0.2s ease both;
}

/* ── Custom count input ── */

.qs__custom-count {
  display: flex;
  align-items: center;
}

.qs__custom-input {
  width: 64px;
  padding: 8px 12px;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-surface-input);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.82rem;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition:
    border-color var(--quiz-transition),
    box-shadow var(--quiz-transition);
}

.qs__custom-input:focus {
  border-color: var(--quiz-border-focus);
  box-shadow: 0 0 0 2px var(--quiz-accent-glow);
}

.qs__custom-input--active {
  border-color: var(--quiz-border-focus);
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
}

.qs__custom-input::placeholder {
  color: var(--quiz-text-muted);
  font-weight: 600;
}

/* ── Toggle list (options) ── */

.qs__toggle-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
}

.qs__toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.qs__toggle-item:last-child {
  border-bottom: none;
}

.qs__toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qs__toggle-label {
  color: var(--quiz-text-soft);
  font-size: 0.84rem;
  font-weight: 600;
}

.qs__toggle-sub {
  color: var(--quiz-text-muted);
  font-size: 0.72rem;
  line-height: 1.4;
}

/* ── Toggle switch ── */

.qs__switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius-pill);
  background: var(--quiz-surface-soft);
  cursor: pointer;
  transition:
    background var(--quiz-transition),
    border-color var(--quiz-transition);
}

.qs__switch--on {
  background: var(--quiz-accent);
  border-color: var(--quiz-accent);
}

.qs__switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--quiz-transition);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.qs__switch--on .qs__switch-thumb {
  transform: translateX(18px);
}

/* ── Hint text ── */

.qs__hint {
  margin: 6px 0 0;
  color: var(--quiz-text-muted);
  font-size: 0.74rem;
  line-height: 1.6;
}

/* ── Actions ── */

.qs__actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  animation: quiz-fade-up 0.5s ease 0.2s both;
}

.qs__start-btn {
  padding: 14px 24px;
  font-size: 0.94rem;
  border-radius: var(--quiz-radius);
}

/* ── Mobile ── */

@media (max-width: 768px) {
  .qs__header {
    padding: 20px 16px;
    border-radius: 18px;
  }

  .qs__fieldset {
    padding: 14px 16px;
  }
}
</style>
