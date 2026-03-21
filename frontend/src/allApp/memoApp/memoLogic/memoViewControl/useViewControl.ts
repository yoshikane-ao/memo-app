import { ref, computed, type Ref } from 'vue';

export function useViewControl(memos: Ref<any[]>) {
  const keyword = ref('');
  const sortOrder = ref('custom'); // 'newest', 'oldest', 'custom'
  const selectedTags = ref<number[]>([]);

  const displayedMemos = computed(() => {
    let result = [...memos.value];

    // 1. Tag Filtering (メモが選択されたタグを "いずれか" 含んでいたら表示: OR条件)
    if (selectedTags.value.length > 0) {
      result = result.filter(memo => {
        const memoTagIds = memo.memo_tags?.map((mt: any) => mt.tag.id) || [];
        return selectedTags.value.some(tagId => memoTagIds.includes(tagId));
      });
    }

    // 2. Keyword Filtering
    if (keyword.value.trim()) {
      const q = keyword.value.trim().toLowerCase();
      result = result.filter(memo => {
        const matchTitle = memo.title.toLowerCase().includes(q);
        const matchContent = memo.content.toLowerCase().includes(q);
        const matchTag = memo.memo_tags?.some((mt: any) => mt.tag.title.toLowerCase().includes(q));
        return matchTitle || matchContent || matchTag;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortOrder.value === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder.value === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        // 'custom' order
        return a.orderIndex - b.orderIndex || b.id - a.id;
      }
    });

    return result;
  });

  return {
    keyword,
    sortOrder,
    selectedTags,
    displayedMemos
  };
}
