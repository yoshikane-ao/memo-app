import { deleteJson, getJson, postJson, putJson } from "../../../../../shared/api/client";
import type {
  CreateMemoInput,
  Memo,
  MemoCollectionScope,
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

export async function fetchMemoList(scope: MemoCollectionScope = "active"): Promise<Memo[]> {
  const data = await getJson<{ items: MemoDto[] }>(`/memos/list?scope=${scope}`);
  return data.items.map(toMemo);
}

export async function createMemo(input: CreateMemoInput): Promise<Memo> {
  return toMemo(await postJson<MemoDto, CreateMemoInput>("/memos/register", input));
}

export async function restoreMemo(id: number): Promise<Memo> {
  return toMemo(await postJson<MemoDto>(`/memos/restore/${id}`));
}

export async function updateMemo(input: UpdateMemoInput): Promise<void> {
  await putJson("/memos/update", {
    id: input.id,
    title: input.title,
    content: input.content,
    width: input.width,
    height: input.height,
  });
}

export async function moveMemoToTrash(id: number): Promise<Memo> {
  return toMemo(await deleteJson<MemoDto>(`/memos/delete/${id}`));
}

export async function purgeMemo(id: number): Promise<void> {
  await deleteJson(`/memos/purge/${id}`);
}

export async function reorderMemos(items: ReorderMemoInput[]): Promise<void> {
  await putJson("/memos/sort", { items });
}
