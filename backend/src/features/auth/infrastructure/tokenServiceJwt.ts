import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AuthConfig } from '../../../config';
import type { TokenKind, TokenPayload, TokenService } from '../application/authPorts';

const assertValidPayload = (value: unknown): TokenPayload => {
  if (typeof value !== 'object' || value === null) {
    throw new Error('JWT payload must be an object');
  }
  const { sub, type } = value as Record<string, unknown>;
  if (typeof sub !== 'number' || !Number.isInteger(sub)) {
    throw new Error('JWT payload.sub must be an integer');
  }
  if (type !== 'access' && type !== 'refresh') {
    throw new Error('JWT payload.type must be access or refresh');
  }
  return { sub, type: type as TokenKind };
};

export const createJwtTokenService = (authConfig: AuthConfig): TokenService => {
  const sign = (userId: number, type: TokenKind, expiresIn: string): string => {
    const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
    return jwt.sign({ sub: userId, type }, authConfig.jwtSecret, options);
  };

  const verify = (token: string, expected: TokenKind): TokenPayload => {
    const payload = jwt.verify(token, authConfig.jwtSecret);
    const parsed = assertValidPayload(payload);
    if (parsed.type !== expected) {
      throw new Error(`expected token type ${expected} but got ${parsed.type}`);
    }
    return parsed;
  };

  return {
    signAccessToken: (userId) => sign(userId, 'access', authConfig.accessTokenTtl),
    signRefreshToken: (userId) => sign(userId, 'refresh', authConfig.refreshTokenTtl),
    verifyAccessToken: (token) => verify(token, 'access'),
    verifyRefreshToken: (token) => verify(token, 'refresh'),
  };
};
