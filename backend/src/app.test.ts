jest.mock("./memoApp/memos/memosRouter", () => {
  const express = require("express");
  return {
    memosRouter: express.Router(),
  };
});

jest.mock("./memoApp/tags/tagsRouter", () => {
  const express = require("express");
  return {
    tagsRouter: express.Router(),
  };
});

import request from "supertest";
import { buildApp } from "./app";

describe("buildApp", () => {
  it("returns 200 from /health", async () => {
    const app = buildApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns 404 for unknown routes", async () => {
    const app = buildApp();
    const response = await request(app).get("/missing-route");

    expect(response.status).toBe(404);
  });
});
