export interface TagRecord {
  id: number;
  title: string;
}

export type RestoreTagInput = {
  id: number;
  title: string;
  linkedMemoIds: number[];
};

export interface TagRepository {
  list(): Promise<TagRecord[]>;
  linkToMemo(memoId: number, tagId: number): Promise<void>;
  findByTitle(title: string): Promise<TagRecord | null>;
  create(title: string): Promise<TagRecord>;
  unlinkFromMemo(memoId: number, tagId: number): Promise<void>;
  deleteSystem(tagId: number): Promise<void>;
  restore(input: RestoreTagInput): Promise<TagRecord>;
}
