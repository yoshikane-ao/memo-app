import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const chromeExecutablePath =
  process.env.CHROME_EXECUTABLE_PATH ??
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : undefined);

const useSystemChrome =
  chromeExecutablePath && existsSync(chromeExecutablePath)
    ? { launchOptions: { executablePath: chromeExecutablePath } }
    : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4311",
    headless: true,
    trace: "on-first-retry",
    ...useSystemChrome,
  },
  webServer: [
    {
      command: "npm run e2e:serve",
      cwd: resolve(__dirname, "../backend"),
      url: "http://127.0.0.1:4310/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: "4310",
      },
    },
    {
      command: "npm run e2e:serve",
      cwd: __dirname,
      url: "http://127.0.0.1:4311",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: "4311",
        API_PROXY_TARGET: "http://127.0.0.1:4310",
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
