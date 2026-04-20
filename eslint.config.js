import { ignores } from './tooling/eslint/ignores.mjs';
import {
  baseConfigs,
  commonRules,
  nodeScriptsConfig,
  prettierConfig,
} from './tooling/eslint/common.mjs';
import { backendConfig, backendTestConfig } from './tooling/eslint/backend.mjs';
import {
  frontendVueConfigs,
  frontendVueFiles,
  frontendTsFiles,
  frontendTestConfig,
  legacyTradeAppConfig,
} from './tooling/eslint/frontend.mjs';

export default [
  { ignores },
  ...baseConfigs,
  ...frontendVueConfigs,
  frontendVueFiles,
  frontendTsFiles,
  backendConfig,
  nodeScriptsConfig,
  frontendTestConfig,
  backendTestConfig,
  commonRules,
  legacyTradeAppConfig,
  prettierConfig,
];
