import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// zod インスタンスに openapi() メソッドを拡張する。
// アプリ起動時に 1 度だけ呼べば OK。import 副作用で実行される前提。
extendZodWithOpenApi(z);

export { z };

// 各 route ファイルがここに registerPath / register する。
// features/*/presentation/http/ 以下の import 副作用で populate される。
export const openApiRegistry = new OpenAPIRegistry();

// cookie ベース認証を 1 箇所で宣言し、認証必須 route から参照する。
openApiRegistry.registerComponent('securitySchemes', 'CookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'access_token',
  description: 'httpOnly cookie。/auth/login または /auth/register 成功時に設定される。',
});

export const generateOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'memo-app API',
      version: '1.0.0',
      description:
        'memo / tag / quiz / auth のエンドポイント一覧。認証が必要な route は Cookie (`memo_access`) を送信してください。',
    },
    servers: [
      { url: 'http://localhost:3004', description: 'ローカル開発' },
      { url: '/', description: '同一オリジン（本番 / フロント経由プロキシ）' },
    ],
  });
};
