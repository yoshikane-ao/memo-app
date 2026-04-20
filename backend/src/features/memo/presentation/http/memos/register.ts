import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { normalizeStringArray } from '../../../../../shared/openapi/zodHelpers';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { MemoUseCases } from '../../../application/memoUseCases';
import { CreateMemoBodySchema, ErrorResponseSchema, MemoWithTagsSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'post',
  path: '/memos/register',
  tags: ['memo'],
  summary: 'メモ新規作成',
  security: [{ CookieAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateMemoBodySchema } },
    },
  },
  responses: {
    201: {
      description: '作成成功',
      content: { 'application/json': { schema: MemoWithTagsSchema } },
    },
    400: {
      description: 'バリデーションエラー',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createRegisterRouter = ({ createMemo }: MemoUseCases) => {
  const registerRouter = Router();

  registerRouter.post('/', async (req, res) => {
    try {
      const { title, content, tags } = CreateMemoBodySchema.parse(req.body);
      const newMemo = await createMemo({
        userId: requireUserId(req),
        title,
        content,
        tags: normalizeStringArray(tags),
      });

      res.status(201).json(newMemo);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to create memo.');
    }
  });

  return registerRouter;
};
