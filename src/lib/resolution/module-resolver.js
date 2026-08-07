import fs from 'node:fs/promises';
import path from 'node:path';

import { compareLocale, extensionCandidates, fileExists, isWithinPath, normalizeString, toPosixPath } from '../utils.js';
import { expandImportAliasTarget, importAliasTargetForSpecifier, normalizeRouteAliasTarget } from './aliases.js';
import { parseHtmlEntry } from './import-maps.js';

const DEFAULT_ENTRY_CANDIDATES = [
  'index.html',
  'src/index.html',
  'src/main.jsx',
  'src/main.js',
  'src/index.jsx',
  'src/index.js',
  'src/app.jsx',
  'src/app.js',
];
export const DEFAULT_ROUTE_ALIASES = [
  { from: '/', to: '' },
  { from: '/', to: 'public' },
];
const HTML_ENTRY_EXTENSIONS = new Set(['.html', '.htm']);
const ANALYZABLE_MODULE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs']);
const ASSET_EXTENSIONS = new Set([
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.wasm',
  '.worker.js',
  '.worker.mjs',
]);
const EXCLUDED_DISCOVERY_DIRS = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'bower_components',
  'dist',
  'build',
  'coverage',
  'out',
  'site',
  'docs',
  '.worktrees',
  '.codex-worktrees',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.parcel-cache',
  '.vite',
]);
export const PLATFORM_IMPORT_SPECIFIERS = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
]);
const UNSUPPORTED_SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.mts', '.ts', '.tsx']);

export async function loadImportAliases(rootDir, entryRel = '') {
  const aliases = new Map();
  const htmlCandidates = [
    path.join(rootDir, 'index.html'),
    entryRel ? path.join(rootDir, path.posix.dirname(toPosixPath(entryRel)), 'index.html') : '',
  ].filter(Boolean);

  for (const htmlPath of htmlCandidates) {
    try {
      const html = await fs.readFile(htmlPath, 'utf8');
      for (const [key, value] of parseHtmlEntry(html).importAliases) aliases.set(key, value);
    } catch {
      // best effort only
    }
  }
  return aliases;
}

async function resolveFromRoot(rootDir, relativePath) {
  for (const candidate of extensionCandidates(relativePath)) {
    const filePath = path.resolve(rootDir, candidate);
    if (!isWithinPath(rootDir, filePath)) continue;
    if (await fileExists(filePath)) {
      return {
        rel: toPosixPath(path.relative(rootDir, filePath)),
        filePath,
      };
    }
  }
  return null;
}

async function resolveExactFromRoot(rootDir, relativePath) {
  const normalized = toPosixPath(normalizeString(relativePath).trim()).replace(/^\.\//, '').replace(/^\/+/, '');
  if (!normalized) return null;
  const filePath = path.resolve(rootDir, normalized);
  if (!isWithinPath(rootDir, filePath)) return null;
  if (!await fileExists(filePath)) return null;
  return {
    rel: toPosixPath(path.relative(rootDir, filePath)),
    filePath,
  };
}

export async function resolveEntry(rootDir, entry, { allowHtml = true } = {}) {
  const requested = normalizeString(entry).trim();
  const candidates = requested ? [requested] : DEFAULT_ENTRY_CANDIDATES;
  for (const candidate of candidates) {
    const normalized = candidate.replace(/^\.\//, '').replace(/^\//, '');
    const ext = path.posix.extname(toPosixPath(normalized)).toLowerCase();
    if (!allowHtml && HTML_ENTRY_EXTENSIONS.has(ext)) continue;
    const resolved = HTML_ENTRY_EXTENSIONS.has(ext)
      ? await resolveExactFromRoot(rootDir, normalized)
      : await resolveFromRoot(rootDir, normalized);
    if (!resolved) continue;
    return {
      ...resolved,
      kind: HTML_ENTRY_EXTENSIONS.has(path.posix.extname(toPosixPath(resolved.rel)).toLowerCase())
        ? 'html'
        : 'module',
    };
  }
  throw new Error(`Unable to resolve browser entry inside ${rootDir}`);
}

export function isAnalyzableModulePath(relativePath) {
  return ANALYZABLE_MODULE_EXTENSIONS.has(path.posix.extname(toPosixPath(relativePath)).toLowerCase());
}

function localAssetKind(relativePath) {
  const normalized = toPosixPath(relativePath).toLowerCase();
  if (normalized.endsWith('.worker.js') || normalized.endsWith('.worker.mjs')) return 'worker';
  const ext = path.posix.extname(normalized);
  if (!ASSET_EXTENSIONS.has(ext)) return '';
  if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') return 'style';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico'].includes(ext)) return 'image';
  if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) return 'font';
  if (ext === '.json') return 'json';
  if (ext === '.wasm') return 'wasm';
  return 'unknown';
}

function isSupportedBrowserModulePath(relativePath) {
  return isAnalyzableModulePath(relativePath);
}

export function normalizeExclude(value) {
  return toPosixPath(normalizeString(value).trim())
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/g, '');
}

export function normalizeExcludes(values = []) {
  return (Array.isArray(values) ? values : [values].filter(Boolean))
    .flatMap((value) => normalizeString(value).split(','))
    .map(normalizeExclude)
    .filter(Boolean)
    .sort(compareLocale);
}

export function pathMatchesExclude(relativePath, excludes) {
  const rel = normalizeExclude(relativePath);
  return excludes.some((exclude) => rel === exclude || rel.startsWith(`${exclude}/`));
}

function isExcludedDiscoveryDir(name, relativePath, excludes) {
  return EXCLUDED_DISCOVERY_DIRS.has(normalizeString(name).trim())
    || pathMatchesExclude(relativePath, excludes);
}

export async function discoverAnalyzableModules(rootDir, moduleLimit, excludes = [], roots = ['']) {
  const discovered = new Map();

  const visit = async (dirPath) => {
    const entries = (await fs.readdir(dirPath, { withFileTypes: true }))
      .sort((a, b) => compareLocale(a.name, b.name));
    for (const entry of entries) {
      const filePath = path.join(dirPath, entry.name);
      const rel = toPosixPath(path.relative(rootDir, filePath));
      if (entry.isDirectory()) {
        if (isExcludedDiscoveryDir(entry.name, rel, excludes)) continue;
        await visit(filePath);
      } else if (entry.isFile() && !pathMatchesExclude(rel, excludes) && isAnalyzableModulePath(rel)) {
        discovered.set(rel, { rel, filePath });
        if (discovered.size > moduleLimit) {
          throw new Error(`Module limit exceeded (${moduleLimit}).`);
        }
      }
    }
  };

  const normalizedRoots = Array.from(new Set((Array.isArray(roots) ? roots : [roots])
    .map(normalizeExclude))).sort(compareLocale);
  for (const root of normalizedRoots.length > 0 ? normalizedRoots : ['']) {
    const dirPath = path.resolve(rootDir, root || '.');
    if (!isWithinPath(rootDir, dirPath)) continue;
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    await visit(dirPath);
  }
  return Array.from(discovered.values()).sort((a, b) => compareLocale(a.rel, b.rel));
}

function localPathFromRouteAlias(specifier, alias) {
  const raw = toPosixPath(normalizeString(specifier).trim());
  if (!raw.startsWith('/')) return null;

  let rest = null;
  if (alias.from === '/') {
    rest = raw.replace(/^\/+/, '');
  } else if (raw === alias.from) {
    rest = '';
  } else if (raw.startsWith(`${alias.from}/`)) {
    rest = raw.slice(alias.from.length + 1);
  }

  if (rest == null) return null;
  return path.posix.normalize(path.posix.join(alias.to, rest));
}

async function resolveRouteAlias({ rootDir, specifier, routeAliases }) {
  for (const alias of routeAliases) {
    const localPath = localPathFromRouteAlias(specifier, alias);
    if (localPath == null) continue;
    const resolved = await resolveBrowserPathFromRoot(rootDir, localPath);
    if (resolved) return resolved;
  }
  return null;
}

export function isRemoteSpecifier(specifier) {
  return /^(?:https?:)?\/\//i.test(normalizeString(specifier).trim());
}

export function nodeBuiltinSpecifier(specifier) {
  const raw = normalizeString(specifier).trim();
  const normalized = raw.startsWith('node:') ? raw.slice('node:'.length) : raw;
  return PLATFORM_IMPORT_SPECIFIERS.has(normalized) ? normalized : '';
}

function unsupportedSourceExtension(relativePath) {
  const ext = path.posix.extname(toPosixPath(relativePath)).toLowerCase();
  return UNSUPPORTED_SOURCE_EXTENSIONS.has(ext) ? ext : '';
}

export async function resolveBrowserPathFromRoot(rootDir, relativePath) {
  const exact = await resolveExactFromRoot(rootDir, relativePath);
  if (exact) {
    const unsupportedExtension = unsupportedSourceExtension(exact.rel);
    if (unsupportedExtension) {
      return {
        ...exact,
        kind: 'unsupported-module',
        assetKind: null,
        unsupportedExtension,
      };
    }
    const assetKind = localAssetKind(exact.rel);
    return {
      ...exact,
      kind: isSupportedBrowserModulePath(exact.rel) ? 'module' : 'asset',
      assetKind: isSupportedBrowserModulePath(exact.rel) ? null : assetKind || 'unknown',
    };
  }
  const module = await resolveFromRoot(rootDir, relativePath);
  if (module) {
    return {
      ...module,
      kind: 'module',
      assetKind: null,
    };
  }
  return null;
}

export function remoteAliasTargetForSpecifier(specifier, aliases) {
  const aliasTarget = importAliasTargetForSpecifier(specifier, aliases);
  return isRemoteSpecifier(aliasTarget) ? aliasTarget : '';
}

export async function resolveImport({ rootDir, specifier, importerRel, aliases, routeAliases }) {
  const raw = normalizeString(specifier).trim();
  if (!raw || isRemoteSpecifier(raw) || nodeBuiltinSpecifier(raw)) return null;
  const aliasTarget = importAliasTargetForSpecifier(raw, aliases);
  if (aliasTarget) {
    const expandedAlias = expandImportAliasTarget(aliasTarget);
    if (isRemoteSpecifier(expandedAlias)) return null;
    const routedAlias = await resolveRouteAlias({ rootDir, specifier: expandedAlias, routeAliases });
    if (routedAlias) return routedAlias;
    const normalizedAlias = normalizeRouteAliasTarget(expandedAlias);
    return resolveBrowserPathFromRoot(rootDir, normalizedAlias);
  }
  if (raw.startsWith('/')) {
    return resolveRouteAlias({ rootDir, specifier: raw, routeAliases });
  }
  if (raw.startsWith('./') || raw.startsWith('../')) {
    const importerDir = path.posix.dirname(toPosixPath(importerRel));
    const relativePath = path.posix.normalize(path.posix.join(importerDir, raw));
    return resolveBrowserPathFromRoot(rootDir, relativePath);
  }
  return null;
}

export function importSpecifierLooksLocal(specifier, aliases, routeAliases) {
  const raw = normalizeString(specifier).trim();
  if (!raw) return false;
  if (raw.startsWith('.') || raw.startsWith('/')) return true;
  for (const key of aliases.keys()) {
    if (raw === key || (key.endsWith('/') && raw.startsWith(key))) return true;
  }
  return routeAliases.some((alias) => raw === alias.from.slice(0, -1) || raw.startsWith(alias.from));
}

export function externalLabel(specifier) {
  const raw = normalizeString(specifier).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).hostname;
    } catch {
      return raw;
    }
  }
  return raw;
}

export function isIgnoredExternalLabel(label) {
  return normalizeString(label).trim().toLowerCase() === 'react';
}

function entryModuleDiscoveryRoot(moduleRel) {
  const rel = normalizeExclude(moduleRel);
  if (!rel) return '';
  const parts = rel.split('/').filter(Boolean);
  if (parts.length > 1 && ['src', 'app', 'client', 'frontend', 'web', 'public'].includes(parts[0])) return parts[0];
  const dir = path.posix.dirname(rel);
  return dir === '.' ? '' : dir;
}

export function includeUnreachableDiscoveryRoots({ sourceRoot, entryModules }) {
  const normalizedSourceRoot = normalizeExclude(sourceRoot);
  if (normalizedSourceRoot && normalizedSourceRoot !== '.') return [normalizedSourceRoot];
  const roots = Array.from(new Set((Array.isArray(entryModules) ? entryModules : [])
    .map((entryModule) => entryModuleDiscoveryRoot(entryModule.rel))
    .filter((root) => root)));
  return roots.length > 0 ? roots.sort(compareLocale) : [''];
}
