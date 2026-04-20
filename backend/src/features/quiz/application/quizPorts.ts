export interface QuizTagRecord {
  id: number;
  tagName: string;
}

export interface QuizChoiceRecord {
  id: number;
  choiceText: string;
}

export interface QuizTagRelationRecord {
  quizTag: QuizTagRecord;
}

export interface QuizRecord {
  id: number;
  word: string;
  mean: string;
  questionText: string | null;
  hint: string | null;
  groupName: string | null;
  isFavorite: boolean;
  quizTagsRelations: QuizTagRelationRecord[];
  choices: QuizChoiceRecord[];
}

export interface QuizGroupNameRow {
  id: number;
  groupName: string | null;
}

export interface QuizFavoriteState {
  id: number;
  isFavorite: boolean;
}

export type BulkQuizLabelAction = 'add' | 'remove' | 'replace' | 'clear';

export interface BulkQuizLabelOperation {
  action: BulkQuizLabelAction;
  values?: string[];
}

export interface BulkUpdateQuizLabelsInput {
  userId: number;
  quizIds: number[];
  tags?: BulkQuizLabelOperation;
  groups?: BulkQuizLabelOperation;
}

export interface BulkUpdateQuizLabelsResult {
  updatedCount: number;
}

export type CreateQuizInput = {
  userId: number;
  word: string;
  mean: string;
  tag: string[];
  groupName?: string;
  questionText?: string;
  hint?: string;
  choices?: string[];
  isFavorite?: boolean;
};

export type UpdateQuizInput = CreateQuizInput & {
  id: number;
};

export interface QuizRepository {
  list(userId: number): Promise<QuizRecord[]>;
  create(input: CreateQuizInput): Promise<QuizRecord>;
  update(input: UpdateQuizInput): Promise<QuizRecord>;
  remove(userId: number, id: number): Promise<void>;
  listTags(userId: number): Promise<QuizTagRecord[]>;
  findTagByName(userId: number, tagName: string): Promise<QuizTagRecord | null>;
  deleteTagById(userId: number, tagId: number): Promise<void>;
  listGroupNameRows(userId: number): Promise<QuizGroupNameRow[]>;
  updateGroupName(userId: number, id: number, groupName: string | null): Promise<void>;
  bulkUpdateLabels(input: BulkUpdateQuizLabelsInput): Promise<BulkUpdateQuizLabelsResult>;
  findById(userId: number, id: number): Promise<QuizFavoriteState | null>;
  toggleFavorite(userId: number, id: number, isFavorite: boolean): Promise<QuizFavoriteState>;
}
