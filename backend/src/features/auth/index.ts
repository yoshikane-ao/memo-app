import { config } from '../../config';
import { logger } from '../../shared/logger';
import { createAuthUseCases } from './application/authUseCases';
import { ensureDemoUser as ensureDemoUserCore } from './application/ensureDemoUser';
import { createBcryptPasswordHasher } from './infrastructure/passwordHasherBcrypt';
import { createJwtTokenService } from './infrastructure/tokenServiceJwt';
import { createUserRepositoryPrisma } from './infrastructure/userRepositoryPrisma';
import { createAuthMiddleware } from './presentation/http/authMiddleware';
import { createAuthRouter } from './presentation/http/authRouter';

const userRepository = createUserRepositoryPrisma();
const passwordHasher = createBcryptPasswordHasher();
const tokenService = createJwtTokenService(config.auth);
const authUseCases = createAuthUseCases({
  userRepository,
  passwordHasher,
  tokenService,
});

export const authRouter = createAuthRouter({
  authUseCases,
  tokenService,
  authConfig: config.auth,
});

export const authMiddleware = createAuthMiddleware({ tokenService });

export const ensureDemoUser = () =>
  ensureDemoUserCore({
    demoConfig: config.demo,
    userRepository,
    passwordHasher,
    logger,
  });

export type { AuthenticatedRequest } from './presentation/http/authMiddleware';
export { isAuthenticatedRequest } from './presentation/http/authMiddleware';
