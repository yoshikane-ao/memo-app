import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { ApiRequestError, getApiErrorMessage, toApiRequestError } from "./apiError";

describe("apiError", () => {
  it("extracts backend messages from axios errors", () => {
    const error = new AxiosError(
      "Request failed with status code 400",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        config: {} as never,
        data: { message: "title is required." },
        headers: {},
        status: 400,
        statusText: "Bad Request",
      }
    );

    const normalized = toApiRequestError(error);

    expect(normalized).toBeInstanceOf(ApiRequestError);
    expect(normalized.message).toBe("title is required.");
    expect(normalized.status).toBe(400);
  });

  it("falls back to generic messages for unknown errors", () => {
    expect(getApiErrorMessage(new Error(""), "Failed to create memo.")).toBe("Failed to create memo.");
    expect(getApiErrorMessage("boom", "Failed to create memo.")).toBe("Failed to create memo.");
  });

  it("passes through explicit non-axios error messages", () => {
    expect(getApiErrorMessage(new Error("Network offline"), "Failed to load tags.")).toBe(
      "Network offline"
    );
  });
});
