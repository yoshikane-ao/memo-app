// 実 Postgres container を testcontainers で立ち上げ、repository 層を統合テストする。
// 通常の test:api（mock 中心）とは別 config で動かす。
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.integration.test.ts'],
  globalSetup: '<rootDir>/src/test/integration/globalSetup.ts',
  globalTeardown: '<rootDir>/src/test/integration/globalTeardown.ts',
  // container 起動 + migrate で 15-30s かかることがあるのでタイムアウトを広めに。
  testTimeout: 60000,
  clearMocks: true,
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  // runInBand は cli で指定するが、念のため maxWorkers を 1 に固定。
  // 単一の Postgres container を共有しているため並列は危険。
  maxWorkers: 1,
};
