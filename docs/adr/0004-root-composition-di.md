# ADR 0004: DI は root composition に一元化し、feature index は factory だけを公開する

- Status: Accepted
- Date: 2026-04-21
- Deciders: core maintainers

## Context

旧実装では、各 `backend/src/features/*/index.ts` が import された瞬間に
repository と useCase、router を singleton として生成していた。
利点は「app.ts での記述量が少ない」だけで、副作用は以下のとおり大きい。

- テストから依存を差し替えるには `jest.mock` で module 全体を hijack する
  必要があり、コード側の構造と乖離した mocking 知識を要求する。
- feature 単位の `index.ts` に「factory 定義」と「インスタンス化」が
  同居しており、ポート／アダプターの組み立て手順がプロジェクトルートから
  一望できない。
- 起動時に不要な外部接続（Prisma クライアント等）が初期化される恐れが
  常にあり、テスト実行時にも副作用が混入しやすい。

「ヘキサゴナル構造で依存方向を内向きにし、DI の過剰利用を避けつつ
リソース制約下で現実的に動かす」という設計方針を満たすには、DI ライブラリ
（Dagger/Hilt など）を導入せず、プレーンな factory 関数による root
composition を採る選択が整合する。

## Decision

- `backend/src/composition/container.ts` に `createContainer()` を実装し、
  `AppContainer` 型として `authMiddleware`、`authRouter`、`memosRouter`、
  `tagsRouter`、`quizRouter`、`ensureDemoUser` を返す。
- 各 `features/*/index.ts` は factory 関数と型だけを export し、
  module load 時に副作用を起こさない。
- `app.ts` は `buildApp(container = createContainer())` を受け取り、
  `registerRoutes(app, container)` でミドルウェアとルートを注入する。
- `server.ts` と `test/e2eApiServer.ts` は `createContainer()` を
  呼び出して `ensureDemoUser` にアクセスする。
- テストは `buildTestContainer()` を渡す純粋な依存性注入で記述する
  （`app.test.ts` を `jest.mock('./features/memo')` 方式から刷新）。
- 外部 DI ライブラリは導入しない。

## Consequences

- すべての依存関係の組み立て手順が `composition/container.ts` に集約され、
  レビュー時の視認性が上がる。
- テストは mock ライブラリに頼らず、同じ shape の `AppContainer` を
  組み立てるだけで差し替えできる。
- feature 内部から singleton を取得していた既存テスト
  （`quizRouter.test.ts` など）は factory を呼び出す形に置き換えが必要。
- 将来のテスト用に `createTestContainer()` を追加することも容易
  （今回は buildTestContainer を app.test.ts に閉じた）。
- 外部 DI を導入しないため、リゾルブの型安全性は TypeScript の
  `ReturnType` 合成だけで担保される。
