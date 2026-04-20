// userRepositoryPrisma を実 Postgres に対して検証する。
// Prisma の @unique 制約に対する findByEmail / create の挙動を通しでチェックする。

import { prisma, resetDatabase } from '../../../test/integration/testDb';
import { createUserRepositoryPrisma } from './userRepositoryPrisma';

const repository = createUserRepositoryPrisma();

describe('userRepositoryPrisma (integration)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('create / findByEmail / findById の一連で生成した row を取り出せる', async () => {
    const created = await repository.create({
      email: 'alice@example.com',
      passwordHash: 'hash-1',
      displayName: 'Alice',
    });

    expect(created).toMatchObject({
      email: 'alice@example.com',
      displayName: 'Alice',
    });
    expect(created.id).toBeGreaterThan(0);

    const byEmail = await repository.findByEmail('alice@example.com');
    expect(byEmail).not.toBeNull();
    expect(byEmail!.passwordHash).toBe('hash-1');

    const byId = await repository.findById(created.id);
    expect(byId).toMatchObject({ id: created.id, email: 'alice@example.com' });
  });

  it('存在しない email / id は null を返す', async () => {
    expect(await repository.findByEmail('nobody@example.com')).toBeNull();
    expect(await repository.findById(999)).toBeNull();
  });

  it('email 重複では Prisma の unique 制約違反が送出される', async () => {
    await repository.create({ email: 'dup@example.com', passwordHash: 'h', displayName: null });

    await expect(
      repository.create({ email: 'dup@example.com', passwordHash: 'h2', displayName: null }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
