import type { TagDeletedPayload } from '../../tagLogic/Types';
import { MemoRegister } from './memoRegister';
import type { MemoRegisterEmits } from './types';
import { useMemoRegisterDraft } from './useMemoRegisterDraft';

export function useMemoRegisterController(emit: MemoRegisterEmits) {
  const { executeRegister } = MemoRegister();
  const {
    newMemo,
    selectedTagTitles,
    tagSelectionResetKey,
    isRegisterDisabled,
    updateTitle,
    updateContent,
    setSelectedTagTitles,
    resetRegisterDraft
  } = useMemoRegisterDraft();

  const handleTagDeleted = (tagId: TagDeletedPayload) => {
    emit('tag-deleted', tagId);
  };

  const handleSave = async () => {
    if (isRegisterDisabled.value) {
      return;
    }

    const createdMemo = await executeRegister({
      title: newMemo.title,
      content: newMemo.content,
      tags: selectedTagTitles.value
    });

    if (createdMemo) {
      emit('memo-created', createdMemo);
      resetRegisterDraft();
      return;
    }

    alert('メモの登録に失敗しました。');
  };

  return {
    newMemo,
    tagSelectionResetKey,
    isRegisterDisabled,
    updateTitle,
    updateContent,
    setSelectedTagTitles,
    handleTagDeleted,
    handleSave
  };
}
