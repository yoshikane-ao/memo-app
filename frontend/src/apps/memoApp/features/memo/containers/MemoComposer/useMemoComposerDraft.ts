import { computed, reactive, ref } from "vue";
import type { TagItem } from "../../../tag";
import type { MemoComposerDraft } from "../../ui/MemoComposer/types";

type MemoComposerDraftOptions = {
  initialSelectedTags?: TagItem[];
};

const cloneTag = (tag: TagItem): TagItem => ({
  ...tag,
});

export function useMemoComposerDraft(options: MemoComposerDraftOptions = {}) {
  const draft = reactive<MemoComposerDraft>({
    title: "",
    content: "",
  });
  const selectedTags = ref<TagItem[]>(
    (options.initialSelectedTags ?? []).map(cloneTag)
  );
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
    selectedTags.value = value.map(cloneTag);
  };

  const resetDraft = (nextSelectedTags: TagItem[] = []) => {
    draft.title = "";
    draft.content = "";
    selectedTags.value = nextSelectedTags.map(cloneTag);
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
