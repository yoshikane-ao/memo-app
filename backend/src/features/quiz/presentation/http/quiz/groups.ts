import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry, z } from '../../../../../shared/openapi/registry';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { QuizGroupNameParamsSchema } from '../schemas';

const GroupsListResponseSchema = z.array(z.string()).openapi('QuizGroupsListResponse');
openApiRegistry.register('QuizGroupsListResponse', GroupsListResponseSchema);

const OkMessageSchema = z.object({ message: z.string() });

openApiRegistry.registerPath({
  method: 'get',
  path: '/quiz/groups',
  tags: ['quiz'],
  summary: 'クイズグループ名一覧の取得',
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: 'グループ名一覧',
      content: { 'application/json': { schema: GroupsListResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/quiz/groups/{groupName}',
  tags: ['quiz'],
  summary: 'クイズグループを名前で削除',
  security: [{ CookieAuth: [] }],
  request: { params: QuizGroupNameParamsSchema },
  responses: {
    200: {
      description: '削除成功',
      content: { 'application/json': { schema: OkMessageSchema } },
    },
  },
});

export const createGroupsRouter = ({ deleteQuizGroup, listQuizGroups }: QuizUseCases) => {
  const groupsRouter = Router();

  groupsRouter.get('/', async (req, res) => {
    try {
      const groups = await listQuizGroups(requireUserId(req));
      res.status(200).json(groups);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to load groups.');
    }
  });

  groupsRouter.delete('/:groupName', async (req, res) => {
    try {
      const { groupName } = QuizGroupNameParamsSchema.parse(req.params);
      await deleteQuizGroup(requireUserId(req), groupName);
      res.status(200).json({ message: 'Group deleted.' });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to delete group.');
    }
  });

  return groupsRouter;
};
