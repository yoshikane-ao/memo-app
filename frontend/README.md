# Memo Frontend

Vue 3 + TypeScript + Vite frontend for the memo app.

## Runtime Shape

- `src/app/router/index.ts` is the app-level router entry point.
- `/` redirects to `/menu`.
- `src/app/router/appRegistry.ts` aggregates app definitions into menu cards and app routes.
- `src/layouts/MenuLayout.vue` provides the shared shell for all `/menu/...` routes.
- `src/pages/menu/MenuHomePage.vue` is the launcher page.
- `src/apps/memoApp` groups all memo-specific pages, features, and styles.
- `src/apps/memoApp/index.ts` is the memo app public entry point.
- `src/apps/memoApp/routes.ts` owns the memo app menu metadata and route creation.
- `src/apps/memoApp/pages/MemoPage.vue` is the memo app screen under `/menu/workspace/memo`.
- `src/apps/memoApp/pages/MemoTrashPage.vue` is the trash screen under `/menu/workspace/memo/trash`.
- `src/apps/memoApp/pages/useMemoPageSetup.ts` owns page startup work:
  - initial memo load
  - history reset
  - shortcut registration
- `src/apps/memoApp/features/memo/model/useMemoHistoryCommands.ts` is the public command facade.
  - memo commands are split into `memoCommandHandlers.ts`
  - tag commands are split into `tagCommandHandlers.ts`
- `src/apps/memoApp/features/memo/model/useMemoStore.ts` and `src/apps/memoApp/features/tag/model/useTagStore.ts`
  are read/load oriented stores.
- `src/apps/memoApp/styles/index.css` is the memo app-local stylesheet entry point.
- `../tooling/tsconfig/base.json` provides shared TypeScript defaults used by the frontend config files.
- `src/shared/history/useHistoryManager.ts` uses Pinia-backed state for undo/redo.
- `src/shared/api/client.ts` and `src/shared/api/apiError.ts` normalize API responses and errors.

## Environment

Copy `.env.example` to `.env` if you need a custom API setting.

```text
# VITE_API_BASE_URL=
# API_PROXY_TARGET=http://127.0.0.1:3004
```

By default, the Vite dev server reads `../backend/.env` and proxies API requests to that backend port.
When the app is served behind the bundled nginx proxy, a custom base URL is optional.

## Verification

- `npm run test:unit` runs component tests, store/command tests, API error tests, and the Vite proxy smoke test.
- `npm run test:e2e` runs a Playwright browser smoke test against a test-only backend and static frontend server, including trash/restore coverage.
- `npm run build` runs `vue-tsc` and the production Vite build.

## Commands

```powershell
npm install
npm run dev
npm run test:unit
npm run test:e2e
npm run build
```
