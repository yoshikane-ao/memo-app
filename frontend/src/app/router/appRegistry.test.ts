import { describe, expect, it } from "vitest";
import {
  buildMenuAppPath,
  findMenuAppById,
  menuAppRegistry,
  menuSectionGroups,
} from "./appRegistry";

describe("appRegistry", () => {
  it("builds stable menu app paths", () => {
    expect(buildMenuAppPath("workspace", "memo")).toBe("/menu/workspace/memo");
  });

  it("groups menu apps by section and exposes the memo path", () => {
    expect(menuAppRegistry).toHaveLength(1);
    expect(menuSectionGroups).toEqual([
      expect.objectContaining({
        section: {
          slug: "workspace",
          label: "作業スペース",
          description: "記録や整理に使うアプリを、ここからまとめて開けます。",
        },
        apps: [
          expect.objectContaining({
            id: "memo",
            path: "/menu/workspace/memo",
          }),
        ],
      }),
    ]);
  });

  it("looks up apps by id", () => {
    expect(findMenuAppById("memo")?.name).toBe("メモ");
    expect(findMenuAppById("missing")).toBeNull();
  });
});
