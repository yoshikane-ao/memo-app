import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

declare global {
  var __MEMO_PG_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

export default async function globalTeardown() {
  const container = globalThis.__MEMO_PG_CONTAINER__;
  if (container) {
    await container.stop();
  }
}
