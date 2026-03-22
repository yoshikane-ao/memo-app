import { ref, computed, type Ref } from 'vue';

export function memoViewControl(memos: Ref<any[]>) {
  const keyword = ref('');
  const searchType = ref('all'); // 'all', 'title', 'content', 'tag'
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

        if (searchType.value === 'title') {
          return matchTitle;
        } else if (searchType.value === 'content') {
          return matchContent;
        } else if (searchType.value === 'tag') {
          return matchTag;
        } else {
          return matchTitle || matchContent || matchTag; // 'all'
        }
      });
    }

    // 3. Sorting
    if (sortOrder.value === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder.value === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    // 'custom' order は memos の元の順序（フロントでドラッグ＆ドロップした順序）に従うため、並べ替え処理を行いません。

    return result;
  });

  return {
    keyword,
    searchType,
    sortOrder,
    selectedTags,
    displayedMemos
  };
}
