import { api } from "../../../shared/api/client";
import type {
  CreateMemoInput,
  Memo,
  MemoDto,
  ReorderMemoInput,
  UpdateMemoInput,
} from "../model/memo.types";

const toMemo = (memo: MemoDto): Memo => ({
  ...memo,
  memo_tags: memo.memo_tags.map((memoTag) => ({
    ...memoTag,
    tag: {
      ...memoTag.tag,
    },
  })),
});

export async function fetchMemoList(): Promise<Memo[]> {
  const response = await api.get<{ items: MemoDto[] }>("/memos/list");
  return response.data.items.map(toMemo);
}

export async function createMemo(input: CreateMemoInput): Promise<Memo> {
  const response = await api.post<MemoDto>("/memos/register", input);
  return toMemo(response.data);
}

export async function updateMemo(input: UpdateMemoInput): Promise<void> {
  await api.put("/memos/update", {
    id: input.id,
    title: input.title,
    content: input.content,
    width: input.width,
    height: input.height,
  });
}

export async function deleteMemo(id: number): Promise<void> {
  await api.delete(`/memos/delete/${id}`);
}

export async function reorderMemos(items: ReorderMemoInput[]): Promise<void> {
  await api.put("/memos/sort", { items });
}
