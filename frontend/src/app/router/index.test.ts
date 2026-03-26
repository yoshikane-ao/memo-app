import { afterEach, describe, expect, it } from "vitest";
import { createMemoryHistory } from "vue-router";
import { createAppRouter } from "./index";

describe("app router", () => {
  afterEach(() => {
    document.title = "";
  });

  it("redirects the root path to /menu", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/");
    await router.isReady();

    expect(router.currentRoute.value.fullPath).toBe("/menu");
    expect(document.title).toBe("Memo App");
  });

  it("resolves the memo app under the menu section path", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/menu/workspace/memo");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("menu-workspace-memo");
    expect(router.currentRoute.value.meta.menuAppId).toBe("memo");
    expect(document.title).toBe("メモ | アプリ一覧");
  });

  it("resolves the memo trash page under the menu section path", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/menu/workspace/memo/trash");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("menu-workspace-memo-trash");
    expect(router.currentRoute.value.meta.menuAppId).toBe("memo");
    expect(document.title).toBe("ごみ箱 | メモ");
  });
});
