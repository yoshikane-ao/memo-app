import { ref } from 'vue';
import axios from 'axios';
import type { TagItem } from '../Types';

export function useTagCatalog() {
  const allTags = ref<TagItem[]>([]);

  const fetchAllTags = async () => {
    try {
      const response = await axios.get('http://localhost:3000/tags/list');
      allTags.value = response.data.items ?? [];
      return true;
    } catch {
      return false;
    }
  };

  return { allTags, fetchAllTags };
}
