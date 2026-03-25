import { deleteJson, getJson, postJson } from "../../../../../shared/api/client";
import type { CreateTagInput, RestoreTagInput, TagItem } from "../model/tag.types";

export async function fetchTagList(): Promise<TagItem[]> {
  const data = await getJson<{ items?: TagItem[] }>("/tags/list");
  return data.items ?? [];
}

export async function createTag(input: CreateTagInput): Promise<TagItem> {
  return postJson<TagItem, { memoId: number | undefined; title: string }>("/tags", {
    memoId: input.memoId,
    title: input.title,
  });
}

export async function restoreTag(input: RestoreTagInput): Promise<TagItem> {
  return postJson<TagItem, RestoreTagInput>("/tags/restore", input);
}

export async function deleteTag(tagId: number): Promise<void> {
  await deleteJson(`/tags/system-delete/${tagId}`);
}

export async function linkTagToMemo(memoId: number, tagId: number): Promise<void> {
  await postJson("/tags/link", { memoId, tagId });
}

export async function unlinkTagFromMemo(memoId: number, tagId: number): Promise<void> {
  await deleteJson(`/tags/unlink/${memoId}/${tagId}`);
}
