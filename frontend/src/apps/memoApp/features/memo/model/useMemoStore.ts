import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { fetchMemoList } from "../api/memo.repository";
import { getApiErrorMessage } from "../../../../../shared/api/apiError";
import type { Memo, MemoCollectionScope, TagSummary } from "./memo.types";

const FETCH_ERROR = "Failed to fetch memos.";
type ManagedMemoScope = Exclude<MemoCollectionScope, "all">;

const cloneTagSummary = (tag: TagSummary): TagSummary => ({
  ...tag,
});

const cloneMemo = (memo: Memo): Memo => ({
  ...memo,
  memo_tags: memo.memo_tags.map((memoTag) => ({
    ...memoTag,
    tag: cloneTagSummary(memoTag.tag),
  })),
});

const sortMemos = (memos: Memo[], scope: MemoCollectionScope) =>
  [...memos].sort((left, right) => {
    if (scope === "trash") {
      return Date.parse(right.deletedAt ?? right.updatedAt) - Date.parse(left.deletedAt ?? left.updatedAt);
    }

    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex;
    }

    return right.id - left.id;
  });

const createScopeRecord = <T>(initialValue: T): Record<ManagedMemoScope, T> => ({
  active: initialValue,
  trash: initialValue,
});

const getManagedScope = (scope: MemoCollectionScope): ManagedMemoScope =>
  scope === "trash" ? "trash" : "active";

const getMemoScope = (memo: Memo): ManagedMemoScope => (memo.deletedAt == null ? "active" : "trash");

export const useMemoStore = defineStore("memo", () => {
  const items = ref<Memo[]>([]);
  const trashItems = ref<Memo[]>([]);
  const loadedScope = ref<ManagedMemoScope>("active");
  const loadedByScope = ref(createScopeRecord(false));
  const loadingByScope = ref(createScopeRecord(false));
  const errorByScope = ref(createScopeRecord<string | null>(null));
  const allItems = computed(() => [...items.value, ...trashItems.value]);
  const loading = computed(() => loadingByScope.value[loadedScope.value]);
  const error = computed(() => errorByScope.value[loadedScope.value]);

  const getCollectionRef = (scope: ManagedMemoScope) => (scope === "trash" ? trashItems : items);

  const getItemsForScope = (scope: MemoCollectionScope = "active") => {
    if (scope === "all") {
      return allItems.value;
    }

    return getCollectionRef(scope).value;
  };

  const setItems = (nextItems: Memo[], scope: ManagedMemoScope = loadedScope.value) => {
    loadedScope.value = scope;
    getCollectionRef(scope).value = sortMemos(nextItems.map(cloneMemo), scope);
    loadedByScope.value = {
      ...loadedByScope.value,
      [scope]: true,
    };
  };

  const setScopeState = (
    scope: ManagedMemoScope,
    nextState: {
      loading?: boolean;
      error?: string | null;
      loaded?: boolean;
    }
  ) => {
    if (nextState.loading !== undefined) {
      loadingByScope.value = {
        ...loadingByScope.value,
        [scope]: nextState.loading,
      };
    }

    if (nextState.error !== undefined) {
      errorByScope.value = {
        ...errorByScope.value,
        [scope]: nextState.error,
      };
    }

    if (nextState.loaded !== undefined) {
      loadedByScope.value = {
        ...loadedByScope.value,
        [scope]: nextState.loaded,
      };
    }

  };

  const upsertLocalMemo = (memo: Memo) => {
    const nextMemo = cloneMemo(memo);
    const targetScope = getMemoScope(nextMemo);
    const otherScope = targetScope === "active" ? "trash" : "active";
    const targetItems = getCollectionRef(targetScope).value;
    const existingIndex = targetItems.findIndex((currentMemo) => currentMemo.id === nextMemo.id);

    if (existingIndex === -1) {
      setItems([nextMemo, ...targetItems], targetScope);
    } else {
      const nextItems = [...targetItems];
      nextItems.splice(existingIndex, 1, nextMemo);
      setItems(nextItems, targetScope);
    }

    getCollectionRef(otherScope).value = getCollectionRef(otherScope).value.filter(
      (currentMemo) => currentMemo.id !== nextMemo.id
    );
  };

  const removeLocalMemo = (memoId: number) => {
    items.value = items.value.filter((memo) => memo.id !== memoId);
    trashItems.value = trashItems.value.filter((memo) => memo.id !== memoId);
  };

  const findMemoById = (memoId: number) =>
    items.value.find((memo) => memo.id === memoId) ??
    trashItems.value.find((memo) => memo.id === memoId);

  const updateMemoAcrossCollections = (mapper: (memo: Memo) => Memo) => {
    items.value = sortMemos(items.value.map((memo) => cloneMemo(mapper(memo))), "active");
    trashItems.value = sortMemos(trashItems.value.map((memo) => cloneMemo(mapper(memo))), "trash");
  };

  const removeDeletedTagReference = (tagId: number) => {
    updateMemoAcrossCollections((memo) => ({
      ...memo,
      memo_tags: memo.memo_tags.filter((memoTag) => memoTag.tag.id !== tagId),
    }));
  };

  const replaceMemoTags = (memoId: number, tags: TagSummary[]) => {
    updateMemoAcrossCollections((memo) =>
      memo.id === memoId
        ? {
            ...memo,
            memo_tags: tags.map((tag) => ({
              memo_id: memoId,
              tag_id: tag.id,
              tag,
            })),
          }
        : memo
    );
  };

  const addLocalTagToMemo = (memoId: number, tag: TagSummary) => {
    const targetMemo = findMemoById(memoId);
    if (!targetMemo || targetMemo.memo_tags.some((memoTag) => memoTag.tag.id === tag.id)) {
      return;
    }

    replaceMemoTags(memoId, [...targetMemo.memo_tags.map((memoTag) => cloneTagSummary(memoTag.tag)), tag]);
  };

  const fetchAll = async (scope: MemoCollectionScope = "active") => {
    if (scope === "all") {
      setScopeState("active", {
        loading: true,
        error: null,
      });
      setScopeState("trash", {
        loading: true,
        error: null,
      });

      try {
        const nextItems = await fetchMemoList("all");
        setItems(
          nextItems.filter((memo) => memo.deletedAt == null),
          "active"
        );
        setItems(
          nextItems.filter((memo) => memo.deletedAt != null),
          "trash"
        );
        return true;
      } catch (fetchError) {
        console.error(fetchError);
        const message = getApiErrorMessage(fetchError, FETCH_ERROR);
        setScopeState("active", {
          error: message,
        });
        setScopeState("trash", {
          error: message,
        });
        return false;
      } finally {
        setScopeState("active", {
          loading: false,
        });
        setScopeState("trash", {
          loading: false,
        });
      }
    }

    const targetScope = getManagedScope(scope);
    loadedScope.value = targetScope;
    setScopeState(targetScope, {
      loading: true,
      error: null,
    });

    try {
      setItems(await fetchMemoList(targetScope), targetScope);
      return true;
    } catch (fetchError) {
      console.error(fetchError);
      setScopeState(targetScope, {
        error: getApiErrorMessage(fetchError, FETCH_ERROR),
      });
      return false;
    } finally {
      setScopeState(targetScope, {
        loading: false,
      });
    }
  };

  const ensureLoaded = async (scope: MemoCollectionScope = "active") => {
    if (scope === "all") {
      if (
        (loadedByScope.value.active && loadedByScope.value.trash) ||
        loadingByScope.value.active ||
        allItems.value.length > 0
      ) {
        return true;
      }

      return fetchAll("all");
    }

    const targetScope = getManagedScope(scope);
    if (getCollectionRef(targetScope).value.length > 0 || loadedByScope.value[targetScope] || loadingByScope.value[targetScope]) {
      return true;
    }

    return fetchAll(targetScope);
  };

  return {
    items,
    trashItems,
    allItems,
    loading,
    error,
    loadedScope,
    loadedByScope,
    loadingByScope,
    errorByScope,
    fetchAll,
    ensureLoaded,
    setItems,
    getItemsForScope,
    findMemoById,
    upsertLocalMemo,
    removeLocalMemo,
    removeDeletedTagReference,
    replaceMemoTags,
    addLocalTagToMemo,
  };
});
