1. データベース設計
2. API設計
3. API実装

機能
・検索
・タグ
・タブ
・タイトル入力
・コンテンツ入力
・コンテンツのサイズ調整
・コピー範囲指定
・アコーディオン形式の表示方法の実装
・ワンクリックコピー
・表形式の入力


### API設計
【エンドポイント】
一覧 : GET : /memos
一件取得 : GET : /memos/:id
作成 : PUT : memos
更新 : PUT : memos/:id
削除 : DELETE : memos/:id


-- 1. グループ（アコーディオンの親要素）
CREATE TABLE memo_groups (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL, -- アコーディオンのタイトル
  display_order INTEGER DEFAULT 0, -- 表示順序を制御したい場合に便利
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. メモ本体
CREATE TABLE memos (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES memo_groups(id) ON DELETE SET NULL, -- どのグループに属するか
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. タグマスター
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE
);

-- 4. メモとタグの中間テーブル（多対多）
CREATE TABLE memo_tags (
  memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (memo_id, tag_id)
);

-- 5. タブ（現在開いているメモや、お気に入りタブなど）
CREATE TABLE tabs (
  id SERIAL PRIMARY KEY,
  memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL
);

--　6. 変更履歴テーブル
CREATE TABLE memo_histories (
  id SERIAL PRIMARY KEY,
  memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_memo_group_id ON memos(group_id);
CREATE INDEX idx_memo_title ON memos(title);
CREATE INDEX idx_memo_histories_memo_id ON memo_histories(memo_id);


















CREATE TABLE memo (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
);

CREATE TABLE tag (
  id SERIAL PRIMARY KEY,
  tag TEXT NOT NULL,
);

CREATE TABLE memo (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
);

CREATE TABLE memotag (
  id SERIAL PRIMARY KEY,
  tagId TEXT NOT NULL UNIQUE,
  memoId TEXT NOT NULL UNIQU,
);





-- 1. メモ本体
CREATE TABLE memos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ALTER TABLE memos ADD COLUMN category_id INTEGER REFERENCES categories(id);
  histry
);

-- 2. タグマスター
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE -- 同じ名前のタグは作らせない
);

-- 3. 中間テーブル（多対多の紐付け）
CREATE TABLE memo_tags (
  memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (memo_id, tag_id) -- 複合主キーで重複登録を防止
);


CREATE TABLE accordion (
    id SERIAL PRIMARY KEY,
    pull_down_title
);

CREATE TABLE accordions (
    id SERIAL PRIMARY KEY,
    pull_down_title
    memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
);

CREATE TABLE tab (
    id SERIAL PRIMARY KEY,
    memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
);

CREATE TABLE tab_collection (
    id SERIAL PRIMARY KEY,
);

-- 検索を高速化するためのインデックス
CREATE INDEX idx_memo_title ON memos(title);