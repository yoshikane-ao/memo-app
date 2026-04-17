export type QuizTag = {
  id: number;
  tagName: string;
};

export type QuizTagRelation = {
  quizTag: QuizTag;
};

export type QuizChoice = {
  id: number;
  choiceText: string;
};

export type QuizItem = {
  id: number;
  word: string;
  mean: string;
  questionText: string | null;
  hint: string | null;
  groupName: string | null;
  isFavorite: boolean;
  quizTagsRelations: QuizTagRelation[];
  choices: QuizChoice[];
};

export type CreateQuizInput = {
  word: string;
  mean: string;
  tags: string[];
  groupName: string;
  isFavorite: boolean;
};

export type UpdateQuizInput = {
  id: number;
  word: string;
  mean: string;
  tags: string[];
  groupName: string;
  questionText: string;
  hint: string;
  choices: string[];
  isFavorite: boolean;
};

export type BulkQuizLabelAction = "add" | "remove" | "replace" | "clear";

export type BulkQuizLabelOperation = {
  action: BulkQuizLabelAction;
  values?: string[];
};

export type BulkUpdateQuizLabelsInput = {
  quizIds: number[];
  tags?: BulkQuizLabelOperation;
  groups?: BulkQuizLabelOperation;
};

export type BulkUpdateQuizLabelsResult = {
  updatedCount: number;
};

// ── Quiz Settings (Start Screen) ──

export type QuizScope = "all" | "tag" | "group" | "favorite";

export type QuizDirection = "word-to-meaning" | "meaning-to-word" | "random";

// 選択式
export type SelectionFormat =
  | "four-choice"        // 4択
  | "true-false"         // ○×
  | "multiple-correct"   // 複数正解クイズ
  | "best-answer"        // ベストアンサー選択
  | "matching";          // ペアリング（マッチング）

// 記述・生成型
export type WrittenFormat =
  | "fill-in-blank"      // 穴埋め
  | "progressive-fill"   // プログレッシブ穴埋め（虫食い）
  | "write-answer"       // 正解を作るクイズ
  | "error-correction";  // 誤謬訂正問題

export type QuestionFormat = SelectionFormat | WrittenFormat;

export type QuestionFormatCategory = "selection" | "written";

export type QuestionFormatOption = {
  value: QuestionFormat;
  label: string;
  description: string;
  category: QuestionFormatCategory;
};

export const QUESTION_FORMAT_OPTIONS: QuestionFormatOption[] = [
  // 選択式
  { value: "four-choice",      label: "4択",             description: "4つの選択肢から1つを選ぶ",                     category: "selection" },
  { value: "true-false",       label: "○×",              description: "正しいか間違いかを2択で答える",                 category: "selection" },
  { value: "multiple-correct", label: "複数正解",         description: "正しいものをすべて選ぶ",                       category: "selection" },
  { value: "best-answer",      label: "ベストアンサー",   description: "最も適切な答えを選ぶ",                         category: "selection" },
  { value: "matching",         label: "ペアリング",       description: "項目同士を正しい組み合わせで結びつける",         category: "selection" },
  // 記述・生成型
  { value: "fill-in-blank",    label: "穴埋め",           description: "空欄に入る内容を答える",                       category: "written" },
  { value: "progressive-fill", label: "虫食い",           description: "段階的に隠す箇所を増やす穴埋め",               category: "written" },
  { value: "write-answer",     label: "正解を作る",       description: "自分の言葉で正しい答えを入力する",              category: "written" },
  { value: "error-correction", label: "誤謬訂正",         description: "間違いを含む文章から誤りを見つけて正す",        category: "written" },
];

export const FORMAT_CATEGORY_LABELS: Record<QuestionFormatCategory, string> = {
  selection: "選択式",
  written: "記述・生成型",
};

export type AnswerMethod = "tap" | "swipe" | "text-input";

export const ANSWER_METHODS_BY_FORMAT: Record<QuestionFormat, AnswerMethod[]> = {
  // 選択式
  "four-choice":      ["tap"],
  "true-false":       ["tap", "swipe"],
  "multiple-correct": ["tap"],
  "best-answer":      ["tap"],
  "matching":         ["tap"],
  // 記述・生成型
  "fill-in-blank":    ["text-input"],
  "progressive-fill": ["text-input"],
  "write-answer":     ["text-input"],
  "error-correction": ["text-input"],
};

export type QuizSettings = {
  scope: QuizScope;
  selectedTags: string[];
  selectedGroups: string[];
  direction: QuizDirection;
  questionFormat: QuestionFormat;
  answerMethod: AnswerMethod;
  questionCount: number | "all";
  showHint: boolean;
  flashMode: boolean;
  reverseMode: boolean;
  randomOrder: boolean;
  withReason: boolean;
};

// ── Batch format data structures ──

export type MultipleCorrectPair = {
  prompt: string;
  answer: string;
  isCorrect: boolean;
};

export type MatchingPair = {
  id: string;
  promptText: string;
  answerText: string;
};

export const QUESTION_COUNT_OPTIONS = [5, 10, 20, "all"] as const;

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  scope: "all",
  selectedTags: [],
  selectedGroups: [],
  direction: "word-to-meaning",
  questionFormat: "four-choice",
  answerMethod: "tap",
  questionCount: 10,
  showHint: false,
  flashMode: false,
  reverseMode: false,
  randomOrder: true,
  withReason: false,
};
