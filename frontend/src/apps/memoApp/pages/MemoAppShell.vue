<script setup lang="ts">
import { RouterView, useRoute, useRouter } from "vue-router";
import { onBeforeUnmount, watch } from "vue";
import { useCopyShortcuts } from "../../../shared/copy/useCopyShortcuts";
import { useHistoryManager } from "../../../shared/history/useHistoryManager";
import { useHistoryShortcuts } from "../../../shared/history/useHistoryShortcuts";
import { memoPaths } from "../routes";
import { useMemoViewStore } from "../features/view/model/useMemoViewStore";

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

const changeScope = async (scope: "active" | "trash") => {
  viewStore.setScope(scope);
  await router.push(scope === "trash" ? memoPaths.trash : memoPaths.active);
};

onBeforeUnmount(() => {
  history.clear();
});
</script>

<template>
  <RouterView />
</template>
