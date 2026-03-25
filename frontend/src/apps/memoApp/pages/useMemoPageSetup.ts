import { computed, watch } from "vue";
import { useMemoStore } from "../features/memo";
import type { MemoCollectionScope } from "../features/memo";
import { useMemoListView, type MemoListViewOptions } from "./useMemoListView";
import { useCopyShortcuts } from "../../../shared/copy/useCopyShortcuts";
import { useHistoryManager } from "../../../shared/history/useHistoryManager";
import { useHistoryShortcuts } from "../../../shared/history/useHistoryShortcuts";

type MemoPageSetupOptions = {
  scope?: MemoCollectionScope;
  listView?: MemoListViewOptions;
};

export const useMemoPageSetup = (options: MemoPageSetupOptions = {}) => {
  const memoStore = useMemoStore();
  const history = useHistoryManager();
  const scope = computed(() => options.scope ?? "active");
  const items = computed(() => memoStore.getItemsForScope(scope.value));

  useHistoryShortcuts();
  useCopyShortcuts();

  watch(
    scope,
    (nextScope) => {
      history.clear();
      void memoStore.fetchAll(nextScope);
    },
    { immediate: true }
  );

  return useMemoListView(items, options.listView);
};
