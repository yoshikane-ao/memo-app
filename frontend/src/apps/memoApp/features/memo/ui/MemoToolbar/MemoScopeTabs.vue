<script setup lang="ts">
import type { MemoViewScope } from "../../../view";

const props = defineProps<{
  scope: MemoViewScope;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "scope-change", scope: MemoViewScope): void;
}>();

const handleScopeChange = (scope: MemoViewScope) => {
  if (props.disabled || props.scope === scope) {
    return;
  }

  emit("scope-change", scope);
};
</script>

<template>
  <nav class="memo-scope-tabs" aria-label="Memo views" role="tablist">
    <button
      type="button"
      role="tab"
      data-memo-scope="active"
      class="memo-scope-tab"
      :class="{ 'is-active': scope === 'active' }"
      :aria-selected="scope === 'active'"
      :disabled="disabled"
      @click="handleScopeChange('active')"
    >
      メモ
    </button>
    <button
      type="button"
      role="tab"
      data-memo-scope="trash"
      class="memo-scope-tab"
      :class="{ 'is-active': scope === 'trash' }"
      :aria-selected="scope === 'trash'"
      :disabled="disabled"
      @click="handleScopeChange('trash')"
    >
      ごみ箱
    </button>
  </nav>
</template>
