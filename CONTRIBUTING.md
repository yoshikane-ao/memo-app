# 開発貢献ガイド

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/ja/) のタグ（英語）+ 本文（日本語）で統一する。

### 書式

```text
<type>: <本文>
```

### type 一覧

| type | 用途 |
|---|---|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | 挙動を変えないリファクタ |
| `perf` | パフォーマンス改善 |
| `test` | テスト追加・修正 |
| `docs` | ドキュメント更新 |
| `build` | ビルド設定・依存関係 |
| `ci` | CI / CD 設定 |
| `chore` | その他の雑多な変更 |

### 例

```text
feat: メモのピン留め機能を追加
fix: クイズテーブル作成を含めた安全なマイグレーション
refactor: tag feature を containers/ui/model に分割
ci: Playwright ブラウザを事前インストール
docs: READMEにアーキテクチャハイライトを追加
```

### 禁則

- `<type>` を付けない素の日本語コミット（例: 「追加」「修正」）は避ける
- 過去コミットの履歴改変（force push など）は行わない。共有環境に配慮する

## ブランチ運用

- 新機能: `feat/xxx`
- バグ修正: `fix/xxx`
- リファクタ: `refactor/xxx`
- `main` への直 push は避け、PR 経由でマージする運用が望ましい

## プルリクエスト

[`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) のテンプレートに従う。動作確認チェックリストは必ず埋める。

## 動作確認（push 前に必ず通す）

```powershell
cd backend
npm run check:architecture
npm run test:api
npm run build

cd ../frontend
npm run check:architecture
npm run test:unit
npm run test:e2e
npm run build
```

UI 変更を含む場合はさらに:

```powershell
cd ..
docker compose up --build
```

で 3 層統合の動作を目視確認する。

## アーキテクチャ境界

`tooling/check-architecture.mjs` が各 feature の層間依存を静的にチェックしている。新しい feature や層を追加するときは [docs/ARCHITECTURE_RULES.md](docs/ARCHITECTURE_RULES.md) のルールを読んでから着手すること。
