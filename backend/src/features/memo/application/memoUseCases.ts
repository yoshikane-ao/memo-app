import { RequestValidationError } from '../../../shared/http/requestValidation';
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

  moveMemoToTrash(userId: number, id: number) {
    return memoRepository.moveToTrash(userId, id);
  },

  restoreMemo(userId: number, id: number) {
    return memoRepository.restore(userId, id);
  },

  purgeAllTrashMemos(userId: number) {
    return memoRepository.deleteManyTrashed(userId);
  },

  async purgeMemo(userId: number, id: number) {
    const existingMemo = await memoRepository.findById(userId, id);

    if (!existingMemo) {
      throw { code: 'P2025' };
    }

    if (existingMemo.deletedAt == null) {
      throw new RequestValidationError('Only trashed memos can be permanently deleted.');
    }

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
