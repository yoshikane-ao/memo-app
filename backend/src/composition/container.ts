import type { Logger } from 'pino';
import { config } from '../config';
import { logger } from '../shared/logger';
import { createAuthUseCases } from '../features/auth/application/authUseCases';
import { ensureDemoUser as ensureDemoUserCore } from '../features/auth/application/ensureDemoUser';
import { createBcryptPasswordHasher } from '../features/auth/infrastructure/passwordHasherBcrypt';
import { createJwtTokenService } from '../features/auth/infrastructure/tokenServiceJwt';
import { createUserRepositoryPrisma } from '../features/auth/infrastructure/userRepositoryPrisma';
import { createAuthMiddleware } from '../features/auth/presentation/http/authMiddleware';
import { createAuthRouter } from '../features/auth/presentation/http/authRouter';
import { createMemoUseCases } from '../features/memo/application/memoUseCases';
import { createTagUseCases } from '../features/memo/application/tagUseCases';
import { createMemoRepository } from '../features/memo/infrastructure/memoRepository';
import { createTagRepository } from '../features/memo/infrastructure/tagRepository';
import { createMemosRouter } from '../features/memo/presentation/http/memosRouter';
import { createTagsRouter } from '../features/memo/presentation/http/tagsRouter';
import { createQuizUseCases } from '../features/quiz/application/quizUseCases';
import { createQuizRepository } from '../features/quiz/infrastructure/quizRepository';
import { createQuizRouter } from '../features/quiz/presentation/http/quizRouter';

export type AppContainer = {
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
  authRouter: ReturnType<typeof createAuthRouter>;
  memosRouter: ReturnType<typeof createMemosRouter>;
  tagsRouter: ReturnType<typeof createTagsRouter>;
  quizRouter: ReturnType<typeof createQuizRouter>;
  ensureDemoUser: () => Promise<void>;
};

export function createContainer(overrides: { logger?: Logger } = {}): AppContainer {
  const effectiveLogger = overrides.logger ?? logger;

  const userRepository = createUserRepositoryPrisma();
  const passwordHasher = createBcryptPasswordHasher();
  const tokenService = createJwtTokenService(config.auth);
  const authUseCases = createAuthUseCases({
    userRepository,
    passwordHasher,
    tokenService,
  });

  const memoRepository = createMemoRepository();
  const memoUseCases = createMemoUseCases({ memoRepository });
  const tagRepository = createTagRepository();
  const tagUseCases = createTagUseCases({ tagRepository });

  const quizRepository = createQuizRepository();
  const quizUseCases = createQuizUseCases({ quizRepository });

  const authMiddleware = createAuthMiddleware({ tokenService });
  const authRouter = createAuthRouter({
    authUseCases,
    tokenService,
    authConfig: config.auth,
  });
  const memosRouter = createMemosRouter(memoUseCases);
  const tagsRouter = createTagsRouter(tagUseCases);
  const quizRouter = createQuizRouter(quizUseCases);

  const ensureDemoUser = (): Promise<void> =>
    ensureDemoUserCore({
      demoConfig: config.demo,
      userRepository,
      passwordHasher,
      logger: effectiveLogger,
    });

  return {
    authMiddleware,
    authRouter,
    memosRouter,
    tagsRouter,
    quizRouter,
    ensureDemoUser,
  };
}
