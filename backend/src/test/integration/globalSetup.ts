// Jest の globalSetup:
// - DATABASE_URL が既に設定されていればそれを使う（ローカルで Postgres を既に
//   立ち上げている開発者向け）。
// - 未設定なら testcontainers で Postgres を 1 本起動し、connection URL を
//   全 worker に伝搬する。CI のように Docker daemon が常駐している環境で便利。
// prisma migrate deploy はどちらのパスでも最後に流し、スキーマを揃える。

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

declare global {
  var __MEMO_PG_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

const backendRoot = resolve(__dirname, '../../..');

export default async function globalSetup() {
  const existingUrl = process.env.INTEGRATION_DATABASE_URL;
  let databaseUrl: string;

  if (existingUrl) {
    databaseUrl = existingUrl;
    // 後段で prisma migrate deploy を同じ URL に対して流すだけでよい。
    // container は起動しないので teardown でも stop すべきものは無い。
  } else {
    const container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('memo_test')
      .withUsername('memo_test')
      .withPassword('memo_test')
      .start();

    databaseUrl = container.getConnectionUri();
    globalThis.__MEMO_PG_CONTAINER__ = container;
  }

  process.env.DATABASE_URL = databaseUrl;

  execSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
