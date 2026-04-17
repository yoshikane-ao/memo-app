import { computed, reactive, ref, watch } from "vue";
import { getApiErrorMessage } from "../../../../../shared/api/apiError";
import {
  bulkUpdateQuizLabels,
  createQuiz,
  deleteQuiz,
  deleteQuizGroup,
  deleteQuizTag,
  fetchQuizGroups,
  fetchQuizList,
  fetchQuizTags,
  toggleFavorite,
  updateQuiz,
} from "../infrastructure/quiz.repository";
import type { BulkUpdateQuizLabelsInput, QuizItem, UpdateQuizInput } from "../model/quiz.types";
import { useQuizRegistrationDefaultsStore } from "../model/useQuizRegistrationDefaultsStore";

const LOAD_ERROR = "問題の読み込みに失敗しました。";
const CREATE_ERROR = "問題の登録に失敗しました。";
const CREATE_SUCCESS = "問題を登録しました。";
const UPDATE_ERROR = "問題の更新に失敗しました。";
const UPDATE_SUCCESS = "問題を更新しました。";
const DELETE_ERROR = "問題の削除に失敗しました。";
const DELETE_SUCCESS = "問題を削除しました。";
const TAG_DELETE_ERROR = "タグの削除に失敗しました。";
const TAG_DELETE_SUCCESS = "タグを削除しました。";
const GROUP_DELETE_ERROR = "グループの削除に失敗しました。";
const GROUP_DELETE_SUCCESS = "グループを削除しました。";

const BULK_UPDATE_ERROR = "Failed to bulk update quizzes.";
const BULK_UPDATE_SUCCESS = "Bulk update completed.";

export const useQuizPage = () => {
  const registrationDefaults = useQuizRegistrationDefaultsStore();
  const items = ref<QuizItem[]>([]);
  const availableTags = ref<string[]>([]);
  const availableGroups = ref<string[]>([]);

  const getDefaultTags = () =>
    registrationDefaults.keepTags ? [...registrationDefaults.fixedTags] : [];

  const getDefaultGroups = () =>
    registrationDefaults.keepGroups ? [...registrationDefaults.fixedGroups] : [];

  const draft = reactive({
    word: "",
    mean: "",
    selectedTags: getDefaultTags(),
    selectedGroup: getDefaultGroups(),
    isFavorite: false,
  });

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref("");
  const noticeMessage = ref("");
  let noticeTimer = 0;
  const showNotice = (msg: string) => {
    window.clearTimeout(noticeTimer);
    noticeMessage.value = msg;
    noticeTimer = window.setTimeout(() => {
      noticeMessage.value = "";
    }, 3000);
  };
  const editingItem = ref<QuizItem | null>(null);
  const selectedQuizIds = ref<number[]>([]);
  const isBulkEditOpen = ref(false);

  const resetDraft = () => {
    draft.word = "";
    draft.mean = "";
    draft.selectedTags = getDefaultTags();
    draft.selectedGroup = getDefaultGroups();
    draft.isFavorite = false;
  };

  watch(
    () => draft.selectedTags,
    (selectedTags) => {
      if (registrationDefaults.keepTags) {
        registrationDefaults.setFixedTags(selectedTags);
      }
    },
    { deep: true }
  );

  watch(
    () => draft.selectedGroup,
    (selectedGroups) => {
      if (registrationDefaults.keepGroups) {
        registrationDefaults.setFixedGroups(selectedGroups);
      }
    },
    { deep: true }
  );

  const loadTagsAndGroups = async () => {
    const [tags, groups] = await Promise.all([
      fetchQuizTags().catch(() => []),
      fetchQuizGroups().catch(() => []),
    ]);
    availableTags.value = tags.map((t) => t.tagName);
    availableGroups.value = groups;
  };

  const loadQuizzes = async () => {
    isLoading.value = true;
    errorMessage.value = "";

    try {
      items.value = await fetchQuizList();
      const itemIds = new Set(items.value.map((item) => item.id));
      selectedQuizIds.value = selectedQuizIds.value.filter((id) => itemIds.has(id));
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, LOAD_ERROR);
    } finally {
      isLoading.value = false;
    }
  };

  const addTag = (tagName: string) => {
    if (!availableTags.value.includes(tagName)) {
      availableTags.value = [...availableTags.value, tagName];
    }
    if (!draft.selectedTags.includes(tagName)) {
      draft.selectedTags = [...draft.selectedTags, tagName];
    }
  };

  const addGroup = (groupName: string) => {
    if (!availableGroups.value.includes(groupName)) {
      availableGroups.value = [...availableGroups.value, groupName];
    }
    if (!draft.selectedGroup.includes(groupName)) {
      draft.selectedGroup = [...draft.selectedGroup, groupName];
    }
  };

  const setSelectedTags = (selectedTags: string[]) => {
    draft.selectedTags = selectedTags;
  };

  const setSelectedGroup = (selectedGroups: string[]) => {
    draft.selectedGroup = selectedGroups;
  };

  const setKeepTags = (enabled: boolean) => {
    registrationDefaults.setKeepTags(enabled, draft.selectedTags);
  };

  const setKeepGroups = (enabled: boolean) => {
    registrationDefaults.setKeepGroups(enabled, draft.selectedGroup);
  };

  const loadQuizPageData = async () => {
    await Promise.all([loadQuizzes(), loadTagsAndGroups()]);
  };

  const submitQuiz = async () => {
    if (draft.word.trim() === "" || draft.mean.trim() === "" || isSubmitting.value) {
      return;
    }

    isSubmitting.value = true;
    errorMessage.value = "";
    noticeMessage.value = "";

    try {
      await createQuiz({
        word: draft.word.trim(),
        mean: draft.mean.trim(),
        tags: draft.selectedTags,
        groupName: draft.selectedGroup.join(","),
        isFavorite: draft.isFavorite,
      });
      resetDraft();
      showNotice(CREATE_SUCCESS);
      await loadQuizPageData();
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, CREATE_ERROR);
    } finally {
      isSubmitting.value = false;
    }
  };

  const openEdit = (item: QuizItem) => {
    editingItem.value = item;
  };

  const closeEdit = () => {
    editingItem.value = null;
  };

  const setSelectedQuizIds = (ids: number[]) => {
    selectedQuizIds.value = [...new Set(ids)];
  };

  const clearSelectedQuizIds = () => {
    selectedQuizIds.value = [];
  };

  const openBulkEdit = () => {
    if (selectedQuizIds.value.length === 0) {
      return;
    }

    isBulkEditOpen.value = true;
  };

  const closeBulkEdit = () => {
    isBulkEditOpen.value = false;
  };

  const submitUpdate = async (input: UpdateQuizInput) => {
    isSubmitting.value = true;
    errorMessage.value = "";
    noticeMessage.value = "";

    try {
      await updateQuiz(input);
      editingItem.value = null;
      showNotice(UPDATE_SUCCESS);
      await loadQuizPageData();
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, UPDATE_ERROR);
    } finally {
      isSubmitting.value = false;
    }
  };

  const submitBulkUpdate = async (input: BulkUpdateQuizLabelsInput) => {
    if (input.quizIds.length === 0) {
      return;
    }

    isSubmitting.value = true;
    errorMessage.value = "";
    noticeMessage.value = "";

    try {
      await bulkUpdateQuizLabels(input);
      isBulkEditOpen.value = false;
      selectedQuizIds.value = [];
      showNotice(BULK_UPDATE_SUCCESS);
      await loadQuizPageData();
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, BULK_UPDATE_ERROR);
    } finally {
      isSubmitting.value = false;
    }
  };

  const toggleQuizFavorite = async (item: QuizItem) => {
    try {
      const result = await toggleFavorite(item.id);
      const target = items.value.find((i) => i.id === result.id);
      if (target) {
        target.isFavorite = result.isFavorite;
      }
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "お気に入りの切り替えに失敗しました。");
    }
  };

  const removeTag = async (tagName: string) => {
    errorMessage.value = "";
    noticeMessage.value = "";

    try {
      await deleteQuizTag(tagName);
      draft.selectedTags = draft.selectedTags.filter((t) => t !== tagName);
      showNotice(TAG_DELETE_SUCCESS);
      await loadQuizPageData();
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, TAG_DELETE_ERROR);
    }
  };

  const removeGroup = async (groupName: string) => {
    errorMessage.value = "";
    noticeMessage.value = "";

    try {
      await deleteQuizGroup(groupName);
      draft.selectedGroup = draft.selectedGroup.filter((g) => g !== groupName);
      showNotice(GROUP_DELETE_SUCCESS);
      await loadQuizPageData();
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, GROUP_DELETE_ERROR);
    }
  };

  const removeQuiz = async (item: QuizItem) => {
    errorMessage.value = "";
    noticeMessage.value = "";

    try {
      await deleteQuiz(item.id);
      selectedQuizIds.value = selectedQuizIds.value.filter((id) => id !== item.id);
      showNotice(DELETE_SUCCESS);
      await loadQuizPageData();
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, DELETE_ERROR);
    }
  };

  const dispose = () => {
    window.clearTimeout(noticeTimer);
  };

  return {
    items,
    draft,
    availableTags,
    availableGroups,
    keepTags: computed(() => registrationDefaults.keepTags),
    keepGroups: computed(() => registrationDefaults.keepGroups),
    isLoading,
    isSubmitting,
    errorMessage,
    noticeMessage,
    editingItem,
    selectedQuizIds,
    isBulkEditOpen,
    isSubmitDisabled: computed(
      () => draft.word.trim() === "" || draft.mean.trim() === "" || isSubmitting.value
    ),
    loadQuizPageData,
    loadQuizzes,
    submitQuiz,
    setSelectedTags,
    setSelectedGroup,
    setKeepTags,
    setKeepGroups,
    addTag,
    addGroup,
    removeTag,
    removeGroup,
    openEdit,
    closeEdit,
    setSelectedQuizIds,
    clearSelectedQuizIds,
    openBulkEdit,
    closeBulkEdit,
    submitUpdate,
    submitBulkUpdate,
    removeQuiz,
    toggleQuizFavorite,
    dispose,
  };
};
