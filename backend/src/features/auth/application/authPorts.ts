export interface User {
  id: number;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export type TokenKind = 'access' | 'refresh';

export interface TokenPayload {
  sub: number;
  type: TokenKind;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithPasswordHash | null>;
  findById(id: number): Promise<User | null>;
  create(input: { email: string; passwordHash: string; displayName: string | null }): Promise<User>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface TokenService {
  signAccessToken(userId: number): string;
  signRefreshToken(userId: number): string;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly kind: 'invalid-credentials' | 'email-taken' | 'unauthorized' | 'validation',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
