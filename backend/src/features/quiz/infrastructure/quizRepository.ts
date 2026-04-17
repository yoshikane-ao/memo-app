import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../db";
import type {
  BulkQuizLabelOperation,
  BulkUpdateQuizLabelsInput,
  BulkUpdateQuizLabelsResult,
  CreateQuizInput,
  QuizChoiceRecord,
  QuizFavoriteState,
  QuizGroupNameRow,
  QuizRecord,
  QuizRepository,
  QuizTagRecord,
  UpdateQuizInput,
} from "../application/quizPorts";

const quizDetailSelect = {
  id: true,
  word: true,
  mean: true,
  questionText: true,
  hint: true,
  groupName: true,
  isFavorite: true,
  quizTagsRelations: {
    select: {
      quizTag: {
        select: {
          id: true,
          tagName: true,
        },
      },
    },
  },
  choices: {
    select: {
      id: true,
      choiceText: true,
    },
  },
} satisfies Prisma.QuizsSelect;

type QuizRecordSource = Prisma.QuizsGetPayload<{
  select: typeof quizDetailSelect;
}>;

const toQuizTagRecord = (tag: { id: number; tagName: string }): QuizTagRecord => ({
  id: tag.id,
  tagName: tag.tagName,
});

const toQuizChoiceRecord = (choice: { id: number; choiceText: string }): QuizChoiceRecord => ({
  id: choice.id,
  choiceText: choice.choiceText,
});

const toQuizRecord = (quiz: QuizRecordSource): QuizRecord => ({
  id: quiz.id,
  word: quiz.word,
  mean: quiz.mean,
  questionText: quiz.questionText,
  hint: quiz.hint,
  groupName: quiz.groupName,
  isFavorite: quiz.isFavorite,
  quizTagsRelations: quiz.quizTagsRelations.map((relation) => ({
    quizTag: toQuizTagRecord(relation.quizTag),
  })),
  choices: quiz.choices.map(toQuizChoiceRecord),
});

const toFavoriteState = (quiz: { id: number; isFavorite: boolean }): QuizFavoriteState => ({
  id: quiz.id,
  isFavorite: quiz.isFavorite,
});

const normalizeValues = (values: string[]) => {
  const normalizedValues: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = value.trim();
    if (normalized === "" || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    normalizedValues.push(normalized);
  }

  return normalizedValues;
};

const parseGroupNames = (groupName: string | null) =>
  normalizeValues(groupName ? groupName.split(",") : []);

const applyBulkLabelOperation = (currentValues: string[], operation: BulkQuizLabelOperation) => {
  const normalizedCurrentValues = normalizeValues(currentValues);

  switch (operation.action) {
    case "add": {
      return normalizeValues([...normalizedCurrentValues, ...(operation.values ?? [])]);
    }
    case "remove": {
      const valuesToRemove = new Set(normalizeValues(operation.values ?? []));
      return normalizedCurrentValues.filter((value) => !valuesToRemove.has(value));
    }
    case "replace": {
      return normalizeValues(operation.values ?? []);
    }
    case "clear": {
      return [];
    }
  }
};

const toDelimitedGroupName = (groups: string[]) => {
  const normalizedGroups = normalizeValues(groups);
  return normalizedGroups.length > 0 ? normalizedGroups.join(",") : null;
};

const buildQuizCreateData = (input: CreateQuizInput): Prisma.QuizsCreateInput => ({
  word: input.word,
  mean: input.mean,
  groupName: input.groupName ?? null,
  questionText: input.questionText ?? null,
  hint: input.hint ?? null,
  isFavorite: input.isFavorite ?? false,
  quizTagsRelations:
    input.tag.length > 0
      ? {
          create: input.tag.map((tagName) => ({
            quizTag: {
              connectOrCreate: {
                where: { tagName },
                create: { tagName },
              },
            },
          })),
        }
      : undefined,
  choices:
    input.choices && input.choices.length > 0
      ? {
          create: input.choices.map((choiceText) => ({ choiceText })),
        }
      : undefined,
});

export const createQuizRepository = (): QuizRepository => ({
  list() {
    return prisma.quizs.findMany({ select: quizDetailSelect }).then((rows) => rows.map(toQuizRecord));
  },

  create(input: CreateQuizInput) {
    return prisma.quizs
      .create({
        data: buildQuizCreateData(input),
        select: quizDetailSelect,
      })
      .then(toQuizRecord);
  },

  async update(input: UpdateQuizInput) {
    await prisma.$transaction([
      prisma.quizTagsRelations.deleteMany({ where: { quiz_id: input.id } }),
      prisma.quizChoice.deleteMany({ where: { quiz_id: input.id } }),
    ]);

    const quiz = await prisma.quizs.update({
      where: { id: input.id },
      data: buildQuizCreateData(input),
      select: quizDetailSelect,
    });

    return toQuizRecord(quiz);
  },

  remove(id: number) {
    return prisma.quizs.delete({ where: { id } }).then(() => undefined);
  },

  listTags() {
    return prisma.quizTag
      .findMany({
        select: { id: true, tagName: true },
        orderBy: { tagName: "asc" },
      })
      .then((rows) => rows.map(toQuizTagRecord));
  },

  findTagByName(tagName: string) {
    return prisma.quizTag
      .findUnique({
        where: { tagName },
        select: { id: true, tagName: true },
      })
      .then((tag) => (tag ? toQuizTagRecord(tag) : null));
  },

  deleteTagById(tagId: number) {
    return prisma.$transaction([
      prisma.quizTagsRelations.deleteMany({ where: { quizTag_id: tagId } }),
      prisma.quizTag.delete({ where: { id: tagId } }),
    ]).then(() => undefined);
  },

  listGroupNameRows() {
    return prisma.quizs
      .findMany({
        where: { groupName: { not: null } },
        select: { id: true, groupName: true },
      })
      .then(
        (rows): QuizGroupNameRow[] =>
          rows.map((row) => ({
            id: row.id,
            groupName: row.groupName,
          }))
      );
  },

  updateGroupName(id: number, groupName: string | null) {
    return prisma.quizs.update({ where: { id }, data: { groupName } }).then(() => undefined);
  },

  async bulkUpdateLabels(input: BulkUpdateQuizLabelsInput): Promise<BulkUpdateQuizLabelsResult> {
    const quizzes = await prisma.quizs.findMany({
      where: { id: { in: input.quizIds } },
      select: {
        id: true,
        groupName: true,
        quizTagsRelations: {
          select: {
            quizTag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });

    if (quizzes.length !== input.quizIds.length) {
      throw { code: "P2025" };
    }

    const nextGroupNames = input.groups
      ? quizzes.map((quiz) => ({
          id: quiz.id,
          groupName: toDelimitedGroupName(
            applyBulkLabelOperation(parseGroupNames(quiz.groupName), input.groups!)
          ),
        }))
      : [];

    const nextTagAssignments = input.tags
      ? quizzes.flatMap((quiz) =>
          applyBulkLabelOperation(
            quiz.quizTagsRelations.map((relation) => relation.quizTag.tagName),
            input.tags!
          ).map((tagName) => ({
            quizId: quiz.id,
            tagName,
          }))
        )
      : [];

    await prisma.$transaction(async (tx) => {
      if (input.tags) {
        const uniqueTagNames = normalizeValues(nextTagAssignments.map((assignment) => assignment.tagName));

        if (uniqueTagNames.length > 0) {
          await tx.quizTag.createMany({
            data: uniqueTagNames.map((tagName) => ({ tagName })),
            skipDuplicates: true,
          });
        }

        const tagRows =
          uniqueTagNames.length > 0
            ? await tx.quizTag.findMany({
                where: { tagName: { in: uniqueTagNames } },
                select: { id: true, tagName: true },
              })
            : [];

        const tagIdByName = new Map(tagRows.map((tagRow) => [tagRow.tagName, tagRow.id]));

        await tx.quizTagsRelations.deleteMany({
          where: {
            quiz_id: { in: input.quizIds },
          },
        });

        const relationRows = nextTagAssignments.map((assignment) => {
          const tagId = tagIdByName.get(assignment.tagName);
          if (tagId == null) {
            throw new Error(`Tag ID missing for ${assignment.tagName}.`);
          }

          return {
            quiz_id: assignment.quizId,
            quizTag_id: tagId,
          };
        });

        if (relationRows.length > 0) {
          await tx.quizTagsRelations.createMany({
            data: relationRows,
            skipDuplicates: true,
          });
        }
      }

      if (input.groups) {
        await Promise.all(
          nextGroupNames.map((groupUpdate) =>
            tx.quizs.update({
              where: { id: groupUpdate.id },
              data: { groupName: groupUpdate.groupName },
            })
          )
        );
      }
    });

    return { updatedCount: quizzes.length };
  },

  findById(id: number) {
    return prisma.quizs
      .findUnique({
        where: { id },
        select: { id: true, isFavorite: true },
      })
      .then((quiz) => (quiz ? toFavoriteState(quiz) : null));
  },

  toggleFavorite(id: number, isFavorite: boolean) {
    return prisma.quizs
      .update({
        where: { id },
        data: { isFavorite },
        select: { id: true, isFavorite: true },
      })
      .then(toFavoriteState);
  },
});
