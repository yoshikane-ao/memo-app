import { Router, type CookieOptions, type Request, type Response } from 'express';
import type { AuthConfig } from '../../../../config';
import {
  parseBody,
  stringField,
  handleRouteError,
} from '../../../../shared/http/requestValidation';
import {
  AuthError,
  type AuthResult,
  type TokenService,
  type User,
} from '../../application/authPorts';
import type { AuthUseCases } from '../../application/authUseCases';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './cookieNames';
import { createAuthMiddleware, isAuthenticatedRequest } from './authMiddleware';

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
      const body = parseBody(req.body, {
        email: stringField(),
        password: stringField({ trim: false }),
      });
      const displayName =
        typeof req.body?.displayName === 'string' ? req.body.displayName : undefined;

      const result = await authUseCases.register({ ...body, displayName });
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
      const body = parseBody(req.body, {
        email: stringField(),
        password: stringField({ trim: false }),
      });
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
