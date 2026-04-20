import { openApiRegistry, z } from '../../../../shared/openapi/registry';

export { ErrorResponseSchema } from '../../../../shared/openapi/commonSchemas';

export const RegisterBodySchema = z
  .object({
    email: z.string().trim().min(1, { message: 'email は必須です。' }).openapi({
      example: 'demo@example.com',
    }),
    password: z.string().min(1, { message: 'password は必須です。' }).openapi({
      example: 'demo12345',
      description: 'trim せず生の文字列で受け取る',
    }),
    displayName: z.string().trim().min(1).optional().openapi({
      example: 'デモユーザー',
    }),
  })
  .openapi('RegisterBody');

export const LoginBodySchema = z
  .object({
    email: z.string().trim().min(1, { message: 'email は必須です。' }),
    password: z.string().min(1, { message: 'password は必須です。' }),
  })
  .openapi('LoginBody');

export const UserSchema = z
  .object({
    id: z.number().int().positive(),
    email: z.string(),
    displayName: z.string().nullable(),
  })
  .openapi('User');

export const AuthResponseSchema = z
  .object({
    user: UserSchema,
  })
  .openapi('AuthResponse');

// コンポーネントとして登録し、後続 route の responses から $ref で参照できるようにする。
openApiRegistry.register('User', UserSchema);
openApiRegistry.register('AuthResponse', AuthResponseSchema);
