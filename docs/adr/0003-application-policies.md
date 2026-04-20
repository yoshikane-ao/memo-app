# ADR 0003: application 層に policies を置き、UseCase をパススルーにしない

- Status: Accepted
- Date: 2026-04-21
- Deciders: core maintainers

## Context

backend の `features/memo/application/memoUseCases.ts` は、ごみ箱移動・
復元・完全削除のたびに `memoRepository` のメソッドを呼び出すだけの
パススルー実装になっていた。スコープ遷移の正当性（「trash → restore は
実際に trash 状態のメモだけ許す」など）はどこにも明文化されていなかった
ため、ハンドラが誤って active メモを purge しても黙って通る状態だった。

「ヘキサゴナル構造でドメインロジックのコアを外部から独立させる」「ビジネス
ロジックのコアを application 層に寄せる」という設計方針を踏まえると、
状態遷移のガード条件は application 層で判定され、ポート経由で
infrastructure に委譲されるべきである。

## Decision

- 状態遷移の事前条件は `features/{feature}/application/policies/` 配下に
  純関数として配置する。
- policy は pure で、入力は値オブジェクト相当（`MemoDeletionState` など）。
  違反時は `RequestValidationError` を投げる。
- UseCase は「repository からの取得 → policy 実行 → repository 操作」という
  3 段構造を基本形とする。
- memo feature に最初のポリシーを追加：
  - `ensureActiveForTrash(memo)` — active のときだけ trash 遷移可
  - `ensureTrashedForRestore(memo)` — trashed のときだけ restore 可
  - `ensureTrashedForPurge(memo)` — trashed のときだけ purge 可
- 既存の `purgeMemo` 内 inline チェックは削除し、policy に統合した。
- policy は Jest ユニットテストで検証する
  （`memoScopeTransition.test.ts`、6 ケース）。

## Consequences

- UseCase は repository にパススルーしなくなり、ビジネス不変条件の
  所在が明確になる。
- 同様のパターンを他 feature（quiz, auth）にも後続で適用できる。
- 境界ルール（`application/` から `infrastructure/` や generated Prisma を
  参照しない）は従来どおり CI で守られる。
- policy の pure 性によりテスト性が高く、repository を mock せずに
  遷移ルールだけを検証できる。
