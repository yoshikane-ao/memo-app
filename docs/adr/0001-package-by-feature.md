# ADR 0001: Package-by-Feature を既定レイアウトとする

- Status: Accepted
- Date: 2026-04-20
- Deciders: core maintainers

## Context

リポジトリ初期のころはフロント・バック共に `controllers/`、`services/`、
`models/` のような技術レイヤー別の配置が混在していた。機能を追加するたびに
横方向の変更量が膨らみ、1 つの機能を追うのに複数のレイヤーを横断する必要が
あり、ビジネスドメインがディレクトリ構造から読み取りづらくなっていた。

「ルートディレクトリを見た瞬間に、システムが扱うビジネスドメインが自明で
なければならない」という設計方針を満たすには、組織化の最小単位を機能
（feature）にそろえ、その内部で必要なレイヤーを閉じる必要がある。

## Decision

- ルート直下は機能軸で配置する。
  - backend: `backend/src/features/{auth,memo,quiz}`
  - frontend: `frontend/src/apps/{memoApp,quiz-app,tradeApp}`
    （各 app の下に `features/{featureName}/` を配置）
- 各機能パッケージは `application/`、`infrastructure/`、`presentation/http/`
  もしくは `ui/containers/components/model/application/infrastructure` の
  サブレイヤーを内側に閉じる。外部は `index.ts` 単一の公開面経由でしか
  触れない。
- `shared/` はドメインに属さない横断プリミティブ（UI 基底、HTTP クライアント、
  フォーマッタ、エラー型）のみを置く。`shared/` から機能内部を参照しない。
- `domain/` はスタンドアロンのドメインルールが積みあがったときにだけ導入する。
  ただ対称性のためだけに層を増やさない。

## Consequences

- 機能を追加するときは、その機能用の `features/<name>/` を切り、必要な
  レイヤーを内側に閉じるだけで済む。横断の影響範囲が小さくなる。
- 既存の `frontend/src/apps/tradeApp` 配下を `features/trade/` 構造に
  移行した（PR1〜PR3）。今後の `apps/testApp` なども同じ原則に従って整理する。
- `tooling/check-architecture.mjs` により feature 間の直接 import
  （index.ts 以外経由）は CI で失敗する。
- 小さな修正のときに「ここは feature 内部／ここは shared」の判断が
  必要になるが、その判断がそのままドメインを明確にするコストとなる。
