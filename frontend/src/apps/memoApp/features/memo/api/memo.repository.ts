import { deleteJson, getJson, postJson, putJson } from "../../../../../shared/api/client";
import { toApiRequestError } from "../../../../../shared/api/apiError";
import type {
  CreateMemoInput,
  Memo,
  MemoCollectionScope,
  MemoDto,
  ReorderMemoInput,
  UpdateMemoInput,
} from "../model/memo.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const TRASH_UNSUPPORTED_MESSAGE = "Trash requires the latest backend. Restart the API server.";

const getNumber = (value: unknown) => (typeof value === "number" ? value : null);
const getString = (value: unknown) => (typeof value === "string" ? value : null);

const isTagSummary = (
  value: unknown
): value is {
  id: number;
  title: string;
} => isRecord(value) && typeof value.id === "number" && typeof value.title === "string";

const isMemoTagRelation = (
  value: unknown
): value is MemoDto["memo_tags"][number] =>
  isRecord(value) &&
  typeof value.memo_id === "number" &&
  typeof value.tag_id === "number" &&
  isTagSummary(value.tag);

const isMemoDto = (value: unknown): value is MemoDto =>
  isRecord(value) &&
  typeof value.id === "number" &&
  typeof value.orderIndex === "number" &&
  (value.width === null || typeof value.width === "number") &&
  (value.height === null || typeof value.height === "number") &&
  typeof value.title === "string" &&
  typeof value.content === "string" &&
  (value.deletedAt === null || typeof value.deletedAt === "string") &&
  typeof value.createdAt === "string" &&
  typeof value.updatedAt === "string" &&
  Array.isArray(value.memo_tags) &&
  value.memo_tags.every(isMemoTagRelation);

const normalizeMemoDto = (value: unknown): MemoDto | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getNumber(value.id);
  const title = getString(value.title);
  const content = getString(value.content);
  const createdAt = getString(value.createdAt);
  const updatedAt = getString(value.updatedAt);

  if (id == null || title == null || content == null || createdAt == null || updatedAt == null) {
    return null;
  }

  const memoTags = value.memo_tags;
  if (memoTags !== undefined && (!Array.isArray(memoTags) || !memoTags.every(isMemoTagRelation))) {
    return null;
  }

  const deletedAt = value.deletedAt;
  if (deletedAt !== undefined && deletedAt !== null && typeof deletedAt !== "string") {
    return null;
  }

  return {
    id,
    orderIndex: getNumber(value.orderIndex) ?? 0,
    width: value.width === null || typeof value.width === "number" ? value.width : null,
    height: value.height === null || typeof value.height === "number" ? value.height : null,
    title,
    content,
    deletedAt: deletedAt ?? null,
    createdAt,
    updatedAt,
    memo_tags: memoTags ?? [],
  };
};

const parseMemoDto = (payload: unknown): MemoDto => {
  if (isMemoDto(payload)) {
    return payload;
  }

  const normalizedPayload = normalizeMemoDto(payload);
  if (normalizedPayload) {
    return normalizedPayload;
  }

  if (isRecord(payload)) {
    const memoPayload = normalizeMemoDto(payload.memo);
    if (memoPayload) {
      return memoPayload;
    }

    const itemPayload = normalizeMemoDto(payload.item);
    if (itemPayload) {
      return itemPayload;
    }
  }

  throw new Error("Invalid memo response.");
};

const hasDeletedAtField = (payload: unknown): boolean => {
  if (!isRecord(payload)) {
    return false;
  }

  if ("deletedAt" in payload) {
    return true;
  }

  return (
    (isRecord(payload.memo) && "deletedAt" in payload.memo) ||
    (isRecord(payload.item) && "deletedAt" in payload.item)
  );
};

const toTrashSupportError = (error: unknown) => {
  const apiError = toApiRequestError(error);

  if (apiError.status === 404 && apiError.message === "Request failed with status code 404") {
    return new Error(TRASH_UNSUPPORTED_MESSAGE);
  }

  return apiError;
};

const toMemo = (payload: unknown): Memo => {
  const memo = parseMemoDto(payload);

  return {
  ...memo,
  memo_tags: memo.memo_tags.map((memoTag) => ({
    ...memoTag,
    tag: {
      ...memoTag.tag,
    },
  })),
  };
};

export async function fetchMemoList(scope: MemoCollectionScope = "active"): Promise<Memo[]> {
  const data = await getJson<{ items: unknown[] }>(`/memos/list?scope=${scope}`);

  if (!Array.isArray(data.items)) {
    throw new Error("Invalid memo list response.");
  }

  if (scope === "trash" && data.items.some((item) => !hasDeletedAtField(item))) {
    throw new Error(TRASH_UNSUPPORTED_MESSAGE);
  }

  return data.items.map(toMemo);
}

export async function createMemo(input: CreateMemoInput): Promise<Memo> {
  return toMemo(await postJson<unknown, CreateMemoInput>("/memos/register", input));
}

export async function restoreMemo(id: number): Promise<Memo> {
  try {
    const response = await postJson<unknown>(`/memos/restore/${id}`);
    if (!hasDeletedAtField(response)) {
      throw new Error(TRASH_UNSUPPORTED_MESSAGE);
    }

    return toMemo(response);
  } catch (error) {
    throw toTrashSupportError(error);
  }
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
  const response = await deleteJson<unknown>(`/memos/delete/${id}`);
  if (!hasDeletedAtField(response)) {
    throw new Error(TRASH_UNSUPPORTED_MESSAGE);
  }

  return toMemo(response);
}

export async function purgeMemo(id: number): Promise<void> {
  try {
    await deleteJson(`/memos/purge/${id}`);
  } catch (error) {
    throw toTrashSupportError(error);
  }
}

export async function reorderMemos(items: ReorderMemoInput[]): Promise<void> {
  await putJson("/memos/sort", { items });
}
