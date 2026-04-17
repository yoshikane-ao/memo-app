import { RequestValidationError } from "../../../shared/http/requestValidation";
import type {
  CreateMemoInput,
  MemoRepository,
  MemoScope,
  MemoSearchScope,
  MemoSearchType,
  ReorderMemoItem,
  UpdateMemoInput,
  UpdateMemoLayoutInput,
} from "./memoPorts";

export const createMemoUseCases = ({
  memoRepository,
}: {
  memoRepository: MemoRepository;
}) => ({
  listMemos(scope: MemoScope) {
    return memoRepository.list(scope);
  },

  searchMemos(query: string, type: MemoSearchType, scope: MemoSearchScope) {
    return memoRepository.search(query, type, scope);
  },

  createMemo(input: CreateMemoInput) {
    return memoRepository.create(input);
  },

  async updateMemo(input: UpdateMemoInput) {
    const updatedMemo = await memoRepository.update(input);
    await memoRepository.createHistory(input.id, input.title, input.content);
    return updatedMemo;
  },

  moveMemoToTrash(id: number) {
    return memoRepository.moveToTrash(id);
  },

  restoreMemo(id: number) {
    return memoRepository.restore(id);
  },

  purgeAllTrashMemos() {
    return memoRepository.deleteManyTrashed();
  },

  async purgeMemo(id: number) {
    const existingMemo = await memoRepository.findById(id);

    if (!existingMemo) {
      throw { code: "P2025" };
    }

    if (existingMemo.deletedAt == null) {
      throw new RequestValidationError("Only trashed memos can be permanently deleted.");
    }

    return memoRepository.purge(id);
  },

  reorderMemos(items: ReorderMemoItem[]) {
    return memoRepository.reorder(items);
  },

  updateMemoLayout(input: UpdateMemoLayoutInput) {
    return memoRepository.updateLayout(input);
  },
});

export type MemoUseCases = ReturnType<typeof createMemoUseCases>;
