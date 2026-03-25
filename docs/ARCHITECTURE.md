# Architecture Overview

## Top Level

```text
memo-app/
|- backend/
|- docs/
|- frontend/
|- tooling/
|- docker-compose.yml
`- README.md
```

- `backend` is the active API service.
- `docs` holds project documentation that is useful to keep out of the runtime roots.
- `frontend` is the active Vue application.
- `tooling` holds shared project configuration such as base TypeScript settings.
- `docker-compose.yml` wires `db`, `api`, and `web`.
- There is no active root npm package. Runtime entry points live in `backend` and `frontend`.

## Active Runtime Structure

### Backend

```text
backend/
|- prisma/
|  |- schema.prisma
|  `- migrations/
`- src/
   |- app.ts
   |- server.ts
   |- config.ts
   |- db.ts
   |- memoApp/
   `- test/
```

- `src/app.ts` builds the Express app and mounts `/health`, `/memos`, and `/tags`.
- `src/server.ts` starts the HTTP server.
- `src/config.ts` is the backend runtime configuration source.
- `src/db.ts` owns the Prisma client.
- `src/memoApp/shared/requestValidation.ts` provides schema-style body, params, and query parsing.
- `src/memoApp/memos` contains the memo feature routes:
  - `list`
  - `register`
  - `update`
  - `delete`
  - `restore`
  - `purge`
  - `search`
  - `sort`
  - `layout`
- `src/memoApp/tags` contains the active tag feature routes and restore/link helpers.
- `src/memoApp/shared/syncSerialSequence.ts` keeps explicit ID restores safe after undo/redo restores.
- `src/test` contains lightweight backend test utilities.

### Frontend

```text
frontend/src/
|- app/
|  `- router/
|- apps/
|  `- memoApp/
|- main.ts
|- App.vue
|- layouts/
|- pages/
|  `- menu/
|- shared/
|- test/
`- styles/
```

- `main.ts` creates the Vue app, Pinia, and router.
- `app/router/index.ts` owns the top-level router and document title handling.
- `app/router/appRegistry.ts` aggregates app definitions into menu cards and `/menu/{section}/{app}` routes.
- `app/router/menuApp.types.ts` defines the shared menu app contract.
- `/` redirects to `/menu`.
- `apps/memoApp` is the memo app boundary.
  - `index.ts` is the memo app public entry point.
  - `routes.ts` owns memo app metadata and route creation.
  - `pages` contains memo app page composition and page setup helpers.
  - `features/memo` contains memo UI, store, repository, and command logic.
  - `features/tag` contains tag UI, store, repository, and tag selection/editing flows.
  - `styles/index.css` is the memo app-local stylesheet entry point.
  - `styles/theme.css`, `chrome.css`, `memo-fields.css`, `memo-composer.css`, `memo-list.css`, and `tag-ui.css` split memo styles by responsibility.
- `layouts/MenuLayout.vue` is the shared shell for all menu-based routes.
- `pages/menu/MenuHomePage.vue` renders the launcher page.
- `styles/menu-theme.css` holds shared menu tokens and keyframes.
- `layouts/menu-shell.css` holds the menu shell styles owned by `MenuLayout.vue`.
- `pages/menu/menu-home.css` holds launcher-specific menu styles owned by `MenuHomePage.vue`.
- `apps/memoApp/pages/MemoPage.vue` is the memo app screen composition root.
- `apps/memoApp/pages/MemoTrashPage.vue` is the memo trash screen composition root.
- `apps/memoApp/pages/useMemoPageSetup.ts` owns initial page loading and shortcut setup.
- `apps/memoApp/pages/useMemoListView.ts` owns local keyword/filter/sort projection for the memo list.
- `shared` contains reusable primitives:
  - API client
  - API error normalization
  - history manager
  - copy shortcuts
  - feedback banner
  - keyboard helpers
  - base UI elements
- `test` contains frontend test-only helpers such as Pinia activation utilities.
- `e2e` contains the browser smoke test and a lightweight static test server.
- `../tooling/tsconfig/base.json` provides shared TypeScript defaults for frontend and backend builds.

## Frontend Component Design

### Page Composition

`MenuLayout.vue` renders:

1. top-level menu header
2. route breadcrumb / summary
3. child `router-view`

`MenuHomePage.vue` renders:

1. launcher hero
2. section groups
3. app cards generated from `appRegistry`

`MemoPage.vue` renders:

1. `FeedbackBanner`
2. `MemoScopeTabs`
3. `MemoComposerContainer`
4. `MemoToolbar`
5. `MemoListContainer`

`MemoTrashPage.vue` renders:

1. `FeedbackBanner`
2. `MemoScopeTabs`
3. `MemoToolbar`
4. `MemoTrashListContainer`

### State and Commands

- `apps/memoApp/features/memo/model/useMemoStore.ts` stores loaded memo state and local memo mutations.
- `apps/memoApp/features/tag/model/useTagStore.ts` stores loaded tag state and local tag mutations.
- `apps/memoApp/features/memo/model/useMemoHistoryCommands.ts` is the command facade.
  - memo write commands live in `memoCommandHandlers.ts`
  - tag write commands live in `tagCommandHandlers.ts`
  - shared conversion/result helpers live in `commandHelpers.ts`
- `shared/history/useHistoryManager.ts` is the shared undo/redo engine backed by Pinia state.
- `shared/api/client.ts` is the HTTP boundary.
- `shared/api/apiError.ts` normalizes backend messages into UI-safe errors.

This means the current frontend architecture is:

```text
router -> menu layout -> page -> page setup -> feature containers -> command facade -> command handlers -> repository -> backend API
                                                     -> Pinia stores
                                                     -> shared history manager
```

### Memo Feature Breakdown

- `apps/memoApp/features/memo/components/MemoComposer*` handles creation inputs and selected tags.
- `apps/memoApp/features/memo/components/MemoToolbar` handles keyword search, search type, sort mode, and tag filtering.
- `apps/memoApp/features/memo/components/MemoList` handles active-list rendering, trash-list rendering, and reordering.
- `apps/memoApp/features/memo/components/MemoCard` handles inline edit, copy, save, trash, and per-memo tag editing.
- `apps/memoApp/features/memo/components/MemoTrashCard` handles restore and permanent delete actions for trashed memos.

### Tag Feature Breakdown

- `apps/memoApp/features/tag/components/TagSelectionSelect` is the tag picker used during memo creation.
- `apps/memoApp/features/tag/components/TagRelationEditor` is the tag editor used on an existing memo card.
- `apps/memoApp/features/tag/components/TagSearchPopover` is the shared tag picker popover shell.
- `apps/memoApp/features/tag/components/TagFilterSelect` is the toolbar tag filter.
- `apps/memoApp/features/tag/components/TagCatalogPanel` renders searchable tag choices and system tag deletion.
- `apps/memoApp/features/tag/components/MemoTagSourceTab` applies tags from another memo.

## Verification Coverage

- Frontend unit tests cover component behavior, stores, commands, page setup, API error normalization, and Vite proxy smoke behavior.
- Frontend browser smoke coverage runs through initial memo load, memo creation, trash, restore, and reload persistence with Playwright.
- Backend API tests cover app boot, config parsing, and selected route validation behavior.
- Backend `src/test/e2eApiServer.ts` provides a test-only in-memory Prisma substitute for browser smoke runs.

## Data Model

Active models in `backend/prisma/schema.prisma`:

- `Memos`
- `Tags`
- `memo_tags`
- `MemoHistories`

Current runtime usage:

- `Memos`, `Tags`, `memo_tags`, and `MemoHistories` are actively used.
- Memo width, height, ordering, and trash state (`deletedAt`) are handled directly on `Memos`.

## Source Of Truth

- Active Prisma migrations live in `backend/prisma/migrations`.
- Active backend environment settings are documented in `backend/.env.example`.
- Legacy top-level migration files under `C:\\personal-development\\migrations` were removed during cleanup.
- Empty or partially abandoned directories should not be treated as active architecture.

## Legacy Or Inactive Areas

Duplicate legacy API clients, unmounted legacy tag route modules, legacy migration files, and empty legacy directories were removed during cleanup.

Keep this distinction in mind before extending the application.

## Verification Commands

Backend:

```powershell
npm run test:api
npm run build
```

Frontend:

```powershell
npm run test:unit
npm run test:e2e
npm run build
```
