import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../application/authPorts';

const DEFAULT_ROUNDS = 12;

export const createBcryptPasswordHasher = (rounds = DEFAULT_ROUNDS): PasswordHasher => ({
  hash(plain) {
    return bcrypt.hash(plain, rounds);
  },
  verify(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
});
