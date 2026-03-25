import {
  arrayField,
  dateField,
  objectField,
  optionalEnumField,
  parseBody,
  parseNonNegativeInt,
  parseObject,
  parseOptionalNonNegativeInt,
  parseOptionalPositiveInt,
  parseOptionalStringArray,
  parsePositiveInt,
  parseQuery,
  parseRequiredString,
  positiveIntField,
  RequestValidationError,
  requireBodyRecord,
  stringField,
} from "./requestValidation";

describe("requestValidation", () => {
  it("requires a record body", () => {
    expect(() => requireBodyRecord(null)).toThrow(RequestValidationError);
    expect(() => requireBodyRecord([])).toThrow("Request body must be a JSON object.");
    expect(requireBodyRecord({ ok: true })).toEqual({ ok: true });
  });

  it("parses required strings and trims by default", () => {
    expect(parseRequiredString("  memo  ", "title")).toBe("memo");
    expect(parseRequiredString("  memo  ", "content", { trim: false })).toBe("  memo  ");
    expect(() => parseRequiredString("", "title")).toThrow("title is required.");
  });

  it("parses positive integers from strings or numbers", () => {
    expect(parsePositiveInt(12, "memoId")).toBe(12);
    expect(parsePositiveInt("12", "memoId")).toBe(12);
    expect(() => parsePositiveInt(0, "memoId")).toThrow("memoId must be a positive integer.");
  });

  it("parses non-negative integers from strings or numbers", () => {
    expect(parseNonNegativeInt(0, "orderIndex")).toBe(0);
    expect(parseNonNegativeInt("3", "orderIndex")).toBe(3);
    expect(() => parseNonNegativeInt(-1, "orderIndex")).toThrow(
      "orderIndex must be a non-negative integer."
    );
  });

  it("parses optional non-negative integers", () => {
    expect(parseOptionalNonNegativeInt(undefined, "width")).toBeUndefined();
    expect(parseOptionalNonNegativeInt(null, "width")).toBeNull();
    expect(parseOptionalNonNegativeInt("0", "width")).toBe(0);
    expect(() => parseOptionalNonNegativeInt(-1, "width")).toThrow(
      "width must be a non-negative integer."
    );
  });

  it("parses optional positive integers", () => {
    expect(parseOptionalPositiveInt(undefined, "memoId")).toBeUndefined();
    expect(parseOptionalPositiveInt(null, "memoId")).toBeNull();
    expect(parseOptionalPositiveInt("4", "memoId")).toBe(4);
    expect(() => parseOptionalPositiveInt(0, "memoId")).toThrow(
      "memoId must be a positive integer."
    );
  });

  it("parses and de-duplicates string arrays", () => {
    expect(parseOptionalStringArray([" work ", "home", "work"], "tags")).toEqual([
      "work",
      "home",
    ]);
    expect(() => parseOptionalStringArray("work", "tags")).toThrow("tags must be an array.");
  });

  it("parses schema-shaped bodies with nested arrays and objects", () => {
    const parsed = parseBody(
      {
        id: 1,
        memo_tags: [
          {
            tag: {
              id: 2,
              title: "work",
            },
          },
        ],
      },
      {
        id: positiveIntField(),
        memo_tags: arrayField(
          objectField({
            tag: objectField({
              id: positiveIntField(),
              title: stringField(),
            }),
          })
        ),
      }
    );

    expect(parsed).toEqual({
      id: 1,
      memo_tags: [
        {
          tag: {
            id: 2,
            title: "work",
          },
        },
      ],
    });
  });

  it("uses nested field paths in schema validation errors", () => {
    expect(() =>
      parseBody(
        {
          memo_tags: [
            {
              tag: {
                id: 0,
                title: "work",
              },
            },
          ],
        },
        {
          memo_tags: arrayField(
            objectField({
              tag: objectField({
                id: positiveIntField(),
                title: stringField(),
              }),
            })
          ),
        }
      )
    ).toThrow("memo_tags[0].tag.id must be a positive integer.");
  });

  it("parses query schemas with enum defaults", () => {
    const parsed = parseQuery(
      { q: " memo ", type: "" },
      {
        q: stringField(),
        type: optionalEnumField(["all", "title", "content", "tag"] as const, {
          defaultValue: "all",
        }),
      }
    );

    expect(parsed).toEqual({ q: "memo", type: "all" });
    expect(() =>
      parseQuery(
        { q: "memo", type: "invalid" },
        {
          q: stringField(),
          type: optionalEnumField(["all", "title"] as const),
        }
      )
    ).toThrow("type must be one of: all, title.");
  });

  it("parses object schemas and date fields", () => {
    const parsed = parseObject(
      {
        createdAt: "2026-03-20T10:00:00.000Z",
      },
      {
        createdAt: dateField(),
      },
      "memo"
    );

    expect(parsed.createdAt).toBeInstanceOf(Date);
    expect(parsed.createdAt.toISOString()).toBe("2026-03-20T10:00:00.000Z");
  });
});
