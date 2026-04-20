<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  applyAutoHeight,
  applyAutoWidth,
} from '../../../../../../shared/composables/textareaAutosize';
import { useActiveCopyTarget } from '../../../../../../shared/copy/activeCopyTarget';
import { copyText } from '../../../../../../shared/copy/copyText';
import {
  handleMultilineEnterSubmit,
  handleSingleLineEnterSubmit,
} from '../../../../../../shared/keyboard/handleEnterSubmit';
import MemoCardActions from './MemoCardActions.vue';
import MemoCardTags from './MemoCardTags.vue';
import type { MemoCardEmits, MemoCardProps } from './types';

const props = defineProps<MemoCardProps>();
const emit = defineEmits<MemoCardEmits>();
const { setActiveTarget, clearActiveTarget } = useActiveCopyTarget();

const memoRowRef = ref<HTMLElement | null>(null);
const titleTextareaRef = ref<HTMLTextAreaElement | null>(null);
const contentTextareaRef = ref<HTMLTextAreaElement | null>(null);

const draftTitle = ref(props.memo.title);
const draftContent = ref(props.memo.content);
const currentWidth = ref<number | undefined>(props.memo.width ?? undefined);
const currentHeight = ref<number | undefined>(props.memo.height ?? undefined);
const isCopied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const titleStyle = computed(() =>
  currentWidth.value == null ? undefined : `${currentWidth.value}px`,
);
const contentStyle = computed(() =>
  currentHeight.value == null ? undefined : `${currentHeight.value}px`,
);

const hasTextChanged = computed(
  () => draftTitle.value !== props.memo.title || draftContent.value !== props.memo.content,
);
const hasRequiredFields = computed(
  () => draftTitle.value.trim() !== '' && draftContent.value.trim() !== '',
);
const isSaveDisabled = computed(() => !hasRequiredFields.value || !hasTextChanged.value);

const syncTitleLayout = () => {
  if (!titleTextareaRef.value) {
    return;
  }

  currentWidth.value = applyAutoWidth(titleTextareaRef.value, {
    min: 80,
    max: 500,
    padding: 4,
  });
};

const syncContentLayout = () => {
  if (!contentTextareaRef.value) {
    return;
  }

  currentHeight.value = applyAutoHeight(contentTextareaRef.value, {
    min: 32,
  });
};

const handleTitleInput = (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  draftTitle.value = target.value;
  syncTitleLayout();
};

const handleContentInput = (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  draftContent.value = target.value;
  syncContentLayout();
};

const handleTitleKeydown = (event: KeyboardEvent) => {
  handleSingleLineEnterSubmit(event, handleSaveRequested, () => !isSaveDisabled.value);
};

const handleContentKeydown = (event: KeyboardEvent) => {
  handleMultilineEnterSubmit(event, handleSaveRequested, () => !isSaveDisabled.value);
};

const handleSaveRequested = () => {
  if (isSaveDisabled.value) {
    return;
  }

  emit('save-requested', {
    memoId: props.memo.id,
    title: draftTitle.value,
    content: draftContent.value,
    width: currentWidth.value,
    height: currentHeight.value,
  });
};

const activateCopyTarget = () => {
  setActiveTarget({
    id: props.memo.id,
    getRoot: () => memoRowRef.value,
    copy: copyMemoContent,
  });
};

const markCopied = () => {
  isCopied.value = true;

  if (copiedTimer) {
    clearTimeout(copiedTimer);
  }

  copiedTimer = setTimeout(() => {
    isCopied.value = false;
    copiedTimer = null;
  }, 500);
};

const copyMemoContent = async () => {
  try {
    await copyText(draftContent.value);
    markCopied();
    return true;
  } catch (error) {
    console.error('Failed to copy memo content.', error);
    emit('copy-error', 'Failed to copy memo.');
    return false;
  }
};

watch(
  () => props.memo.title,
  (value) => {
    draftTitle.value = value;
    void nextTick(syncTitleLayout);
  },
);

watch(
  () => props.memo.content,
  (value) => {
    draftContent.value = value;
    void nextTick(syncContentLayout);
  },
);

watch(
  () => props.memo.width,
  (value) => {
    if (value != null) {
      currentWidth.value = value;
    }
  },
);

watch(
  () => props.memo.height,
  (value) => {
    if (value != null) {
      currentHeight.value = value;
    }
  },
);

onMounted(() => {
  void nextTick(() => {
    syncTitleLayout();
    syncContentLayout();
  });
});

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer);
  }

  clearActiveTarget(props.memo.id);
});
</script>

<template>
  <div
    ref="memoRowRef"
    class="memo-row"
    @focusin="activateCopyTarget"
    @pointerdown.capture="activateCopyTarget"
  >
    <div class="title-cell">
      <textarea
        :id="`title-${memo.id}`"
        ref="titleTextareaRef"
        :value="draftTitle"
        :style="{ width: titleStyle }"
        rows="1"
        spellcheck="false"
        class="title-input"
        @input="handleTitleInput"
        @keydown="handleTitleKeydown"
      />
    </div>

    <div class="content-cell">
      <textarea
        :id="`content-${memo.id}`"
        ref="contentTextareaRef"
        :value="draftContent"
        :style="{ height: contentStyle }"
        rows="2"
        spellcheck="false"
        class="content-input"
        @input="handleContentInput"
        @keydown="handleContentKeydown"
      />

      <MemoCardTags
        :memo-id="memo.id"
        :tags="memo.memo_tags"
        @memo-tags-updated="emit('memo-tags-updated', $event)"
        @tag-deleted="emit('tag-deleted', $event)"
      />
    </div>

    <div class="actions-cell">
      <MemoCardActions
        :memo-id="memo.id"
        :is-copied="isCopied"
        :is-save-disabled="isSaveDisabled"
        @copy-requested="void copyMemoContent()"
        @save-requested="handleSaveRequested"
        @trash-requested="emit('trash-requested', memo.id)"
      />
    </div>
  </div>
</template>
