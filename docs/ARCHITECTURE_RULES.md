# Architecture Rules

## Summary

- The default unit of organization is a feature, not a technical layer.
- In this phase, `backend/src/features/{memo,quiz}` and `frontend/src/apps/{memoApp,quiz-app}` are the reference implementations.
- `trade` and `test` remain non-reference areas. They use the app-shell/page/public-surface pattern, but they do not define the target architecture.
- `shared/` is reserved for true cross-feature primitives only.

## Reference Scope

- Backend reference scope:
  - `backend/src/features/memo`
  - `backend/src/features/quiz`
- Frontend reference scope:
  - `frontend/src/apps/memoApp`
  - `frontend/src/apps/quiz-app`
- Non-reference scope:
  - `frontend/src/apps/tradeApp`
  - `frontend/src/apps/testApp`
  - any remaining legacy directories that are not mounted from runtime entrypoints

## Shared Definition

- `shared/` may contain only:
  - base UI and design-system primitives
  - generic utilities
  - HTTP client foundations
  - error primitives
  - cross-feature types
- `shared/` must not contain:
  - feature-specific business rules
  - feature-specific hooks
  - feature-specific DTOs
  - screen-specific components

## Layer Usage

- Frontend reference features use:
  - `containers/` for orchestration, commands, store wiring, and user confirmations
  - `ui/` for presenter-only components
  - `model/` for feature state and pure state helpers
  - `application/` for feature orchestration hooks and actions
  - `infrastructure/` for HTTP and external IO
  - `types.ts` for feature-public types used outside `model/`
- Backend reference features use:
  - `application/` for use-case factories and port interfaces
  - `infrastructure/` for repository implementations
  - `presentation/http/` for request parsing, response mapping, and route wiring
  - `index.ts` for feature composition
- Backend `application/` must not import ORM-generated types.
- Frontend `application/` stays lifecycle-free. Initial load and cleanup belong to pages or containers.
- Do not add layers only for symmetry.
- `domain/` is introduced only when the feature has standalone domain rules that justify it.

## Public Surface

- Each feature exposes a single public entry via `index.ts`.
- External code must import reference feature internals only through that public entry.
- Frontend pages must consume reference features through their public surface, not through `application/`, `model/`, or `infrastructure/` internals.
- `export *` from feature public entrypoints is forbidden.

## Current Guardrails

- `frontend npm run check:architecture`
- `backend npm run check:architecture`

The automated checks currently enforce:

- no `export *` in feature public entrypoints
- no direct `api/` or `infrastructure/` imports from frontend pages, ui, containers, or components
- no feature-owned imports from `shared/`
- reference frontend feature internals must not be imported from outside the same feature, except through `index.ts`
- `frontend/src/apps/*/pages` must not import `application/`, `model/`, or `infrastructure/` directly
- `frontend/src/apps/*/application` and `frontend/src/apps/*/features/*/application` must not own `onMounted` or teardown lifecycle hooks
- `frontend/src/apps/memoApp/ui` must not import `application/`, `model/`, `infrastructure/`, stores, or side-effect shared modules
- `backend/src/features/{memo,quiz}/application` must not import generated Prisma types
- `backend/src/features/{memo,quiz}/application` must not import `infrastructure/`
- `backend/src/features/{memo,quiz}/presentation/http` must not import `infrastructure/`, `db`, or Prisma directly
