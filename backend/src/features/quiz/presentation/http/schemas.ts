import { openApiRegistry, z } from '../../../../shared/openapi/registry';
import {
  integerFromInput,
  positiveIntArray,
  trimmedStringArray,
} from '../../../../shared/openapi/zodHelpers';

export { ErrorResponseSchema } from '../../../../shared/openapi/commonSchemas';

export const QuizTagSchema = z
  .object({
    id: z.number().int().positive(),
    tagName: z.string(),
  })
  .openapi('QuizTag');

export const QuizChoiceSchema = z
  .object({
    id: z.number().int().positive(),
    choiceText: z.string(),
  })
  .openapi('QuizChoice');

export const QuizTagRelationSchema = z
  .object({
    quizTag: QuizTagSchema,
  })
  .openapi('QuizTagRelation');

export const QuizSchema = z
  .object({
    id: z.number().int().positive(),
    word: z.string(),
    mean: z.string(),
    questionText: z.string().nullable(),
    hint: z.string().nullable(),
    groupName: z.string().nullable(),
    isFavorite: z.boolean(),
    quizTagsRelations: z.array(QuizTagRelationSchema),
    choices: z.array(QuizChoiceSchema),
  })
  .openapi('Quiz');

export const QuizFavoriteStateSchema = z
  .object({
    id: z.number().int().positive(),
    isFavorite: z.boolean(),
  })
  .openapi('QuizFavoriteState');

export const BulkQuizLabelActionSchema = z
  .enum(['add', 'remove', 'replace', 'clear'])
  .openapi('BulkQuizLabelAction');

// add/remove/replace は values 必須、clear は values 不要 → refine で表現する。
export const BulkQuizLabelOperationSchema = z
  .object({
    action: BulkQuizLabelActionSchema,
    values: z.array(z.string().trim()).optional(),
  })
  .superRefine((op, ctx) => {
    if (op.action !== 'clear' && (!op.values || op.values.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['values'],
        message: `${op.action} では values を 1 件以上指定してください。`,
      });
    }
  })
  .transform((op) => {
    if (op.action === 'clear') return { action: 'clear' as const };
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of op.values ?? []) {
      if (value === '' || seen.has(value)) continue;
      seen.add(value);
      out.push(value);
    }
    return { action: op.action, values: out };
  })
  .openapi('BulkQuizLabelOperation');

export const CreateQuizBodySchema = z
  .object({
    word: z.string().trim().min(1, { message: 'word は必須です。' }),
    mean: z.string().trim().min(1, { message: 'mean は必須です。' }),
    tag: trimmedStringArray(),
    groupName: z
      .string()
      .transform((v) => v.trim())
      .optional()
      .transform((v) => (v === '' || v === undefined ? undefined : v)),
    questionText: z
      .string()
      .transform((v) => v.trim())
      .optional()
      .transform((v) => (v === '' || v === undefined ? undefined : v)),
    hint: z
      .string()
      .transform((v) => v.trim())
      .optional()
      .transform((v) => (v === '' || v === undefined ? undefined : v)),
    choices: trimmedStringArray(),
    isFavorite: z.boolean().optional(),
  })
  .openapi('CreateQuizBody');

export const UpdateQuizBodySchema = CreateQuizBodySchema;

export const BulkUpdateQuizLabelsBodySchema = z
  .object({
    quizIds: positiveIntArray(),
    tags: BulkQuizLabelOperationSchema.optional(),
    groups: BulkQuizLabelOperationSchema.optional(),
  })
  .superRefine((body, ctx) => {
    if (!body.tags && !body.groups) {
      ctx.addIssue({
        code: 'custom',
        path: [],
        message: 'tags か groups のどちらかを指定してください。',
      });
    }
  })
  .openapi('BulkUpdateQuizLabelsBody');

export const BulkUpdateQuizLabelsResultSchema = z
  .object({
    updatedCount: z.number().int().nonnegative(),
  })
  .openapi('BulkUpdateQuizLabelsResult');

export const QuizIdParamsSchema = z
  .object({
    id: integerFromInput({ min: 1 }),
  })
  .openapi('QuizIdParams');

export const QuizTagNameParamsSchema = z
  .object({
    tagName: z.string().min(1),
  })
  .openapi('QuizTagNameParams');

export const QuizGroupNameParamsSchema = z
  .object({
    groupName: z.string().min(1),
  })
  .openapi('QuizGroupNameParams');

openApiRegistry.register('QuizTag', QuizTagSchema);
openApiRegistry.register('QuizChoice', QuizChoiceSchema);
openApiRegistry.register('Quiz', QuizSchema);
openApiRegistry.register('QuizFavoriteState', QuizFavoriteStateSchema);
openApiRegistry.register('BulkUpdateQuizLabelsResult', BulkUpdateQuizLabelsResultSchema);
