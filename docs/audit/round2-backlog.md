# 監査 Round2 バックログ（未対応の真のバグ）

2026-04-20 の 2 回目監査で発見し、第1スプリント (branch `fix/security-audit-round1`) には
含めなかった残タスク。偽陽性と分離済み（[round2-false-positives.md](round2-false-positives.md) 参照）。

1 バグ 1 PR を原則とし、依存関係のあるものは近接してマージする。

## High

### H-R2-1. Sentry に Authorization/Cookie マスキングなし
- **場所**: [backend/src/shared/sentry.ts:13-17](../../backend/src/shared/sentry.ts#L13-L17)
- **内容**: `Sentry.init` に `beforeSend` も `sendDefaultPii: false` もなく、`Authorization` ヘッダ・`Cookie` が Sentry に送信される。
- **修正**: `sendDefaultPii: false` を設定し、`beforeSend` で `event.request.headers.cookie` / `authorization` を削除。

### H-R2-2. password に最大長なし（bcrypt 72バイト問題）
- **場所**: [backend/src/features/auth/presentation/http/schemas.ts:10,23](../../backend/src/features/auth/presentation/http/schemas.ts#L10)
- **内容**: bcrypt は 72 バイト以降を切り詰めるため、72 バイト超の password は先頭一致で認証通過する（強いパスワード末尾が検証されない）。
- **修正**: `RegisterBodySchema.password` と `LoginBodySchema.password` に `.max(72)` を追加。もしくは pre-hash として `crypto.createHash('sha256').update(password).digest('base64')` してから bcrypt に渡す（既存ユーザーの移行が必要）。

### H-R2-3. nginx `client_max_body_size` 未設定
- **場所**: [frontend/nginx.conf](../../frontend/nginx.conf)
- **内容**: nginx デフォルトの 1MB 制限。メモ本文や添付を超えると `413 Request Entity Too Large` でサイレント失敗。
- **修正**: server ブロックに `client_max_body_size 10m;`（API 側でも zod の `max` を合わせる）。

### H-R2-4. `unhandledRejection` / `uncaughtException` ハンドラなし
- **場所**: [backend/src/server.ts](../../backend/src/server.ts)
- **内容**: 未捕捉例外でプロセスが落ちて Docker の `restart: always` によるクラッシュループに入る。Sentry にも残らない。
- **修正**: `process.on('unhandledRejection', (err) => { logger.error / Sentry.captureException; process.exit(1); })` 相当を登録。

## Medium

### M-R2-1. displayName の最大長なし
- **場所**: [backend/src/features/auth/presentation/http/schemas.ts:14](../../backend/src/features/auth/presentation/http/schemas.ts#L14)
- **修正**: `.max(255)` を追加（DoS / ストレージ浪費の予防）。

### M-R2-2. Prisma インデックス不足（複数）
- `quizTagsRelations.quizTag_id`
- `quizSet.quiz_id`
- `quizChoice.quiz_id`
- いずれも cascade delete や tag 関連検索で full scan を誘発。
- **修正**: schema.prisma に `@@index(...)` を追加し、対応する `CREATE INDEX` マイグレーションを発行。

### M-R2-3. backend Dockerfile が single-stage で devDependencies を残す
- **場所**: [backend/Dockerfile](../../backend/Dockerfile)
- **修正**: builder/runtime の multi-stage 化、runtime は `npm ci --omit=dev` で prod 依存のみ。

### M-R2-4. nginx セキュリティレスポンスヘッダ不足
- **場所**: [frontend/nginx.conf](../../frontend/nginx.conf)
- **修正**: `Strict-Transport-Security`, `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin` を `add_header` で追加。

### M-R2-5. pino logger に redact 設定なし
- **場所**: [backend/src/shared/logger.ts](../../backend/src/shared/logger.ts)
- **修正**: `redact: { paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'], censor: '***' }` を追加。

### M-R2-6. CSRF 対策なし
- **場所**: [frontend/src/shared/api/client.ts](../../frontend/src/shared/api/client.ts) と [backend の auth 系](../../backend/src/features/auth/)
- **内容**: Cookie 認証 + `sameSite:'strict'` で主要ブラウザでは CSRF はほぼ防げるが、helmet CSP で `unsafe-inline` / `unsafe-eval` を許しているため XSS 経由の残留リスクあり。
- **修正**: double-submit cookie パターンで `X-CSRF-Token` ヘッダと cookie の一致を検証するミドルウェアを追加。または CSP を厳格化（Swagger UI 経路を /api 以下の別 CSP に分離）。

## Low

### L-R2-1. `server.ts` の `app.listen` にエラーハンドラなし
- **場所**: [backend/src/server.ts:22-24](../../backend/src/server.ts#L22-L24)
- **内容**: ポート競合時に silent に抜ける。
- **修正**: `.on('error', (err) => { logger.fatal({err}); process.exit(1); })`。

---

## 運用タスク（コードと独立）

- **DBパスワードローテーション**: public リポに旧 DB パスワードが履歴に残っているので、新しいパスワードへローテーション＋履歴書き換え（または accept して旧値を permanent secret として無効化）。
- **Sentry release tag**: CI から `RELEASE_VERSION=github.sha` を渡して `Sentry.init({ release: ... })` に反映。
- **docker compose build vs image の優先制御**: `build:` と `image:` 併記時の挙動を明文化、もしくは CI 環境では `docker compose pull` のみ許可する運用に統一。

## 推奨マージ順

1. H-R2-1（Sentry マスキング）— secrets ログ漏れは最優先
2. H-R2-4（unhandled handler）— クラッシュループ予防
3. H-R2-2（bcrypt 72B）— 認証セキュリティ
4. H-R2-3（nginx body size）— 機能影響、リリース直後に影響出やすい
5. M 系はまとまった時間で一気に。M-R2-3（multi-stage Dockerfile）は他修正と競合しやすいのでラス前。
6. L-R2-1 は M 系と同スプリントで。
