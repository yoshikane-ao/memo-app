// 各 feature の route ファイルが import 副作用で registry に registerPath する前提なので、
// 本テストも feature を import してから document を生成する。
import '../../features/auth/presentation/http/authRouter';
import '../../features/memo/presentation/http/memosRouter';
import '../../features/memo/presentation/http/tagsRouter';
import '../../features/quiz/presentation/http/quizRouter';

import { generateOpenApiDocument } from './registry';

describe('generateOpenApiDocument', () => {
  const document = generateOpenApiDocument();

  it('returns a valid OpenAPI 3.x document with info / paths', () => {
    expect(document.openapi).toMatch(/^3\./);
    expect(document.info.title).toBe('memo-app API');
    expect(document.paths).toBeDefined();
  });

  it('registers auth endpoints', () => {
    expect(document.paths!['/auth/login']).toBeDefined();
    expect(document.paths!['/auth/register']).toBeDefined();
    expect(document.paths!['/auth/me']).toBeDefined();
  });

  it('registers memo endpoints with path parameters', () => {
    expect(document.paths!['/memos/list']).toBeDefined();
    expect(document.paths!['/memos/register']).toBeDefined();
    expect(document.paths!['/memos/delete/{id}']).toBeDefined();
  });

  it('registers quiz endpoints', () => {
    expect(document.paths!['/quiz/list']).toBeDefined();
    expect(document.paths!['/quiz/register']).toBeDefined();
    expect(document.paths!['/quiz/bulk']).toBeDefined();
    expect(document.paths!['/quiz/favorite/{id}']).toBeDefined();
  });

  it('registers the CookieAuth security scheme', () => {
    const schemes = document.components?.securitySchemes;
    expect(schemes?.CookieAuth).toMatchObject({ type: 'apiKey', in: 'cookie' });
  });
});
