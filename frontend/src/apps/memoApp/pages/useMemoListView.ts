import { computed, ref, type Ref } from "vue";
import type { Memo } from "../features/memo";

export type MemoSearchType = "all" | "title" | "content" | "tag";
export type MemoSortOrder = "custom" | "newest" | "oldest";

export type MemoListViewOptions = {
  allowManualReorder?: boolean;
  defaultSortOrder?: MemoSortOrder;
  sortTimestamp?: "createdAt" | "deletedAt";
};

const matchesSelectedTags = (memo: Memo, selectedTagIds: ReadonlySet<number>) =>
  selectedTagIds.size === 0 || memo.memo_tags.some((memoTag) => selectedTagIds.has(memoTag.tag.id));

const matchesKeyword = (memo: Memo, query: string, searchType: MemoSearchType) => {
  if (query === "") {
    return true;
  }

  const matchTitle = memo.title.includes(query);
  const matchContent = memo.content.includes(query);
  const matchTag = memo.memo_tags.some((memoTag) => memoTag.tag.title.includes(query));

  switch (searchType) {
    case "title":
      return matchTitle;
    case "content":
      return matchContent;
    case "tag":
      return matchTag;
    default:
      return matchTitle || matchContent || matchTag;
  }
};

const getSortValue = (memo: Memo, field: "createdAt" | "deletedAt") =>
  Date.parse((field === "deletedAt" ? memo.deletedAt : memo.createdAt) ?? memo.updatedAt);

const sortByTimestampDescending =
  (field: "createdAt" | "deletedAt") => (left: Memo, right: Memo) =>
    getSortValue(right, field) - getSortValue(left, field);

const sortByTimestampAscending =
  (field: "createdAt" | "deletedAt") => (left: Memo, right: Memo) =>
    getSortValue(left, field) - getSortValue(right, field);

export function useMemoListView(items: Ref<Memo[]>, options: MemoListViewOptions = {}) {
  const allowManualReorder = options.allowManualReorder ?? true;
  const sortTimestamp = options.sortTimestamp ?? "createdAt";
  const keyword = ref("");
  const searchType = ref<MemoSearchType>("all");
  const sortOrder = ref<MemoSortOrder>(options.defaultSortOrder ?? "custom");
  const selectedTags = ref<number[]>([]);
  const normalizedKeyword = computed(() => keyword.value.trim());
  const selectedTagIdSet = computed(() => new Set(selectedTags.value));

  const displayedMemos = computed<Memo[]>(() => {
    const query = normalizedKeyword.value;
    const nextItems = items.value.filter(
      (memo) =>
        matchesSelectedTags(memo, selectedTagIdSet.value) &&
        matchesKeyword(memo, query, searchType.value)
    );

    if (sortOrder.value === "newest") {
      return [...nextItems].sort(sortByTimestampDescending(sortTimestamp));
    }

    if (sortOrder.value === "oldest") {
      return [...nextItems].sort(sortByTimestampAscending(sortTimestamp));
    }

    return nextItems;
  });

  const canReorder = computed(
    () =>
      allowManualReorder &&
      sortOrder.value === "custom" &&
      normalizedKeyword.value === "" &&
      selectedTagIdSet.value.size === 0
  );

  return {
    keyword,
    searchType,
    sortOrder,
    selectedTags,
    displayedMemos,
    canReorder,
  };
}
