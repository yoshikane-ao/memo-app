# ADR 0002: Presenter と Container を物理・論理の両面で完全分離する

- Status: Accepted
- Date: 2026-04-20
- Deciders: core maintainers

## Context

フロントエンドのコンポーネント設計方針は、以下を絶対基準として掲げている。

- 単一責任（SRP）と SOLID に従い、機能的焦点を絞る
- 継承ではなくコンポジションを優先する
- 視覚的な構成要素と、データ取得・状態管理を「物理的・論理的に完全に分離」する
- 単方向データフローを厳守する

この方針を実装に落とすには、「Presenter は `props + emits` の純粋な表示
コンポーネント」「Container は状態管理・副作用・派生データ計算を担う」と
いう役割分担を境界ごと強制し、CI で逸脱を検知する必要がある。

memoApp は Phase 2 以前からこの分離を満たしていた。一方、tradeApp では
`view/ActionPanel.vue` が `reactive` ドラフトを持ち、かつ `model/` の
ビジネス関数（`resolveTradeImpactPattern`, `calculateTradePositionPnL`）を
直接呼び出していた。その結果、ui/ が model/ に依存し、ドメインの計算と
描画が同じモジュールに詰まっていた。

## Decision

- `ui/` は以下のモジュールのみを import してよい：
  - `vue`、他の `ui/` ファイル
  - 同ディレクトリの `./types`
  - feature 公開型 `../types`（`model/` からの re-export を含む）
  - `shared/ui`、`shared/format`、`shared/copy`、`shared/composables`
- `ui/` が次を import することを禁じる：
  - `application/**`、`model/**`、`infrastructure/**`
  - `shared/api`、`shared/command`、`shared/history`、`shared/feedback/useFeedbackStore`
  - 任意の `use*Store`
- 業務ロジックは Container 層で計算し、precomputed な値（整形済みテキスト、
  `PlayerPanelPositionRow`、`ActionPanelImpactPatterns` など）を prop として
  ui に渡す。
- 上記ルールを `tooling/check-architecture.mjs` の memoApp 限定ルールから
  `frontend/src/apps/{memoApp,tradeApp}/ui` に拡張し CI で強制する。
- フォーマッタ（`formatCurrency`、`formatSignedCurrency` など）は
  `shared/format/currency.ts` に集約する。`model/gameCalculations.ts` は
  これらを re-export するだけの薄い層とし、ui も model も同じ実装を共有する。

## Consequences

- tradeApp の `ActionPanel.vue` から `reactive form` の両方向バインドは
  残したが、`resolveTradeImpactPattern` の呼び出しは Container に移した。
  `PlayerPanel.vue` も `positionRows` を precomputed に受け取る形へ改めた。
- `containers/TradeBattleScreen.vue` が `buildPlayerPanelPositionRows`、
  `actionImpactPatterns` を `computed` で算出して ui へ渡す。
- ui の純粋化により、再利用・置換・ストーリーブック化が容易になった。
- 境界違反は `npm run check:architecture` で検知される。
