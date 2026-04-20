// tagRepository の統合テスト。
// link / unlink の所有権チェック（P2025）と、restore の
// 「id / title / 関連 memo を transaction でまとめて戻す」挙動を実 DB で検証する。

import { prisma, resetDatabase, seedUser } from '../../../test/integration/testDb';
import { createTagRepository } from './tagRepository';

const repository = createTagRepository();

describe('tagRepository (integration)', () => {
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

  const createMemo = async (userId: number, title = 'memo') =>
    prisma.memos.create({ data: { userId, title, content: '' } });

  it('create → findByTitle → list でタグを取り出せる', async () => {
    const tag = await repository.create(ownerId, 'food');

    expect(await repository.findByTitle(ownerId, 'food')).toEqual(tag);
    expect(await repository.list(ownerId)).toEqual([tag]);
  });

  it('list: userId でスコープされ、他ユーザーのタグは返らない', async () => {
    await repository.create(ownerId, 'mine');
    await repository.create(otherUserId, 'theirs');

    expect((await repository.list(ownerId)).map((tag) => tag.title)).toEqual(['mine']);
  });

  it('linkToMemo / unlinkFromMemo の往復で memo_tags が追加・削除される', async () => {
    const memo = await createMemo(ownerId);
    const tag = await repository.create(ownerId, 'work');

    await repository.linkToMemo(ownerId, memo.id, tag.id);
    let relations = await prisma.memo_tags.findMany({ where: { memo_id: memo.id } });
    expect(relations).toHaveLength(1);

    await repository.unlinkFromMemo(ownerId, memo.id, tag.id);
    relations = await prisma.memo_tags.findMany({ where: { memo_id: memo.id } });
    expect(relations).toHaveLength(0);
  });

  it('linkToMemo: 他ユーザーの memo に紐付けようとすると P2025 になる', async () => {
    const othersMemo = await createMemo(otherUserId);
    const ownerTag = await repository.create(ownerId, 'work');

    await expect(repository.linkToMemo(ownerId, othersMemo.id, ownerTag.id)).rejects.toMatchObject({
      code: 'P2025',
    });
  });

  it('linkToMemo: 他ユーザーのタグを紐付けようとすると P2025 になる', async () => {
    const ownerMemo = await createMemo(ownerId);
    const othersTag = await repository.create(otherUserId, 'secret');

    await expect(repository.linkToMemo(ownerId, ownerMemo.id, othersTag.id)).rejects.toMatchObject({
      code: 'P2025',
    });
  });

  it('deleteSystem: タグ削除時に memo_tags も連鎖的に消える', async () => {
    const memo = await createMemo(ownerId);
    const tag = await repository.create(ownerId, 'goner');
    await repository.linkToMemo(ownerId, memo.id, tag.id);

    await repository.deleteSystem(ownerId, tag.id);

    expect(await repository.findByTitle(ownerId, 'goner')).toBeNull();
    expect(await prisma.memo_tags.findMany({ where: { tag_id: tag.id } })).toHaveLength(0);
    // memo 本体は残る
    expect(await prisma.memos.findUnique({ where: { id: memo.id } })).not.toBeNull();
  });

  describe('restore', () => {
    it('同じ id / title のタグが既にあれば no-op で existing を返す', async () => {
      const memo = await createMemo(ownerId);
      const existing = await repository.create(ownerId, 'archive');

      const restored = await repository.restore({
        userId: ownerId,
        id: existing.id,
        title: 'archive',
        linkedMemoIds: [memo.id],
      });

      expect(restored.id).toBe(existing.id);
      // 指定した memo との紐付けが追加される
      const links = await prisma.memo_tags.findMany({ where: { tag_id: existing.id } });
      expect(links.map((link) => link.memo_id)).toEqual([memo.id]);
    });

    it('同じ title で id 違いのタグがあれば existing を使って re-link する', async () => {
      const memo = await createMemo(ownerId);
      const existing = await repository.create(ownerId, 'work');
      // 消えた古い id (例: 999) で復元要求が来たとき、title 衝突で existing を再利用する
      const restored = await repository.restore({
        userId: ownerId,
        id: 999,
        title: 'work',
        linkedMemoIds: [memo.id],
      });

      expect(restored.id).toBe(existing.id);
    });

    it('id も title も無ければ元 id のまま新規作成し、linked memos と再紐付けする', async () => {
      const memoA = await createMemo(ownerId, 'A');
      const memoB = await createMemo(ownerId, 'B');

      const restored = await repository.restore({
        userId: ownerId,
        id: 42,
        title: 'fresh',
        linkedMemoIds: [memoA.id, memoB.id],
      });

      expect(restored.id).toBe(42);
      expect(restored.title).toBe('fresh');
      const links = await prisma.memo_tags.findMany({ where: { tag_id: 42 } });
      expect(links.map((link) => link.memo_id).sort()).toEqual([memoA.id, memoB.id].sort());
    });

    it('他ユーザーの memo は linkedMemoIds に混ざっていても無視される', async () => {
      const ownerMemo = await createMemo(ownerId, 'mine');
      const othersMemo = await createMemo(otherUserId, 'not mine');

      const restored = await repository.restore({
        userId: ownerId,
        id: 50,
        title: 'mixed',
        linkedMemoIds: [ownerMemo.id, othersMemo.id],
      });

      const links = await prisma.memo_tags.findMany({ where: { tag_id: restored.id } });
      expect(links.map((link) => link.memo_id)).toEqual([ownerMemo.id]);
    });
  });
});
