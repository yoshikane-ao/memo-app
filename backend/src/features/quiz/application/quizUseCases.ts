import type {
  BulkUpdateQuizLabelsInput,
  CreateQuizInput,
  QuizRepository,
  UpdateQuizInput,
} from './quizPorts';

export const createQuizUseCases = ({ quizRepository }: { quizRepository: QuizRepository }) => ({
  listQuizzes(userId: number) {
    return quizRepository.list(userId);
  },

  createQuiz(input: CreateQuizInput) {
    return quizRepository.create(input);
  },

  updateQuiz(input: UpdateQuizInput) {
    return quizRepository.update(input);
  },

  bulkUpdateQuizLabels(input: BulkUpdateQuizLabelsInput) {
    return quizRepository.bulkUpdateLabels(input);
  },

  async removeQuiz(userId: number, id: number) {
    await quizRepository.remove(userId, id);
  },

  listQuizTags(userId: number) {
    return quizRepository.listTags(userId);
  },

  async deleteQuizTag(userId: number, tagName: string) {
    const tag = await quizRepository.findTagByName(userId, tagName);
    if (!tag) {
      throw { code: 'P2025' };
    }

    await quizRepository.deleteTagById(userId, tag.id);
  },

  async listQuizGroups(userId: number) {
    const rows = await quizRepository.listGroupNameRows(userId);
    const groupSet = new Set<string>();

    for (const row of rows) {
      if (!row.groupName) {
        continue;
      }

      for (const groupName of row.groupName.split(',')) {
        const normalizedGroup = groupName.trim();
        if (normalizedGroup !== '') {
          groupSet.add(normalizedGroup);
        }
      }
    }

    return [...groupSet].sort();
  },

  async deleteQuizGroup(userId: number, targetGroup: string) {
    const rows = await quizRepository.listGroupNameRows(userId);
    const updates = rows
      .map((row) => {
        const groups = (row.groupName ?? '')
          .split(',')
          .map((groupName) => groupName.trim())
          .filter((groupName) => groupName !== '' && groupName !== targetGroup);

        return {
          id: row.id,
          groupName: groups.length > 0 ? groups.join(',') : null,
        };
      })
      .filter((update) => {
        const original = rows.find((row) => row.id === update.id);
        return original && original.groupName !== update.groupName;
      });

    if (updates.length === 0) {
      return;
    }

    await Promise.all(
      updates.map((update) => quizRepository.updateGroupName(userId, update.id, update.groupName)),
    );
  },

  async toggleQuizFavorite(userId: number, id: number) {
    const quiz = await quizRepository.findById(userId, id);
    if (!quiz) {
      throw { code: 'P2025' };
    }

    return quizRepository.toggleFavorite(userId, id, !quiz.isFavorite);
  },
});

export type QuizUseCases = ReturnType<typeof createQuizUseCases>;
