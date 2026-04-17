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

  it("groups menu apps by section and exposes app paths", () => {
    expect(menuAppRegistry).toHaveLength(4);
    expect(menuSectionGroups).toEqual([
      expect.objectContaining({
        section: {
          slug: "workspace",
          label: "ワークスペース",
          description: "作成したアプリをここから開けます。",
        },
        apps: expect.arrayContaining([
          expect.objectContaining({
            id: "memo",
            path: "/menu/workspace/memo",
          }),
          expect.objectContaining({
            id: "quiz",
            path: "/menu/workspace/quiz",
          }),
          expect.objectContaining({
            id: "trade",
            path: "/menu/workspace/trade",
          }),
          expect.objectContaining({
            id: "test",
            path: "/menu/workspace/test",
          }),
        ]),
      }),
    ]);
  });

  it("looks up apps by id", () => {
    expect(findMenuAppById("memo")?.name).toBe("メモ");
    expect(findMenuAppById("missing")).toBeNull();
  });
});
