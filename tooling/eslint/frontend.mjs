import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export const frontendVueConfigs = vue.configs['flat/recommended'];

export const frontendVueFiles = {
  files: ['frontend/**/*.vue'],
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      extraFileExtensions: ['.vue'],
    },
    globals: { ...globals.browser },
  },
};

export const frontendTsFiles = {
  files: ['frontend/**/*.{ts,tsx}'],
  languageOptions: {
    globals: { ...globals.browser },
    sourceType: 'module',
  },
};

export const frontendTestConfig = {
  files: ['frontend/**/*.test.ts', 'frontend/**/*.spec.ts'],
  languageOptions: {
    globals: { ...globals.browser, ...globals.node },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
  },
};

// tradeApp はポートフォリオ主役ではない旧コード。Phase 2.5 時点では段階的に
// error から warn に下げておき、将来クリーンアップする。
export const legacyTradeAppConfig = {
  files: ['frontend/src/apps/tradeApp/**/*.{ts,vue}'],
  rules: {
    'vue/no-deprecated-slot-attribute': 'warn',
    'vue/no-ref-as-operand': 'warn',
    'vue/no-use-v-if-with-v-for': 'warn',
    'vue/return-in-computed-property': 'warn',
  },
};
