<script setup lang="ts">
import { RouterLink } from "vue-router";
import type { MemoCollectionScope } from "../../model/memo.types";
import { memoPaths } from "../../../../routes";

defineProps<{
  scope: MemoCollectionScope;
}>();
</script>

<template>
  <nav class="memo-scope-tabs" aria-label="Memo views">
    <RouterLink
      :to="memoPaths.active"
      class="memo-scope-tab"
      :class="{ 'is-active': scope === 'active' }"
    >
      メモ
    </RouterLink>
    <RouterLink
      :to="memoPaths.trash"
      class="memo-scope-tab"
      :class="{ 'is-active': scope === 'trash' }"
    >
      ごみ箱
    </RouterLink>
  </nav>
</template>
