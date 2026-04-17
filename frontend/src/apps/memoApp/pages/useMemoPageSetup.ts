import { computed, watch } from "vue";
import { useMemoStore } from "../features/memo";
import type { MemoCollectionScope } from "../features/memo";
import { useTagStore } from "../features/tag";
import { useMemoListView, type MemoListViewOptions } from "./useMemoListView";

type MemoPageSetupOptions = {
  scope?: MemoCollectionScope;
  listView?: MemoListViewOptions;
};

export const useMemoPageSetup = (options: MemoPageSetupOptions = {}) => {
  const memoStore = useMemoStore();
  const tagStore = useTagStore();
  const scope = computed(() => options.scope ?? "active");
  const items = computed(() => memoStore.getItemsForScope(scope.value));

  watch(
    scope,
    (nextScope) => {
      void memoStore.fetchAll(nextScope);
      void tagStore.ensureLoaded();
    },
    { immediate: true }
  );

  return useMemoListView(items, options.listView);
};
