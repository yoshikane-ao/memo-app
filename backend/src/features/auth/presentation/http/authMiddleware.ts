import type { NextFunction, Request, Response } from 'express';
import type { TokenService } from '../../application/authPorts';
import { ACCESS_COOKIE_NAME } from './cookieNames';

export interface AuthenticatedRequest extends Request {
  userId: number;
}

export const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest =>
  typeof (req as AuthenticatedRequest).userId === 'number';

export interface AuthMiddlewareDeps {
  tokenService: TokenService;
}

const extractAccessToken = (req: Request): string | null => {
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  const header = req.header('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
};

export const createAuthMiddleware = ({ tokenService }: AuthMiddlewareDeps) => {
  return function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = extractAccessToken(req);
    if (!token) {
      return res.status(401).json({ message: '認証が必要です。' });
    }

    try {
      const payload = tokenService.verifyAccessToken(token);
      (req as AuthenticatedRequest).userId = payload.sub;
      return next();
    } catch {
      return res.status(401).json({ message: 'セッションの有効期限が切れました。' });
    }
  };
};
