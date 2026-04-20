// quizRepository の統合テスト。
// 単純な CRUD に加えて、bulkUpdateLabels / update / favorite toggle の
// transaction 系ロジックを実 DB で確認する。mock では絶対に検証不可能な領域。

import { prisma, resetDatabase, seedUser } from '../../../test/integration/testDb';
import { createQuizRepository } from './quizRepository';

const repository = createQuizRepository();

describe('quizRepository (integration)', () => {
  let ownerId: number;
  let otherUserId: number;

  beforeEach(async () => {
    await resetDatabase();
    const owner = await seedUser('owner@example.com');
    const other = await seedUser('other@example.com');
    ownerId = owner.id;
    otherUserId = other.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const createSampleQuiz = (
    userId: number,
    overrides: Partial<Parameters<typeof repository.create>[0]> = {},
  ) =>
    repository.create({
      userId,
      word: 'alpha',
      mean: 'first',
      tag: [],
      ...overrides,
    });

  it('create: tag / choices 付きのクイズを保存し、relation 込みで返す', async () => {
    const quiz = await repository.create({
      userId: ownerId,
      word: 'beta',
      mean: 'second',
      tag: ['grammar', 'basic'],
      choices: ['c1', 'c2'],
      groupName: 'review',
      isFavorite: true,
    });

    expect(quiz.word).toBe('beta');
    expect(quiz.isFavorite).toBe(true);
    expect(quiz.quizTagsRelations.map((relation) => relation.quizTag.tagName).sort()).toEqual([
      'basic',
      'grammar',
    ]);
    expect(quiz.choices.map((choice) => choice.choiceText)).toEqual(['c1', 'c2']);
  });

  it('list: userId でスコープされる', async () => {
    await createSampleQuiz(ownerId, { word: 'mine' });
    await createSampleQuiz(otherUserId, { word: 'theirs' });

    const ownerList = await repository.list(ownerId);
    expect(ownerList.map((quiz) => quiz.word)).toEqual(['mine']);
  });

  it('update: 既存 quiz の tag / choices を洗い替えする', async () => {
    const quiz = await repository.create({
      userId: ownerId,
      word: 'w',
      mean: 'm',
      tag: ['old'],
      choices: ['old-c'],
    });

    const updated = await repository.update({
      userId: ownerId,
      id: quiz.id,
      word: 'w',
      mean: 'm',
      tag: ['new1', 'new2'],
      choices: ['new-c'],
    });

    expect(updated.quizTagsRelations.map((relation) => relation.quizTag.tagName).sort()).toEqual([
      'new1',
      'new2',
    ]);
    expect(updated.choices.map((choice) => choice.choiceText)).toEqual(['new-c']);
    // old タグが残っていても connectOrCreate で再利用されないので、quizTag 行数は
    // 新タグ 2 件分に old の 1 件を加えた 3 件になる想定（orphan タグはそのまま残る）
    const tags = await prisma.quizTag.findMany({ where: { userId: ownerId } });
    expect(tags.map((tag) => tag.tagName).sort()).toEqual(['new1', 'new2', 'old']);
  });

  it('update: 他ユーザーの quiz を書き換えようとすると P2025 になる', async () => {
    const othersQuiz = await createSampleQuiz(otherUserId);

    await expect(
      repository.update({
        userId: ownerId,
        id: othersQuiz.id,
        word: 'hijack',
        mean: 'x',
        tag: [],
      }),
    ).rejects.toMatchObject({ code: 'P2025' });
  });

  it('remove: 他ユーザーの quiz を削除しようとすると P2025、own は消える', async () => {
    const ownerQuiz = await createSampleQuiz(ownerId);
    const othersQuiz = await createSampleQuiz(otherUserId);

    await expect(repository.remove(ownerId, othersQuiz.id)).rejects.toMatchObject({
      code: 'P2025',
    });
    await repository.remove(ownerId, ownerQuiz.id);

    expect(await repository.list(ownerId)).toHaveLength(0);
    expect(await prisma.quizs.findUnique({ where: { id: othersQuiz.id } })).not.toBeNull();
  });

  it('toggleFavorite: 所有者のみ更新でき、他ユーザーは P2025', async () => {
    const quiz = await createSampleQuiz(ownerId);

    const toggled = await repository.toggleFavorite(ownerId, quiz.id, true);
    expect(toggled).toEqual({ id: quiz.id, isFavorite: true });

    await expect(repository.toggleFavorite(otherUserId, quiz.id, false)).rejects.toMatchObject({
      code: 'P2025',
    });
  });

  it('deleteTagById: 他ユーザーの tag は消せない', async () => {
    const ownerQuiz = await repository.create({
      userId: ownerId,
      word: 'w',
      mean: 'm',
      tag: ['owner-tag'],
    });
    const ownerTag = ownerQuiz.quizTagsRelations[0]!.quizTag;

    await expect(repository.deleteTagById(otherUserId, ownerTag.id)).rejects.toMatchObject({
      code: 'P2025',
    });
    // owner 本人なら消せる + relation も消える
    await repository.deleteTagById(ownerId, ownerTag.id);
    expect(await prisma.quizTag.findUnique({ where: { id: ownerTag.id } })).toBeNull();
  });

  describe('bulkUpdateLabels', () => {
    it('tags: replace action で既存タグを洗い替えし、未登録タグは自動で作る', async () => {
      const q1 = await repository.create({
        userId: ownerId,
        word: 'a',
        mean: 'b',
        tag: ['existing'],
      });
      const q2 = await repository.create({ userId: ownerId, word: 'c', mean: 'd', tag: [] });

      const result = await repository.bulkUpdateLabels({
        userId: ownerId,
        quizIds: [q1.id, q2.id],
        tags: { action: 'replace', values: ['existing', 'grammar'] },
      });

      expect(result.updatedCount).toBe(2);
      const refreshed = await repository.list(ownerId);
      const tagsByQuizId = new Map(
        refreshed.map((quiz) => [
          quiz.id,
          quiz.quizTagsRelations.map((relation) => relation.quizTag.tagName).sort(),
        ]),
      );
      expect(tagsByQuizId.get(q1.id)).toEqual(['existing', 'grammar']);
      expect(tagsByQuizId.get(q2.id)).toEqual(['existing', 'grammar']);
      // 新規 tag が persist されている
      const tagRows = await prisma.quizTag.findMany({ where: { userId: ownerId } });
      expect(tagRows.map((tag) => tag.tagName).sort()).toEqual(['existing', 'grammar']);
    });

    it('groups: add action で既存 groupName にマージする', async () => {
      const quiz = await repository.create({
        userId: ownerId,
        word: 'a',
        mean: 'b',
        tag: [],
        groupName: 'daily',
      });

      await repository.bulkUpdateLabels({
        userId: ownerId,
        quizIds: [quiz.id],
        groups: { action: 'add', values: ['review'] },
      });

      const [refreshed] = await repository.list(ownerId);
      expect(refreshed!.groupName).toBe('daily,review');
    });

    it('tags: clear action で全タグ紐付けを剥がす', async () => {
      const quiz = await repository.create({
        userId: ownerId,
        word: 'a',
        mean: 'b',
        tag: ['t1', 't2'],
      });

      await repository.bulkUpdateLabels({
        userId: ownerId,
        quizIds: [quiz.id],
        tags: { action: 'clear' },
      });

      const [refreshed] = await repository.list(ownerId);
      expect(refreshed!.quizTagsRelations).toHaveLength(0);
    });

    it('他ユーザーの quiz が混ざっていると P2025 で transaction ロールバック', async () => {
      const ownerQuiz = await createSampleQuiz(ownerId);
      const othersQuiz = await createSampleQuiz(otherUserId);

      await expect(
        repository.bulkUpdateLabels({
          userId: ownerId,
          quizIds: [ownerQuiz.id, othersQuiz.id],
          tags: { action: 'replace', values: ['should-not-persist'] },
        }),
      ).rejects.toMatchObject({ code: 'P2025' });

      // ロールバックされたので新規 tag も作成されていないはず
      const tagRows = await prisma.quizTag.findMany({ where: { tagName: 'should-not-persist' } });
      expect(tagRows).toHaveLength(0);
    });
  });
});
