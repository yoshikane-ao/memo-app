import type { TagRecord } from "./tagPorts";

export const memoScopes = ["active", "trash", "all"] as const;
export type MemoScope = (typeof memoScopes)[number];

export const memoSearchTypes = ["all", "title", "content", "tag"] as const;
export type MemoSearchType = (typeof memoSearchTypes)[number];

export const memoSearchScopes = memoScopes;
export type MemoSearchScope = MemoScope;

export interface MemoRecord {
  id: number;
  orderIndex: number;
  width: number | null;
  height: number | null;
  title: string;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoTagRelationRecord {
  memo_id: number;
  tag_id: number;
  tag: TagRecord;
}

export interface MemoWithTags extends MemoRecord {
  memo_tags: MemoTagRelationRecord[];
}

export interface MemoDeletionState {
  id: number;
  deletedAt: Date | null;
}

export type CreateMemoInput = {
  title: string;
  content: string;
  tags?: string[];
};

export type UpdateMemoInput = {
  id: number;
  title: string;
  content: string;
  width?: number;
  height?: number;
};

export type ReorderMemoItem = {
  id: number;
  orderIndex: number;
};

export type UpdateMemoLayoutInput = {
  memoId: number;
  width?: number;
  height?: number;
};

export interface MemoRepository {
  list(scope: MemoScope): Promise<MemoWithTags[]>;
  search(query: string, type: MemoSearchType, scope: MemoSearchScope): Promise<MemoWithTags[]>;
  create(input: CreateMemoInput): Promise<MemoWithTags>;
  update(input: UpdateMemoInput): Promise<MemoRecord>;
  createHistory(id: number, title: string, content: string): Promise<void>;
  moveToTrash(id: number): Promise<MemoWithTags>;
  restore(id: number): Promise<MemoWithTags>;
  deleteManyTrashed(): Promise<number>;
  findById(id: number): Promise<MemoDeletionState | null>;
  purge(id: number): Promise<MemoWithTags>;
  reorder(items: ReorderMemoItem[]): Promise<void>;
  updateLayout(input: UpdateMemoLayoutInput): Promise<MemoRecord>;
}
