import request from 'supertest';

jest.mock('../../../../db', () => ({
  prisma: {
    quizs: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    quizTag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
    },
    quizTagsRelations: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    quizChoice: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '../../../../db';
import { buildJsonTestApp } from '../../../../test/buildJsonTestApp';
import { quizRouter } from '../../index';

const TEST_USER_ID = 1;

const mockedPrisma = prisma as unknown as {
  quizs: {
    findMany: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  quizTag: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
    createMany: jest.Mock;
  };
  quizTagsRelations: {
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  quizChoice: {
    deleteMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

const authedApp = () => buildJsonTestApp(quizRouter, { userId: TEST_USER_ID });

describe('quizRouter', () => {
  beforeEach(() => {
    mockedPrisma.quizs.findMany.mockReset();
    mockedPrisma.quizs.create.mockReset();
    mockedPrisma.quizs.findFirst.mockReset();
    mockedPrisma.quizs.findUnique.mockReset();
    mockedPrisma.quizs.update.mockReset();
    mockedPrisma.quizs.updateMany.mockReset();
    mockedPrisma.quizTag.findMany.mockReset();
    mockedPrisma.quizTag.findUnique.mockReset();
    mockedPrisma.quizTag.delete.mockReset();
    mockedPrisma.quizTag.createMany.mockReset();
    mockedPrisma.quizTagsRelations.deleteMany.mockReset();
    mockedPrisma.quizTagsRelations.createMany.mockReset();
    mockedPrisma.quizChoice.deleteMany.mockReset();
    mockedPrisma.$transaction.mockReset();
    mockedPrisma.$transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === 'function') {
        return input(mockedPrisma);
      }

      return Promise.all(input as Promise<unknown>[]);
    });
  });

  it('lists quizzes scoped to the authenticated user', async () => {
    mockedPrisma.quizs.findMany.mockResolvedValue([
      {
        id: 1,
        word: 'alpha',
        mean: 'first',
        questionText: null,
        hint: null,
        groupName: 'basic',
        isFavorite: false,
        quizTagsRelations: [{ quizTag: { id: 2, tagName: 'tag-a' } }],
        choices: [{ id: 10, choiceText: 'choice-a' }],
      },
    ]);

    const response = await request(authedApp()).get('/list');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 1,
        word: 'alpha',
        mean: 'first',
        questionText: null,
        hint: null,
        groupName: 'basic',
        isFavorite: false,
        quizTagsRelations: [{ quizTag: { id: 2, tagName: 'tag-a' } }],
        choices: [{ id: 10, choiceText: 'choice-a' }],
      },
    ]);
    expect(mockedPrisma.quizs.findMany).toHaveBeenCalledWith({
      where: { userId: TEST_USER_ID },
      select: {
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
      },
    });
  });

  it('creates a quiz scoped to the authenticated user', async () => {
    mockedPrisma.quizs.create.mockResolvedValue({
      id: 3,
      word: 'beta',
      mean: 'second',
      questionText: null,
      hint: null,
      groupName: 'review',
      isFavorite: true,
      quizTagsRelations: [{ quizTag: { id: 5, tagName: 'grammar' } }],
      choices: [],
    });

    const response = await request(authedApp())
      .post('/register')
      .send({
        word: 'beta',
        mean: 'second',
        tag: ['grammar'],
        groupName: 'review',
        isFavorite: true,
      });

    expect(response.status).toBe(201);
    expect(mockedPrisma.quizs.create).toHaveBeenCalledWith({
      data: {
        userId: TEST_USER_ID,
        word: 'beta',
        mean: 'second',
        groupName: 'review',
        questionText: null,
        hint: null,
        isFavorite: true,
        quizTagsRelations: {
          create: [
            {
              quizTag: {
                connectOrCreate: {
                  where: { userId_tagName: { userId: TEST_USER_ID, tagName: 'grammar' } },
                  create: { userId: TEST_USER_ID, tagName: 'grammar' },
                },
              },
            },
          ],
        },
        choices: undefined,
      },
      select: {
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
      },
    });
  });

  it('returns 404 when toggling favorite for a quiz the user does not own', async () => {
    mockedPrisma.quizs.findFirst.mockResolvedValue(null);

    const response = await request(authedApp()).patch('/favorite/99');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Quiz not found.' });
    expect(mockedPrisma.quizs.updateMany).not.toHaveBeenCalled();
  });

  it('bulk updates quiz tags and groups scoped to the authenticated user', async () => {
    mockedPrisma.quizs.findMany.mockResolvedValueOnce([
      {
        id: 1,
        groupName: 'daily',
        quizTagsRelations: [{ quizTag: { tagName: 'existing' } }],
      },
      {
        id: 2,
        groupName: null,
        quizTagsRelations: [],
      },
    ]);
    mockedPrisma.quizTag.createMany.mockResolvedValue({ count: 1 });
    mockedPrisma.quizTag.findMany.mockResolvedValueOnce([
      { id: 10, tagName: 'existing' },
      { id: 11, tagName: 'grammar' },
    ]);
    mockedPrisma.quizTagsRelations.deleteMany.mockResolvedValue({ count: 1 });
    mockedPrisma.quizTagsRelations.createMany.mockResolvedValue({ count: 4 });
    mockedPrisma.quizs.update.mockResolvedValue({});

    const response = await request(authedApp())
      .patch('/bulk')
      .send({
        quizIds: [1, 2],
        tags: { action: 'replace', values: ['existing', 'grammar'] },
        groups: { action: 'add', values: ['review'] },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ updatedCount: 2 });
    expect(mockedPrisma.quizs.findMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] }, userId: TEST_USER_ID },
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
    expect(mockedPrisma.quizTag.createMany).toHaveBeenCalledWith({
      data: [
        { userId: TEST_USER_ID, tagName: 'existing' },
        { userId: TEST_USER_ID, tagName: 'grammar' },
      ],
      skipDuplicates: true,
    });
    expect(mockedPrisma.quizTag.findMany).toHaveBeenCalledWith({
      where: { userId: TEST_USER_ID, tagName: { in: ['existing', 'grammar'] } },
      select: { id: true, tagName: true },
    });
    expect(mockedPrisma.quizTagsRelations.deleteMany).toHaveBeenCalledWith({
      where: {
        quiz_id: { in: [1, 2] },
      },
    });
    expect(mockedPrisma.quizTagsRelations.createMany).toHaveBeenCalledWith({
      data: [
        { quiz_id: 1, quizTag_id: 10 },
        { quiz_id: 1, quizTag_id: 11 },
        { quiz_id: 2, quizTag_id: 10 },
        { quiz_id: 2, quizTag_id: 11 },
      ],
      skipDuplicates: true,
    });
    expect(mockedPrisma.quizs.update).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: { groupName: 'daily,review' },
    });
    expect(mockedPrisma.quizs.update).toHaveBeenNthCalledWith(2, {
      where: { id: 2 },
      data: { groupName: 'review' },
    });
  });

  it('rejects requests without an authenticated user', async () => {
    const response = await request(buildJsonTestApp(quizRouter)).get('/list');

    expect(response.status).toBe(500);
    expect(mockedPrisma.quizs.findMany).not.toHaveBeenCalled();
  });
});
