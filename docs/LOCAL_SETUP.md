# ローカルセットアップ

## Docker Compose で一発起動（推奨）

ルートに `.env` を置くだけで 3 層（PostgreSQL / Express API / Nginx）がまとめて立ち上がる。

```powershell
cp .env.example .env
# 必要なら .env 内のパスワード等を好きな値に書き換え
docker compose up --build
```

`.env` は Docker Compose が自動で読み込む。中身のキーは [`.env.example`](../.env.example) 参照。

## Node で個別に動かす

### バックエンド

1. `backend/.env.example` を `backend/.env` にコピー
2. ローカル PostgreSQL に合わせて `DATABASE_URL` を設定
3. 必要に応じて下記を上書き:
   - `HOST`
   - `PORT`
   - `RATE_LIMIT_WINDOW_MS`
   - `RATE_LIMIT_MAX_REQUESTS`

```powershell
cd backend
npm install
npm run build
npm run test:api
npm run dev
```

`backend/.env` の例:

```text
HOST=0.0.0.0
PORT=3004
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
DATABASE_URL="postgresql://postgres:password@localhost:5432/memo?schema=public"
```

### フロントエンド

1. `frontend/.env.example` を `frontend/.env` にコピー
2. 通常は API 設定を空のままで OK（開発中の Vite は `/health` / `/memos` / `/tags` を `backend/.env` のポートへプロキシ）
3. プロキシ先を変えたい場合のみ `VITE_API_BASE_URL` または `API_PROXY_TARGET` を設定
4. どちらも未設定時のフォールバックは `http://127.0.0.1:3004`

```powershell
cd frontend
npm install
npm run build
npm run test:unit
npm run dev
```

本番相当の挙動を見たい場合は Docker Compose 起動の方が近い（nginx 経由の相対パス API）。

## 動作確認（CI と同等のチェック）

### バックエンド

```powershell
cd backend
npm run check:architecture
npm run test:api
npm run test:integration   # Docker Desktop が起動している必要あり
npm run build
```

`test:integration` は [testcontainers](https://node.testcontainers.org/) が Postgres コンテナを自動起動するため、**Docker Desktop（または同等の Docker daemon）が動いている環境**でのみ実行可能。CI ではランナーの Docker が常に利用できるので制約なく走る。

### フロントエンド

```powershell
cd frontend
npm run check:architecture
npm run test:unit
npm run test:e2e
npm run build
```

### カバレッジの内訳

- バックエンド単体テスト: route / useCase の jest mock テスト、OpenAPI 仕様生成の検証、config / ensureDemoUser の挙動
- バックエンド統合テスト: `testcontainers` で起動した実 Postgres に対する repository 層テスト（userId スコープ、transaction 系、nested create/update）
- フロントエンド単体テスト: コンポーネント挙動、store / コマンドのテスト、ページ初期化テスト、API エラー正規化、Vite プロキシの `/health` / `/memos` / `/tags` スモーク
- ブラウザ E2E: Playwright スモーク（ログイン → メモ作成 → ゴミ箱 → 復元 → リロード永続化）。テスト専用のバックエンド + サーバーを Playwright が立ち上げる
