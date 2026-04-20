export interface TagRecord {
  id: number;
  title: string;
}

export type RestoreTagInput = {
  userId: number;
  id: number;
  title: string;
  linkedMemoIds: number[];
};

export interface TagRepository {
  list(userId: number): Promise<TagRecord[]>;
  linkToMemo(userId: number, memoId: number, tagId: number): Promise<void>;
  findByTitle(userId: number, title: string): Promise<TagRecord | null>;
  create(userId: number, title: string): Promise<TagRecord>;
  unlinkFromMemo(userId: number, memoId: number, tagId: number): Promise<void>;
  deleteSystem(userId: number, tagId: number): Promise<void>;
  restore(input: RestoreTagInput): Promise<TagRecord>;
}
