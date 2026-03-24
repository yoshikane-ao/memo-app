<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import MemoTagSourceTab from "./MemoTagSourceTab.vue";
import TagCatalogPanel from "./TagCatalogPanel.vue";
import TagPickerPopoverShell from "./TagPickerPopoverShell.vue";
import type { MemoTagSource, TagItem } from "../model/tag.types";

const props = defineProps<{
  tags: TagItem[];
  selectedTagIds?: number[];
  memoSources?: MemoTagSource[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-tag", tag: TagItem): void;
  (e: "create-tag", title: string): void;
  (e: "tag-deleted", tag: TagItem): void;
  (e: "apply-tags-from-memo", source: MemoTagSource): void;
}>();

type PickerTab = "tags" | "memos";

const modalRef = ref<HTMLElement | null>(null);
const activeTab = ref<PickerTab>("tags");
const hasMemoTab = computed(() => props.memoSources !== undefined);
let outsideClickTimer: ReturnType<typeof setTimeout> | null = null;

const handleClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    emit("close");
  }
};

onMounted(() => {
  outsideClickTimer = setTimeout(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.addEventListener("click", handleClickOutside, true);
  }, 100);
});

onBeforeUnmount(() => {
  if (outsideClickTimer) {
    clearTimeout(outsideClickTimer);
    outsideClickTimer = null;
  }

  if (typeof document !== "undefined") {
    document.removeEventListener("click", handleClickOutside, true);
  }
});
</script>

<template>
  <div ref="modalRef">
    <TagPickerPopoverShell
      :activeTab="activeTab"
      :showMemoTab="hasMemoTab"
      @update:activeTab="activeTab = $event"
      @close="emit('close')"
    >
      <TagCatalogPanel
        v-if="activeTab === 'tags'"
        :tags="tags"
        :selectedTagIds="selectedTagIds"
        @toggle-tag="emit('toggle-tag', $event)"
        @create-tag="emit('create-tag', $event)"
        @tag-deleted="emit('tag-deleted', $event)"
      />

      <MemoTagSourceTab
        v-else-if="memoSources"
        :memoSources="memoSources"
        @apply-tags-from-memo="emit('apply-tags-from-memo', $event)"
      />

      <div v-else class="memo-source-empty">No memos available.</div>
    </TagPickerPopoverShell>
  </div>
</template>
