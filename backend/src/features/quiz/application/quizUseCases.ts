import type {
  BulkUpdateQuizLabelsInput,
  CreateQuizInput,
  QuizRepository,
  UpdateQuizInput,
} from "./quizPorts";

export const createQuizUseCases = ({
  quizRepository,
}: {
  quizRepository: QuizRepository;
}) => ({
  listQuizzes() {
    return quizRepository.list();
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

  async removeQuiz(id: number) {
    await quizRepository.remove(id);
  },

  listQuizTags() {
    return quizRepository.listTags();
  },

  async deleteQuizTag(tagName: string) {
    const tag = await quizRepository.findTagByName(tagName);
    if (!tag) {
      throw { code: "P2025" };
    }

    await quizRepository.deleteTagById(tag.id);
  },

  async listQuizGroups() {
    const rows = await quizRepository.listGroupNameRows();
    const groupSet = new Set<string>();

    for (const row of rows) {
      if (!row.groupName) {
        continue;
      }

      for (const groupName of row.groupName.split(",")) {
        const normalizedGroup = groupName.trim();
        if (normalizedGroup !== "") {
          groupSet.add(normalizedGroup);
        }
      }
    }

    return [...groupSet].sort();
  },

  async deleteQuizGroup(targetGroup: string) {
    const rows = await quizRepository.listGroupNameRows();
    const updates = rows
      .map((row) => {
        const groups = (row.groupName ?? "")
          .split(",")
          .map((groupName) => groupName.trim())
          .filter((groupName) => groupName !== "" && groupName !== targetGroup);

        return {
          id: row.id,
          groupName: groups.length > 0 ? groups.join(",") : null,
        };
      })
      .filter((update) => {
        const original = rows.find((row) => row.id === update.id);
        return original && original.groupName !== update.groupName;
      });

    if (updates.length === 0) {
      return;
    }

    await Promise.all(updates.map((update) => quizRepository.updateGroupName(update.id, update.groupName)));
  },

  async toggleQuizFavorite(id: number) {
    const quiz = await quizRepository.findById(id);
    if (!quiz) {
      throw { code: "P2025" };
    }

    return quizRepository.toggleFavorite(id, !quiz.isFavorite);
  },
});

export type QuizUseCases = ReturnType<typeof createQuizUseCases>;
