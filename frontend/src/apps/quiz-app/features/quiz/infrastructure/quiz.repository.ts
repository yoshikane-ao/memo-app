import { deleteJson, getJson, patchJson, postJson, putJson } from "../../../../../shared/api/client";
import type {
  BulkUpdateQuizLabelsInput,
  BulkUpdateQuizLabelsResult,
  CreateQuizInput,
  QuizChoice,
  QuizItem,
  QuizTag,
  QuizTagRelation,
  UpdateQuizInput,
} from "../model/quiz.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isQuizTag = (value: unknown): value is QuizTag =>
  isRecord(value) && typeof value.id === "number" && typeof value.tagName === "string";

const isQuizTagRelation = (value: unknown): value is QuizTagRelation =>
  isRecord(value) && isQuizTag(value.quizTag);

const isQuizChoice = (value: unknown): value is QuizChoice =>
  isRecord(value) && typeof value.id === "number" && typeof value.choiceText === "string";

const isQuizItem = (value: unknown): value is QuizItem =>
  isRecord(value) &&
  typeof value.id === "number" &&
  typeof value.word === "string" &&
  typeof value.mean === "string" &&
  (value.questionText === null || typeof value.questionText === "string") &&
  (value.hint === null || typeof value.hint === "string") &&
  (value.groupName === null || typeof value.groupName === "string") &&
  typeof value.isFavorite === "boolean" &&
  Array.isArray(value.quizTagsRelations) &&
  value.quizTagsRelations.every(isQuizTagRelation) &&
  Array.isArray(value.choices) &&
  value.choices.every(isQuizChoice);

const parseQuizItem = (value: unknown): QuizItem => {
  if (!isQuizItem(value)) {
    throw new Error("Invalid quiz response.");
  }

  return {
    id: value.id,
    word: value.word,
    mean: value.mean,
    questionText: value.questionText,
    hint: value.hint,
    groupName: value.groupName,
    isFavorite: value.isFavorite,
    quizTagsRelations: value.quizTagsRelations.map((relation) => ({
      quizTag: {
        id: relation.quizTag.id,
        tagName: relation.quizTag.tagName,
      },
    })),
    choices: value.choices.map((choice) => ({
      id: choice.id,
      choiceText: choice.choiceText,
    })),
  };
};

export async function fetchQuizList(): Promise<QuizItem[]> {
  const response = await getJson<unknown[]>("/quiz/list");
  if (!Array.isArray(response)) {
    throw new Error("Invalid quiz list response.");
  }

  return response.map(parseQuizItem);
}

export async function createQuiz(input: CreateQuizInput): Promise<QuizItem> {
  return parseQuizItem(
    await postJson<unknown, { word: string; mean: string; tag: string[]; groupName?: string; isFavorite: boolean }>(
      "/quiz/register",
      {
        word: input.word,
        mean: input.mean,
        tag: input.tags,
        groupName: input.groupName || undefined,
        isFavorite: input.isFavorite,
      }
    )
  );
}

export async function updateQuiz(input: UpdateQuizInput): Promise<QuizItem> {
  return parseQuizItem(
    await putJson<unknown>(`/quiz/update/${input.id}`, {
      word: input.word,
      mean: input.mean,
      tag: input.tags,
      groupName: input.groupName || undefined,
      questionText: input.questionText || undefined,
      hint: input.hint || undefined,
      choices: input.choices.filter((c) => c.trim() !== ""),
      isFavorite: input.isFavorite,
    })
  );
}

export async function deleteQuiz(id: number): Promise<void> {
  await deleteJson(`/quiz/remove/${id}`);
}

export async function fetchQuizTags(): Promise<QuizTag[]> {
  const response = await getJson<unknown[]>("/quiz/tags");
  if (!Array.isArray(response)) {
    throw new Error("Invalid tags response.");
  }
  return response.filter(isQuizTag).map((t) => ({ id: t.id, tagName: t.tagName }));
}

export async function toggleFavorite(id: number): Promise<{ id: number; isFavorite: boolean }> {
  const response = await patchJson<unknown>(`/quiz/favorite/${id}`);
  if (
    !isRecord(response) ||
    typeof response.id !== "number" ||
    typeof response.isFavorite !== "boolean"
  ) {
    throw new Error("Invalid favorite toggle response.");
  }
  return { id: response.id, isFavorite: response.isFavorite };
}

export async function fetchQuizGroups(): Promise<string[]> {
  const response = await getJson<unknown[]>("/quiz/groups");
  if (!Array.isArray(response)) {
    throw new Error("Invalid groups response.");
  }
  return response.filter((v): v is string => typeof v === "string");
}

export async function deleteQuizTag(tagName: string): Promise<void> {
  await deleteJson(`/quiz/tags/${encodeURIComponent(tagName)}`);
}

export async function deleteQuizGroup(groupName: string): Promise<void> {
  await deleteJson(`/quiz/groups/${encodeURIComponent(groupName)}`);
}

export async function bulkUpdateQuizLabels(
  input: BulkUpdateQuizLabelsInput
): Promise<BulkUpdateQuizLabelsResult> {
  const response = await patchJson<unknown>("/quiz/bulk", {
    quizIds: input.quizIds,
    tags: input.tags,
    groups: input.groups,
  });

  if (
    !isRecord(response) ||
    typeof response.updatedCount !== "number"
  ) {
    throw new Error("Invalid bulk update response.");
  }

  return { updatedCount: response.updatedCount };
}
