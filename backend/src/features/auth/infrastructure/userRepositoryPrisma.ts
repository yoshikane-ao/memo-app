import { prisma } from '../../../db';
import type { User, UserRepository, UserWithPasswordHash } from '../application/authPorts';

type PrismaUser = {
  id: number;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const toUser = (row: PrismaUser): User => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toUserWithHash = (row: PrismaUser): UserWithPasswordHash => ({
  ...toUser(row),
  passwordHash: row.passwordHash,
});

export const createUserRepositoryPrisma = (): UserRepository => ({
  async findByEmail(email) {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toUserWithHash(row) : null;
  },

  async findById(id) {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  },

  async create({ email, passwordHash, displayName }) {
    const row = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });
    return toUser(row);
  },
});
