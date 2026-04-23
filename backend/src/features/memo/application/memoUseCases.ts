import type {
  CreateMemoInput,
  MemoRepository,
  MemoScope,
  MemoSearchScope,
  MemoSearchType,
  ReorderMemoItem,
  UpdateMemoInput,
  UpdateMemoLayoutInput,
} from './memoPorts';
import {
  ensureActiveForTrash,
  ensureTrashedForPurge,
  ensureTrashedForRestore,
} from './policies/memoScopeTransition';

async function requireExistingMemo(memoRepository: MemoRepository, userId: number, id: number) {
  const memo = await memoRepository.findById(userId, id);
  if (!memo) {
    throw { code: 'P2025' };
  }
  return memo;
}

export const createMemoUseCases = ({ memoRepository }: { memoRepository: MemoRepository }) => ({
  listMemos(userId: number, scope: MemoScope) {
    return memoRepository.list(userId, scope);
  },

  searchMemos(userId: number, query: string, type: MemoSearchType, scope: MemoSearchScope) {
    return memoRepository.search(userId, query, type, scope);
  },

  createMemo(input: CreateMemoInput) {
    return memoRepository.create(input);
  },

  async updateMemo(input: UpdateMemoInput) {
    const updatedMemo = await memoRepository.update(input);
    await memoRepository.createHistory(input.userId, input.id, input.title, input.content);
    return updatedMemo;
  },

  async moveMemoToTrash(userId: number, id: number) {
    const existingMemo = await requireExistingMemo(memoRepository, userId, id);
    ensureActiveForTrash(existingMemo);
    return memoRepository.moveToTrash(userId, id);
  },

  async restoreMemo(userId: number, id: number) {
    const existingMemo = await requireExistingMemo(memoRepository, userId, id);
    ensureTrashedForRestore(existingMemo);
    return memoRepository.restore(userId, id);
  },

  purgeAllTrashMemos(userId: number) {
    return memoRepository.deleteManyTrashed(userId);
  },

  async purgeMemo(userId: number, id: number) {
    const existingMemo = await requireExistingMemo(memoRepository, userId, id);
    ensureTrashedForPurge(existingMemo);
    return memoRepository.purge(userId, id);
  },

  reorderMemos(userId: number, items: ReorderMemoItem[]) {
    return memoRepository.reorder(userId, items);
  },

  updateMemoLayout(input: UpdateMemoLayoutInput) {
    return memoRepository.updateLayout(input);
  },
});

export type MemoUseCases = ReturnType<typeof createMemoUseCases>;
