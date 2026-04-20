import {
  AuthError,
  type PasswordHasher,
  type TokenService,
  type User,
  type UserRepository,
  type UserWithPasswordHash,
} from './authPorts';
import { createAuthUseCases } from './authUseCases';

const sampleUser: UserWithPasswordHash = {
  id: 42,
  email: 'taro@example.com',
  displayName: 'Taro',
  passwordHash: 'hashed:correct',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const createDeps = () => {
  const userRepository: jest.Mocked<UserRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const passwordHasher: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(async (p: string) => `hashed:${p}`),
    verify: jest.fn(),
  };
  const tokenService: jest.Mocked<TokenService> = {
    signAccessToken: jest.fn((id) => `access:${id}`),
    signRefreshToken: jest.fn((id) => `refresh:${id}`),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };
  return { userRepository, passwordHasher, tokenService };
};

describe('authUseCases.register', () => {
  it('creates a user, hashes the password, and issues tokens', async () => {
    const deps = createDeps();
    const created: User = {
      id: 1,
      email: 'new@example.com',
      displayName: 'New User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    deps.userRepository.findByEmail.mockResolvedValue(null);
    deps.userRepository.create.mockResolvedValue(created);

    const useCases = createAuthUseCases(deps);
    const result = await useCases.register({
      email: 'New@Example.com',
      password: 'strong-password',
      displayName: '  New User  ',
    });

    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('strong-password');
    expect(deps.userRepository.create).toHaveBeenCalledWith({
      email: 'new@example.com',
      passwordHash: 'hashed:strong-password',
      displayName: 'New User',
    });
    expect(result.user.email).toBe('new@example.com');
    expect(result.tokens.accessToken).toBe('access:1');
    expect(result.tokens.refreshToken).toBe('refresh:1');
  });

  it('rejects invalid email', async () => {
    const deps = createDeps();
    const useCases = createAuthUseCases(deps);
    await expect(
      useCases.register({ email: 'bad-email', password: 'strong-password' }),
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('rejects short password', async () => {
    const deps = createDeps();
    const useCases = createAuthUseCases(deps);
    await expect(
      useCases.register({ email: 'ok@example.com', password: 'short' }),
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('rejects when email is already taken', async () => {
    const deps = createDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser);
    const useCases = createAuthUseCases(deps);
    await expect(
      useCases.register({ email: 'taro@example.com', password: 'strong-password' }),
    ).rejects.toMatchObject({ kind: 'email-taken' });
  });
});

describe('authUseCases.login', () => {
  it('returns tokens when credentials are valid', async () => {
    const deps = createDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser);
    deps.passwordHasher.verify.mockResolvedValue(true);

    const useCases = createAuthUseCases(deps);
    const result = await useCases.login({
      email: 'taro@example.com',
      password: 'correct',
    });

    expect(result.user.id).toBe(sampleUser.id);
    expect(result.tokens.accessToken).toBe('access:42');
  });

  it('rejects unknown email', async () => {
    const deps = createDeps();
    deps.userRepository.findByEmail.mockResolvedValue(null);
    const useCases = createAuthUseCases(deps);
    await expect(
      useCases.login({ email: 'missing@example.com', password: 'whatever' }),
    ).rejects.toMatchObject({ kind: 'invalid-credentials' });
  });

  it('rejects wrong password', async () => {
    const deps = createDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser);
    deps.passwordHasher.verify.mockResolvedValue(false);
    const useCases = createAuthUseCases(deps);
    await expect(
      useCases.login({ email: 'taro@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({ kind: 'invalid-credentials' });
  });
});

describe('authUseCases.refresh', () => {
  it('issues new tokens when refresh token is valid', async () => {
    const deps = createDeps();
    deps.tokenService.verifyRefreshToken.mockReturnValue({ sub: 42, type: 'refresh' });
    deps.userRepository.findById.mockResolvedValue(sampleUser);
    const useCases = createAuthUseCases(deps);
    const result = await useCases.refresh('refresh-token');
    expect(result.tokens.accessToken).toBe('access:42');
    expect(result.tokens.refreshToken).toBe('refresh:42');
  });

  it('rejects invalid refresh token', async () => {
    const deps = createDeps();
    deps.tokenService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('invalid');
    });
    const useCases = createAuthUseCases(deps);
    await expect(useCases.refresh('bogus')).rejects.toBeInstanceOf(AuthError);
  });

  it('rejects if user no longer exists', async () => {
    const deps = createDeps();
    deps.tokenService.verifyRefreshToken.mockReturnValue({ sub: 99, type: 'refresh' });
    deps.userRepository.findById.mockResolvedValue(null);
    const useCases = createAuthUseCases(deps);
    await expect(useCases.refresh('token')).rejects.toMatchObject({ kind: 'unauthorized' });
  });
});

describe('authUseCases.getMe', () => {
  it('returns the user when id resolves', async () => {
    const deps = createDeps();
    deps.userRepository.findById.mockResolvedValue(sampleUser);
    const useCases = createAuthUseCases(deps);
    const user = await useCases.getMe(42);
    expect(user.id).toBe(42);
    expect(user.email).toBe('taro@example.com');
  });

  it('throws unauthorized when user is missing', async () => {
    const deps = createDeps();
    deps.userRepository.findById.mockResolvedValue(null);
    const useCases = createAuthUseCases(deps);
    await expect(useCases.getMe(9999)).rejects.toMatchObject({ kind: 'unauthorized' });
  });
});
