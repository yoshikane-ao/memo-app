// memoRepository を実 Postgres で検証する。
// userId スコープの境界、Trash / 復元のライフサイクル、
// Prisma の nested create（memo + memo_tags + tag の connectOrCreate）を通しで確認する。

import { prisma, resetDatabase, seedUser } from '../../../test/integration/testDb';
import { createMemoRepository } from './memoRepository';

const repository = createMemoRepository();

describe('memoRepository (integration)', () => {
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

  it('create: tags 付きでメモを作ると memo_tags と tag が同時に作られる', async () => {
    const memo = await repository.create({
      userId: ownerId,
      title: '買い物メモ',
      content: '牛乳、卵',
      tags: ['food', 'urgent'],
    });

    expect(memo.title).toBe('買い物メモ');
    expect(memo.memo_tags.map((relation) => relation.tag.title).sort()).toEqual(['food', 'urgent']);

    const tags = await prisma.tags.findMany({ where: { userId: ownerId } });
    expect(tags.map((tag) => tag.title).sort()).toEqual(['food', 'urgent']);
  });

  it('list: userId でスコープされ、他ユーザーのメモは返らない', async () => {
    await repository.create({ userId: ownerId, title: 'mine', content: '', tags: [] });
    await repository.create({ userId: otherUserId, title: 'theirs', content: '', tags: [] });

    const ownerMemos = await repository.list(ownerId, 'active');
    const otherMemos = await repository.list(otherUserId, 'active');

    expect(ownerMemos.map((memo) => memo.title)).toEqual(['mine']);
    expect(otherMemos.map((memo) => memo.title)).toEqual(['theirs']);
  });

  it('moveToTrash → list(trash) で現れ、list(active) から消える', async () => {
    const memo = await repository.create({
      userId: ownerId,
      title: 'trash me',
      content: '',
      tags: [],
    });

    await repository.moveToTrash(ownerId, memo.id);

    expect(await repository.list(ownerId, 'active')).toHaveLength(0);
    const trashed = await repository.list(ownerId, 'trash');
    expect(trashed).toHaveLength(1);
    expect(trashed[0]!.deletedAt).not.toBeNull();
  });

  it('restore: ごみ箱のメモを active に戻す', async () => {
    const memo = await repository.create({ userId: ownerId, title: 'back', content: '', tags: [] });
    await repository.moveToTrash(ownerId, memo.id);

    const restored = await repository.restore(ownerId, memo.id);

    expect(restored.deletedAt).toBeNull();
    expect(await repository.list(ownerId, 'active')).toHaveLength(1);
    expect(await repository.list(ownerId, 'trash')).toHaveLength(0);
  });

  it('moveToTrash: 他ユーザーの memo を触ろうとすると P2025 になる', async () => {
    const memo = await repository.create({
      userId: otherUserId,
      title: 'not yours',
      content: '',
      tags: [],
    });

    await expect(repository.moveToTrash(ownerId, memo.id)).rejects.toMatchObject({ code: 'P2025' });
  });

  it('deleteManyTrashed: ごみ箱のメモだけ物理削除する', async () => {
    const activeMemo = await repository.create({
      userId: ownerId,
      title: 'keep',
      content: '',
      tags: [],
    });
    const trashedMemo = await repository.create({
      userId: ownerId,
      title: 'purge',
      content: '',
      tags: [],
    });
    await repository.moveToTrash(ownerId, trashedMemo.id);

    const count = await repository.deleteManyTrashed(ownerId);

    expect(count).toBe(1);
    const remaining = await prisma.memos.findMany({ where: { userId: ownerId } });
    expect(remaining.map((memo) => memo.id)).toEqual([activeMemo.id]);
  });

  it('search: title / content / tag の横断検索が scope 付きで動く', async () => {
    await repository.create({ userId: ownerId, title: '買い物', content: '牛乳', tags: ['food'] });
    await repository.create({
      userId: ownerId,
      title: '仕事',
      content: '会議メモ',
      tags: ['work'],
    });

    const byTitle = await repository.search(ownerId, '買い物', 'title', 'active');
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0]!.title).toBe('買い物');

    const byContent = await repository.search(ownerId, '会議', 'content', 'active');
    expect(byContent).toHaveLength(1);
    expect(byContent[0]!.content).toBe('会議メモ');

    const byTag = await repository.search(ownerId, 'food', 'tag', 'active');
    expect(byTag).toHaveLength(1);
    expect(byTag[0]!.title).toBe('買い物');

    const byAll = await repository.search(ownerId, '会議', 'all', 'active');
    expect(byAll).toHaveLength(1);
  });

  it('reorder: 複数メモの orderIndex を一括更新する', async () => {
    const first = await repository.create({ userId: ownerId, title: 'A', content: '', tags: [] });
    const second = await repository.create({ userId: ownerId, title: 'B', content: '', tags: [] });
    const third = await repository.create({ userId: ownerId, title: 'C', content: '', tags: [] });

    await repository.reorder(ownerId, [
      { id: first.id, orderIndex: 2 },
      { id: second.id, orderIndex: 0 },
      { id: third.id, orderIndex: 1 },
    ]);

    const list = await repository.list(ownerId, 'active');
    expect(list.map((memo) => memo.title)).toEqual(['B', 'C', 'A']);
  });

  it('updateLayout: width / height を null リセットできる', async () => {
    const memo = await repository.create({
      userId: ownerId,
      title: 'resize',
      content: '',
      tags: [],
    });

    await repository.updateLayout({ userId: ownerId, memoId: memo.id, width: 200, height: 120 });
    const afterSet = (await repository.list(ownerId, 'active'))[0]!;
    expect({ width: afterSet.width, height: afterSet.height }).toEqual({ width: 200, height: 120 });

    await repository.updateLayout({ userId: ownerId, memoId: memo.id });
    const afterReset = (await repository.list(ownerId, 'active'))[0]!;
    expect({ width: afterReset.width, height: afterReset.height }).toEqual({
      width: null,
      height: null,
    });
  });
});
