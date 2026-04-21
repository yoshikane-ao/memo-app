# ポートフォリオハブ

複数の個人制作アプリを 1 つのハブに集約したフルスタック・ポートフォリオ。代表作 **memo-app** は Vue 3 / Express / Prisma / PostgreSQL の構成で、JWT + httpOnly cookie 認証、Zod 由来の OpenAPI 仕様、Prometheus / Sentry の観測性、GHCR 経由の CI/CD まで**本番運用で求められる一式**を備えている。

> **🚀 ライブデモ:** http://3.104.123.11/ （ハブで作品一覧 → memo カードをクリック → デモログインボタンで全機能を触れる）
> **📘 API ドキュメント:** http://3.104.123.11/api/docs/ （Swagger UI, OpenAPI 3.0）
> **🏛 アーキテクチャ:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ／ **🛠 セットアップ:** [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

![ポートフォリオハブ全景](docs/screenshots/menu-hero.png)

![代表作 memo-app（デスクトップ）](docs/screenshots/desktop.png)

<p align="center">
  <img src="docs/screenshots/mobile.png" alt="代表作 memo-app（モバイル）" width="320">
</p>

## 掲載作品

`/menu` から各作品のライブデモへ遷移できる。詳細はカード内の概要・工夫した点・使用技術・制作期間を参照。

- **memo-app** — タグ管理・ごみ箱・型安全な Undo/Redo を備えたメモアプリ。本リポジトリの代表作で、以下「ハイライト」の対象。Vue 3 / Express / Prisma / PostgreSQL、約 2 ヶ月。
- **quiz-app** — 単語・意味・タグを 1 モデルに集約し、作成と回答を同データから扱える単語帳形式のクイズアプリ。同スタック、約 1 ヶ月。
- **trade-app** — 1 画面 2 プレイヤーで交互操作するローカル対戦のトレードゲーム。価格変動と勝敗判定を純粋関数で分離。Vue 3 / Express / PostgreSQL、約 1 ヶ月。

## 代表作 memo-app のハイライト

- **Zod 由来の OpenAPI 仕様** — リクエスト検証・API ドキュメント・TypeScript 型の単一ソース。[`backend/src/features/*/presentation/http/schemas.ts`](backend/src/features/) の Zod スキーマから `/api/docs` の Swagger UI を自動生成（[docs/screenshots/api-docs.png](docs/screenshots/api-docs.png)）
- **JWT + httpOnly cookie 認証** — `bcryptjs` でハッシュ化、アクセス/リフレッシュトークンの 2 段構え、401 時のフロント側自動再試行、起動時のデモアカウント seed まで実装（[`backend/src/features/auth/`](backend/src/features/auth/)）
- **観測性の基礎一式** — `pino` 構造化ログ + リクエスト ID 付き child logger、`prom-client` による `/metrics`、DB ping 付き `/health/ready`、Sentry 連携（[`backend/src/shared/`](backend/src/shared/)）
- **アーキテクチャ境界の自動強制** — 独自の [`tooling/check-architecture.mjs`](tooling/check-architecture.mjs) が CI で層間の不正 import を検査。application 層は ORM 生成型を一切参照しない（[docs/ARCHITECTURE_RULES.md](docs/ARCHITECTURE_RULES.md)）
- **push 毎の lint / test / E2E / GHCR デプロイ** — [GitHub Actions](.github/workflows/deploy.yml) で ESLint / Jest / Vitest / Playwright を通してから GHCR にイメージを push → EC2 で `docker compose pull` のみ実行（911MiB の小容量 EC2 でもビルドせず安全）
- **型安全な Undo / Redo** — メモ・タグ操作をコマンドパターン + Pinia で履歴管理（[`frontend/src/shared/history/`](frontend/src/shared/history/)）
- **225 件以上の自動テスト** — backend: Jest で 38 件（OpenAPI 生成テスト込み）／ frontend: Vitest で 187 件 ／ E2E: Playwright で認証〜メモ操作を通しスモーク

## 技術スタック

| レイヤー      | 使用技術                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Frontend      | Vue 3 (Composition API) / TypeScript (strict) / Vite / Pinia / Vitest / Playwright                                             |
| Backend       | Express / TypeScript / Prisma / PostgreSQL 16 / Jest + Supertest / Zod / `@asteasolutions/zod-to-openapi` / pino / prom-client |
| Auth          | jsonwebtoken / bcryptjs / httpOnly cookie（アクセス 15m / リフレッシュ 7d）                                                    |
| Observability | pino / pino-http / prom-client / Sentry (@sentry/node, @sentry/vue)                                                            |
| DevOps        | Docker Compose / GitHub Actions / GitHub Container Registry / AWS EC2 / Nginx                                                  |

## 構成

```text
memo-app/
├─ backend/              # Express API（feature × レイヤー分離、Zod スキーマ駆動）
├─ frontend/             # Vue 3 SPA（feature × containers/ui/model 分離）
├─ docs/                 # ARCHITECTURE.md / ARCHITECTURE_RULES.md / screenshots
├─ tooling/              # 共有 TS 設定 + アーキテクチャ境界チェッカー
├─ .github/workflows/    # CI / GHCR build+push / EC2 デプロイ
├─ docker-compose.yml    # 3 層ローカル / 本番スタック
└─ .env.example          # Docker 用認証情報テンプレート
```

runtime の詳細な流れは [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照。

## クイックスタート

```powershell
cp .env.example .env
docker compose up --build
```

Node で個別に動かす手順・テスト実行方法は [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)。

## API ドキュメントを見る

本番: http://3.104.123.11/api/docs/ ／ ローカル: `docker compose up` 後に http://localhost/api/docs/ ／ JSON: http://3.104.123.11/api/openapi.json

## 貢献・コミット規約

[CONTRIBUTING.md](CONTRIBUTING.md) を参照。

## ライセンス

[MIT](LICENSE)
