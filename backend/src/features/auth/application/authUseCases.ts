import {
  AuthError,
  type AuthResult,
  type LoginInput,
  type PasswordHasher,
  type RegisterInput,
  type TokenService,
  type User,
  type UserRepository,
} from './authPorts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const validateEmail = (email: string) => {
  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthError('メールアドレスの形式が正しくありません。', 'validation');
  }
};

const validatePassword = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      `パスワードは ${MIN_PASSWORD_LENGTH} 文字以上で入力してください。`,
      'validation',
    );
  }
};

const toPublicUser = (user: User): User => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export interface AuthUseCasesDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
}

export interface AuthUseCases {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  refresh(refreshToken: string): Promise<AuthResult>;
  getMe(userId: number): Promise<User>;
}

export const createAuthUseCases = (deps: AuthUseCasesDeps): AuthUseCases => {
  const { userRepository, passwordHasher, tokenService } = deps;

  const issueTokens = (userId: number) => ({
    accessToken: tokenService.signAccessToken(userId),
    refreshToken: tokenService.signRefreshToken(userId),
  });

  return {
    async register(input) {
      const email = normalizeEmail(input.email);
      validateEmail(email);
      validatePassword(input.password);

      const existing = await userRepository.findByEmail(email);
      if (existing) {
        throw new AuthError('このメールアドレスは既に登録されています。', 'email-taken');
      }

      const passwordHash = await passwordHasher.hash(input.password);
      const created = await userRepository.create({
        email,
        passwordHash,
        displayName: input.displayName?.trim() || null,
      });

      return {
        user: toPublicUser(created),
        tokens: issueTokens(created.id),
      };
    },

    async login(input) {
      const email = normalizeEmail(input.email);
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new AuthError('メールアドレスまたはパスワードが違います。', 'invalid-credentials');
      }

      const ok = await passwordHasher.verify(input.password, user.passwordHash);
      if (!ok) {
        throw new AuthError('メールアドレスまたはパスワードが違います。', 'invalid-credentials');
      }

      return {
        user: toPublicUser(user),
        tokens: issueTokens(user.id),
      };
    },

    async refresh(refreshToken) {
      let payload;
      try {
        payload = tokenService.verifyRefreshToken(refreshToken);
      } catch {
        throw new AuthError(
          'セッションの有効期限が切れました。再度ログインしてください。',
          'unauthorized',
        );
      }

      const user = await userRepository.findById(payload.sub);
      if (!user) {
        throw new AuthError('ユーザーが見つかりません。', 'unauthorized');
      }

      return {
        user: toPublicUser(user),
        tokens: issueTokens(user.id),
      };
    },

    async getMe(userId) {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AuthError('ユーザーが見つかりません。', 'unauthorized');
      }
      return toPublicUser(user);
    },
  };
};
