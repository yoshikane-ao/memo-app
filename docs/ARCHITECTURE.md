# Architecture Overview

See [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md) for the active guardrails and reference-scope rules.

## Top Level

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

- `backend` contains the active API service.
- `frontend` contains the active Vue application.
- `docs` holds architecture and project documentation.
- `tooling` holds shared project scripts such as architecture checks.
- `.github/workflows/deploy.yml` now runs validation before deployment.

## Active Runtime Structure

### Backend

```text
backend/src/
|- app.ts
|- server.ts
|- config.ts
|- db.ts
|- features/
|  |- memo/
|  |  |- application/
|  |  |- infrastructure/
|  |  |- presentation/http/
|  |  `- index.ts
|  `- quiz/
|- shared/
|- test/
`- types/
```

- `app.ts` mounts `/health`, `/memos`, `/tags`, and `/quiz`.
- `features/memo` is the backend reference feature.
- `features/quiz` is also part of the backend reference scope.
- `features/memo/index.ts` composes repositories, use cases, and routers.
- `features/memo/application` owns framework-agnostic ports and use-case factories.
- `features/memo/infrastructure` owns Prisma-backed repositories.
- `features/memo/presentation/http` owns request parsing and Express routing only.
- `features/quiz/index.ts` now composes repositories, use cases, and routers through the same boundary pattern.
- `features/quiz/application` owns framework-agnostic ports and use-case factories.
- `features/quiz/infrastructure` owns Prisma-backed repositories.
- `features/quiz/presentation/http` owns request parsing and Express routing only.
- Legacy `src/memoApp` and `src/tradeApp` trees were removed.

### Frontend

```text
frontend/src/
|- app/router/
|- apps/
|  |- memoApp/
|  |  |- features/
|  |  |  |- memo/
|  |  |  |- tag/
|  |  |  `- view/
|  |  |- pages/
|  |  |- styles/
|  |  |- routes.ts
|  |  `- index.ts
|  |- quiz-app/
|  |- testApp/
|  `- tradeApp/
|- layouts/
|- pages/menu/
|- shared/
|- styles/
`- test/
```

- `app/router` owns the top-level menu router and app registry.
- `apps/memoApp` is the frontend reference app boundary.
- `apps/memoApp/features/memo` owns memo list, composer, toolbar, commands, state, and repositories.
- `apps/memoApp/features/tag` now uses:
  - `containers/` for tag selection/filter/editor orchestration
  - `ui/` for tag presenter components and popovers
  - `model/` for tag state
  - `application/` for tag command hooks
  - `infrastructure/` for tag API access
  - `types.ts` for feature-public types
- `apps/memoApp/features/view` owns memo view scope state and navigation helpers.
- `apps/memoApp/pages/useMemoPageSetup.ts` is the page-level load boundary for memo and tag bootstrap.
- `apps/quiz-app` is also in the frontend reference scope.
- `apps/quiz-app/features/quiz` uses `application/`, `containers/`, `infrastructure/`, `model/`, `ui/`, and `index.ts`.
- Quiz initial load now lives in containers, while application hooks stay lifecycle-free.
- `apps/tradeApp` now routes through `pages/` and a feature public surface, but remains transitional because most internals still live in app-level technical directories.
- `apps/testApp` now routes through `pages/` and `features/pipeline`, but remains a lightweight playground app rather than a reference feature.
- `tradeApp` and `testApp` remain available but are not the reference frontend architecture for this phase.

## Frontend Composition Flow

```text
router
-> menu layout
-> memo app shell
-> page setup
-> feature containers
-> feature ui
-> feature application / model
-> feature infrastructure
-> backend API
```

- `MemoPage.vue` and `MemoTrashPage.vue` consume the memo feature through its public surface.
- Tag orchestration now lives in tag containers, not in tag presenter components.
- Presenter components emit events upward; containers own store reads, command execution, and confirmation flows.
- Application hooks stay lifecycle-free; first-load responsibility lives in page setup or containers.
- All mounted app routes now enter through `pages/`, not directly through `application/`, `model/`, or `infrastructure/`.

## Source Of Truth

- Runtime entrypoints:
  - `backend/src/app.ts`
  - `frontend/src/app/router/index.ts`
- Reference rules:
  - `docs/ARCHITECTURE_RULES.md`
- Guardrail script:
  - `tooling/check-architecture.mjs`
- Validation workflow:
  - `.github/workflows/deploy.yml`
