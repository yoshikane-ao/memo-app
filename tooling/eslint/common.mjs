import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export const baseConfigs = [js.configs.recommended, ...tseslint.configs.recommended];

export const commonRules = {
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-empty-object-type': [
      'error',
      { allowInterfaces: 'with-single-extends' },
    ],
    'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};

export const nodeScriptsConfig = {
  files: [
    '**/*.config.{js,cjs,mjs,ts}',
    '**/*.cjs',
    'tooling/**/*.{js,mjs,cjs}',
    'frontend/e2e/**/*.{js,mjs,cjs}',
    'frontend/vite.*.ts',
    'frontend/vitest.config.ts',
    'frontend/playwright.config.ts',
  ],
  languageOptions: {
    globals: { ...globals.node },
  },
};

export const prettierConfig = prettier;
