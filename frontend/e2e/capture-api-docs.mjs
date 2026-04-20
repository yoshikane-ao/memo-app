// README 向け: /api/docs を開いてスクショを `docs/screenshots/api-docs.png` に保存する。
// 使い方（例）:
//   # バックエンドをローカルで起動しておいて
//   cd frontend
//   API_DOCS_URL=http://127.0.0.1:3004/api/docs/ node e2e/capture-api-docs.mjs
//   # または本番を直接叩く
//   API_DOCS_URL=http://3.104.123.11/api/docs/ node e2e/capture-api-docs.mjs
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outputPath = resolve(__dirname, '../../docs/screenshots/api-docs.png');
const target = process.env.API_DOCS_URL ?? 'http://127.0.0.1:3004/api/docs/';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto(target, { waitUntil: 'domcontentloaded' });
// Swagger UI は JS で動的描画されるので、タグセクションの出現を待つ。
await page.waitForSelector('.opblock-tag', { timeout: 60000 });
await page.waitForTimeout(800);

await page.screenshot({ path: outputPath, fullPage: false });
await browser.close();

console.log(`Saved: ${outputPath}`);
