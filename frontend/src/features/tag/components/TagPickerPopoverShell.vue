<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    activeTab?: "tags" | "memos";
    showMemoTab?: boolean;
  }>(),
  {
    activeTab: "tags",
    showMemoTab: false,
  }
);

const emit = defineEmits<{
  (e: "update:activeTab", tab: "tags" | "memos"): void;
  (e: "close"): void;
}>();
</script>

<template>
  <div class="tag-popup">
    <div v-if="props.showMemoTab" class="tag-popup-tabs">
      <button
        type="button"
        class="tag-popup-tab"
        :class="{ 'is-active': props.activeTab === 'tags' }"
        @click="emit('update:activeTab', 'tags')"
      >
        Tags
      </button>
      <button
        type="button"
        class="tag-popup-tab"
        :class="{ 'is-active': props.activeTab === 'memos' }"
        @click="emit('update:activeTab', 'memos')"
      >
        Memos
      </button>
    </div>

    <slot />

    <button type="button" class="tag-popup-close-btn" @click="emit('close')">Close</button>
  </div>
</template>
