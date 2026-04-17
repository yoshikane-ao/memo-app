import { describe, expect, it } from "vitest";
import { parseQuizTags } from "./quizDraft";

describe("parseQuizTags", () => {
  it("splits, trims, and deduplicates tags", () => {
    expect(parseQuizTags(" work, review\nwork、focus ")).toEqual(["work", "review", "focus"]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseQuizTags(" , \n ")).toEqual([]);
  });
});
