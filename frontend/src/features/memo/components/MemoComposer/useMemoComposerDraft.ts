import { computed, reactive, ref } from "vue";
import type { MemoComposerDraft } from "./types";

export function useMemoComposerDraft() {
  const draft = reactive<MemoComposerDraft>({
    title: "",
    content: "",
  });
  const selectedTagTitles = ref<string[]>([]);
  const tagSelectionResetKey = ref(0);

  const isSubmitDisabled = computed(
    () => draft.title.trim() === "" || draft.content.trim() === ""
  );

  const updateTitle = (value: string) => {
    draft.title = value;
  };

  const updateContent = (value: string) => {
    draft.content = value;
  };

  const setSelectedTagTitles = (value: string[]) => {
    selectedTagTitles.value = value;
  };

  const resetDraft = () => {
    draft.title = "";
    draft.content = "";
    selectedTagTitles.value = [];
    tagSelectionResetKey.value += 1;
  };

  return {
    draft,
    selectedTagTitles,
    tagSelectionResetKey,
    isSubmitDisabled,
    updateTitle,
    updateContent,
    setSelectedTagTitles,
    resetDraft,
  };
}
