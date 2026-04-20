import globals from 'globals';

export const backendConfig = {
  files: ['backend/**/*.{ts,js,cjs,mjs}'],
  languageOptions: {
    globals: { ...globals.node },
    sourceType: 'commonjs',
  },
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
  },
};

export const backendTestConfig = {
  files: ['backend/**/*.test.ts', 'backend/**/*.spec.ts', 'backend/**/__tests__/**/*.ts'],
  languageOptions: {
    globals: { ...globals.node, ...globals.jest },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
  },
};
