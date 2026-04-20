import type { ZodError } from 'zod';
import { z } from './registry';

// Zod v4 の issue.path は配列なので、ドット記法でつなぎ直して人間に読みやすくする。
const formatPath = (path: PropertyKey[]): string => {
  if (path.length === 0) return 'request';
  return path
    .map((segment, index) =>
      typeof segment === 'number'
        ? `[${segment}]`
        : index === 0
          ? String(segment)
          : `.${String(segment)}`,
    )
    .join('');
};

export const formatZodError = (error: ZodError): string => {
  const first = error.issues[0];
  if (!first) return 'リクエストの検証に失敗しました。';
  return `${formatPath(first.path)}: ${first.message}`;
};

// body / params / query で整数を受け取る共通パーサ。
// Express は req.params / req.query を文字列で返すため coerce で数値化する。
export const integerFromInput = (opts: { min: number; description?: string }) =>
  z.coerce
    .number({ message: '整数で指定してください。' })
    .int({ message: '整数で指定してください。' })
    .min(opts.min, { message: `${opts.min} 以上で指定してください。` });

// query の空文字 "?width=" を undefined に正規化してから整数化する。
export const optionalIntegerFromQuery = (opts?: { min?: number; description?: string }) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      return value;
    },
    z.coerce
      .number()
      .int()
      .min(opts?.min ?? 0, { message: `${opts?.min ?? 0} 以上で指定してください。` })
      .optional(),
  );

// 文字列配列（各要素 trim 済み、未指定時は [] デフォルト）。
// 重複排除は normalizeStringArray で呼び出し側が行う（型推論安定化のため）。
export const trimmedStringArray = (_opts?: { description?: string }) =>
  z.array(z.string().trim()).default([]);

// 正整数配列（最低 1 件）。dedupeIntArray で呼び出し側が重複排除する。
export const positiveIntArray = () =>
  z.array(z.number().int().positive()).min(1, { message: '少なくとも 1 件指定してください。' });

// 空文字・重複を除いた文字列配列に正規化する。
export const normalizeStringArray = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (value === '' || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
};

export const dedupeIntArray = (values: number[]): number[] => [...new Set(values)];
