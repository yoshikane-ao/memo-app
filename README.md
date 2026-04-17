# Memo App

Memo management application with a Vue frontend and an Express + Prisma backend.

## Structure

```text
memo-app/
|- .github/
|- backend/
|- docs/
|- frontend/
|- tooling/
|- docker-compose.yml
`- README.md
```

- `backend` serves the API.
- `docs` holds project documentation such as the architecture overview.
- `frontend` serves the web UI.
- `tooling` holds shared configuration such as base TypeScript settings.
- `docs/ARCHITECTURE.md` describes the active directory structure and component design.
- `.github/workflows/deploy.yml` validates backend and frontend before deploy.
- Root-level files are intentionally kept minimal: repository metadata, docs entry points, and cross-project orchestration only.

## Runtime Flow

- Frontend boot starts at `frontend/src/app/router/index.ts`.
- `/` redirects to `/menu`.
- `/menu` renders the app menu, and app pages live under `/menu/{section}/{app}`.
- The memo app currently exposes `/menu/workspace/memo` and `/menu/workspace/memo/trash`.
- `frontend/src/app/router/appRegistry.ts` aggregates app definitions.
- `frontend/src/layouts/MenuLayout.vue` provides the shared menu shell.
- `frontend/src/pages/menu/MenuHomePage.vue` renders the app launcher.
- `frontend/src/apps/memoApp` is the memo app boundary for pages, features, and styles.
- `frontend/src/apps/quiz-app` is the quiz app boundary for pages, features, and styles.
- `frontend/src/apps/tradeApp` now exposes thin `pages/` wrappers over its internal trade feature boundary.
- `frontend/src/apps/testApp` now uses `pages/` plus `features/pipeline` instead of a direct root component route.
- `frontend/src/apps/memoApp/routes.ts` owns memo app menu metadata and route creation.
- `frontend/src/apps/memoApp/index.ts` is the memo app public entry point for the shared router.
- `frontend/src/apps/memoApp/features/tag` separates `containers/`, `ui/`, `model/`, `application/`, `infrastructure/`, and `types.ts`.
- `frontend/src/apps/memoApp/pages/useMemoPageSetup.ts` handles first load for memos and tags.
- `frontend/src/apps/quiz-app/features/quiz/containers` own initial quiz load and bootstrap.
- `frontend/src/apps/tradeApp/pages` and `frontend/src/apps/testApp/pages` stay thin and consume feature public surfaces.
- Write operations flow through `useMemoHistoryCommands`:
  - memo writes live in `features/memo/application`
  - tag writes live in `features/tag/application`
- Quiz page, start, and answer orchestration lives in `frontend/src/apps/quiz-app/features/quiz/application`.
- App-level pages across `frontend/src/apps/*` avoid direct imports from `application/`, `model/`, and `infrastructure/`.
- Read/load state lives in Pinia stores:
  - `useMemoStore.ts`
  - `useTagStore.ts`
  - `useQuizSessionStore.ts`
- API requests are normalized at `frontend/src/shared/api/client.ts` and `apiError.ts`.
- Backend boot starts at `backend/src/app.ts` and `backend/src/server.ts`.
- Backend runtime configuration comes from `backend/src/config.ts`.
- `backend/src/features/memo` is the backend reference feature using `application/`, `infrastructure/`, `presentation/http/`, and `index.ts`.
- `backend/src/features/quiz` follows the same feature composition pattern with framework-agnostic ports in `application/`.
- `backend/src/features/memo/application` stays free of Prisma-generated types; mapping to database models happens in `infrastructure/`.
- `backend/src/features/quiz/application` also stays free of Prisma-generated types; `trade` and `test` remain outside the reference scope.

## Local Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `DATABASE_URL` for your local PostgreSQL instance.
3. Optionally override:
   - `HOST`
   - `PORT`
   - `RATE_LIMIT_WINDOW_MS`
   - `RATE_LIMIT_MAX_REQUESTS`

Run:

```powershell
cd backend
npm install
npm run build
npm run test:api
npm run dev
```

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Usually you can leave API settings unset and use relative requests.
   During local development, Vite proxies `/health`, `/memos`, and `/tags`
   to the backend port from `backend/.env`.
3. Only set `VITE_API_BASE_URL` or `API_PROXY_TARGET` if you need to override that default.
   If neither is set, the fallback target is `http://127.0.0.1:3004`.

Run:

```powershell
cd frontend
npm install
npm run build
npm run test:unit
npm run dev
```

## Docker

`docker-compose.yml` starts:

- PostgreSQL
- backend API
- frontend web server

Run:

```powershell
docker compose up --build
```

When the frontend is served behind the bundled nginx proxy, API requests can use relative paths and do not require a local `.env` override.

## Verification

Backend:

```powershell
cd backend
npm run check:architecture
npm run test:api
npm run build
```

Backend env example:

```text
HOST=0.0.0.0
PORT=3004
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
DATABASE_URL="postgresql://postgres:password@localhost:5432/memo?schema=public"
```

Frontend:

```powershell
cd frontend
npm run check:architecture
npm run test:unit
npm run test:e2e
npm run build
```

Frontend unit coverage includes component behavior, store/command tests, page setup tests,
API error normalization, and a Vite proxy smoke test for `/health`, `/memos`, and `/tags`.
Frontend browser coverage also includes a Playwright smoke test for initial memo load,
memo creation, trash, restore, and reload persistence through a test-only backend/server pair.
