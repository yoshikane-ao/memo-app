import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from './registry';

// 各 feature の route ファイルが import 副作用で registry を埋めるので、
// createDocsRouter を呼ぶタイミング（app.ts の登録時）には全 route が register 済み。
export const createDocsRouter = (): Router => {
  const router = Router();

  const document = generateOpenApiDocument();

  router.get('/openapi.json', (_req, res) => {
    res.status(200).json(document);
  });

  router.use('/docs', swaggerUi.serve, swaggerUi.setup(document));

  return router;
};
