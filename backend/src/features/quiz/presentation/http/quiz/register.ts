import { Router } from 'express';
import { handleRouteError } from '../../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../../shared/openapi/registry';
import { normalizeStringArray } from '../../../../../shared/openapi/zodHelpers';
import { requireUserId } from '../../../../../shared/http/authContext';
import type { QuizUseCases } from '../../../application/quizUseCases';
import { CreateQuizBodySchema, ErrorResponseSchema, QuizSchema } from '../schemas';

openApiRegistry.registerPath({
  method: 'post',
  path: '/quiz/register',
  tags: ['quiz'],
  summary: 'クイズの新規作成',
  security: [{ CookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateQuizBodySchema } } },
  },
  responses: {
    201: {
      description: '作成成功',
      content: { 'application/json': { schema: QuizSchema } },
    },
    400: {
      description: 'バリデーションエラー',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createRegisterRouter = ({ createQuiz }: QuizUseCases) => {
  const registerRouter = Router();

  registerRouter.post('/', async (req, res) => {
    try {
      const { tag, choices, ...rest } = CreateQuizBodySchema.parse(req.body);
      const quiz = await createQuiz({
        userId: requireUserId(req),
        ...rest,
        tag: normalizeStringArray(tag),
        choices: normalizeStringArray(choices),
      });
      res.status(201).json(quiz);
    } catch (error) {
      return handleRouteError(res, error, 'Failed to create quiz.');
    }
  });

  return registerRouter;
};
