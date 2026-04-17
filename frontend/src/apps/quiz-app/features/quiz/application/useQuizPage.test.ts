import { beforeEach, describe, expect, it, vi } from "vitest";
import { activateTestPinia } from "../../../../../test/pinia";
import { useQuizPage } from "./useQuizPage";
import type { QuizItem } from "../model/quiz.types";
import {
  bulkUpdateQuizLabels,
  createQuiz,
  deleteQuiz,
  deleteQuizGroup,
  deleteQuizTag,
  fetchQuizGroups,
  fetchQuizList,
  fetchQuizTags,
  toggleFavorite,
  updateQuiz,
} from "../infrastructure/quiz.repository";

vi.mock("../infrastructure/quiz.repository", () => ({
  bulkUpdateQuizLabels: vi.fn(),
  createQuiz: vi.fn(),
  deleteQuiz: vi.fn(),
  deleteQuizGroup: vi.fn(),
  deleteQuizTag: vi.fn(),
  fetchQuizGroups: vi.fn(),
  fetchQuizList: vi.fn(),
  fetchQuizTags: vi.fn(),
  toggleFavorite: vi.fn(),
  updateQuiz: vi.fn(),
}));

const makeQuiz = (overrides: Partial<QuizItem> = {}): QuizItem => ({
  id: 1,
  word: "apple",
  mean: "fruit",
  questionText: null,
  hint: null,
  groupName: "daily",
  isFavorite: false,
  quizTagsRelations: [
    {
      quizTag: {
        id: 1,
        tagName: "work",
      },
    },
  ],
  choices: [],
  ...overrides,
});

describe("useQuizPage", () => {
  beforeEach(() => {
    activateTestPinia();
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(fetchQuizList).mockResolvedValue([]);
    vi.mocked(fetchQuizTags).mockResolvedValue([]);
    vi.mocked(fetchQuizGroups).mockResolvedValue([]);
    vi.mocked(bulkUpdateQuizLabels).mockResolvedValue({ updatedCount: 2 });
    vi.mocked(createQuiz).mockResolvedValue(makeQuiz());
    vi.mocked(updateQuiz).mockResolvedValue(makeQuiz());
    vi.mocked(deleteQuiz).mockResolvedValue();
    vi.mocked(deleteQuizTag).mockResolvedValue();
    vi.mocked(deleteQuizGroup).mockResolvedValue();
    vi.mocked(toggleFavorite).mockResolvedValue({ id: 1, isFavorite: true });
  });

  it("initializes the draft with persisted fixed selections", () => {
    window.localStorage.setItem(
      "quiz-registration-defaults-v1",
      JSON.stringify({
        keepTags: true,
        keepGroups: true,
        fixedTags: ["work"],
        fixedGroups: ["daily"],
      })
    );

    const page = useQuizPage();

    expect(page.keepTags.value).toBe(true);
    expect(page.keepGroups.value).toBe(true);
    expect(page.draft.selectedTags).toEqual(["work"]);
    expect(page.draft.selectedGroup).toEqual(["daily"]);
  });

  it("clears tag and group selections after submit when keep mode is off", async () => {
    const page = useQuizPage();
    page.draft.word = "apple";
    page.draft.mean = "fruit";
    page.setSelectedTags(["work"]);
    page.setSelectedGroup(["daily"]);

    await page.submitQuiz();

    expect(createQuiz).toHaveBeenCalledWith({
      word: "apple",
      mean: "fruit",
      tags: ["work"],
      groupName: "daily",
      isFavorite: false,
    });
    expect(page.draft.word).toBe("");
    expect(page.draft.mean).toBe("");
    expect(page.draft.selectedTags).toEqual([]);
    expect(page.draft.selectedGroup).toEqual([]);
  });

  it("restores fixed tag and group selections after submit when keep mode is on", async () => {
    const page = useQuizPage();
    page.setSelectedTags(["work"]);
    page.setSelectedGroup(["daily"]);
    page.setKeepTags(true);
    page.setKeepGroups(true);
    page.draft.word = "apple";
    page.draft.mean = "fruit";

    await page.submitQuiz();

    expect(page.draft.word).toBe("");
    expect(page.draft.mean).toBe("");
    expect(page.draft.selectedTags).toEqual(["work"]);
    expect(page.draft.selectedGroup).toEqual(["daily"]);
    expect(JSON.parse(window.localStorage.getItem("quiz-registration-defaults-v1") ?? "null")).toEqual({
      keepTags: true,
      keepGroups: true,
      fixedTags: ["work"],
      fixedGroups: ["daily"],
    });
  });

  it("submits a bulk label update for the selected quizzes and clears the selection", async () => {
    const page = useQuizPage();
    page.setSelectedQuizIds([1, 2]);

    await page.submitBulkUpdate({
      quizIds: [1, 2],
      tags: { action: "add", values: ["grammar"] },
      groups: { action: "replace", values: ["review"] },
    });

    expect(bulkUpdateQuizLabels).toHaveBeenCalledWith({
      quizIds: [1, 2],
      tags: { action: "add", values: ["grammar"] },
      groups: { action: "replace", values: ["review"] },
    });
    expect(page.selectedQuizIds.value).toEqual([]);
    expect(page.isBulkEditOpen.value).toBe(false);
  });
});
