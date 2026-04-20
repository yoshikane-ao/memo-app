import type { Logger } from 'pino';
import { ensureDemoUser } from './ensureDemoUser';
import type { PasswordHasher, User, UserRepository, UserWithPasswordHash } from './authPorts';

const noopLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
} as unknown as Logger;

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
  return { userRepository, passwordHasher, logger: noopLogger };
};

const existingUser: UserWithPasswordHash = {
  id: 1,
  email: 'demo@example.com',
  passwordHash: 'hashed:old',
  displayName: 'Demo',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createdUser: User = {
  id: 2,
  email: 'demo@example.com',
  displayName: 'デモユーザー',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ensureDemoUser', () => {
  it('does nothing when demo email is missing', async () => {
    const deps = createDeps();
    await ensureDemoUser({
      ...deps,
      demoConfig: { email: null, password: 'secret', displayName: 'X' },
    });
    expect(deps.userRepository.findByEmail).not.toHaveBeenCalled();
    expect(deps.userRepository.create).not.toHaveBeenCalled();
  });

  it('does nothing when demo password is missing', async () => {
    const deps = createDeps();
    await ensureDemoUser({
      ...deps,
      demoConfig: { email: 'demo@example.com', password: null, displayName: 'X' },
    });
    expect(deps.userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('skips creation when the demo user already exists', async () => {
    const deps = createDeps();
    deps.userRepository.findByEmail.mockResolvedValue(existingUser);
    await ensureDemoUser({
      ...deps,
      demoConfig: { email: 'demo@example.com', password: 'demo12345', displayName: 'デモユーザー' },
    });
    expect(deps.userRepository.create).not.toHaveBeenCalled();
  });

  it('creates the demo user when not present', async () => {
    const deps = createDeps();
    deps.userRepository.findByEmail.mockResolvedValue(null);
    deps.userRepository.create.mockResolvedValue(createdUser);
    await ensureDemoUser({
      ...deps,
      demoConfig: { email: 'Demo@Example.com', password: 'demo12345', displayName: 'デモユーザー' },
    });
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('demo12345');
    expect(deps.userRepository.create).toHaveBeenCalledWith({
      email: 'demo@example.com',
      passwordHash: 'hashed:demo12345',
      displayName: 'デモユーザー',
    });
  });
});
