import { computed, reactive, ref } from "vue";
import type { TagItem } from "../../../tag";
import type { MemoComposerDraft } from "./types";

export function useMemoComposerDraft() {
  const draft = reactive<MemoComposerDraft>({
    title: "",
    content: "",
  });
  const selectedTags = ref<TagItem[]>([]);
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

  const setSelectedTags = (value: TagItem[]) => {
    selectedTags.value = value;
  };

  const resetDraft = () => {
    draft.title = "";
    draft.content = "";
    selectedTags.value = [];
    tagSelectionResetKey.value += 1;
  };

  return {
    draft,
    selectedTags,
    tagSelectionResetKey,
    isSubmitDisabled,
    updateTitle,
    updateContent,
    setSelectedTags,
    resetDraft,
  };
}
