import type { MemoListItem, MemoTextField } from '../Types';

export function useMemoListState() {
  const updateMemoField = (memo: MemoListItem, field: MemoTextField, event: Event) => {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      memo[field] = target.value;
    }
  };

  return {
    updateMemoField
  };
}
