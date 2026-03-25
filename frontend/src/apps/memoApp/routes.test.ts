import { describe, expect, it } from "vitest";
import { memoAppDefinition, memoPaths } from "./routes";

describe("memoAppDefinition", () => {
  it("exposes the memo menu entry as the app public definition", () => {
    expect(memoAppDefinition.entry).toMatchObject({
      id: "memo",
      slug: "memo",
      name: "メモ",
      section: {
        slug: "workspace",
      },
    });
  });

  it("creates the memo and trash routes inside the shared /menu shell", () => {
    expect(memoPaths).toEqual({
      active: "/menu/workspace/memo",
      trash: "/menu/workspace/memo/trash",
    });
    expect(memoAppDefinition.createRoutes()).toEqual([
      expect.objectContaining({
        path: "workspace/memo",
        name: "menu-workspace-memo",
        meta: expect.objectContaining({
          pageTitle: "メモ | アプリ一覧",
          menuAppId: "memo",
          menuSectionSlug: "workspace",
        }),
      }),
      expect.objectContaining({
        path: "workspace/memo/trash",
        name: "menu-workspace-memo-trash",
        meta: expect.objectContaining({
          pageTitle: "ごみ箱 | メモ",
          menuAppId: "memo",
          menuSectionSlug: "workspace",
        }),
      }),
    ]);
  });
});
