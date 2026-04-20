import { openApiRegistry, z } from './registry';

export const ErrorResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi('ErrorResponse');

openApiRegistry.register('ErrorResponse', ErrorResponseSchema);
