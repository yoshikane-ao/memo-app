import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const target = process.argv[2] ?? 'all';
const violations = [];

const toPosixPath = (value) => value.split(path.sep).join('/');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function addViolation(file, message) {
  violations.push(`${toPosixPath(path.relative(repoRoot, file))}: ${message}`);
}

function isCodeFile(file) {
  return /\.(ts|vue)$/.test(file) && !file.endsWith('.d.ts');
}

function isTestFile(file) {
  return /\.test\.ts$/.test(file);
}

function hasForbiddenImport(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function checkExportStar(file, text) {
  if (/^\s*export\s+\*/m.test(text)) {
    addViolation(file, 'feature public entrypoints must not use export *.');
  }
}

function getRelativeImports(text) {
  const imports = [];
  for (const match of text.matchAll(/from\s+["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (specifier.startsWith('.')) {
      imports.push(specifier);
    }
  }
  return imports;
}

function getFrontendFeatureRoot(file) {
  const normalized = toPosixPath(file);
  const match = normalized.match(/^(.*\/frontend\/src\/apps\/[^/]+\/features\/[^/]+)(?:\/.*)?$/);
  return match ? match[1] : null;
}

function isReferenceBackendFeature(normalized) {
  return (
    normalized.includes('/backend/src/features/memo/') ||
    normalized.includes('/backend/src/features/quiz/')
  );
}

function checkFrontendFeatureBoundaryImports(file, text) {
  const currentFeatureRoot = getFrontendFeatureRoot(file);
  const fileDir = path.dirname(file);

  for (const specifier of getRelativeImports(text)) {
    const resolved = toPosixPath(path.resolve(fileDir, specifier));
    const featureMatch = resolved.match(
      /^(.*\/frontend\/src\/apps\/[^/]+\/features\/[^/]+)(?:\/(.*))?$/,
    );

    if (!featureMatch) {
      continue;
    }

    const [, targetFeatureRoot, targetSubpath = ''] = featureMatch;
    if (currentFeatureRoot === targetFeatureRoot) {
      continue;
    }

    if (targetSubpath === '' || targetSubpath === 'index' || targetSubpath === 'index.ts') {
      continue;
    }

    addViolation(
      file,
      `feature internals must be imported only from inside the same feature; found ${specifier}.`,
    );
  }
}

function checkFrontend(file, text) {
  const normalized = toPosixPath(file);
  const testFile = isTestFile(file);

  if (normalized.includes('/frontend/src/apps/') && normalized.endsWith('/index.ts')) {
    checkExportStar(file, text);
  }

  if (
    normalized.includes('/frontend/src/apps/') &&
    (normalized.includes('/pages/') ||
      normalized.includes('/components/') ||
      normalized.includes('/ui/') ||
      normalized.includes('/containers/')) &&
    hasForbiddenImport(text, [
      /from\s+["'][^"']*\/api\/[^"']*["']/,
      /from\s+["'][^"']*\/infrastructure\/[^"']*["']/,
    ])
  ) {
    addViolation(
      file,
      'pages/ui/containers/components must not import feature api or infrastructure directly.',
    );
  }

  if (
    !testFile &&
    normalized.includes('/frontend/src/apps/') &&
    normalized.includes('/pages/') &&
    hasForbiddenImport(text, [
      /from\s+["'][^"']*\/application\/[^"']*["']/,
      /from\s+["'][^"']*\/model\/[^"']*["']/,
      /from\s+["'][^"']*\/infrastructure\/[^"']*["']/,
    ])
  ) {
    addViolation(
      file,
      'app pages must use feature public surfaces instead of application, model, or infrastructure internals.',
    );
  }

  if (
    !testFile &&
    normalized.includes('/frontend/src/apps/') &&
    normalized.includes('/application/') &&
    hasForbiddenImport(text, [
      /import\s+\{[^}]*onMounted[^}]*\}\s+from\s+["']vue["']/,
      /import\s+\{[^}]*onBeforeMount[^}]*\}\s+from\s+["']vue["']/,
      /import\s+\{[^}]*onUnmounted[^}]*\}\s+from\s+["']vue["']/,
      /import\s+\{[^}]*onBeforeUnmount[^}]*\}\s+from\s+["']vue["']/,
    ])
  ) {
    addViolation(
      file,
      'app application hooks must stay lifecycle-free; page or container setup owns initial load and cleanup.',
    );
  }

  if (
    !testFile &&
    (normalized.includes('/frontend/src/apps/memoApp/') ||
      normalized.includes('/frontend/src/apps/tradeApp/')) &&
    normalized.includes('/ui/') &&
    hasForbiddenImport(text, [
      /from\s+["'][^"']*\/application\/[^"']*["']/,
      /from\s+["'][^"']*\/model\/[^"']*["']/,
      /from\s+["'][^"']*\/infrastructure\/[^"']*["']/,
      /from\s+["'][^"']*\/shared\/api\/[^"']*["']/,
      /from\s+["'][^"']*\/shared\/command\/[^"']*["']/,
      /from\s+["'][^"']*\/shared\/feedback\/useFeedbackStore["']/,
      /from\s+["'][^"']*\/shared\/history\/[^"']*["']/,
      /import\s+\{[^}]*use[A-Za-z]+Store[^}]*\}\s+from\s+["'][^"']+["']/,
    ])
  ) {
    addViolation(
      file,
      'app ui must stay free of application, model, infrastructure, stores, and side-effect shared modules.',
    );
  }

  if (
    normalized.includes('/frontend/src/shared/') &&
    hasForbiddenImport(text, [
      /from\s+["'][^"']*\/apps\/[^"']*["']/,
      /from\s+["'][^"']*\/features\/[^"']*["']/,
    ])
  ) {
    addViolation(file, 'shared must not import feature-owned modules.');
  }

  if (normalized.includes('/frontend/src/apps/') && /from\s+["']axios["']/.test(text)) {
    addViolation(
      file,
      'frontend app code must not import axios directly; use shared/api or feature infrastructure.',
    );
  }

  checkFrontendFeatureBoundaryImports(file, text);
}

function checkBackend(file, text) {
  const normalized = toPosixPath(file);
  const testFile = isTestFile(file);

  if (normalized.includes('/backend/src/features/') && normalized.endsWith('/index.ts')) {
    checkExportStar(file, text);
  }

  if (
    isReferenceBackendFeature(normalized) &&
    !testFile &&
    normalized.includes('/presentation/http/')
  ) {
    if (/from\s+["'][^"']*\/infrastructure\/[^"']*["']/.test(text)) {
      addViolation(file, 'presentation/http must not import infrastructure directly.');
    }

    if (/from\s+["'][^"']*\/db["']/.test(text)) {
      addViolation(file, 'presentation/http must not import db directly.');
    }

    if (/\bprisma\./.test(text)) {
      addViolation(file, 'presentation/http must not access Prisma directly.');
    }
  }

  if (
    isReferenceBackendFeature(normalized) &&
    !testFile &&
    normalized.includes('/application/') &&
    /from\s+["'][^"']*\/generated\/prisma\/client["']/.test(text)
  ) {
    addViolation(file, 'backend application must not depend on generated Prisma types.');
  }

  if (
    isReferenceBackendFeature(normalized) &&
    !testFile &&
    normalized.includes('/application/') &&
    /from\s+["'][^"']*\/infrastructure\/[^"']*["']/.test(text)
  ) {
    addViolation(
      file,
      'backend application must depend on ports, not infrastructure implementations.',
    );
  }

  if (
    normalized.endsWith('/backend/src/app.ts') &&
    /from\s+["'][^"']*\/(?:memoApp\/(?:memos|tags)|quiz-app\/quiz)\//.test(text)
  ) {
    addViolation(
      file,
      'app composition must import feature routes through the feature public entrypoint.',
    );
  }

  if (
    normalized.includes('/backend/src/shared/') &&
    hasForbiddenImport(text, [/from\s+["'][^"']*\/features\/[^"']*["']/])
  ) {
    addViolation(file, 'backend shared must not import feature-owned modules.');
  }

  if (
    normalized.includes('/backend/src/features/') &&
    normalized.endsWith('/index.ts') &&
    hasForbiddenImport(text, [/from\s+["'][^"']*\/presentation\/http\/[^"']*["']/])
  ) {
    if (!/presentation\/http\/[A-Za-z]+Router["']/.test(text)) {
      addViolation(
        file,
        'backend feature public entrypoints must export only intended public modules.',
      );
    }
  }
}

async function run() {
  const files = await walk(repoRoot);

  for (const file of files) {
    if (!isCodeFile(file)) {
      continue;
    }

    const normalized = toPosixPath(file);
    const shouldCheckFrontend = target === 'all' || target === 'frontend';
    const shouldCheckBackend = target === 'all' || target === 'backend';

    if (!normalized.includes('/frontend/') && !normalized.includes('/backend/')) {
      continue;
    }

    const text = await readFile(file, 'utf8');

    if (shouldCheckFrontend && normalized.includes('/frontend/')) {
      checkFrontend(file, text);
    }

    if (shouldCheckBackend && normalized.includes('/backend/')) {
      checkBackend(file, text);
    }
  }

  if (violations.length > 0) {
    console.error('Architecture guardrail violations found:');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Architecture checks passed for ${target}.`);
}

void run();
