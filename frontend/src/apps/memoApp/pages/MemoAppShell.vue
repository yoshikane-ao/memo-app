<script setup lang="ts">
import { RouterView, useRoute, useRouter } from "vue-router";
import { onBeforeUnmount, watch } from "vue";
import { useCopyShortcuts } from "../../../shared/copy/useCopyShortcuts";
import { useHistoryManager } from "../../../shared/history/useHistoryManager";
import { useHistoryShortcuts } from "../../../shared/history/useHistoryShortcuts";
import { memoPaths } from "../routes";
import { useMemoViewStore } from "../features/view";

const history = useHistoryManager();
const route = useRoute();
const router = useRouter();
const viewStore = useMemoViewStore();

useHistoryShortcuts();
useCopyShortcuts();

const toScopeFromPath = (path: string) => (path === memoPaths.trash ? "trash" : "active");

watch(
  () => route.path,
  (path) => {
    const nextScope = toScopeFromPath(path);
    if (viewStore.currentScope === nextScope) {
      return;
    }

    viewStore.setScope(nextScope);
  },
  { immediate: true }
);

watch(
  () => viewStore.currentScope,
  (scope) => {
    const nextPath = scope === "trash" ? memoPaths.trash : memoPaths.active;
    if (route.path === nextPath) {
      return;
    }

    void router.push(nextPath);
  }
);

onBeforeUnmount(() => {
  history.clear();
});
</script>

<template>
  <RouterView />
</template>
