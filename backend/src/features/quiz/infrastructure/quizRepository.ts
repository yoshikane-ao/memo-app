import type { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../db';
import { RecordNotFoundError } from '../../../shared/errors';
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
} from '../application/quizPorts';

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
    if (normalized === '' || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    normalizedValues.push(normalized);
  }

  return normalizedValues;
};

const parseGroupNames = (groupName: string | null) =>
  normalizeValues(groupName ? groupName.split(',') : []);

const applyBulkLabelOperation = (currentValues: string[], operation: BulkQuizLabelOperation) => {
  const normalizedCurrentValues = normalizeValues(currentValues);

  switch (operation.action) {
    case 'add': {
      return normalizeValues([...normalizedCurrentValues, ...(operation.values ?? [])]);
    }
    case 'remove': {
      const valuesToRemove = new Set(normalizeValues(operation.values ?? []));
      return normalizedCurrentValues.filter((value) => !valuesToRemove.has(value));
    }
    case 'replace': {
      return normalizeValues(operation.values ?? []);
    }
    case 'clear': {
      return [];
    }
  }
};

const toDelimitedGroupName = (groups: string[]) => {
  const normalizedGroups = normalizeValues(groups);
  return normalizedGroups.length > 0 ? normalizedGroups.join(',') : null;
};

const buildQuizMutationData = (input: CreateQuizInput) => ({
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
                where: { userId_tagName: { userId: input.userId, tagName } },
                create: { userId: input.userId, tagName },
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
  list(userId: number) {
    return prisma.quizs
      .findMany({ where: { userId }, select: quizDetailSelect })
      .then((rows) => rows.map(toQuizRecord));
  },

  create(input: CreateQuizInput) {
    return prisma.quizs
      .create({
        data: {
          userId: input.userId,
          ...buildQuizMutationData(input),
        },
        select: quizDetailSelect,
      })
      .then(toQuizRecord);
  },

  async update(input: UpdateQuizInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.quizs.findFirst({
        where: { id: input.id, userId: input.userId },
        select: { id: true },
      });
      if (!existing) {
        throw new RecordNotFoundError();
      }

      await tx.quizTagsRelations.deleteMany({ where: { quiz_id: input.id } });
      await tx.quizChoice.deleteMany({ where: { quiz_id: input.id } });

      const quiz = await tx.quizs.update({
        where: { id: input.id },
        data: buildQuizMutationData(input),
        select: quizDetailSelect,
      });

      return toQuizRecord(quiz);
    });
  },

  async remove(userId: number, id: number) {
    const result = await prisma.quizs.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new RecordNotFoundError();
    }
  },

  listTags(userId: number) {
    return prisma.quizTag
      .findMany({
        where: { userId },
        select: { id: true, tagName: true },
        orderBy: { tagName: 'asc' },
      })
      .then((rows) => rows.map(toQuizTagRecord));
  },

  findTagByName(userId: number, tagName: string) {
    return prisma.quizTag
      .findUnique({
        where: { userId_tagName: { userId, tagName } },
        select: { id: true, tagName: true },
      })
      .then((tag) => (tag ? toQuizTagRecord(tag) : null));
  },

  async deleteTagById(userId: number, tagId: number) {
    await prisma.$transaction(async (tx) => {
      const tag = await tx.quizTag.findFirst({
        where: { id: tagId, userId },
        select: { id: true },
      });
      if (!tag) {
        throw new RecordNotFoundError();
      }

      await tx.quizTagsRelations.deleteMany({ where: { quizTag_id: tagId } });
      await tx.quizTag.delete({ where: { id: tagId } });
    });
  },

  listGroupNameRows(userId: number) {
    return prisma.quizs
      .findMany({
        where: { userId, groupName: { not: null } },
        select: { id: true, groupName: true },
      })
      .then((rows): QuizGroupNameRow[] =>
        rows.map((row) => ({
          id: row.id,
          groupName: row.groupName,
        })),
      );
  },

  async updateGroupName(userId: number, id: number, groupName: string | null) {
    const result = await prisma.quizs.updateMany({
      where: { id, userId },
      data: { groupName },
    });

    if (result.count === 0) {
      throw new RecordNotFoundError();
    }
  },

  async bulkUpdateLabels(input: BulkUpdateQuizLabelsInput): Promise<BulkUpdateQuizLabelsResult> {
    const quizzes = await prisma.quizs.findMany({
      where: { id: { in: input.quizIds }, userId: input.userId },
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
      throw new RecordNotFoundError();
    }

    const nextGroupNames = input.groups
      ? quizzes.map((quiz) => ({
          id: quiz.id,
          groupName: toDelimitedGroupName(
            applyBulkLabelOperation(parseGroupNames(quiz.groupName), input.groups!),
          ),
        }))
      : [];

    const nextTagAssignments = input.tags
      ? quizzes.flatMap((quiz) =>
          applyBulkLabelOperation(
            quiz.quizTagsRelations.map((relation) => relation.quizTag.tagName),
            input.tags!,
          ).map((tagName) => ({
            quizId: quiz.id,
            tagName,
          })),
        )
      : [];

    await prisma.$transaction(async (tx) => {
      if (input.tags) {
        const uniqueTagNames = normalizeValues(
          nextTagAssignments.map((assignment) => assignment.tagName),
        );

        if (uniqueTagNames.length > 0) {
          await tx.quizTag.createMany({
            data: uniqueTagNames.map((tagName) => ({ userId: input.userId, tagName })),
            skipDuplicates: true,
          });
        }

        const tagRows =
          uniqueTagNames.length > 0
            ? await tx.quizTag.findMany({
                where: { userId: input.userId, tagName: { in: uniqueTagNames } },
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
            }),
          ),
        );
      }
    });

    return { updatedCount: quizzes.length };
  },

  findById(userId: number, id: number) {
    return prisma.quizs
      .findFirst({
        where: { id, userId },
        select: { id: true, isFavorite: true },
      })
      .then((quiz) => (quiz ? toFavoriteState(quiz) : null));
  },

  async toggleFavorite(userId: number, id: number, isFavorite: boolean) {
    const result = await prisma.quizs.updateMany({
      where: { id, userId },
      data: { isFavorite },
    });

    if (result.count === 0) {
      throw new RecordNotFoundError();
    }

    return { id, isFavorite };
  },
});
