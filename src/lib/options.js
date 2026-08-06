import { normalizeString } from './utils.js';

export const DEFAULT_MODULE_LIMIT = 500;
export const MAX_MODULE_LIMIT = 100000;
export const DEFAULT_SOURCE_MODE = 'none';
export const SOURCE_MODES = new Set(['none', 'declarations', 'full']);
export const DEFAULT_FRAMEWORK = 'auto';
export const FRAMEWORKS = new Set(['auto', 'vanilla', 'react']);

export function normalizeSourceMode(value = DEFAULT_SOURCE_MODE) {
  const mode = normalizeString(value || DEFAULT_SOURCE_MODE).trim().toLowerCase();
  if (!SOURCE_MODES.has(mode)) {
    throw new Error('--source-mode must be one of none, declarations, or full.');
  }
  return mode;
}

export function normalizeModuleLimit(value = DEFAULT_MODULE_LIMIT) {
  const raw = value == null || value === '' ? String(DEFAULT_MODULE_LIMIT) : normalizeString(value).trim();
  if (!/^\d+$/.test(raw)) {
    throw new Error(`--module-limit must be an integer from 1 to ${MAX_MODULE_LIMIT}.`);
  }
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MODULE_LIMIT) {
    throw new Error(`--module-limit must be an integer from 1 to ${MAX_MODULE_LIMIT}.`);
  }
  return limit;
}

export function normalizeFramework(value = DEFAULT_FRAMEWORK) {
  const framework = normalizeString(value || DEFAULT_FRAMEWORK).trim().toLowerCase();
  if (!FRAMEWORKS.has(framework)) {
    throw new Error('--framework must be one of auto, vanilla, or react.');
  }
  return framework;
}

export function sourcePrivacyMetadata(sourceMode, {
  declarationCount = 0,
  moduleSourceCount = 0,
} = {}) {
  const mode = normalizeSourceMode(sourceMode);
  const declarationSourceAvailable = mode === 'declarations' || mode === 'full';
  const moduleSourceAvailable = mode === 'full';
  return {
    sourceMode: mode,
    declarationSourceAvailable,
    moduleSourceAvailable,
    sourceArtifacts: {
      sourceCodeJson: declarationSourceAvailable,
      sourceModulesJson: moduleSourceAvailable,
      functionMapJson: true,
    },
    capabilities: {
      sourceDialogs: declarationSourceAvailable,
      moduleSourceApi: moduleSourceAvailable,
      occurrenceSearch: moduleSourceAvailable,
      structuralFunctionMap: true,
    },
    counts: {
      declarationSourceCount: declarationSourceAvailable ? declarationCount : 0,
      moduleSourceCount: moduleSourceAvailable ? moduleSourceCount : 0,
    },
  };
}
