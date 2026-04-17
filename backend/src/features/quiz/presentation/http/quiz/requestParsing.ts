import {
  RequestValidationError,
  arrayField,
  objectField,
  optionalEnumField,
  parseBody,
  parseParams,
  positiveIntField,
  stringField,
  type FieldParser,
} from "../../../../../shared/http/requestValidation";
import type { BulkQuizLabelAction, BulkQuizLabelOperation } from "../../../application/quizPorts";

const dedupeStringArrayField = (): FieldParser<string[] | undefined> =>
  arrayField(stringField(), {
    optional: true,
    defaultValue: [],
    dedupeBy: (entry) => entry,
  });

const dedupePositiveIntArrayField = (): FieldParser<number[]> =>
  (value, fieldName) => {
    if (!Array.isArray(value)) {
      throw new RequestValidationError(`${fieldName} must be an array.`);
    }

    const ids = [...new Set(value.map((entry, index) => positiveIntField()(entry, `${fieldName}[${index}]`)))];

    if (ids.length === 0) {
      throw new RequestValidationError(`${fieldName} must not be empty.`);
    }

    return ids;
  };

const optionalTrimmedStringField =
  (): FieldParser<string | undefined> =>
  (value, fieldName) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== "string") {
      throw new RequestValidationError(`${fieldName} must be a string.`);
    }

    const normalized = value.trim();
    return normalized === "" ? undefined : normalized;
  };

const optionalBooleanField =
  (): FieldParser<boolean | undefined> =>
  (value, fieldName) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== "boolean") {
      throw new RequestValidationError(`${fieldName} must be a boolean.`);
    }

    return value;
  };

const bulkLabelOperationField =
  (): FieldParser<BulkQuizLabelOperation | undefined> =>
  (value, fieldName) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    const operation = objectField({
      action: optionalEnumField(["add", "remove", "replace", "clear"] as const),
      values: dedupeStringArrayField(),
    })(value, fieldName) as {
      action: BulkQuizLabelAction | undefined;
      values: string[] | undefined;
    };

    if (!operation.action) {
      throw new RequestValidationError(`${fieldName}.action is required.`);
    }

    if (operation.action !== "clear" && (!operation.values || operation.values.length === 0)) {
      throw new RequestValidationError(`${fieldName}.values must not be empty for ${operation.action}.`);
    }

    return operation.action === "clear"
      ? { action: "clear" }
      : {
          action: operation.action,
          values: operation.values ?? [],
        };
  };

export const parseQuizIdParams = (value: unknown) =>
  parseParams(value, {
    id: positiveIntField(),
  });

export const parseTagNameParams = (value: unknown) =>
  parseParams(value, {
    tagName: stringField(),
  });

export const parseGroupNameParams = (value: unknown) =>
  parseParams(value, {
    groupName: stringField(),
  });

export const parseCreateQuizBody = (value: unknown) =>
  parseBody(value, {
    word: stringField(),
    mean: stringField(),
    tag: dedupeStringArrayField(),
    groupName: optionalTrimmedStringField(),
    questionText: optionalTrimmedStringField(),
    hint: optionalTrimmedStringField(),
    choices: dedupeStringArrayField(),
    isFavorite: optionalBooleanField(),
  });

export const parseUpdateQuizBody = parseCreateQuizBody;

export const parseBulkUpdateQuizLabelsBody = (value: unknown) => {
  const parsed = parseBody(value, {
    quizIds: dedupePositiveIntArrayField(),
    tags: bulkLabelOperationField(),
    groups: bulkLabelOperationField(),
  });

  if (!parsed.tags && !parsed.groups) {
    throw new RequestValidationError("Request body must include tags or groups.");
  }

  return parsed;
};
