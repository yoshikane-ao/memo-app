import { computed, type ComputedRef, type Ref } from 'vue';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';
import type { MemoListItem, MemoApiItem } from '../types/memo-domain.types';
import type { MemoSearchType, MemoSortOrder } from '../memoSearch/types';
import type { MemoTagsUpdatedPayload, TagDeletedPayload } from '../../tagLogic/Types';

interface MemoRepaintBindingsArgs {
  keyword: Ref<string>;
  searchType: Ref<MemoSearchType>;
  sortOrder: Ref<MemoSortOrder>;
  selectedTags: Ref<number[]>;
  displayedMemos: ComputedRef<MemoListItem[]>;
  canSort: ComputedRef<boolean>;
  handleMemoCreated: (item: MemoApiItem) => void;
  handleTagDeleted: (tagId: TagDeletedPayload) => void;
  handleItemsReplaced: (items: MemoListItem[]) => void;
  handleSortSaved: (items: MemoListItem[]) => void;
  handleMemoUpdated: (payload: MemoUpdatedPayload) => void;
  handleMemoDeleted: (memoId: MemoDeletedPayload) => void;
  handleMemoTagsUpdated: (payload: MemoTagsUpdatedPayload) => void;
}

export function useMemoRepaintBindings(args: MemoRepaintBindingsArgs) {
  const memoRegisterListeners = {
    'memo-created': args.handleMemoCreated,
    'tag-deleted': args.handleTagDeleted
  };

  const memoSearchProps = computed(() => ({
    keyword: args.keyword.value,
    searchType: args.searchType.value,
    sortOrder: args.sortOrder.value,
    selectedTags: args.selectedTags.value
  }));

  const memoSearchListeners = {
    'update:keyword': (value: string) => {
      args.keyword.value = value;
    },
    'update:searchType': (value: MemoSearchType) => {
      args.searchType.value = value;
    },
    'update:sortOrder': (value: MemoSortOrder) => {
      args.sortOrder.value = value;
    },
    'update:selectedTags': (value: number[]) => {
      args.selectedTags.value = value;
    },
    'tag-deleted': args.handleTagDeleted
  };

  const memoListProps = computed(() => ({
    items: args.displayedMemos.value,
    canSort: args.canSort.value
  }));

  const memoListListeners = {
    'update:items': args.handleItemsReplaced,
    'sort-saved': args.handleSortSaved,
    'memo-updated': args.handleMemoUpdated,
    'memo-deleted': args.handleMemoDeleted,
    'memo-tags-updated': args.handleMemoTagsUpdated,
    'tag-deleted': args.handleTagDeleted
  };

  return {
    memoRegisterListeners,
    memoSearchProps,
    memoSearchListeners,
    memoListProps,
    memoListListeners
  };
}
