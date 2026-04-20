import { Router, type CookieOptions, type Request, type Response } from 'express';
import type { AuthConfig } from '../../../../config';
import { handleRouteError } from '../../../../shared/http/requestValidation';
import { openApiRegistry } from '../../../../shared/openapi/registry';
import {
  AuthError,
  type AuthResult,
  type TokenService,
  type User,
} from '../../application/authPorts';
import type { AuthUseCases } from '../../application/authUseCases';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './cookieNames';
import { createAuthMiddleware, isAuthenticatedRequest } from './authMiddleware';
import {
  AuthResponseSchema,
  ErrorResponseSchema,
  LoginBodySchema,
  RegisterBodySchema,
} from './schemas';

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15m に合わせる
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7d に合わせる

const authErrorStatus = (error: AuthError): number => {
  switch (error.kind) {
    case 'validation':
      return 400;
    case 'email-taken':
      return 409;
    case 'invalid-credentials':
    case 'unauthorized':
      return 401;
  }
};

const buildBaseCookieOptions = (authConfig: AuthConfig): CookieOptions => ({
  httpOnly: true,
  secure: authConfig.cookieSecure,
  sameSite: 'strict',
  domain: authConfig.cookieDomain,
});

const setAuthCookies = (res: Response, authConfig: AuthConfig, result: AuthResult) => {
  const base = buildBaseCookieOptions(authConfig);
  res.cookie(ACCESS_COOKIE_NAME, result.tokens.accessToken, {
    ...base,
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE_NAME, result.tokens.refreshToken, {
    ...base,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

const clearAuthCookies = (res: Response, authConfig: AuthConfig) => {
  const base = buildBaseCookieOptions(authConfig);
  res.clearCookie(ACCESS_COOKIE_NAME, { ...base, path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...base, path: REFRESH_COOKIE_PATH });
};

const respondWithUser = (res: Response, user: User) => {
  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  });
};

const sendAuthError = (res: Response, error: unknown) => {
  if (error instanceof AuthError) {
    return res.status(authErrorStatus(error)).json({ message: error.message });
  }
  throw error;
};

const jsonContent = <T extends object>(schema: T) => ({
  'application/json': { schema },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['auth'],
  summary: '新規ユーザー登録',
  request: {
    body: {
      content: jsonContent(RegisterBodySchema),
    },
  },
  responses: {
    201: { description: '作成成功', content: jsonContent(AuthResponseSchema) },
    400: { description: 'バリデーションエラー', content: jsonContent(ErrorResponseSchema) },
    409: { description: 'email 重複', content: jsonContent(ErrorResponseSchema) },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['auth'],
  summary: 'ログイン',
  request: {
    body: {
      content: jsonContent(LoginBodySchema),
    },
  },
  responses: {
    200: { description: 'ログイン成功', content: jsonContent(AuthResponseSchema) },
    400: { description: 'バリデーションエラー', content: jsonContent(ErrorResponseSchema) },
    401: { description: '認証失敗', content: jsonContent(ErrorResponseSchema) },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['auth'],
  summary: 'アクセストークン再発行',
  security: [{ CookieAuth: [] }],
  responses: {
    200: { description: '再発行成功', content: jsonContent(AuthResponseSchema) },
    401: {
      description: 'refresh token 無効 / 期限切れ',
      content: jsonContent(ErrorResponseSchema),
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['auth'],
  summary: 'ログアウト（cookie 破棄）',
  responses: {
    204: { description: 'ログアウト成功' },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['auth'],
  summary: '認証中ユーザー情報の取得',
  security: [{ CookieAuth: [] }],
  responses: {
    200: { description: '取得成功', content: jsonContent(AuthResponseSchema) },
    401: { description: '未認証', content: jsonContent(ErrorResponseSchema) },
  },
});

export interface AuthRouterDeps {
  authUseCases: AuthUseCases;
  tokenService: TokenService;
  authConfig: AuthConfig;
}

export const createAuthRouter = ({ authUseCases, tokenService, authConfig }: AuthRouterDeps) => {
  const router = Router();
  const authMiddleware = createAuthMiddleware({ tokenService });

  router.post('/register', async (req, res) => {
    try {
      const body = RegisterBodySchema.parse(req.body);
      const result = await authUseCases.register(body);
      setAuthCookies(res, authConfig, result);
      return res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
        },
      });
    } catch (error) {
      try {
        sendAuthError(res, error);
      } catch (passthrough) {
        return handleRouteError(res, passthrough, 'Failed to register.');
      }
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const body = LoginBodySchema.parse(req.body);
      const result = await authUseCases.login(body);
      setAuthCookies(res, authConfig, result);
      return respondWithUser(res, result.user);
    } catch (error) {
      try {
        sendAuthError(res, error);
      } catch (passthrough) {
        return handleRouteError(res, passthrough, 'Failed to log in.');
      }
    }
  });

  router.post('/refresh', async (req: Request, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      return res.status(401).json({ message: '認証が必要です。' });
    }
    try {
      const result = await authUseCases.refresh(refreshToken);
      setAuthCookies(res, authConfig, result);
      return respondWithUser(res, result.user);
    } catch (error) {
      try {
        sendAuthError(res, error);
      } catch (passthrough) {
        return handleRouteError(res, passthrough, 'Failed to refresh session.');
      }
    }
  });

  router.post('/logout', (_req, res) => {
    clearAuthCookies(res, authConfig);
    return res.status(204).send();
  });

  router.get('/me', authMiddleware, async (req, res) => {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ message: '認証が必要です。' });
    }
    try {
      const user = await authUseCases.getMe(req.userId);
      return respondWithUser(res, user);
    } catch (error) {
      try {
        sendAuthError(res, error);
      } catch (passthrough) {
        return handleRouteError(res, passthrough, 'Failed to load user.');
      }
    }
  });

  return router;
};
