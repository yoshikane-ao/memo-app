import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./copyText";

describe("copyText", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("uses the Clipboard API when available", async () => {
    const writeText = vi.mocked(navigator.clipboard.writeText);

    await copyText("Alpha");

    expect(writeText).toHaveBeenCalledWith("Alpha");
  });

  it("falls back to execCommand when the Clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.mocked(document.execCommand).mockReturnValue(true);

    await copyText("Alpha");

    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("throws when neither Clipboard API nor execCommand copy is available", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    vi.mocked(document.execCommand).mockReturnValue(false);

    await expect(copyText("Alpha")).rejects.toThrow("Fallback copy failed.");
  });
});
