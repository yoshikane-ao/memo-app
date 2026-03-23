import { computed, ref, type Ref } from 'vue';
import type { MemoListItem, MemoSearchType, MemoSortOrder } from '../Types';

export function useMemoSearch(memos: Ref<MemoListItem[]>) {
  const keyword = ref('');
  const searchType = ref<MemoSearchType>('all');
  const sortOrder = ref<MemoSortOrder>('custom');
  const selectedTags = ref<number[]>([]);

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
    keyword,
    searchType,
    sortOrder,
    selectedTags,
    displayedMemos,
    canSort
  };
}
