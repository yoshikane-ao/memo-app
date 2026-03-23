import { computed, reactive, ref } from 'vue';
import type { MemoDraft } from './types';

export function useMemoRegisterDraft() {
  const newMemo = reactive<MemoDraft>({
    title: '',
    content: ''
  });
  const selectedTagTitles = ref<string[]>([]);
  const tagSelectionResetKey = ref(0);

  const isRegisterDisabled = computed(() => {
    return newMemo.title.trim() === '' || newMemo.content.trim() === '';
  });

  const updateTitle = (title: string) => {
    newMemo.title = title;
  };

  const updateContent = (content: string) => {
    newMemo.content = content;
  };

  const setSelectedTagTitles = (titles: string[]) => {
    selectedTagTitles.value = titles;
  };

  const resetRegisterDraft = () => {
    newMemo.title = '';
    newMemo.content = '';
    selectedTagTitles.value = [];
    tagSelectionResetKey.value += 1;
  };

  return {
    newMemo,
    selectedTagTitles,
    tagSelectionResetKey,
    isRegisterDisabled,
    updateTitle,
    updateContent,
    setSelectedTagTitles,
    resetRegisterDraft
  };
}
