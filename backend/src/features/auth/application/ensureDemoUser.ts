import type { Logger } from 'pino';
import type { DemoConfig } from '../../../config';
import type { PasswordHasher, UserRepository } from './authPorts';

export interface EnsureDemoUserDeps {
  demoConfig: DemoConfig;
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  logger: Logger;
}

// 起動時にデモユーザーを冪等に作成する。
// DEMO_EMAIL / DEMO_PASSWORD のいずれかが未設定なら何もしない。
// ポートフォリオサイトの「とりあえず触ってみたい」人向けの入口を保証する。
export const ensureDemoUser = async (deps: EnsureDemoUserDeps): Promise<void> => {
  const { demoConfig, userRepository, passwordHasher, logger } = deps;

  if (!demoConfig.email || !demoConfig.password) {
    logger.debug('DEMO_EMAIL / DEMO_PASSWORD 未設定のためデモユーザー seed をスキップ');
    return;
  }

  const email = demoConfig.email.toLowerCase();
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    logger.info({ email }, 'デモユーザーは既に存在するため seed をスキップ');
    return;
  }

  const passwordHash = await passwordHasher.hash(demoConfig.password);
  await userRepository.create({
    email,
    passwordHash,
    displayName: demoConfig.displayName,
  });
  logger.info({ email }, 'デモユーザーを作成しました');
};
