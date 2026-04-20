import { openApiRegistry, z } from '../../../../shared/openapi/registry';
import {
  integerFromInput,
  optionalIntegerFromQuery,
  trimmedStringArray,
} from '../../../../shared/openapi/zodHelpers';
import { memoScopes, memoSearchScopes, memoSearchTypes } from '../../application/memoPorts';

export { ErrorResponseSchema } from '../../../../shared/openapi/commonSchemas';

export const MemoScopeSchema = z.enum(memoScopes).openapi('MemoScope');
export const MemoSearchTypeSchema = z.enum(memoSearchTypes).openapi('MemoSearchType');
export const MemoSearchScopeSchema = z.enum(memoSearchScopes).openapi('MemoSearchScope');

export const TagSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string(),
  })
  .openapi('Tag');

export const MemoTagRelationSchema = z
  .object({
    memo_id: z.number().int().positive(),
    tag_id: z.number().int().positive(),
    tag: TagSchema,
  })
  .openapi('MemoTagRelation');

export const MemoSchema = z
  .object({
    id: z.number().int().positive(),
    orderIndex: z.number().int().nonnegative(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    title: z.string(),
    content: z.string(),
    deletedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('Memo');

export const MemoWithTagsSchema = MemoSchema.extend({
  memo_tags: z.array(MemoTagRelationSchema),
}).openapi('MemoWithTags');

export const MemoListResponseSchema = z
  .object({
    items: z.array(MemoWithTagsSchema),
  })
  .openapi('MemoListResponse');

export const TagListResponseSchema = z
  .object({
    items: z.array(TagSchema),
  })
  .openapi('TagListResponse');

export const CreateMemoBodySchema = z
  .object({
    title: z.string().trim().min(1, { message: 'title は必須です。' }),
    content: z.string(),
    tags: trimmedStringArray({ description: '空文字と重複は route 側で除外される' }),
  })
  .openapi('CreateMemoBody');

export const UpdateMemoBodySchema = z
  .object({
    id: integerFromInput({ min: 1 }),
    title: z.string().trim().min(1, { message: 'title は必須です。' }),
    content: z.string(),
    width: optionalIntegerFromQuery({ min: 0 }),
    height: optionalIntegerFromQuery({ min: 0 }),
  })
  .openapi('UpdateMemoBody');

export const ListMemoQuerySchema = z
  .object({
    scope: MemoScopeSchema.optional().default('active'),
  })
  .openapi('ListMemoQuery');

export const SearchMemoQuerySchema = z
  .object({
    q: z.string().trim().min(1, { message: 'q は必須です。' }),
    type: MemoSearchTypeSchema.optional().default('all'),
    scope: MemoSearchScopeSchema.optional().default('active'),
  })
  .openapi('SearchMemoQuery');

export const SortMemoBodySchema = z
  .object({
    items: z.array(
      z.object({
        id: integerFromInput({ min: 1 }),
        orderIndex: integerFromInput({ min: 0 }),
      }),
    ),
  })
  .openapi('SortMemoBody');

export const LayoutMemoBodySchema = z
  .object({
    memoId: integerFromInput({ min: 1 }),
    width: optionalIntegerFromQuery({ min: 0 }),
    height: optionalIntegerFromQuery({ min: 0 }),
  })
  .openapi('LayoutMemoBody');

export const MemoIdParamsSchema = z
  .object({
    id: integerFromInput({ min: 1 }),
  })
  .openapi('MemoIdParams');

export const CreateTagBodySchema = z
  .object({
    title: z.string().trim().min(1, { message: 'title は必須です。' }),
    memoId: z
      .preprocess(
        (value) => (value === '' || value === null || value === undefined ? undefined : value),
        integerFromInput({ min: 1 }).optional(),
      )
      .openapi({ description: 'タグを同時にメモに紐付けるときだけ指定する' }),
  })
  .openapi('CreateTagBody');

export const LinkTagBodySchema = z
  .object({
    memoId: integerFromInput({ min: 1 }),
    tagId: integerFromInput({ min: 1 }),
  })
  .openapi('LinkTagBody');

export const UnlinkTagParamsSchema = z
  .object({
    memoId: integerFromInput({ min: 1 }),
    tagId: integerFromInput({ min: 1 }),
  })
  .openapi('UnlinkTagParams');

export const SystemDeleteTagParamsSchema = z
  .object({
    tagId: integerFromInput({ min: 1 }),
  })
  .openapi('SystemDeleteTagParams');

export const RestoreTagBodySchema = z
  .object({
    id: integerFromInput({ min: 1 }),
    title: z.string().trim().min(1, { message: 'title は必須です。' }),
    linkedMemoIds: z
      .array(integerFromInput({ min: 1 }))
      .optional()
      .transform((values) => (values ? [...new Set(values)] : [])),
  })
  .openapi('RestoreTagBody');

export const OkMessageSchema = z.object({ message: z.string() }).openapi('OkMessage');

openApiRegistry.register('Tag', TagSchema);
openApiRegistry.register('Memo', MemoSchema);
openApiRegistry.register('MemoWithTags', MemoWithTagsSchema);
openApiRegistry.register('MemoListResponse', MemoListResponseSchema);
openApiRegistry.register('TagListResponse', TagListResponseSchema);
openApiRegistry.register('OkMessage', OkMessageSchema);
