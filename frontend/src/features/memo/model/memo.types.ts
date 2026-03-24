export interface TagSummary {
  id: number;
  title: string;
}

export interface MemoTagRelation {
  memo_id: number;
  tag_id: number;
  tag: TagSummary;
}

export interface MemoDto {
  id: number;
  orderIndex: number;
  width: number | null;
  height: number | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  memo_tags: MemoTagRelation[];
}

export interface Memo {
  id: number;
  orderIndex: number;
  width: number | null;
  height: number | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  memo_tags: MemoTagRelation[];
}

export interface CreateMemoInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateMemoInput {
  id: number;
  title: string;
  content: string;
  width?: number;
  height?: number;
}

export interface ReorderMemoInput {
  id: number;
  orderIndex: number;
}
