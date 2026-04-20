import type { Response } from 'express';
import { logger } from '../logger';

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export type FieldParser<T> = (value: unknown, fieldName: string) => T;

type SchemaShape = Record<string, FieldParser<unknown>>;

type InferSchema<T extends SchemaShape> = {
  [K in keyof T]: T[K] extends FieldParser<infer U> ? U : never;
};

type OptionalIntFieldOptions = {
  emptyStringAsUndefined?: boolean;
};

type ArrayFieldOptions<T> = {
  optional?: boolean;
  defaultValue?: T[];
  dedupeBy?: (item: T) => string | number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatRecordError = (fieldName: string) =>
  fieldName === 'Request body'
    ? 'Request body must be a JSON object.'
    : `${fieldName} must be a JSON object.`;

const childFieldName = (parentFieldName: string, key: string) =>
  parentFieldName.startsWith('Request ') ? key : `${parentFieldName}.${key}`;

const normalizeOptionalNumericValue = (value: unknown, options?: OptionalIntFieldOptions) =>
  options?.emptyStringAsUndefined && value === '' ? undefined : value;

export function parseRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new RequestValidationError(formatRecordError(fieldName));
  }

  return value;
}

export function requireBodyRecord(value: unknown): Record<string, unknown> {
  return parseRecord(value, 'Request body');
}

export function parseObject<T extends SchemaShape>(
  value: unknown,
  shape: T,
  fieldName: string,
): InferSchema<T> {
  const record = parseRecord(value, fieldName);
  const parsed = {} as InferSchema<T>;

  for (const key of Object.keys(shape) as Array<keyof T>) {
    const parser = shape[key]!;
    parsed[key] = parser(
      record[String(key)],
      childFieldName(fieldName, String(key)),
    ) as InferSchema<T>[typeof key];
  }

  return parsed;
}

export function parseBody<T extends SchemaShape>(value: unknown, shape: T): InferSchema<T> {
  return parseObject(value, shape, 'Request body');
}

export function parseParams<T extends SchemaShape>(value: unknown, shape: T): InferSchema<T> {
  return parseObject(value, shape, 'Request params');
}

export function parseQuery<T extends SchemaShape>(value: unknown, shape: T): InferSchema<T> {
  return parseObject(value, shape, 'Request query');
}

export function parseRequiredString(
  value: unknown,
  fieldName: string,
  options?: { trim?: boolean },
): string {
  if (typeof value !== 'string') {
    throw new RequestValidationError(`${fieldName} must be a string.`);
  }

  if (value.trim() === '') {
    throw new RequestValidationError(`${fieldName} is required.`);
  }

  return options?.trim === false ? value : value.trim();
}

const toInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return null;
};

export function parsePositiveInt(value: unknown, fieldName: string): number {
  const parsed = toInteger(value);

  if (parsed == null || parsed <= 0) {
    throw new RequestValidationError(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

export function parseNonNegativeInt(value: unknown, fieldName: string): number {
  const parsed = toInteger(value);

  if (parsed == null || parsed < 0) {
    throw new RequestValidationError(`${fieldName} must be a non-negative integer.`);
  }

  return parsed;
}

export function parseOptionalPositiveInt(
  value: unknown,
  fieldName: string,
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return parsePositiveInt(value, fieldName);
}

export function parseOptionalNonNegativeInt(
  value: unknown,
  fieldName: string,
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return parseNonNegativeInt(value, fieldName);
}

export function parseOptionalStringArray(value: unknown, fieldName: string): string[] | undefined {
  return optionalStringArrayField()(value, fieldName);
}

export const stringField =
  (options?: { trim?: boolean }): FieldParser<string> =>
  (value, fieldName) =>
    parseRequiredString(value, fieldName, options);

export const positiveIntField = (): FieldParser<number> => (value, fieldName) =>
  parsePositiveInt(value, fieldName);

export const nonNegativeIntField = (): FieldParser<number> => (value, fieldName) =>
  parseNonNegativeInt(value, fieldName);

export const optionalPositiveIntField =
  (options?: OptionalIntFieldOptions): FieldParser<number | null | undefined> =>
  (value, fieldName) =>
    parseOptionalPositiveInt(normalizeOptionalNumericValue(value, options), fieldName);

export const optionalNonNegativeIntField =
  (options?: OptionalIntFieldOptions): FieldParser<number | null | undefined> =>
  (value, fieldName) =>
    parseOptionalNonNegativeInt(normalizeOptionalNumericValue(value, options), fieldName);

export const dateField = (): FieldParser<Date> => (value, fieldName) => {
  const normalized = parseRequiredString(value, fieldName);
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.valueOf())) {
    throw new RequestValidationError(`${fieldName} must be a valid date string.`);
  }

  return parsed;
};

export function arrayField<T>(itemParser: FieldParser<T>): FieldParser<T[]>;
export function arrayField<T>(
  itemParser: FieldParser<T>,
  options: ArrayFieldOptions<T> & { optional: true },
): FieldParser<T[] | undefined>;
export function arrayField<T>(
  itemParser: FieldParser<T>,
  options?: ArrayFieldOptions<T>,
): FieldParser<T[] | undefined> {
  return (value, fieldName) => {
    if (value === undefined && options?.optional) {
      return options.defaultValue;
    }

    if (!Array.isArray(value)) {
      throw new RequestValidationError(`${fieldName} must be an array.`);
    }

    const parsed = value.map((entry, index) => itemParser(entry, `${fieldName}[${index}]`));

    if (!options?.dedupeBy) {
      return parsed;
    }

    const uniqueItems = new Map<string | number, T>();
    for (const item of parsed) {
      uniqueItems.set(options.dedupeBy(item), item);
    }

    return [...uniqueItems.values()];
  };
}

export const objectField =
  <T extends SchemaShape>(shape: T): FieldParser<InferSchema<T>> =>
  (value, fieldName) =>
    parseObject(value, shape, fieldName);

export const optionalStringArrayField = (): FieldParser<string[] | undefined> =>
  arrayField(stringField(), {
    optional: true,
    dedupeBy: (entry) => entry,
  });

export const optionalEnumField =
  <T extends readonly string[]>(
    values: T,
    options?: { defaultValue?: T[number] },
  ): FieldParser<T[number] | undefined> =>
  (value, fieldName) => {
    if (value === undefined || value === null) {
      return options?.defaultValue;
    }

    if (typeof value !== 'string') {
      throw new RequestValidationError(`${fieldName} must be a string.`);
    }

    const normalized = value.trim();

    if (normalized === '') {
      return options?.defaultValue;
    }

    if (!values.includes(normalized as T[number])) {
      throw new RequestValidationError(`${fieldName} must be one of: ${values.join(', ')}.`);
    }

    return normalized as T[number];
  };

export function handleRouteError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
  notFoundMessage?: string,
) {
  if (error instanceof RequestValidationError) {
    return res.status(400).json({ message: error.message });
  }

  if ((error as { code?: string }).code === 'P2025' && notFoundMessage) {
    return res.status(404).json({ message: notFoundMessage });
  }

  // pino-http が req.log にリクエストスコープの child logger を注入するので、
  // あればそれを使い、無ければベースロガーにフォールバック。
  const log = res.req?.log ?? logger;
  log.error({ err: error }, fallbackMessage);
  return res.status(500).json({ message: fallbackMessage });
}
