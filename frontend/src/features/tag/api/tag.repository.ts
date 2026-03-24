import { api } from "../../../shared/api/client";
import type { CreateTagInput, TagItem } from "../model/tag.types";

export async function fetchTagList(): Promise<TagItem[]> {
  const response = await api.get<{ items?: TagItem[] }>("/tags/list");
  return response.data.items ?? [];
}

export async function createTag(input: CreateTagInput): Promise<TagItem> {
  const response = await api.post<TagItem>("/tags", {
    memoId: input.memoId,
    title: input.title,
  });
  return response.data;
}

export async function deleteTag(tagId: number): Promise<void> {
  await api.delete(`/tags/system-delete/${tagId}`);
}

export async function linkTagToMemo(memoId: number, tagId: number): Promise<void> {
  await api.post("/tags/link", { memoId, tagId });
}

export async function unlinkTagFromMemo(memoId: number, tagId: number): Promise<void> {
  await api.delete(`/tags/unlink/${memoId}/${tagId}`);
}
