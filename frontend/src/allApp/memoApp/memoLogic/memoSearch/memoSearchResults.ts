import { computed, type Ref } from 'vue';
import type { MemoListItem } from '../types/memo-domain.types';
import type { MemoSearchType, MemoSortOrder } from './types';

interface MemoSearchResultDeps {
  memos: Ref<MemoListItem[]>;
  keyword: Ref<string>;
  searchType: Ref<MemoSearchType>;
  sortOrder: Ref<MemoSortOrder>;
  selectedTags: Ref<number[]>;
}

export function useMemoSearchResults({
  memos,
  keyword,
  searchType,
  sortOrder,
  selectedTags
}: MemoSearchResultDeps) {
  const displayedMemos = computed<MemoListItem[]>(() => {
    let result = [...memos.value];

    if (selectedTags.value.length > 0) {
      result = result.filter((memo) => {
        const memoTagIds = memo.memo_tags.map((memoTag) => memoTag.tag.id);
        return selectedTags.value.some((tagId) => memoTagIds.includes(tagId));
      });
    }

    if (keyword.value.trim()) {
      const query = keyword.value.trim().toLowerCase();
      result = result.filter((memo) => {
        const matchTitle = memo.title.toLowerCase().includes(query);
        const matchContent = memo.content.toLowerCase().includes(query);
        const matchTag = memo.memo_tags.some((memoTag) =>
          memoTag.tag.title.toLowerCase().includes(query)
        );

        if (searchType.value === 'title') {
          return matchTitle;
        }

        if (searchType.value === 'content') {
          return matchContent;
        }

        if (searchType.value === 'tag') {
          return matchTag;
        }

        return matchTitle || matchContent || matchTag;
      });
    }

    if (sortOrder.value === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder.value === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return result;
  });

  const canSort = computed(
    () => sortOrder.value === 'custom' && !keyword.value && selectedTags.value.length === 0
  );

  return {
    displayedMemos,
    canSort
  };
}
