import { computed, ref } from 'vue';
import { useTagCatalog } from '../tagCatalog/tagCatalog';

export function useTagSearch() {
  const searchQuery = ref('');
  const { allTags, fetchAllTags } = useTagCatalog();

  const filteredTags = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();

    if (!query) {
      return allTags.value;
    }

    return allTags.value.filter((tag) => tag.title.toLowerCase().includes(query));
  });

  const hasExactMatch = computed(() => {
    return allTags.value.some((tag) => tag.title === searchQuery.value.trim());
  });

  return { searchQuery, filteredTags, hasExactMatch, fetchAllTags, allTags };
}
