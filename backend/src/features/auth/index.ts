import { config } from '../../config';
import { createAuthUseCases } from './application/authUseCases';
import { createBcryptPasswordHasher } from './infrastructure/passwordHasherBcrypt';
import { createJwtTokenService } from './infrastructure/tokenServiceJwt';
import { createUserRepositoryPrisma } from './infrastructure/userRepositoryPrisma';
import { createAuthMiddleware } from './presentation/http/authMiddleware';
import { createAuthRouter } from './presentation/http/authRouter';

const tokenService = createJwtTokenService(config.auth);
const authUseCases = createAuthUseCases({
  userRepository: createUserRepositoryPrisma(),
  passwordHasher: createBcryptPasswordHasher(),
  tokenService,
});

export const authRouter = createAuthRouter({
  authUseCases,
  tokenService,
  authConfig: config.auth,
});

export const authMiddleware = createAuthMiddleware({ tokenService });

export type { AuthenticatedRequest } from './presentation/http/authMiddleware';
export { isAuthenticatedRequest } from './presentation/http/authMiddleware';
