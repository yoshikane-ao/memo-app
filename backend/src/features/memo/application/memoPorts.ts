import type { TagRecord } from './tagPorts';

export const memoScopes = ['active', 'trash', 'all'] as const;
export type MemoScope = (typeof memoScopes)[number];

export const memoSearchTypes = ['all', 'title', 'content', 'tag'] as const;
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
  userId: number;
  title: string;
  content: string;
  tags?: string[];
};

export type UpdateMemoInput = {
  userId: number;
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
  userId: number;
  memoId: number;
  width?: number;
  height?: number;
};

export interface MemoRepository {
  list(userId: number, scope: MemoScope): Promise<MemoWithTags[]>;
  search(
    userId: number,
    query: string,
    type: MemoSearchType,
    scope: MemoSearchScope,
  ): Promise<MemoWithTags[]>;
  create(input: CreateMemoInput): Promise<MemoWithTags>;
  update(input: UpdateMemoInput): Promise<MemoRecord>;
  createHistory(userId: number, id: number, title: string, content: string): Promise<void>;
  moveToTrash(userId: number, id: number): Promise<MemoWithTags>;
  restore(userId: number, id: number): Promise<MemoWithTags>;
  deleteManyTrashed(userId: number): Promise<number>;
  findById(userId: number, id: number): Promise<MemoDeletionState | null>;
  purge(userId: number, id: number): Promise<MemoWithTags>;
  reorder(userId: number, items: ReorderMemoItem[]): Promise<void>;
  updateLayout(input: UpdateMemoLayoutInput): Promise<MemoRecord>;
}
