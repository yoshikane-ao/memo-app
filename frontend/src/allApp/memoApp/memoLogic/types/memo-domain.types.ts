import type { TagItem } from '../../tagLogic/Types';

export type MemoTextField = 'title' | 'content';

export interface MemoIdProps {
  memoId: number;
}

export interface MemoTagRelation {
  memo_id: number;
  tag_id: number;
  tag: TagItem;
}

export interface MemoApiItem {
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

export interface MemoListItem extends MemoApiItem {
  initialTitle: string;
  initialContent: string;
}
