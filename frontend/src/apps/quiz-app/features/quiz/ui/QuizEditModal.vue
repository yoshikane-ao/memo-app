<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import BaseButton from "../../../../../shared/ui/BaseButton.vue";
import type { QuizItem, UpdateQuizInput } from "../model/quiz.types";

type Tab = "basic" | "advanced";

const props = defineProps<{
  item: QuizItem;
  isSubmitting: boolean;
  availableTags: string[];
  availableGroups: string[];
}>();

const emit = defineEmits<{
  (event: "save", input: UpdateQuizInput): void;
  (event: "close"): void;
  (event: "addTag", value: string): void;
  (event: "addGroup", value: string): void;
  (event: "deleteTag", value: string): void;
  (event: "deleteGroup", value: string): void;
}>();

const activeTab = ref<Tab>("basic");
const newTag = ref("");
const newGroup = ref("");
const tagDeleteMode = ref(false);
const groupDeleteMode = ref(false);

const draft = reactive({
  word: "",
  mean: "",
  selectedTags: [] as string[],
  selectedGroup: [] as string[],
  isFavorite: false,
  questionText: "",
  hint: "",
  choices: [""] as string[],
});

watch(
  () => props.item,
  (item) => {
    draft.word = item.word;
    draft.mean = item.mean;
    draft.selectedTags = item.quizTagsRelations.map((r) => r.quizTag.tagName);
    draft.selectedGroup = item.groupName
      ? item.groupName.split(",").map((g) => g.trim()).filter(Boolean)
      : [];
    draft.isFavorite = item.isFavorite;
    draft.questionText = item.questionText ?? "";
    draft.hint = item.hint ?? "";
    draft.choices =
      item.choices.length > 0
        ? item.choices.map((c) => c.choiceText)
        : [""];
  },
  { immediate: true }
);

const advancedCount = computed(() => {
  let n = 0;
  if (draft.questionText.trim()) n++;
  if (draft.hint.trim()) n++;
  n += draft.choices.filter((c) => c.trim() !== "").length;
  return n;
});

/* ── Tag helpers ── */
const toggleTag = (tag: string) => {
  draft.selectedTags = draft.selectedTags.includes(tag)
    ? draft.selectedTags.filter((t) => t !== tag)
    : [...draft.selectedTags, tag];
};

const addNewTag = () => {
  const v = newTag.value.trim();
  if (!v) return;
  emit("addTag", v);
  if (!draft.selectedTags.includes(v)) {
    draft.selectedTags = [...draft.selectedTags, v];
  }
  newTag.value = "";
};

/* ── Group helpers ── */
const selectGroup = (g: string) => {
  draft.selectedGroup = draft.selectedGroup.includes(g)
    ? draft.selectedGroup.filter((x) => x !== g)
    : [...draft.selectedGroup, g];
};

const addNewGroup = () => {
  const v = newGroup.value.trim();
  if (!v) return;
  emit("addGroup", v);
  if (!draft.selectedGroup.includes(v)) {
    draft.selectedGroup = [...draft.selectedGroup, v];
  }
  newGroup.value = "";
};

/* ── Choice helpers ── */
const choiceRefs = ref<HTMLInputElement[]>([]);

const addChoice = async () => {
  draft.choices.push("");
  await nextTick();
  choiceRefs.value[draft.choices.length - 1]?.focus();
};

const removeChoice = (i: number) => {
  draft.choices.splice(i, 1);
};

/* ── Save ── */
const isSaveDisabled = computed(
  () => draft.word.trim() === "" || draft.mean.trim() === "" || props.isSubmitting
);

const handleSave = () => {
  if (isSaveDisabled.value) return;
  emit("save", {
    id: props.item.id,
    word: draft.word.trim(),
    mean: draft.mean.trim(),
    tags: draft.selectedTags,
    groupName: draft.selectedGroup.join(","),
    isFavorite: draft.isFavorite,
    questionText: draft.questionText.trim(),
    hint: draft.hint.trim(),
    choices: draft.choices.filter((c) => c.trim() !== ""),
  });
};

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) emit("close");
};

const onKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") emit("close");
};

onMounted(() => document.addEventListener("keydown", onKey));
onUnmounted(() => document.removeEventListener("keydown", onKey));
</script>

<template>
  <Teleport to="body">
    <div class="ov" @click="handleOverlayClick">
      <div class="dl" role="dialog" aria-modal="true">

        <!-- ══ Header ══ -->
        <header class="dl-head">
          <div>
            <h2 class="dl-head__title">問題を編集</h2>
            <p class="dl-head__sub">{{ item.word }}</p>
          </div>
          <button class="dl-head__close" aria-label="閉じる" @click="emit('close')">
            &times;
          </button>
        </header>

        <!-- ══ Tabs ══ -->
        <nav class="dl-tabs">
          <button
            type="button"
            class="dl-tabs__btn"
            :class="{ 'dl-tabs__btn--on': activeTab === 'basic' }"
            @click="activeTab = 'basic'"
          >
            基本
          </button>
          <button
            type="button"
            class="dl-tabs__btn"
            :class="{ 'dl-tabs__btn--on': activeTab === 'advanced' }"
            @click="activeTab = 'advanced'"
          >
            出題設定
            <span v-if="advancedCount > 0" class="dl-tabs__dot">{{ advancedCount }}</span>
          </button>
        </nav>

        <!-- ══ Body ══ -->
        <div class="dl-body">

          <!-- ── Tab: basic ── -->
          <div v-if="activeTab === 'basic'" key="basic" class="pane">

            <!-- Word & Meaning -->
            <section class="sec">
              <h3 class="sec__title">単語と意味</h3>
              <div class="sec__row">
                <label class="inp">
                  <span class="inp__lbl">単語 <span class="inp__req">*</span></span>
                  <input v-model="draft.word" type="text" placeholder="apple" />
                </label>
                <label class="inp">
                  <span class="inp__lbl">意味 <span class="inp__req">*</span></span>
                  <input v-model="draft.mean" type="text" placeholder="りんご" />
                </label>
              </div>
            </section>

            <!-- Favorite -->
            <section class="sec">
              <label class="sec__fav-toggle">
                <button
                  type="button"
                  class="sec__fav-btn"
                  :class="{ 'sec__fav-btn--on': draft.isFavorite }"
                  @click="draft.isFavorite = !draft.isFavorite"
                >
                  {{ draft.isFavorite ? '\u2605' : '\u2606' }}
                </button>
                <span class="sec__fav-label">お気に入り</span>
              </label>
            </section>

            <!-- Tags — flat inline chips -->
            <section class="sec">
              <div class="sec__title-row">
                <h3 class="sec__title">タグ <span class="sec__hint">複数選択OK</span></h3>
                <button
                  v-if="availableTags.length > 0"
                  type="button"
                  class="sec__del-toggle"
                  :class="{ 'sec__del-toggle--on': tagDeleteMode }"
                  @click="tagDeleteMode = !tagDeleteMode"
                >
                  {{ tagDeleteMode ? '完了' : '削除' }}
                </button>
              </div>
              <div class="chips">
                <span
                  v-for="tag in availableTags"
                  :key="tag"
                  class="chip-wrap"
                >
                  <button
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': draft.selectedTags.includes(tag) }"
                    @click="toggleTag(tag)"
                  >
                    {{ tag }}
                  </button>
                  <button
                    v-if="tagDeleteMode"
                    type="button"
                    class="chip-del"
                    title="削除"
                    @click="emit('deleteTag', tag)"
                  >
                    &times;
                  </button>
                </span>
                <span v-if="availableTags.length === 0" class="chips__empty">
                  タグがまだありません
                </span>
              </div>
              <div class="add-row">
                <input
                  v-model="newTag"
                  type="text"
                  class="add-row__input"
                  placeholder="新しいタグを入力"
                  @keydown.enter.prevent="addNewTag"
                />
                <button
                  type="button"
                  class="add-row__btn"
                  :disabled="newTag.trim() === ''"
                  @click="addNewTag"
                >
                  追加
                </button>
              </div>
            </section>

            <!-- Group — flat inline chips -->
            <section class="sec">
              <div class="sec__title-row">
                <h3 class="sec__title">グループ <span class="sec__hint">複数選択OK</span></h3>
                <button
                  v-if="availableGroups.length > 0"
                  type="button"
                  class="sec__del-toggle"
                  :class="{ 'sec__del-toggle--on': groupDeleteMode }"
                  @click="groupDeleteMode = !groupDeleteMode"
                >
                  {{ groupDeleteMode ? '完了' : '削除' }}
                </button>
              </div>
              <div class="chips">
                <span
                  v-for="g in availableGroups"
                  :key="g"
                  class="chip-wrap"
                >
                  <button
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': draft.selectedGroup.includes(g) }"
                    @click="selectGroup(g)"
                  >
                    {{ g }}
                  </button>
                  <button
                    v-if="groupDeleteMode"
                    type="button"
                    class="chip-del"
                    title="削除"
                    @click="emit('deleteGroup', g)"
                  >
                    &times;
                  </button>
                </span>
                <span v-if="availableGroups.length === 0" class="chips__empty">
                  グループがまだありません
                </span>
              </div>
              <div class="add-row">
                <input
                  v-model="newGroup"
                  type="text"
                  class="add-row__input"
                  placeholder="新しいグループを入力"
                  @keydown.enter.prevent="addNewGroup"
                />
                <button
                  type="button"
                  class="add-row__btn"
                  :disabled="newGroup.trim() === ''"
                  @click="addNewGroup"
                >
                  追加
                </button>
              </div>
            </section>
          </div>

          <!-- ── Tab: advanced ── -->
          <div v-if="activeTab === 'advanced'" key="adv" class="pane">

            <!-- Question text -->
            <section class="sec">
              <h3 class="sec__title">問題文</h3>
              <p class="sec__desc">出題時に単語の代わりに表示されます。空欄なら単語がそのまま出ます。</p>
              <textarea
                v-model="draft.questionText"
                rows="3"
                placeholder="例: この果物の名前は？"
              />
            </section>

            <!-- Hint -->
            <section class="sec">
              <h3 class="sec__title">ヒント</h3>
              <p class="sec__desc">解答に困ったとき表示できるヒントです。</p>
              <input v-model="draft.hint" type="text" placeholder="例: 赤くて丸い果物" />
            </section>

            <!-- Choices -->
            <section class="sec">
              <h3 class="sec__title">選択肢</h3>
              <p class="sec__desc">選択問題にする場合に使います。正解は自動で含まれます。</p>

              <div class="choices">
                <div
                  v-for="(_, i) in draft.choices"
                  :key="i"
                  class="choices__row"
                >
                  <span class="choices__letter">{{ String.fromCharCode(65 + i) }}</span>
                  <input
                    :ref="(el) => { if (el) choiceRefs[i] = el as HTMLInputElement }"
                    v-model="draft.choices[i]"
                    type="text"
                    placeholder="選択肢を入力"
                    @keydown.enter.prevent="addChoice"
                  />
                  <button
                    v-if="draft.choices.length > 1"
                    type="button"
                    class="choices__del"
                    aria-label="削除"
                    @click="removeChoice(i)"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <button type="button" class="choices__add" @click="addChoice">
                + 選択肢を追加
              </button>
            </section>
          </div>
        </div>

        <!-- ══ Footer ══ -->
        <footer class="dl-foot">
          <BaseButton @click="emit('close')">キャンセル</BaseButton>
          <BaseButton class="btn-primary" :disabled="isSaveDisabled" @click="handleSave">
            {{ isSubmitting ? '保存中...' : '保存する' }}
          </BaseButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ───────────────────────── Overlay ── */
.ov {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(8px) saturate(1.6);
  -webkit-backdrop-filter: blur(8px) saturate(1.6);
  animation: quiz-fade-in 0.22s ease both;
}

/* ───────────────────────── Dialog ── */
.dl {
  width: min(540px, 92vw);
  max-height: 86vh;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  border-radius: 20px;
  background: rgba(30, 30, 32, 0.92);
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.5),
    0 0 0 0.5px rgba(255, 255, 255, 0.08),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.06);
  animation: quiz-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  font-family: var(--quiz-font);
  color: var(--quiz-text);
  overflow: hidden;
}

/* ───────────────────────── Header ── */
.dl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 14px;
}

.dl-head__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.dl-head__sub {
  margin: 3px 0 0;
  color: var(--quiz-accent-strong);
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.dl-head__close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dl-head__close:hover {
  background: rgba(255, 69, 58, 0.14);
  color: #ff6961;
}

.dl-head__close:active {
  transform: scale(0.92);
}

/* ───────────────────────── Tabs ── */
.dl-tabs {
  display: flex;
  gap: 4px;
  margin: 4px 28px 0;
  padding: 3px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.dl-tabs__btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  justify-content: center;
  padding: 9px 18px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  font-family: var(--quiz-font);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.dl-tabs__btn:hover {
  color: rgba(255, 255, 255, 0.7);
}

.dl-tabs__btn--on {
  background: rgba(255, 255, 255, 0.08);
  color: var(--quiz-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dl-tabs__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent-strong);
  font-size: 0.68rem;
  font-weight: 700;
}

/* ───────────────────────── Body ── */
.dl-body {
  overflow-y: auto;
  padding: 22px 28px 28px;
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: quiz-fade-up 0.25s ease both;
}

/* ───────────────────────── Section ── */
.sec {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sec__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--quiz-text);
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.sec__hint {
  color: rgba(255, 255, 255, 0.28);
  font-size: 0.72rem;
  font-weight: 500;
}

.sec__desc {
  margin: -6px 0 0;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.78rem;
  line-height: 1.55;
}

.sec__fav-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.sec__fav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--quiz-border);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.25);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.sec__fav-btn:hover {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.06);
  color: rgba(255, 193, 7, 0.6);
}

.sec__fav-btn:active {
  transform: scale(0.9);
}

.sec__fav-btn--on {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  animation: fav-pop 0.35s cubic-bezier(0.17, 0.67, 0.21, 1.2);
}

.sec__fav-btn--on:hover {
  background: rgba(255, 193, 7, 0.22);
  color: #ffca28;
}

@keyframes fav-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.sec__fav-label {
  color: var(--quiz-text-soft);
  font-size: 0.84rem;
  font-weight: 600;
}

.sec__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* ───────────────────────── Input ── */
.inp {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.inp__lbl {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.inp__req {
  color: var(--quiz-accent-strong);
}

/* ── Modal-scoped form control overrides ── */
.dl input[type="text"],
.dl textarea {
  padding: 11px 16px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 1px 3px rgba(0, 0, 0, 0.2);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.88rem;
  letter-spacing: -0.005em;
  outline: none;
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.dl input[type="text"]:hover,
.dl textarea:hover {
  background: rgba(255, 255, 255, 0.07);
}

.dl input[type="text"]:focus,
.dl textarea:focus {
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 0 0 1px rgba(200, 106, 56, 0.35),
    0 0 0 3px rgba(200, 106, 56, 0.12),
    inset 0 1px 3px rgba(0, 0, 0, 0.15);
}

.dl input[type="text"]::placeholder,
.dl textarea::placeholder {
  color: rgba(255, 255, 255, 0.18);
  font-weight: 400;
}

.dl textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}

/* ───────────────────────── Chips ── */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding: 2px;
}

.chips__empty {
  color: rgba(255, 255, 255, 0.25);
  font-size: 0.82rem;
}

.chip {
  padding: 7px 16px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--quiz-font);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.chip:hover {
  background: rgba(200, 106, 56, 0.12);
  color: var(--quiz-accent-strong);
}

.chip:active {
  transform: scale(0.96);
}

.chip--on {
  background: rgba(200, 106, 56, 0.2);
  color: var(--quiz-accent-strong);
  box-shadow: inset 0 0 0 1.5px rgba(200, 106, 56, 0.4);
}

.chip--on:hover {
  background: rgba(200, 106, 56, 0.28);
}

/* ───────────────────────── Section title row ── */
.sec__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sec__del-toggle {
  padding: 3px 10px;
  border: 1px solid var(--quiz-border);
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  font-family: var(--quiz-font);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sec__del-toggle:hover {
  border-color: rgba(232, 85, 85, 0.4);
  color: rgba(232, 85, 85, 0.8);
}

.sec__del-toggle--on {
  border-color: rgba(232, 85, 85, 0.5);
  background: rgba(232, 85, 85, 0.12);
  color: #ff6961;
}

/* ───────────────────────── Chip wrap + delete ── */
.chip-wrap {
  display: inline-flex;
  align-items: center;
}

.chip-del {
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
    background 0.2s ease,
    transform 0.2s ease;
}

.chip-del:hover {
  background: rgba(232, 85, 85, 0.35);
  transform: scale(1.15);
}

/* ───────────────────────── Add row ── */
.add-row {
  display: flex;
  gap: 8px;
}

.add-row__input {
  flex: 1;
  min-width: 0;
  padding: 9px 16px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  color: var(--quiz-text);
  font-family: var(--quiz-font);
  font-size: 0.82rem;
  outline: none;
  transition: all 0.2s ease;
}

.add-row__input:focus {
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 0 0 1px rgba(200, 106, 56, 0.3),
    0 0 0 3px rgba(200, 106, 56, 0.1);
}

.add-row__input::placeholder {
  color: rgba(255, 255, 255, 0.18);
}

.add-row__btn {
  padding: 9px 18px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--quiz-font);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.add-row__btn:hover:not(:disabled) {
  background: rgba(200, 106, 56, 0.16);
  color: var(--quiz-accent-strong);
}

.add-row__btn:active:not(:disabled) {
  transform: scale(0.96);
}

.add-row__btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* ───────────────────────── Choices ── */
.choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 260px;
  overflow-y: auto;
}

.choices__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  animation: quiz-fade-up 0.22s ease both;
  transition: background 0.15s ease;
}

.choices__row:hover {
  background: rgba(255, 255, 255, 0.035);
}

.choices__letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(200, 106, 56, 0.1);
  color: var(--quiz-accent-strong);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.choices__row input {
  flex: 1;
  min-width: 0;
}

.choices__del {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.2);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.choices__del:hover {
  background: rgba(255, 69, 58, 0.12);
  color: #ff6961;
}

.choices__del:active {
  transform: scale(0.88);
}

.choices__add {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 9px 18px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.35);
  font-family: var(--quiz-font);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.choices__add:hover {
  background: rgba(200, 106, 56, 0.1);
  color: var(--quiz-accent-strong);
}

.choices__add:active {
  transform: scale(0.96);
}

/* ───────────────────────── Footer ── */
.dl-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.12);
}

/* ───────────────────────── Responsive ── */
@media (max-width: 500px) {
  .dl-head {
    padding: 20px 20px 12px;
  }

  .dl-tabs {
    margin: 4px 20px 0;
  }

  .dl-body {
    padding: 18px 20px 24px;
  }

  .dl-foot {
    padding: 14px 20px;
  }

  .sec__row {
    grid-template-columns: 1fr;
  }
}
</style>
