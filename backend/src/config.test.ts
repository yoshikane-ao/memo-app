import { createConfig } from "./config";

describe("createConfig", () => {
  it("uses defaults when env values are missing", () => {
    expect(createConfig({})).toEqual({
      host: "0.0.0.0",
      port: 3004,
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 60,
    });
  });

  it("parses valid env values", () => {
    expect(
      createConfig({
        HOST: "127.0.0.1",
        PORT: "3000",
        RATE_LIMIT_WINDOW_MS: "120000",
        RATE_LIMIT_MAX_REQUESTS: "120",
      })
    ).toEqual({
      host: "127.0.0.1",
      port: 3000,
      rateLimitWindowMs: 120000,
      rateLimitMaxRequests: 120,
    });
  });

  it("falls back when numeric env values are invalid", () => {
    expect(
      createConfig({
        HOST: " ",
        PORT: "not-a-number",
        RATE_LIMIT_WINDOW_MS: "-1",
        RATE_LIMIT_MAX_REQUESTS: "0",
      })
    ).toEqual({
      host: "0.0.0.0",
      port: 3004,
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 60,
    });
  });
});
