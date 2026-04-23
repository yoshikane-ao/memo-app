# Architecture Rules

## Summary

- The default unit of organization is a feature, not a technical layer.
- Reference implementations (follow the full set of rules):
  - `backend/src/features/{auth,memo,quiz}`
  - `frontend/src/apps/{memoApp,quiz-app,tradeApp}`
- Non-reference scope (kept minimal, not the target architecture):
  - `frontend/src/apps/testApp`
  - any remaining legacy directories that are not mounted from runtime entrypoints
- `shared/` is reserved for true cross-feature primitives only.
- Root DI composition lives in `backend/src/composition/container.ts`. Each feature `index.ts` exposes factories, never module-scope singletons.

## Reference Scope

- Backend reference scope:
  - `backend/src/features/auth`
  - `backend/src/features/memo`
  - `backend/src/features/quiz`
- Frontend reference scope:
  - `frontend/src/apps/memoApp`
  - `frontend/src/apps/quiz-app`
  - `frontend/src/apps/tradeApp`

## Shared Definition

- `shared/` may contain only:
  - base UI and design-system primitives (`shared/ui/`)
  - generic utilities (`shared/composables/`, `shared/format/`, `shared/copy/`)
  - HTTP client foundations (`shared/api/`)
  - authentication and error primitives
  - command/history infrastructure used by features (`shared/command/`, `shared/history/`)
  - cross-feature types
- `shared/` must not contain:
  - feature-specific business rules
  - feature-specific hooks
  - feature-specific DTOs
  - screen-specific components
- `shared/format/` owns locale-aware formatters (currency, signed numbers) so that both `model/` and `ui/` can reuse the same implementation without ui having to reach into a feature's model.

## Layer Usage

### Frontend reference features

- `containers/` — orchestration, commands, store wiring, user confirmations, lifecycle (`onMounted`/`onBeforeUnmount` live here or in pages)
- `ui/` — presenter-only components, props + emits, no business logic, no store access
- `components/` — bucket-named primitives reusable within the feature
- `model/` — feature state, pure state helpers, Pinia stores, value objects
- `application/` — feature orchestration hooks and command handlers; must stay lifecycle-free
- `infrastructure/` — HTTP and external IO adapters
- `types.ts` — feature-public types; re-exports `model/` types that `ui/` needs
- `domain/` — only when the feature has standalone domain rules that justify a dedicated layer

### Backend reference features

- `application/` — use-case factories, port interfaces (`*Ports.ts`), policy modules under `application/policies/`
- `infrastructure/` — repository implementations, external service adapters
- `presentation/http/` — request parsing, response mapping, route wiring (bundled via `{feature}Router.ts`)
- `index.ts` — feature public surface; exposes factories and types only
- Backend `application/` must not import ORM-generated types or concrete infrastructure modules; depend on ports.
- Use cases must not degrade to repository pass-through. When a method enforces state transitions, ownership, or cross-entity integrity, those rules belong in `application/policies/` and get invoked from the use case.

## Public Surface

- Each feature exposes a single public entry via `index.ts`.
- External code must import reference feature internals only through that public entry.
- Frontend pages must consume reference features through their public surface, not through `application/`, `model/`, or `infrastructure/` internals.
- Backend `index.ts` files export factories and types only. They must not instantiate repositories or routers at module load.
- `export *` from feature public entrypoints is forbidden.

## Root Composition (Backend)

- All dependency wiring happens in `backend/src/composition/container.ts` via `createContainer()`.
- `app.ts` accepts an optional `AppContainer` for test injection: `buildApp(container = createContainer())`.
- `server.ts` and `test/e2eApiServer.ts` obtain their `ensureDemoUser` from the container.
- No external DI library (Dagger/Hilt-equivalent). Factory functions composed at root are sufficient and keep the runtime footprint small.

## Presenter / Container Separation (Frontend)

- Single direction of data flow: `pages → containers → ui`. Events bubble upward via emits.
- Containers own reactive state, dispatch commands, and compute derived data; they pass immutable props down to UI.
- `ui/` components are pure presenters: props and emits only. They may import `vue`, sibling `ui/` files, local `./types`, the feature `../types`, and allowed `shared/` modules (`shared/format`, `shared/ui`, `shared/copy`, `shared/composables`).
- `ui/` must not import `application/`, `model/`, `infrastructure/`, `shared/api/`, `shared/command/`, `shared/history/`, `shared/feedback/useFeedbackStore`, or any `useXxxStore`.

## Current Guardrails (automated)

- `npm run check:architecture` in `frontend/` and `backend/`

The automated checks enforce:

- no `export *` in feature public entrypoints
- no direct `api/` or `infrastructure/` imports from frontend pages, ui, containers, or components
- no feature-owned imports from `shared/`
- reference frontend feature internals must not be imported from outside the same feature, except through `index.ts`
- `frontend/src/apps/*/pages` must not import `application/`, `model/`, or `infrastructure/` directly
- `frontend/src/apps/*/application` and `frontend/src/apps/*/features/*/application` must not own `onMounted` or teardown lifecycle hooks
- `frontend/src/apps/{memoApp,tradeApp}/ui` must not import `application/`, `model/`, `infrastructure/`, stores, or side-effect shared modules
- no direct `axios` import from frontend app code (use `shared/api` or feature `infrastructure/`)
- `backend/src/features/{memo,quiz}/application` must not import generated Prisma types
- `backend/src/features/{memo,quiz}/application` must not import `infrastructure/`
- `backend/src/features/{memo,quiz}/presentation/http` must not import `infrastructure/`, `db`, or Prisma directly
- `backend/src/app.ts` must import feature routes through the feature public entry (or the root container), never through an internal HTTP path
- backend feature `index.ts` may only export its intended public modules

## Related ADRs

- [0001 Package-by-Feature layout](./adr/0001-package-by-feature.md)
- [0002 Presenter/Container split and strict ui rule](./adr/0002-presenter-container-split.md)
- [0003 Application-layer policies for state transitions](./adr/0003-application-policies.md)
- [0004 Root-composition DI and feature factories](./adr/0004-root-composition-di.md)
