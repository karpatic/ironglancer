import fs from 'node:fs/promises';
import path from 'node:path';

import {
  extractDeclarationSpans,
  extractImportRefs,
  identifierReferenceLocations,
  maskIgnorableSyntax,
} from './import-parser.js';
import { compareLocale, extensionCandidates, fileExists, isWithinPath, normalizeString, toPosixPath } from './utils.js';

const DEFAULT_ENTRY_CANDIDATES = [
  'app.jsx',
  'app.js',
  'index.jsx',
  'index.js',
  'main.jsx',
  'main.js',
  'src/app.jsx',
  'src/app.js',
  'src/index.jsx',
  'src/index.js',
  'src/main.jsx',
  'src/main.js',
];

const DEFAULT_ROUTE_ALIASES = [
  { from: '/', to: '' },
  { from: '/', to: 'public' },
];

const ANALYZABLE_MODULE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);
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
const lexicalBlockRangeCache = new WeakMap();
const loopScopeRangeCache = new WeakMap();
const stringConstantValueCache = new WeakMap();
const identifierReferenceLocationCache = new WeakMap();
const visibleLocalBindingLocationCache = new WeakMap();
const FUNCTION_DEPENDENCY_LIMITATIONS = [
  'Static function dependencies are based on identifier references inside saved declaration spans; IronGlancer does not execute code or prove runtime control flow.',
  'Usage syntax is labeled as call, optional-call, tagged-template, jsx-element, or reference from nearby source syntax; reference entries are not claimed to be definite runtime calls.',
  'Imported targets are limited to statically resolved local imports, dynamic imports, require calls, exact supported Faculty browser import wrappers, and supported lazy-module patterns with resolvable bindings.',
  'Same-module targets are limited to named function declarations and named arrow-function variable declarations discovered in the same file; dynamic property dispatch, aliasing through arbitrary values, and unresolved re-exports are outside this map.',
];

async function loadImportAliases(rootDir, entryRel = '') {
  const aliases = new Map();
  const htmlCandidates = [
    path.join(rootDir, 'index.html'),
    entryRel ? path.join(rootDir, path.posix.dirname(toPosixPath(entryRel)), 'index.html') : '',
  ].filter(Boolean);

  for (const htmlPath of htmlCandidates) {
    try {
      const html = await fs.readFile(htmlPath, 'utf8');
      const match = html.match(/<script\s+type=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i);
      if (!match) continue;
      const importMap = JSON.parse(match[1]);
      const imports = importMap && typeof importMap.imports === 'object' && !Array.isArray(importMap.imports)
        ? importMap.imports
        : {};
      for (const [key, value] of Object.entries(imports)) {
        const rawValue = normalizeString(value).trim();
        if (!rawValue || /^https?:\/\//i.test(rawValue)) continue;
        aliases.set(key, rawValue);
      }
    } catch {
      // best effort only
    }
  }
  return aliases;
}

function parseRouteAliasString(value) {
  const raw = normalizeString(value).trim();
  const separatorIndex = raw.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error(`Invalid route alias "${raw}". Use route=path.`);
  }
  return {
    from: raw.slice(0, separatorIndex),
    to: raw.slice(separatorIndex + 1),
  };
}

function routeAliasEntries(routeAliases) {
  const entries = Array.isArray(routeAliases) ? routeAliases : [routeAliases].filter(Boolean);
  return entries.map((entry) => (typeof entry === 'string' ? parseRouteAliasString(entry) : entry));
}

function normalizeRouteAliasFrom(value) {
  const raw = toPosixPath(normalizeString(value).trim());
  if (!raw) return '';
  const rooted = raw.startsWith('/') ? raw : `/${raw}`;
  return rooted.replace(/\/+$/g, '') || '/';
}

function normalizeRouteAliasTarget(value) {
  const raw = toPosixPath(normalizeString(value).trim());
  if (!raw) return '';
  const normalized = raw.replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/g, '');
  return normalized === '.' ? '' : normalized;
}

export function normalizeRouteAliases(routeAliases = []) {
  return routeAliasEntries(routeAliases)
    .map((entry, index) => {
      const from = normalizeRouteAliasFrom(Array.isArray(entry) ? entry[0] : entry?.from);
      const targetSource = Array.isArray(entry) ? entry[1] : entry?.to;
      const to = normalizeRouteAliasTarget(targetSource);
      if (!from || targetSource == null) {
        throw new Error('Route aliases must include a route and target path.');
      }
      return { from, to, index };
    })
    .sort((a, b) => b.from.length - a.from.length || a.index - b.index)
    .map(({ from, to }) => ({ from, to }));
}

function expandImportAliasTarget(value) {
  return toPosixPath(normalizeString(value).trim())
    .replace('__REVIEW_ORIGIN__/', 'public/');
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

async function resolveEntry(rootDir, entry) {
  const requested = normalizeString(entry).trim();
  const candidates = requested ? [requested] : DEFAULT_ENTRY_CANDIDATES;
  for (const candidate of candidates) {
    const resolved = await resolveFromRoot(rootDir, candidate.replace(/^\.\//, '').replace(/^\//, ''));
    if (resolved) return resolved;
  }
  throw new Error(`Unable to resolve entry inside ${rootDir}`);
}

function isAnalyzableModulePath(relativePath) {
  return ANALYZABLE_MODULE_EXTENSIONS.has(path.posix.extname(toPosixPath(relativePath)).toLowerCase());
}

function isExcludedDiscoveryDir(name) {
  return EXCLUDED_DISCOVERY_DIRS.has(normalizeString(name).trim());
}

async function discoverAnalyzableModules(rootDir, moduleLimit) {
  const discovered = [];

  const visit = async (dirPath) => {
    const entries = (await fs.readdir(dirPath, { withFileTypes: true }))
      .sort((a, b) => compareLocale(a.name, b.name));
    for (const entry of entries) {
      const filePath = path.join(dirPath, entry.name);
      const rel = toPosixPath(path.relative(rootDir, filePath));
      if (entry.isDirectory()) {
        if (isExcludedDiscoveryDir(entry.name)) continue;
        await visit(filePath);
      } else if (entry.isFile() && isAnalyzableModulePath(rel)) {
        discovered.push({ rel, filePath });
        if (discovered.length > moduleLimit) {
          throw new Error(`Module limit exceeded (${moduleLimit}).`);
        }
      }
    }
  };

  await visit(rootDir);
  return discovered.sort((a, b) => compareLocale(a.rel, b.rel));
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
    const resolved = await resolveFromRoot(rootDir, localPath);
    if (resolved) return resolved;
  }
  return null;
}

async function resolveImport({ rootDir, specifier, importerRel, aliases, routeAliases }) {
  const raw = normalizeString(specifier).trim();
  if (!raw || /^https?:\/\//i.test(raw)) return null;
  const aliasTarget = aliases.get(raw);
  if (aliasTarget) {
    const expandedAlias = expandImportAliasTarget(aliasTarget);
    const routedAlias = await resolveRouteAlias({ rootDir, specifier: expandedAlias, routeAliases });
    if (routedAlias) return routedAlias;
    const normalizedAlias = normalizeRouteAliasTarget(expandedAlias);
    return resolveFromRoot(rootDir, normalizedAlias);
  }
  if (raw.startsWith('/')) {
    return resolveRouteAlias({ rootDir, specifier: raw, routeAliases });
  }
  if (raw.startsWith('./') || raw.startsWith('../')) {
    const importerDir = path.posix.dirname(toPosixPath(importerRel));
    const relativePath = path.posix.normalize(path.posix.join(importerDir, raw));
    return resolveFromRoot(rootDir, relativePath);
  }
  return null;
}

function sourceLines(source) {
  const normalized = normalizeString(source);
  if (!normalized) return [];
  const lines = normalized.split(/\r\n|\r|\n/);
  if (/[\r\n]$/.test(normalized)) lines.pop();
  return lines;
}

function formatLineCount(lineCount) {
  return `${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`;
}

function scriptStats(rel, source) {
  const lines = sourceLines(source);
  return {
    path: rel,
    lineCount: lines.length,
    maxLineLength: lines.reduce((max, line) => Math.max(max, line.length), 0),
  };
}

function declarationSpansByName(record) {
  const spans = new Map();
  for (const span of Array.isArray(record?.declarationSpans) ? record.declarationSpans : []) {
    if (!spans.has(span.name)) spans.set(span.name, span);
  }
  return spans;
}

function componentSpans(record) {
  return Array.from(declarationSpansByName(record))
    .filter(([name]) => /^[A-Z]/.test(name));
}

function declarationLineCount(record, name) {
  const span = declarationSpansByName(record).get(normalizeString(name).trim());
  return Number.isInteger(span?.lineCount) && span.lineCount > 0 ? span.lineCount : null;
}

function escapeRegExp(value) {
  return normalizeString(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeIdentifier(value) {
  const raw = normalizeString(value).trim().replace(/^(?:type|typeof)\s+/, '');
  const match = raw.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  return match ? match[0] : '';
}

function identifierListParts(text) {
  return normalizeString(text)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseNamedExportSpecifier(part) {
  const cleaned = normalizeString(part)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/g, '')
    .trim()
    .replace(/^(?:type|typeof)\s+/, '');
  if (!cleaned) return null;
  const aliasMatch = cleaned.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/);
  if (aliasMatch) return { local: aliasMatch[1], exported: aliasMatch[2] };
  const local = normalizeIdentifier(cleaned);
  return local ? { local, exported: local } : null;
}

function parseCommonJsObjectSpecifier(part) {
  const cleaned = normalizeString(part)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/g, '')
    .trim();
  if (!cleaned) return null;
  const aliasMatch = cleaned.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*([A-Za-z_$][A-Za-z0-9_$]*)$/);
  if (aliasMatch) return { exported: aliasMatch[1], local: aliasMatch[2] };
  const local = normalizeIdentifier(cleaned);
  return local ? { exported: local, local } : null;
}

function findNextNonWhitespaceIndex(text, start) {
  let index = start;
  while (index < text.length && /\s/.test(text[index])) index += 1;
  return index;
}

function findMatchingBrace(text, startIndex) {
  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === '{') {
      depth += 1;
    } else if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function findMatchingDelimiter(text, startIndex, openChar, closeChar) {
  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === openChar) {
      depth += 1;
    } else if (text[index] === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitTopLevel(text, separator = ',') {
  const parts = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push({ text: text.slice(start, index), startIndex: start });
      start = index + 1;
    }
  }
  parts.push({ text: text.slice(start), startIndex: start });
  return parts;
}

function topLevelCharacterIndex(text, target) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === target && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return -1;
}

function wordAt(text, start, word) {
  if (text.slice(start, start + word.length) !== word) return false;
  const before = text[start - 1] || '';
  const after = text[start + word.length] || '';
  return !/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after);
}

function namedExportListFromClauseStart(text, closeBraceIndex) {
  const fromIndex = findNextNonWhitespaceIndex(text, closeBraceIndex + 1);
  if (!wordAt(text, fromIndex, 'from')) return -1;
  const specifierIndex = findNextNonWhitespaceIndex(text, fromIndex + 'from'.length);
  return text[specifierIndex] === '"' || text[specifierIndex] === "'" ? fromIndex : -1;
}

function namedExportListEntries(masked) {
  const entries = [];
  const exportListPattern = /\bexport\s*\{/g;
  let match;
  while ((match = exportListPattern.exec(masked))) {
    const openBraceIndex = masked.indexOf('{', match.index);
    const closeBraceIndex = findMatchingBrace(masked, openBraceIndex);
    if (closeBraceIndex === -1) {
      exportListPattern.lastIndex = match.index + match[0].length;
      continue;
    }
    const fromIndex = namedExportListFromClauseStart(masked, closeBraceIndex);
    if (fromIndex === -1) {
      const semicolonIndex = findNextNonWhitespaceIndex(masked, closeBraceIndex + 1);
      entries.push({
        specifiersText: masked.slice(openBraceIndex + 1, closeBraceIndex),
        startIndex: match.index,
        endIndex: masked[semicolonIndex] === ';' ? semicolonIndex + 1 : closeBraceIndex + 1,
      });
    }
    exportListPattern.lastIndex = closeBraceIndex + 1;
  }
  return entries;
}

function defaultExportDeclarationName(record) {
  const source = normalizeString(record?.source);
  if (!source) return '';
  const masked = maskIgnorableSyntax(source);
  const spans = declarationSpansByName(record);
  const directMatch = masked.match(/\bexport\s+default\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
  if (directMatch && spans.has(directMatch[1])) return directMatch[1];
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (specifier?.exported === 'default' && spans.has(specifier.local)) return specifier.local;
    }
  }
  const identifierMatch = masked.match(/\bexport\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/);
  if (identifierMatch && spans.has(identifierMatch[1])) return identifierMatch[1];
  return '';
}

function addPublicApiSignal(info, { kind, exportedName, startIndex, endIndex }) {
  const signalKind = normalizeString(kind).trim();
  const name = normalizeString(exportedName).trim();
  if (signalKind && !info.exportKinds.includes(signalKind)) info.exportKinds.push(signalKind);
  if (name && !info.exportedNames.includes(name)) info.exportedNames.push(name);
  if (Number.isInteger(startIndex) && Number.isInteger(endIndex) && endIndex > startIndex) {
    info.ranges.push({ startIndex, endIndex });
  }
}

function declarationPublicApiInfo(record, declarationName) {
  const name = normalizeIdentifier(declarationName);
  const source = normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const info = {
    exported: false,
    exportedNames: [],
    exportKinds: [],
    ranges: [],
  };
  if (!name || !source) return info;

  const escaped = escapeRegExp(name);
  const directFunctionExportPattern = new RegExp(`\\bexport\\s+(default\\s+)?(?:async\\s+)?function\\s*\\*?\\s+${escaped}\\s*\\(`, 'g');
  const directArrowExportPattern = new RegExp(`\\bexport\\s+(?:const|let|var)\\s+${escaped}\\s*=`, 'g');
  const defaultIdentifierExportPattern = new RegExp(`\\bexport\\s+default\\s+${escaped}\\b`, 'g');
  const commonJsPropertyPattern = new RegExp(`\\b(?:module\\.)?exports\\s*\\.\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*${escaped}\\b`, 'g');
  const commonJsFunctionExpressionPattern = new RegExp(`\\b(?:module\\.)?exports\\s*\\.\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*(?:async\\s+)?function\\s*\\*?\\s+${escaped}\\s*\\(`, 'g');
  const commonJsDefaultPattern = new RegExp(`\\bmodule\\s*\\.\\s*exports\\s*=\\s*${escaped}\\b`, 'g');
  const commonJsObjectPattern = /\bmodule\s*\.\s*exports\s*=\s*\{([\s\S]*?)\}/g;

  let match;
  while ((match = directFunctionExportPattern.exec(masked))) {
    info.exported = true;
    const kind = match[1] ? 'default-export' : 'named-export';
    addPublicApiSignal(info, {
      kind,
      exportedName: match[1] ? 'default' : name,
      startIndex: match.index,
      endIndex: directFunctionExportPattern.lastIndex,
    });
  }
  while ((match = directArrowExportPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'named-export',
      exportedName: name,
      startIndex: match.index,
      endIndex: directArrowExportPattern.lastIndex,
    });
  }
  while ((match = defaultIdentifierExportPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'default-export',
      exportedName: 'default',
      startIndex: match.index,
      endIndex: defaultIdentifierExportPattern.lastIndex,
    });
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (!specifier || specifier.local !== name) continue;
      info.exported = true;
      addPublicApiSignal(info, {
        kind: specifier.exported === 'default' ? 'default-export' : 'named-export',
        exportedName: specifier.exported,
        startIndex: entry.startIndex,
        endIndex: entry.endIndex,
      });
    }
  }
  while ((match = commonJsPropertyPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'commonjs-export',
      exportedName: match[1],
      startIndex: match.index,
      endIndex: commonJsPropertyPattern.lastIndex,
    });
  }
  while ((match = commonJsFunctionExpressionPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'commonjs-export',
      exportedName: match[1],
      startIndex: match.index,
      endIndex: commonJsFunctionExpressionPattern.lastIndex,
    });
  }
  while ((match = commonJsDefaultPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'commonjs-export',
      exportedName: 'module.exports',
      startIndex: match.index,
      endIndex: commonJsDefaultPattern.lastIndex,
    });
  }
  while ((match = commonJsObjectPattern.exec(masked))) {
    for (const part of identifierListParts(match[1])) {
      const specifier = parseCommonJsObjectSpecifier(part);
      if (!specifier || specifier.local !== name) continue;
      info.exported = true;
      addPublicApiSignal(info, {
        kind: 'commonjs-export',
        exportedName: specifier.exported,
        startIndex: match.index,
        endIndex: commonJsObjectPattern.lastIndex,
      });
    }
  }

  info.exportKinds.sort(compareLocale);
  info.exportedNames.sort(compareLocale);
  return info;
}

function isDeclarationNameLocation(span, location) {
  return Number.isInteger(span?.nameStartIndex)
    && Number.isInteger(span?.nameEndIndex)
    && location?.index === span.nameStartIndex
    && location?.endIndex === span.nameEndIndex;
}

function locationInRanges(location, ranges) {
  return ranges.some((range) => (
    Number.isInteger(range?.startIndex)
    && Number.isInteger(range?.endIndex)
    && location.index >= range.startIndex
    && location.endIndex <= range.endIndex
  ));
}

function declarationSpanExclusiveEnd(span) {
  return Number.isInteger(span?.endIndex) ? span.endIndex + 1 : null;
}

function locationInsideDeclarationSpan(span, location) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex)
    && Number.isInteger(spanEnd)
    && Number.isInteger(span?.nameEndIndex)
    && location?.index > span.nameEndIndex
    && location.index >= span.startIndex
    && location.endIndex <= spanEnd;
}

function locationWithinDeclarationBounds(span, location) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex)
    && Number.isInteger(spanEnd)
    && Number.isInteger(location?.index)
    && Number.isInteger(location?.endIndex)
    && location.index >= span.startIndex
    && location.endIndex <= spanEnd;
}

function declarationSpanLength(span) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex) && Number.isInteger(spanEnd)
    ? spanEnd - span.startIndex
    : Number.MAX_SAFE_INTEGER;
}

function innermostDeclarationSpanForLocation(record, location) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((span) => locationInsideDeclarationSpan(span, location))
    .sort((a, b) => declarationSpanLength(a) - declarationSpanLength(b)
      || b.startIndex - a.startIndex
      || compareLocale(a.name, b.name))[0] || null;
}

function parentDeclarationSpanForSpan(record, childSpan) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((span) => span !== childSpan && locationWithinDeclarationBounds(span, {
      index: childSpan.startIndex,
      endIndex: declarationSpanExclusiveEnd(childSpan),
    }))
    .sort((a, b) => declarationSpanLength(a) - declarationSpanLength(b)
      || b.startIndex - a.startIndex
      || compareLocale(a.name, b.name))[0] || null;
}

function locationOwnedByDeclaration(record, span, location) {
  return innermostDeclarationSpanForLocation(record, location) === span;
}

function isAnyDeclarationNameLocation(record, location) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .some((span) => isDeclarationNameLocation(span, location));
}

function declarationIdentifierMetrics(record, span, publicApiInfo) {
  const locations = cachedIdentifierReferenceLocations(record, span?.name);
  const declarationLocations = locations.filter((location) => isDeclarationNameLocation(span, location));
  const nonDeclarationLocations = locations.filter((location) => !isDeclarationNameLocation(span, location));
  const publicApiLocations = nonDeclarationLocations
    .filter((location) => locationInRanges(location, publicApiInfo.ranges));
  const publicApiIndexes = new Set(publicApiLocations.map((location) => `${location.index}:${location.endIndex}`));
  const ownDeclarationLocations = nonDeclarationLocations
    .filter((location) => locationInsideDeclarationSpan(span, location));
  const ownDeclarationIndexes = new Set(ownDeclarationLocations.map((location) => `${location.index}:${location.endIndex}`));
  const sameFileLocations = nonDeclarationLocations
    .filter((location) => {
      const key = `${location.index}:${location.endIndex}`;
      return !publicApiIndexes.has(key) && !ownDeclarationIndexes.has(key);
    });

  return {
    identifierOccurrenceCount: locations.length,
    declarationNameOccurrenceCount: declarationLocations.length,
    ownDeclarationReferenceCount: ownDeclarationLocations.length,
    declarationOnlyNameOccurrence: locations.length === declarationLocations.length + ownDeclarationLocations.length,
    sameFileReferenceCount: sameFileLocations.length,
    publicApiReferenceCount: publicApiLocations.length,
  };
}

function topLevelWordIndex(text, word) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index <= text.length - word.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) continue;
    if (text.slice(index, index + word.length) !== word) continue;
    const before = text[index - 1] || '';
    const after = text[index + word.length] || '';
    if (!/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after)) return index;
  }
  return -1;
}

function topLevelBindingPatternText(text) {
  const cutIndexes = [
    topLevelCharacterIndex(text, '='),
    topLevelWordIndex(text, 'of'),
    topLevelWordIndex(text, 'in'),
  ].filter((index) => index >= 0);
  const endIndex = cutIndexes.length > 0 ? Math.min(...cutIndexes) : text.length;
  return text.slice(0, endIndex).replace(/^\s*\.\.\./, '');
}

function bindingIdentifierLocations(pattern, absoluteStart, identifier) {
  const bindingPattern = topLevelBindingPatternText(normalizeString(pattern));
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  const escaped = escapeRegExp(name);
  const namePattern = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
  const locations = [];
  let match;
  while ((match = namePattern.exec(bindingPattern))) {
    const nextIndex = findNextNonWhitespaceIndex(bindingPattern, match.index + match[0].length);
    if (bindingPattern[nextIndex] === ':') continue;
    locations.push({
      name,
      index: absoluteStart + match.index,
      endIndex: absoluteStart + match.index + match[0].length,
    });
  }
  return locations;
}

function findTopLevelArrowIndex(text, start, end) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < end - 1; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    if (
      char === '='
      && text[index + 1] === '>'
      && parenDepth === 0
      && bracketDepth === 0
      && braceDepth === 0
    ) {
      return index;
    }
  }
  return -1;
}

function declarationParameterRange(record, span) {
  const masked = maskIgnorableSyntax(record?.source);
  if (span?.kind === 'function') {
    const parametersStart = masked.indexOf('(', span.nameEndIndex);
    if (parametersStart === -1) return null;
    const parametersEnd = findMatchingDelimiter(masked, parametersStart, '(', ')');
    return parametersEnd === -1 ? null : {
      startIndex: parametersStart + 1,
      endIndex: parametersEnd,
    };
  }
  if (span?.kind !== 'arrow') return null;
  const spanEnd = declarationSpanExclusiveEnd(span);
  const equalsIndex = masked.indexOf('=', span.nameEndIndex);
  if (equalsIndex === -1 || equalsIndex >= spanEnd) return null;
  const arrowIndex = findTopLevelArrowIndex(masked, equalsIndex + 1, spanEnd);
  if (arrowIndex === -1) return null;
  let parametersStart = findNextNonWhitespaceIndex(masked, equalsIndex + 1);
  if (wordAt(masked, parametersStart, 'async')) {
    parametersStart = findNextNonWhitespaceIndex(masked, parametersStart + 'async'.length);
  }
  if (masked[parametersStart] === '(') {
    const parametersEnd = findMatchingDelimiter(masked, parametersStart, '(', ')');
    if (parametersEnd !== -1 && parametersEnd <= arrowIndex) {
      return {
        startIndex: parametersStart + 1,
        endIndex: parametersEnd,
      };
    }
  }
  return {
    startIndex: parametersStart,
    endIndex: arrowIndex,
  };
}

function parameterBindingLocations(record, span, identifier) {
  const range = declarationParameterRange(record, span);
  if (!range) return [];
  const masked = maskIgnorableSyntax(record?.source);
  const parameters = masked.slice(range.startIndex, range.endIndex);
  const locations = [];
  for (const part of splitTopLevel(parameters)) {
    locations.push(...bindingIdentifierLocations(
      part.text,
      range.startIndex + part.startIndex,
      identifier,
    ).map((location) => ({ ...location, kind: 'parameter' })));
  }
  return locations;
}

function findStatementEnd(masked, start, limit) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < limit; index += 1) {
    const char = masked[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index + 1;
  }
  return limit;
}

function wordBeforeIndex(masked, index) {
  const endIndex = previousNonWhitespaceIndex(masked, index);
  if (endIndex === -1 || !/[A-Za-z_$]/.test(masked[endIndex])) return '';
  let startIndex = endIndex;
  while (startIndex > 0 && /[A-Za-z0-9_$]/.test(masked[startIndex - 1])) startIndex -= 1;
  return masked.slice(startIndex, endIndex + 1);
}

function shouldTreatBraceAsLexicalBlock(masked, openIndex) {
  const previousIndex = previousNonWhitespaceIndex(masked, openIndex);
  if (previousIndex === -1) return true;
  if (')>;{'.includes(masked[previousIndex])) return true;
  return ['do', 'else', 'finally', 'try'].includes(wordBeforeIndex(masked, openIndex));
}

function lexicalBlockRanges(record) {
  if (!record || typeof record !== 'object') return [];
  if (lexicalBlockRangeCache.has(record)) return lexicalBlockRangeCache.get(record);
  const masked = maskIgnorableSyntax(record?.source);
  const ranges = [];
  const seen = new Set();
  const add = (startIndex, endIndex) => {
    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || endIndex <= startIndex) return;
    const key = `${startIndex}:${endIndex}`;
    if (seen.has(key)) return;
    seen.add(key);
    ranges.push({ startIndex, endIndex });
  };

  for (let index = 0; index < masked.length; index += 1) {
    if (masked[index] !== '{' || !shouldTreatBraceAsLexicalBlock(masked, index)) continue;
    const closeIndex = findMatchingBrace(masked, index);
    if (closeIndex !== -1) add(index, closeIndex + 1);
  }

  ranges.sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex)
    || b.startIndex - a.startIndex);
  lexicalBlockRangeCache.set(record, ranges);
  return ranges;
}

function canEndStatementAtIndex(text, index) {
  const char = text[index];
  if (/[A-Za-z0-9_$]/.test(char) || ')]}"\'`'.includes(char)) return true;
  return (char === '+' || char === '-') && text[index - 1] === char;
}

function statementContinuationStarts(text, index) {
  const char = text[index];
  if (!char) return false;
  return '`([{.,?:+-*/%&|^<>=!~'.includes(char);
}

function hasLineTerminatorBetween(text, start, end) {
  for (let index = start; index < end; index += 1) {
    if (text[index] === '\n' || text[index] === '\r') return true;
  }
  return false;
}

function identifierEndIndex(text, start) {
  if (!/[A-Za-z_$]/.test(text[start] || '')) return start;
  let index = start + 1;
  while (index < text.length && /[A-Za-z0-9_$]/.test(text[index])) index += 1;
  return index;
}

function templateLiteralEndIndex(text, start, limit) {
  let index = start + 1;
  let expressionDepth = 0;
  while (index < limit) {
    const char = text[index];
    if (char === '`' && expressionDepth === 0) return index + 1;
    if (char === '$' && text[index + 1] === '{' && expressionDepth === 0) {
      expressionDepth = 1;
      index += 2;
      continue;
    }
    if (expressionDepth > 0) {
      if (char === '`') {
        index = templateLiteralEndIndex(text, index, limit);
        continue;
      }
      if (char === '{') expressionDepth += 1;
      else if (char === '}') expressionDepth -= 1;
    }
    index += 1;
  }
  return limit;
}

function expressionStatementEndIndex(masked, start, limit) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let lastNonWhitespace = start;
  for (let index = start; index < limit; index += 1) {
    const char = masked[index];
    if (!/\s/.test(char)) lastNonWhitespace = index;
    if (char === '`') {
      index = templateLiteralEndIndex(masked, index, limit) - 1;
      lastNonWhitespace = Math.max(lastNonWhitespace, index);
    } else if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') {
      if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) return Math.max(start, lastNonWhitespace);
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index + 1;
    } else if (
      (char === '\n' || char === '\r')
      && parenDepth === 0
      && bracketDepth === 0
      && braceDepth === 0
      && lastNonWhitespace >= start
      && canEndStatementAtIndex(masked, lastNonWhitespace)
    ) {
      const nextIndex = findNextNonWhitespaceIndex(masked, index + 1);
      if (!statementContinuationStarts(masked, nextIndex)) return lastNonWhitespace + 1;
    }
  }
  return Math.min(limit, lastNonWhitespace + 1);
}

function conditionEndAfterKeyword(masked, keywordEnd, limit) {
  const conditionStart = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (conditionStart >= limit || masked[conditionStart] !== '(') return -1;
  return findMatchingDelimiter(masked, conditionStart, '(', ')');
}

function bracedBlockEndIndex(masked, blockStart, limit) {
  const start = findNextNonWhitespaceIndex(masked, blockStart);
  if (start >= limit || masked[start] !== '{') return -1;
  const end = findMatchingBrace(masked, start);
  return end === -1 ? -1 : end + 1;
}

function controlStatementWithConditionEnd(masked, keywordEnd, limit) {
  const conditionEnd = conditionEndAfterKeyword(masked, keywordEnd, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, keywordEnd, limit);
  return singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, conditionEnd + 1), limit);
}

function ifStatementEndIndex(masked, start, limit) {
  const conditionEnd = conditionEndAfterKeyword(masked, start + 'if'.length, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, start, limit);
  let end = singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, conditionEnd + 1), limit);
  const elseIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, elseIndex, 'else')) {
    end = singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, elseIndex + 'else'.length), limit);
  }
  return end;
}

function tryStatementEndIndex(masked, start, limit) {
  let end = bracedBlockEndIndex(masked, start + 'try'.length, limit);
  if (end === -1) return expressionStatementEndIndex(masked, start, limit);
  let nextIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, nextIndex, 'catch')) {
    const conditionEnd = conditionEndAfterKeyword(masked, nextIndex + 'catch'.length, limit);
    const catchBlockStart = conditionEnd === -1
      ? findNextNonWhitespaceIndex(masked, nextIndex + 'catch'.length)
      : findNextNonWhitespaceIndex(masked, conditionEnd + 1);
    const catchEnd = bracedBlockEndIndex(masked, catchBlockStart, limit);
    if (catchEnd !== -1) end = catchEnd;
  }
  nextIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, nextIndex, 'finally')) {
    const finallyEnd = bracedBlockEndIndex(masked, nextIndex + 'finally'.length, limit);
    if (finallyEnd !== -1) end = finallyEnd;
  }
  return end;
}

function doStatementEndIndex(masked, start, limit) {
  const bodyStart = findNextNonWhitespaceIndex(masked, start + 'do'.length);
  const bodyEnd = singleStatementEndIndex(masked, bodyStart, limit);
  const whileIndex = findNextNonWhitespaceIndex(masked, bodyEnd);
  if (!wordAt(masked, whileIndex, 'while')) return bodyEnd;
  const conditionEnd = conditionEndAfterKeyword(masked, whileIndex + 'while'.length, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, whileIndex, limit);
  const semicolonIndex = findNextNonWhitespaceIndex(masked, conditionEnd + 1);
  return masked[semicolonIndex] === ';' ? semicolonIndex + 1 : conditionEnd + 1;
}

function restrictedExpressionStatementEndIndex(masked, start, keyword, limit) {
  const keywordEnd = start + keyword.length;
  const nextIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (hasLineTerminatorBetween(masked, keywordEnd, nextIndex)) return keywordEnd;
  const semicolonIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (masked[semicolonIndex] === ';') return semicolonIndex + 1;
  return expressionStatementEndIndex(masked, start, limit);
}

function restrictedJumpStatementEndIndex(masked, start, keyword, limit) {
  const keywordEnd = start + keyword.length;
  const nextIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (hasLineTerminatorBetween(masked, keywordEnd, nextIndex)) return keywordEnd;
  if (masked[nextIndex] === ';') return nextIndex + 1;
  const labelEnd = identifierEndIndex(masked, nextIndex);
  if (labelEnd > nextIndex) {
    const afterLabel = findNextNonWhitespaceIndex(masked, labelEnd);
    return masked[afterLabel] === ';' ? afterLabel + 1 : labelEnd;
  }
  return keywordEnd;
}

function loopHeaderBoundsAt(masked, forIndex, limit) {
  if (!wordAt(masked, forIndex, 'for')) return null;
  let headerStart = findNextNonWhitespaceIndex(masked, forIndex + 'for'.length);
  if (wordAt(masked, headerStart, 'await')) {
    headerStart = findNextNonWhitespaceIndex(masked, headerStart + 'await'.length);
  }
  if (headerStart >= limit || masked[headerStart] !== '(') return null;
  const headerEnd = findMatchingDelimiter(masked, headerStart, '(', ')');
  if (headerEnd === -1) return null;
  return {
    headerStartIndex: headerStart,
    headerEndIndex: headerEnd + 1,
    bodyStartIndex: findNextNonWhitespaceIndex(masked, headerEnd + 1),
  };
}

function loopBodyEndIndex(masked, bodyStart, limit) {
  if (bodyStart >= limit) return limit;
  if (masked[bodyStart] === '{') {
    const closeIndex = findMatchingBrace(masked, bodyStart);
    return closeIndex === -1 ? limit : closeIndex + 1;
  }
  if (masked[bodyStart] === ';') return bodyStart + 1;
  return singleStatementEndIndex(masked, bodyStart, limit);
}

function loopEndIndexAt(masked, forIndex, limit) {
  const bounds = loopHeaderBoundsAt(masked, forIndex, limit);
  if (!bounds) return expressionStatementEndIndex(masked, forIndex, limit);
  return loopBodyEndIndex(masked, bounds.bodyStartIndex, limit);
}

function singleStatementEndIndex(masked, start, limit) {
  const statementStart = findNextNonWhitespaceIndex(masked, start);
  if (statementStart >= limit) return limit;
  if (masked[statementStart] === '{') {
    const closeIndex = findMatchingBrace(masked, statementStart);
    return closeIndex === -1 ? limit : closeIndex + 1;
  }
  if (masked[statementStart] === ';') return statementStart + 1;
  if (wordAt(masked, statementStart, 'if')) return ifStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'for')) return loopEndIndexAt(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'while')) {
    return controlStatementWithConditionEnd(masked, statementStart + 'while'.length, limit);
  }
  if (wordAt(masked, statementStart, 'with')) {
    return controlStatementWithConditionEnd(masked, statementStart + 'with'.length, limit);
  }
  if (wordAt(masked, statementStart, 'switch')) {
    const conditionEnd = conditionEndAfterKeyword(masked, statementStart + 'switch'.length, limit);
    const blockEnd = conditionEnd === -1
      ? -1
      : bracedBlockEndIndex(masked, conditionEnd + 1, limit);
    return blockEnd === -1 ? expressionStatementEndIndex(masked, statementStart, limit) : blockEnd;
  }
  if (wordAt(masked, statementStart, 'try')) return tryStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'do')) return doStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'return')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'return', limit);
  }
  if (wordAt(masked, statementStart, 'throw')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'throw', limit);
  }
  if (wordAt(masked, statementStart, 'yield')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'yield', limit);
  }
  if (wordAt(masked, statementStart, 'break')) {
    return restrictedJumpStatementEndIndex(masked, statementStart, 'break', limit);
  }
  if (wordAt(masked, statementStart, 'continue')) {
    return restrictedJumpStatementEndIndex(masked, statementStart, 'continue', limit);
  }
  return expressionStatementEndIndex(masked, statementStart, limit);
}

function loopScopeRanges(record) {
  if (!record || typeof record !== 'object') return [];
  if (loopScopeRangeCache.has(record)) return loopScopeRangeCache.get(record);
  const masked = maskIgnorableSyntax(record?.source);
  const ranges = [];
  const forPattern = /\bfor\b/g;
  let match;
  while ((match = forPattern.exec(masked))) {
    const bounds = loopHeaderBoundsAt(masked, match.index, masked.length);
    if (!bounds) continue;
    const endIndex = loopBodyEndIndex(masked, bounds.bodyStartIndex, masked.length);
    ranges.push({
      startIndex: match.index,
      headerStartIndex: bounds.headerStartIndex,
      headerEndIndex: bounds.headerEndIndex,
      endIndex,
    });
  }
  ranges.sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex)
    || b.startIndex - a.startIndex);
  loopScopeRangeCache.set(record, ranges);
  return ranges;
}

function nearestLexicalBlockForLocation(record, location, ownerSpan) {
  const ownerEnd = declarationSpanExclusiveEnd(ownerSpan);
  return lexicalBlockRanges(record).find((range) => (
    location.index >= range.startIndex
    && location.endIndex <= range.endIndex
    && (!ownerSpan || (
      range.startIndex >= ownerSpan.startIndex
      && range.endIndex <= ownerEnd
    ))
  )) || null;
}

function loopHeaderRangeForLocation(record, location, ownerSpan) {
  const ownerEnd = declarationSpanExclusiveEnd(ownerSpan);
  return loopScopeRanges(record).find((range) => (
    location.index > range.headerStartIndex
    && location.endIndex <= range.headerEndIndex
    && (!ownerSpan || (
      range.startIndex >= ownerSpan.startIndex
      && range.endIndex <= ownerEnd
    ))
  )) || null;
}

function loopHeaderScopeForLocation(record, location, ownerSpan) {
  return loopHeaderRangeForLocation(record, location, ownerSpan);
}

function spanScope(span) {
  return {
    scopeStart: span?.startIndex,
    scopeEnd: declarationSpanExclusiveEnd(span),
  };
}

function blockScopedBindingScope(record, ownerSpan, location) {
  const loopScope = loopHeaderScopeForLocation(record, location, ownerSpan);
  if (loopScope) {
    return {
      scopeStart: loopScope.startIndex,
      scopeEnd: loopScope.endIndex,
    };
  }
  const block = nearestLexicalBlockForLocation(record, location, ownerSpan);
  return block ? {
    scopeStart: block.startIndex,
    scopeEnd: block.endIndex,
  } : spanScope(ownerSpan);
}

function functionScopedBindingScope(ownerSpan) {
  return spanScope(ownerSpan);
}

function loopHeaderDeclarationEnd(masked, declarationStart, headerEndIndex) {
  const limit = Math.max(declarationStart, headerEndIndex - 1);
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = declarationStart; index < limit; index += 1) {
    const char = masked[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return limit;
}

function variableStatementEndIndex(masked, declarationStart, limit) {
  return expressionStatementEndIndex(masked, declarationStart, limit);
}

function variableBindingLocations(record, span, identifier) {
  const masked = maskIgnorableSyntax(record?.source);
  const spanEnd = declarationSpanExclusiveEnd(span);
  const declarationPattern = /\b(const|let|var)\s+/g;
  const locations = [];
  let match;
  while ((match = declarationPattern.exec(masked))) {
    const keywordLocation = { index: match.index, endIndex: declarationPattern.lastIndex };
    if (!locationOwnedByDeclaration(record, span, keywordLocation)) continue;
    const declarationStart = declarationPattern.lastIndex;
    const loopHeader = loopHeaderRangeForLocation(record, keywordLocation, span);
    const statementEnd = loopHeader
      ? loopHeaderDeclarationEnd(masked, declarationStart, loopHeader.headerEndIndex)
      : variableStatementEndIndex(masked, match.index, spanEnd);
    const declarationText = masked.slice(declarationStart, statementEnd);
    for (const part of splitTopLevel(declarationText)) {
      const declaratorStart = declarationStart + part.startIndex;
      const declaratorEnd = declaratorStart + part.text.length;
      locations.push(...bindingIdentifierLocations(
        part.text,
        declaratorStart,
        identifier,
      ).filter((location) => locationOwnedByDeclaration(record, span, location))
        .map((location) => ({
          ...location,
          kind: 'variable',
          declarationKind: match[1],
          ...(match[1] === 'var'
            ? functionScopedBindingScope(span)
            : blockScopedBindingScope(record, span, location)),
          statementStart: match.index,
          statementEnd,
          declaratorStart,
          declaratorEnd,
        })));
    }
  }
  return locations;
}

function functionBindingLocations(record, span, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((candidate) => candidate !== span
      && candidate.kind === 'function'
      && candidate.name === name
      && candidate.declarationType === 'function-declaration'
      && parentDeclarationSpanForSpan(record, candidate) === span)
    .map((candidate) => ({
      name,
      index: candidate.nameStartIndex,
      endIndex: candidate.nameEndIndex,
      kind: 'function',
      ...blockScopedBindingScope(record, span, {
        index: candidate.nameStartIndex,
        endIndex: candidate.nameEndIndex,
      }),
    }));
}

function classBindingLocations(record, span, identifier) {
  const masked = maskIgnorableSyntax(record?.source);
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  const classPattern = /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;
  const locations = [];
  let match;
  while ((match = classPattern.exec(masked))) {
    if (match[1] !== name) continue;
    const index = match.index + match[0].lastIndexOf(match[1]);
    const location = { name, index, endIndex: index + match[1].length };
    if (locationOwnedByDeclaration(record, span, location)) {
      locations.push({
        ...location,
        kind: 'class',
        ...blockScopedBindingScope(record, span, location),
      });
    }
  }
  return locations;
}

function localBindingLocations(record, span, identifier) {
  return [
    ...parameterBindingLocations(record, span, identifier)
      .map((location) => ({ ...location, ...functionScopedBindingScope(span) })),
    ...variableBindingLocations(record, span, identifier),
    ...functionBindingLocations(record, span, identifier),
    ...classBindingLocations(record, span, identifier),
  ].sort((a, b) => a.index - b.index || a.endIndex - b.endIndex);
}

function declarationScopeChain(record, span) {
  const chain = [];
  let current = span;
  while (current) {
    chain.push(current);
    current = parentDeclarationSpanForSpan(record, current);
  }
  return chain;
}

function visibleLocalBindingLocations(record, span, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  if (record && typeof record === 'object') {
    if (!visibleLocalBindingLocationCache.has(record)) {
      visibleLocalBindingLocationCache.set(record, new Map());
    }
    const recordCache = visibleLocalBindingLocationCache.get(record);
    const key = [
      span?.startIndex,
      declarationSpanExclusiveEnd(span),
      name,
    ].join('\u0000');
    if (recordCache.has(key)) return recordCache.get(key);
    const bindings = visibleLocalBindingLocationsUncached(record, span, name);
    recordCache.set(key, bindings);
    return bindings;
  }
  return visibleLocalBindingLocationsUncached(record, span, name);
}

function visibleLocalBindingLocationsUncached(record, span, identifier) {
  const bindings = [];
  const seen = new Set();
  for (const scopeSpan of declarationScopeChain(record, span)) {
    for (const binding of localBindingLocations(record, scopeSpan, identifier)) {
      const key = `${binding.kind}:${binding.index}:${binding.endIndex}:${binding.scopeStart}:${binding.scopeEnd}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bindings.push(binding);
    }
  }
  return bindings.sort((a, b) => (a.scopeEnd - a.scopeStart) - (b.scopeEnd - b.scopeStart)
    || b.scopeStart - a.scopeStart
    || a.index - b.index);
}

function sameLocation(a, b) {
  return a?.index === b?.index && a?.endIndex === b?.endIndex;
}

function cachedIdentifierReferenceLocations(record, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  if (!record || typeof record !== 'object') return identifierReferenceLocations(record?.source, name);
  if (!identifierReferenceLocationCache.has(record)) {
    identifierReferenceLocationCache.set(record, new Map());
  }
  const recordCache = identifierReferenceLocationCache.get(record);
  if (!recordCache.has(name)) {
    recordCache.set(name, identifierReferenceLocations(record.source, name));
  }
  return recordCache.get(name);
}

function lineStartIndexesForSource(source) {
  const text = normalizeString(source);
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function lineNumberAtSourceIndex(source, index) {
  if (!Number.isInteger(index) || index < 0) return null;
  const starts = lineStartIndexesForSource(source);
  let low = 0;
  let high = starts.length - 1;
  let found = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (starts[mid] <= index) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found + 1;
}

function unescapeStringLiteralValue(value) {
  return normalizeString(value).replace(/\\(['"\\])/g, '$1');
}

function stringLiteralExpressionValue(expression) {
  const match = normalizeString(expression).trim().match(/^(['"])((?:\\.|(?!\1)[\s\S])*?)\1$/);
  return match ? unescapeStringLiteralValue(match[2]) : '';
}

function stringConstantValues(record) {
  if (!record || typeof record !== 'object') return new Map();
  if (stringConstantValueCache.has(record)) return stringConstantValueCache.get(record);
  const source = normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const constants = new Map();
  const pattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(['"])((?:\\.|(?!\2)[\s\S])*?)\2/g;
  let match;
  while ((match = pattern.exec(source))) {
    if (!/\S/.test(masked[match.index] || '')) continue;
    constants.set(match[1], unescapeStringLiteralValue(match[3]));
  }
  stringConstantValueCache.set(record, constants);
  return constants;
}

function normalizeSpecifierExpression(expression) {
  let text = normalizeString(expression).trim();
  const paneUrlMatch = text.match(/^paneUrl\s*\(\s*([\s\S]*?)\s*\)$/);
  if (paneUrlMatch) text = paneUrlMatch[1].trim();
  return text;
}

function specifierExpressionMatchesRef(record, expression, specifier) {
  const text = normalizeSpecifierExpression(expression);
  if (!text) return false;
  const literalValue = stringLiteralExpressionValue(text);
  if (literalValue) return literalValue === specifier;
  const identifierMatch = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  return Boolean(identifierMatch) && stringConstantValues(record).get(text) === specifier;
}

function declarationSpecifierMatchesRef(record, declaration, refKind, specifier) {
  const specifierExpression = `((?:paneUrl\\s*\\(\\s*)?(?:['"](?:\\\\.|[^'"])*['"]|[A-Za-z_$][A-Za-z0-9_$]*)\\s*\\)?)`;
  const callPattern = refKind === 'require'
    ? new RegExp(`\\brequire\\s*\\(\\s*${specifierExpression}\\s*\\)`, 'g')
    : new RegExp(`\\b(?:import|window\\.import)\\s*\\(\\s*${specifierExpression}\\s*\\)`, 'g');
  let match;
  while ((match = callPattern.exec(declaration))) {
    if (specifierExpressionMatchesRef(record, match[1], specifier)) return true;
  }
  return false;
}

function localBindingDeclarationSource(record, localBinding) {
  const source = normalizeString(record?.source);
  const start = Number.isInteger(localBinding?.declaratorStart)
    ? localBinding.declaratorStart
    : localBinding?.statementStart;
  const end = Number.isInteger(localBinding?.declaratorEnd)
    ? localBinding.declaratorEnd
    : localBinding?.statementEnd;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) return '';
  return source.slice(start, end);
}

function localBindingIsImportDeclaration(record, localBinding, binding, ref) {
  if (
    localBinding?.kind !== 'variable'
    || normalizeIdentifier(binding?.local) !== normalizeIdentifier(localBinding.name)
  ) {
    return false;
  }
  const declaration = localBindingDeclarationSource(record, localBinding);
  const maskedDeclaration = maskIgnorableSyntax(declaration);
  const refKind = normalizeString(ref?.kind).trim();
  if (refKind === 'dynamic' || refKind === 'require') {
    const loaderPattern = refKind === 'require'
      ? /\brequire\s*\(/
      : /\b(?:import|window\.import)\s*\(/;
    const specifier = normalizeString(ref?.specifier).trim();
    return Boolean(specifier)
      && loaderPattern.test(maskedDeclaration)
      && declarationSpecifierMatchesRef(record, declaration, refKind, specifier);
  }
  if (refKind === 'lazy' && binding?.inferred) {
    const imported = escapeRegExp(normalizeIdentifier(binding.imported));
    return imported ? new RegExp(`\\.\\s*${imported}\\b`).test(declaration) : false;
  }
  return false;
}

function isShadowedReferenceLocation(record, span, identifier, location, {
  binding,
  ref,
  ignoredBindingLocations = [],
} = {}) {
  for (const localBinding of visibleLocalBindingLocations(record, span, identifier)) {
    if (ignoredBindingLocations.some((ignored) => sameLocation(localBinding, ignored))) continue;
    if (sameLocation(localBinding, location)) return true;
    if (
      Number.isInteger(localBinding.scopeStart)
      && Number.isInteger(localBinding.scopeEnd)
      && location.index >= localBinding.scopeStart
      && location.endIndex <= localBinding.scopeEnd
    ) {
      return !localBindingIsImportDeclaration(record, localBinding, binding, ref);
    }
  }
  return false;
}

function declarationSnippet(record, span) {
  const lines = sourceLines(record?.source);
  if (
    !span
    || !Number.isInteger(span.startLine)
    || !Number.isInteger(span.endLine)
    || span.startLine < 1
    || span.endLine < span.startLine
    || span.endLine > lines.length
  ) {
    return '';
  }
  return lines.slice(span.startLine - 1, span.endLine).join('\n');
}

function sourceDeclarationEntry({
  moduleId,
  visibleName,
  record,
  span,
  declarationName = visibleName,
  sourceOrigin,
  metrics = emptyDeclarationImportMetrics(),
  relationships = emptyDeclarationRelationships(),
}) {
  const code = declarationSnippet(record, span);
  if (!moduleId || !visibleName || !record?.rel || !code) return null;
  return {
    moduleId,
    modulePath: record.rel,
    name: visibleName,
    declarationName,
    kind: span.kind,
    startLine: span.startLine,
    endLine: span.endLine,
    code,
    sourceOrigin,
    referenceCount: metrics.referenceCount,
    sameFileReferenceCount: metrics.sameFileReferenceCount,
    incomingReferenceCount: metrics.incomingReferenceCount,
    directIdentifierReferenceCount: metrics.directIdentifierReferenceCount,
    importerFileCount: metrics.importerFileCount,
    importedFunctionUses: Array.isArray(relationships.importedFunctionUses)
      ? relationships.importedFunctionUses
      : [],
    importedBy: Array.isArray(relationships.importedBy) ? relationships.importedBy : [],
  };
}

function emptyDeclarationRelationships() {
  return {
    importedFunctionUses: [],
    importedBy: [],
  };
}

function emptyDeclarationImportMetrics() {
  return {
    referenceCount: 0,
    directIdentifierReferenceCount: 0,
    sameFileReferenceCount: 0,
    ownDeclarationReferenceCount: 0,
    sameFileNameOccurrenceCount: 0,
    incomingReferenceCount: 0,
    identifierOccurrenceCount: 0,
    declarationNameOccurrenceCount: 0,
    declarationOnlyNameOccurrence: false,
    publicApiReferenceCount: 0,
    importerFileCount: 0,
    incomingImports: [],
    publicApi: {
      exported: false,
      exportedNames: [],
      exportKinds: [],
    },
  };
}

function declarationImportMetricKey(modulePath, declarationName) {
  const rel = normalizeString(modulePath).trim();
  const name = normalizeString(declarationName).trim();
  return rel && name ? `${rel}\u0000${name}` : '';
}

function namedExportDeclarationMap(record) {
  const source = normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const spans = declarationSpansByName(record);
  const exports = new Map();
  const add = (exportedName, localName) => {
    const exported = normalizeIdentifier(exportedName);
    const local = normalizeIdentifier(localName);
    if (exported && local && spans.has(local) && !exports.has(exported)) exports.set(exported, local);
  };

  const directFunctionExportPattern = /\bexport\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
  const directArrowExportPattern = /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  const commonJsFunctionExpressionPattern = /\b(?:module\.)?exports\s*\.\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
  const commonJsPropertyPattern = /\b(?:module\.)?exports\s*\.\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([A-Za-z_$][A-Za-z0-9_$]*)\b/g;
  const commonJsObjectPattern = /\bmodule\s*\.\s*exports\s*=\s*\{([\s\S]*?)\}/g;
  let match;
  while ((match = directFunctionExportPattern.exec(masked))) add(match[1], match[1]);
  while ((match = directArrowExportPattern.exec(masked))) add(match[1], match[1]);
  while ((match = commonJsFunctionExpressionPattern.exec(masked))) add(match[1], match[2]);
  while ((match = commonJsPropertyPattern.exec(masked))) add(match[1], match[2]);
  while ((match = commonJsObjectPattern.exec(masked))) {
    for (const part of identifierListParts(match[1])) {
      const specifier = parseCommonJsObjectSpecifier(part);
      if (specifier) add(specifier.exported, specifier.local);
    }
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (specifier) add(specifier.exported, specifier.local);
    }
  }
  return exports;
}

function namedExportDeclarationName(record, exportedName) {
  const imported = normalizeIdentifier(exportedName);
  if (!imported) return '';
  const exportedDeclarations = namedExportDeclarationMap(record);
  if (exportedDeclarations.has(imported)) return exportedDeclarations.get(imported);
  return '';
}

function importBindingDeclarationName(targetRecord, binding) {
  const kind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (kind === 'named') {
    const imported = normalizeIdentifier(binding?.imported);
    return namedExportDeclarationName(targetRecord, imported);
  }
  if (kind === 'default') return defaultExportDeclarationName(targetRecord);
  return '';
}

function declarationImportMetricsFor(metrics, record, declarationName) {
  const key = declarationImportMetricKey(record?.rel, declarationName);
  return key && metrics instanceof Map
    ? (metrics.get(key) || emptyDeclarationImportMetrics())
    : emptyDeclarationImportMetrics();
}

function declarationRelationshipsFor(relationships, record, declarationName) {
  const key = declarationImportMetricKey(record?.rel, declarationName);
  return key && relationships instanceof Map
    ? (relationships.get(key) || emptyDeclarationRelationships())
    : emptyDeclarationRelationships();
}

function previousNonWhitespaceIndex(text, start) {
  for (let index = start - 1; index >= 0; index -= 1) {
    if (!/\s/.test(text[index])) return index;
  }
  return -1;
}

function isJsxOpeningIdentifierReference(source, location) {
  const text = normalizeString(source);
  const previousIndex = previousNonWhitespaceIndex(text, location?.index);
  if (text[previousIndex] !== '<') return false;
  if (/\s/.test(text[location.endIndex] || '')) return true;
  const nextIndex = findNextNonWhitespaceIndex(text, location.endIndex);
  return ['/', '>'].includes(text[nextIndex]) || /\s/.test(text[nextIndex] || '');
}

function isDirectCallableIdentifierReference(source, location) {
  const text = normalizeString(source);
  const nextIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  return text[nextIndex] === '(' || isJsxOpeningIdentifierReference(text, location);
}

function isOptionalCallIdentifierReference(source, location) {
  const text = normalizeString(source);
  const questionIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  if (text[questionIndex] !== '?' || text[questionIndex + 1] !== '.') return false;
  return text[findNextNonWhitespaceIndex(text, questionIndex + 2)] === '(';
}

function isTaggedTemplateIdentifierReference(source, location) {
  const text = normalizeString(source);
  return text[findNextNonWhitespaceIndex(text, location?.endIndex)] === '`';
}

function isJsxOpeningMemberReference(source, location) {
  const text = normalizeString(source);
  let dotIndex = previousNonWhitespaceIndex(text, location?.index);
  if (text[dotIndex] !== '.') return false;

  while (dotIndex !== -1) {
    let index = previousNonWhitespaceIndex(text, dotIndex);
    if (!/[A-Za-z0-9_$]/.test(text[index] || '')) return false;
    while (index > 0 && /[A-Za-z0-9_$]/.test(text[index - 1])) index -= 1;
    const previousIndex = previousNonWhitespaceIndex(text, index);
    if (text[previousIndex] === '<') return true;
    if (text[previousIndex] !== '.') return false;
    dotIndex = previousIndex;
  }
  return false;
}

function usageSyntaxForLocation(source, location) {
  const text = normalizeString(source);
  if (isJsxOpeningIdentifierReference(text, location) || isJsxOpeningMemberReference(text, location)) {
    return 'jsx-element';
  }
  if (isOptionalCallIdentifierReference(text, location)) return 'optional-call';
  if (isTaggedTemplateIdentifierReference(text, location)) return 'tagged-template';
  const nextIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  return text[nextIndex] === '(' ? 'call' : 'reference';
}

function compactReferenceUsages(record, referenceLocations) {
  const seen = new Set();
  return (Array.isArray(referenceLocations) ? referenceLocations : [])
    .map((location) => ({
      line: Number.isInteger(location?.line)
        ? location.line
        : lineNumberAtSourceIndex(record?.source, location?.index),
      syntax: usageSyntaxForLocation(record?.source, location),
    }))
    .filter((usage) => Number.isInteger(usage.line) && usage.line > 0 && usage.syntax)
    .filter((usage) => {
      const key = `${usage.line}\u0000${usage.syntax}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
}

function usageLinesForUsages(usages) {
  return Array.from(new Set((Array.isArray(usages) ? usages : [])
    .map((usage) => usage.line)
    .filter((line) => Number.isInteger(line) && line > 0)))
    .sort((a, b) => a - b);
}

function syntaxKindsForUsages(usages) {
  return Array.from(new Set((Array.isArray(usages) ? usages : [])
    .map((usage) => normalizeString(usage.syntax).trim())
    .filter(Boolean)))
    .sort(compareLocale);
}

function relationKindForSyntaxKinds(syntaxKinds) {
  const kinds = Array.isArray(syntaxKinds) ? syntaxKinds : [];
  if (kinds.length !== 1) return 'mixed-static-usage';
  if (kinds[0] === 'jsx-element') return 'static-jsx-element';
  if (kinds[0] === 'reference') return 'static-reference';
  return 'static-call';
}

function namespaceReferenceMaskedSource(source) {
  return maskIgnorableSyntax(source)
    .replace(/<\/\s*[A-Za-z_$][A-Za-z0-9_$]*(?:\s*\.\s*[A-Za-z_$][A-Za-z0-9_$]*)*/g, (closingTag) => (
      ' '.repeat(closingTag.length)
    ));
}

function isNamespaceBaseReference(masked, location) {
  const previousIndex = previousNonWhitespaceIndex(masked, location.index);
  if (previousIndex === -1) return true;
  return masked[previousIndex] !== '.' && masked[previousIndex] !== '#';
}

function namespaceMemberAfter(masked, endIndex) {
  let operatorIndex = findNextNonWhitespaceIndex(masked, endIndex);
  if (masked[operatorIndex] === '?') {
    if (masked[operatorIndex + 1] !== '.') return null;
    operatorIndex += 2;
  } else if (masked[operatorIndex] === '.') {
    operatorIndex += 1;
  } else {
    return null;
  }
  const memberStart = findNextNonWhitespaceIndex(masked, operatorIndex);
  const match = masked.slice(memberStart).match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
  if (!match) return null;
  return {
    name: match[1],
    index: memberStart,
    endIndex: memberStart + match[1].length,
  };
}

function declarationReferenceLocations(record, span, identifier, {
  directCallableOnly = false,
  binding,
  ref,
  ignoredBindingLocations = [],
} = {}) {
  const locations = cachedIdentifierReferenceLocations(record, identifier)
    .filter((location) => !isAnyDeclarationNameLocation(record, location))
    .filter((location) => locationOwnedByDeclaration(record, span, location))
    .filter((location) => !isShadowedReferenceLocation(record, span, identifier, location, {
      binding,
      ref,
      ignoredBindingLocations,
    }));
  return directCallableOnly
    ? locations.filter((location) => isDirectCallableIdentifierReference(record?.source, location))
    : locations;
}

function namespaceMemberReferenceLocations(record, span, namespaceName, { binding, ref } = {}) {
  const namespace = normalizeIdentifier(namespaceName);
  if (!namespace) return new Map();
  const masked = namespaceReferenceMaskedSource(record?.source);
  const escaped = escapeRegExp(namespace);
  const pattern = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
  const locationsByMember = new Map();
  let match;
  while ((match = pattern.exec(masked))) {
    const namespaceLocation = {
      index: match.index,
      endIndex: match.index + namespace.length,
    };
    if (!isNamespaceBaseReference(masked, namespaceLocation)) continue;
    const member = namespaceMemberAfter(masked, namespaceLocation.endIndex);
    const memberName = normalizeIdentifier(member?.name);
    if (!memberName) continue;
    const memberLocation = {
      index: member.index,
      endIndex: member.endIndex,
    };
    if (span && !locationOwnedByDeclaration(record, span, namespaceLocation)) continue;
    if (span && isShadowedReferenceLocation(record, span, namespace, namespaceLocation, { binding, ref })) continue;
    if (!locationsByMember.has(memberName)) locationsByMember.set(memberName, []);
    locationsByMember.get(memberName).push(memberLocation);
  }
  return locationsByMember;
}

function importBindingRelationshipTarget(targetRecord, binding) {
  const targetSpans = declarationSpansByName(targetRecord);
  const bindingKind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') return null;

  const declarationName = importBindingDeclarationName(targetRecord, binding);
  const span = targetSpans.get(declarationName);
  return span ? {
    declarationName,
    span,
    importedName: bindingKind === 'default' ? 'default' : binding.imported,
    directCallableOnly: false,
  } : null;
}

function namespaceImportRelationshipTarget(targetRecord, binding, memberName) {
  const targetSpans = declarationSpansByName(targetRecord);
  const importedName = normalizeIdentifier(memberName);
  const declarationName = namedExportDeclarationName(targetRecord, importedName);
  const span = targetSpans.get(declarationName);
  const namespaceName = normalizeIdentifier(binding?.local);
  return span ? {
    declarationName,
    span,
    importedName,
    localName: namespaceName ? `${namespaceName}.${importedName}` : importedName,
    directCallableOnly: false,
  } : null;
}

function bindingReferenceGroups({
  importerRecord,
  importerSpan,
  targetRecord,
  binding,
  ref,
}) {
  const bindingKind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') {
    return Array.from(namespaceMemberReferenceLocations(
      importerRecord,
      importerSpan,
      binding.local,
      { binding, ref },
    ), ([memberName, referenceLocations]) => ({
      target: namespaceImportRelationshipTarget(targetRecord, binding, memberName),
      referenceLocations,
    })).filter((group) => group.target && group.referenceLocations.length > 0);
  }

  const target = importBindingRelationshipTarget(targetRecord, binding);
  if (!target) return [];
  const referenceLocations = declarationReferenceLocations(
    importerRecord,
    importerSpan,
    binding.local,
    {
      directCallableOnly: Boolean(target.directCallableOnly),
      binding,
      ref,
    },
  );
  return referenceLocations.length > 0 ? [{ target, referenceLocations }] : [];
}

function compactUseRelationship({
  importerRecord,
  targetRecord,
  target,
  binding,
  ref,
  referenceLocations,
}) {
  const localName = normalizeString(target.localName || binding?.local).trim();
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    name: localName || target.declarationName,
    declarationName: target.declarationName,
    importedName: normalizeString(target.importedName).trim(),
    localName,
    bindingKind: normalizeString(binding?.kind || 'named').trim() || 'named',
    loadKind: normalizeString(ref?.kind).trim() || 'import',
    specifier: normalizeString(ref?.specifier).trim(),
    modulePath: targetRecord.rel,
    startLine: target.span.startLine,
    endLine: target.span.endLine,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compactImportedByRelationship({
  importerRecord,
  importerName,
  importerSpan,
  target,
  binding,
  ref,
  referenceLocations,
}) {
  const localName = normalizeString(target?.localName || binding?.local).trim();
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    name: importerName,
    declarationName: importerName,
    localName,
    importedName: normalizeString(target?.importedName || binding?.imported).trim(),
    bindingKind: normalizeString(binding?.kind || 'named').trim() || 'named',
    loadKind: normalizeString(ref?.kind).trim() || 'import',
    specifier: normalizeString(ref?.specifier).trim(),
    modulePath: importerRecord.rel,
    startLine: importerSpan.startLine,
    endLine: importerSpan.endLine,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compareDeclarationRelationship(a, b) {
  return compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || compareLocale(a.name, b.name)
    || compareLocale(a.localName, b.localName)
    || compareLocale(a.importedName, b.importedName);
}

function addDeclarationRelationship(bucket, listName, seen, seenKey, relationship) {
  if (seen.has(seenKey)) return;
  seen.add(seenKey);
  bucket[listName].push(relationship);
}

function buildDeclarationRelationships(graph) {
  const relationships = new Map();
  const seenUses = new Set();
  const seenImportedBy = new Set();
  const ensure = (record, declarationName) => {
    const key = declarationImportMetricKey(record?.rel, declarationName);
    if (!key) return null;
    if (!relationships.has(key)) relationships.set(key, emptyDeclarationRelationships());
    return relationships.get(key);
  };

  for (const importerRecord of graph.modules.values()) {
    const importerSpans = Array.from(declarationSpansByName(importerRecord));
    if (importerSpans.length === 0) continue;
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;

        for (const [importerName, importerSpan] of importerSpans) {
          for (const { target, referenceLocations } of bindingReferenceGroups({
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const targetKey = declarationImportMetricKey(targetRecord.rel, target.declarationName);
            if (!targetKey) continue;

            const importerKey = declarationImportMetricKey(importerRecord.rel, importerName);
            const useBucket = ensure(importerRecord, importerName);
            const importedByBucket = ensure(targetRecord, target.declarationName);
            if (!importerKey || !useBucket || !importedByBucket) continue;

            const relationshipKey = [
              importerKey,
              targetKey,
              target.localName || binding.local,
              target.importedName || binding.imported,
              binding.kind,
              ref.kind,
              ref.specifier,
            ].join('\u0000');
            const referenceCount = referenceLocations.length;
            addDeclarationRelationship(
              useBucket,
              'importedFunctionUses',
              seenUses,
              relationshipKey,
              compactUseRelationship({ importerRecord, targetRecord, target, binding, ref, referenceLocations }),
            );
            addDeclarationRelationship(
              importedByBucket,
              'importedBy',
              seenImportedBy,
              relationshipKey,
              compactImportedByRelationship({
                importerRecord,
                importerName,
                importerSpan,
                target,
                binding,
                ref,
                referenceLocations,
              }),
            );
          }
        }
      }
    }
  }

  for (const bucket of relationships.values()) {
    bucket.importedFunctionUses.sort(compareDeclarationRelationship);
    bucket.importedBy.sort(compareDeclarationRelationship);
  }
  return relationships;
}

function buildDeclarationImportMetrics(graph) {
  const buckets = new Map();
  for (const record of graph.modules.values()) {
    for (const [declarationName, span] of declarationSpansByName(record)) {
      const key = declarationImportMetricKey(record.rel, declarationName);
      if (!key) continue;
      const publicApi = declarationPublicApiInfo(record, declarationName);
      const identifierMetrics = declarationIdentifierMetrics(record, span, publicApi);
      buckets.set(key, {
        ...identifierMetrics,
        incomingReferenceCount: 0,
        importerFiles: new Set(),
        incomingImports: [],
        publicApi: {
          exported: publicApi.exported,
          exportedNames: publicApi.exportedNames,
          exportKinds: publicApi.exportKinds,
        },
      });
    }
  }
  for (const importerRecord of graph.modules.values()) {
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        const importGroups = new Map();
        for (const [, importerSpan] of declarationSpansByName(importerRecord)) {
          for (const { target, referenceLocations } of bindingReferenceGroups({
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const groupKey = declarationImportMetricKey(targetRecord.rel, target.declarationName);
            if (!groupKey) continue;
            if (!importGroups.has(groupKey)) importGroups.set(groupKey, { target, referenceCount: 0 });
            importGroups.get(groupKey).referenceCount += referenceLocations.length;
          }
        }
        for (const [key, { target, referenceCount }] of importGroups) {
          if (!buckets.has(key)) {
            buckets.set(key, {
              identifierOccurrenceCount: 0,
              declarationNameOccurrenceCount: 0,
              declarationOnlyNameOccurrence: false,
              sameFileReferenceCount: 0,
              ownDeclarationReferenceCount: 0,
              publicApiReferenceCount: 0,
              incomingReferenceCount: 0,
              importerFiles: new Set(),
              incomingImports: [],
              publicApi: {
                exported: false,
                exportedNames: [],
                exportKinds: [],
              },
            });
          }
          const bucket = buckets.get(key);
          bucket.incomingReferenceCount += referenceCount;
          if (importerRecord.rel !== targetRecord.rel) {
            bucket.importerFiles.add(importerRecord.rel);
            bucket.incomingImports.push({
              importerPath: importerRecord.rel,
              specifier: ref.specifier,
              loadKind: normalizeString(ref.kind).trim() || 'import',
              imported: target.importedName || binding.imported,
              local: target.localName || binding.local,
              bindingKind: binding.kind,
              inferred: Boolean(binding.inferred),
              referenceCount,
            });
          }
        }
      }
    }
  }

  return new Map(Array.from(buckets, ([key, bucket]) => [key, {
    referenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    directIdentifierReferenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    sameFileReferenceCount: bucket.sameFileReferenceCount,
    ownDeclarationReferenceCount: bucket.ownDeclarationReferenceCount,
    sameFileNameOccurrenceCount: Math.max(
      0,
      bucket.identifierOccurrenceCount - bucket.declarationNameOccurrenceCount - bucket.ownDeclarationReferenceCount,
    ),
    incomingReferenceCount: bucket.incomingReferenceCount,
    identifierOccurrenceCount: bucket.identifierOccurrenceCount,
    declarationNameOccurrenceCount: bucket.declarationNameOccurrenceCount,
    declarationOnlyNameOccurrence: bucket.declarationOnlyNameOccurrence,
    publicApiReferenceCount: bucket.publicApiReferenceCount,
    importerFileCount: bucket.importerFiles.size,
    incomingImports: bucket.incomingImports.sort((a, b) => compareLocale(a.importerPath, b.importerPath)
      || compareLocale(a.loadKind, b.loadKind)
      || compareLocale(a.imported, b.imported)
      || compareLocale(a.local, b.local)),
    publicApi: bucket.publicApi,
  }]));
}

function memberMetricLabel(label, lineCount, metrics = emptyDeclarationImportMetrics()) {
  if (!Number.isInteger(lineCount) || lineCount <= 0) return label;
  const referenceCount = Number.isInteger(metrics.referenceCount) && metrics.referenceCount >= 0
    ? metrics.referenceCount
    : 0;
  const importerFileCount = Number.isInteger(metrics.importerFileCount) && metrics.importerFileCount >= 0
    ? metrics.importerFileCount
    : 0;
  return `${label} [lines: ${lineCount} | refs: ${referenceCount} | importers: ${importerFileCount}]`;
}

function mermaidClassLabel(record) {
  return `${record.stats.lineCount} ${path.posix.basename(record.rel)}`;
}

function escapeMermaidLabel(label) {
  return normalizeString(label).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function mermaidClassHeader(record, classId) {
  return `class ${classId}["${escapeMermaidLabel(mermaidClassLabel(record))}"]`;
}

function externalLabel(specifier) {
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

function isIgnoredExternalLabel(label) {
  return normalizeString(label).trim().toLowerCase() === 'react';
}

function isJsxModule(rel) {
  return /\.(?:jsx)$/i.test(rel);
}

function moduleRecords(graph, { reachableOnly = false } = {}) {
  return Array.from(graph.modules.values())
    .filter((record) => !reachableOnly || record.reachable)
    .sort((a, b) => compareLocale(a.rel, b.rel));
}

function jsxModuleRecords(graph, options = {}) {
  return moduleRecords(graph, options)
    .filter((record) => isJsxModule(record.rel))
    .sort((a, b) => compareLocale(a.rel, b.rel));
}

function buildClassIds(records) {
  const baseCounts = new Map();
  const ids = new Map();
  for (const record of records) {
    const base = normalizeString(path.posix.basename(record.rel, path.posix.extname(record.rel)))
      .replace(/[^A-Za-z0-9_$]/g, '_') || 'Module';
    const count = (baseCounts.get(base) || 0) + 1;
    baseCounts.set(base, count);
    ids.set(record.rel, count === 1 ? base : `${base}_${count}`);
  }
  return ids;
}

function importedScriptVariableName(ref) {
  const bindings = Array.isArray(ref?.bindings) ? ref.bindings : [];
  const binding = bindings.find((candidate) => candidate.kind === 'named')
    || bindings.find((candidate) => candidate.kind === 'namespace')
    || bindings.find((candidate) => candidate.kind === 'default');
  return normalizeString(binding?.local).trim();
}

function namespaceMemberNamesForRecord(record, binding, ref) {
  const names = new Set();
  for (const [, span] of declarationSpansByName(record)) {
    for (const memberName of namespaceMemberReferenceLocations(record, span, binding.local, { binding, ref }).keys()) {
      names.add(memberName);
    }
  }
  return Array.from(names).sort(compareLocale);
}

function importedScriptCandidatesForJsx(record, graph, declarationImportMetrics) {
  const candidates = [];
  for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
    if (ref?.localRel && isJsxModule(ref.localRel)) continue;
    if (isIgnoredExternalLabel(ref?.specifier)) continue;
    const name = importedScriptVariableName(ref);
    if (name === 'React') continue;
    if (!name) continue;
    const targetRecord = ref.localRel ? graph.modules.get(ref.localRel) : null;
    const binding = (Array.isArray(ref.bindings) ? ref.bindings : [])
      .find((candidate) => candidate.local === name);
    if (targetRecord && binding?.kind === 'namespace') {
      for (const memberName of namespaceMemberNamesForRecord(record, binding, ref)) {
        const declarationName = namedExportDeclarationName(targetRecord, memberName);
        const visibleName = `${name}.${memberName}`;
        candidates.push({
          name: visibleName,
          targetRecord,
          binding,
          declarationName,
          lineCount: declarationLineCount(targetRecord, declarationName),
          metrics: declarationImportMetricsFor(declarationImportMetrics, targetRecord, declarationName),
        });
      }
      continue;
    }
    const resolvedDeclarationName = importBindingDeclarationName(targetRecord, binding);
    const declarationName = resolvedDeclarationName || (targetRecord ? '' : name);
    candidates.push({
      name,
      targetRecord,
      binding,
      declarationName,
      lineCount: declarationLineCount(targetRecord, declarationName),
      metrics: declarationImportMetricsFor(declarationImportMetrics, targetRecord, declarationName),
    });
  }
  return candidates.sort((a, b) => compareLocale(a.name, b.name));
}

function importedScriptMembersForJsx(record, graph, declarationImportMetrics) {
  const members = new Map();
  for (const candidate of importedScriptCandidatesForJsx(record, graph, declarationImportMetrics)) {
    const { name, lineCount, metrics } = candidate;
    const existing = members.get(name);
    if (!existing || (!existing.lineCount && lineCount)) {
      members.set(name, { name, lineCount, metrics });
    }
  }
  return Array.from(members.values()).sort((a, b) => compareLocale(a.name, b.name));
}

function importedScriptSourceDeclarationsForJsx(record, graph, moduleId, declarationImportMetrics, declarationRelationships) {
  const declarations = new Map();
  for (const candidate of importedScriptCandidatesForJsx(record, graph, declarationImportMetrics)) {
    const { name, targetRecord, binding, declarationName, metrics } = candidate;
    if (!targetRecord) continue;

    const span = declarationSpansByName(targetRecord).get(declarationName);
    const entry = sourceDeclarationEntry({
      moduleId,
      visibleName: name,
      record: targetRecord,
      span,
      declarationName,
      sourceOrigin: 'imported-script-member',
      metrics,
      relationships: declarationRelationshipsFor(declarationRelationships, targetRecord, declarationName),
    });
    if (entry && !declarations.has(entry.name)) declarations.set(entry.name, entry);
  }
  return Array.from(declarations.values())
    .sort((a, b) => compareLocale(a.name, b.name));
}

function importKindRank(kind) {
  if (kind === 'default') return 0;
  if (kind === 'namespace') return 1;
  return 2;
}

function compareImportEdgeBinding(a, b) {
  return importKindRank(a.kind) - importKindRank(b.kind)
    || compareLocale(a.imported, b.imported)
    || compareLocale(a.local, b.local)
    || Number(a.inferred) - Number(b.inferred);
}

function importBindingLineCount(graph, targetRel, binding) {
  if (binding.kind !== 'named') return null;
  const targetRecord = graph.modules.get(targetRel);
  return declarationLineCount(targetRecord, importBindingDeclarationName(targetRecord, binding));
}

function edgeRestingLabel(loadKinds) {
  const kinds = Array.isArray(loadKinds) ? loadKinds : Array.from(loadKinds || []);
  const isLazyOnly = kinds.length > 0
    && kinds.every((kind) => kind === 'lazy' || kind === 'dynamic');
  return isLazyOnly ? 'lazy' : 'import';
}

function buildImportEdges(graph, { reachableOnly = false } = {}) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly });
  const classIds = buildClassIds(jsxModules);
  const edgeMap = new Map();

  for (const record of jsxModules) {
    const source = classIds.get(record.rel);
    for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
      if (!ref?.localRel || !classIds.has(ref.localRel)) continue;
      const key = `${record.rel}\u0000${ref.localRel}`;
      if (!edgeMap.has(key)) {
        const targetRecord = graph.modules.get(ref.localRel);
        edgeMap.set(key, {
          source,
          target: classIds.get(ref.localRel),
          sourcePath: record.rel,
          targetPath: ref.localRel,
          targetLineCount: targetRecord?.stats?.lineCount || null,
          loadKinds: new Set(),
          imports: new Map(),
        });
      }

      const edge = edgeMap.get(key);
      const loadKind = normalizeString(ref.kind).trim();
      if (loadKind) edge.loadKinds.add(loadKind);
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.imported || !binding?.local) continue;
        const lineCount = importBindingLineCount(graph, ref.localRel, binding);
        const enriched = lineCount ? { ...binding, lineCount } : binding;
        const bindingKey = `${binding.kind}\u0000${binding.imported}\u0000${binding.local}\u0000${binding.inferred}`;
        edge.imports.set(bindingKey, enriched);
      }
    }
  }

  return Array.from(edgeMap.values())
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourcePath: edge.sourcePath,
      targetPath: edge.targetPath,
      targetLineCount: edge.targetLineCount,
      loadKinds: Array.from(edge.loadKinds).sort(compareLocale),
      imports: Array.from(edge.imports.values()).sort(compareImportEdgeBinding),
    }))
    .sort((a, b) => compareLocale(a.sourcePath, b.sourcePath)
      || compareLocale(a.targetPath, b.targetPath)
      || compareLocale(a.source, b.source)
      || compareLocale(a.target, b.target));
}

function encodedStaticId(value) {
  return Buffer.from(normalizeString(value), 'utf8').toString('base64url');
}

function functionSpanKey(record, span) {
  return [
    normalizeString(record?.rel).trim(),
    normalizeString(span?.name).trim(),
    normalizeString(span?.kind).trim(),
    span?.startLine,
    span?.endLine,
  ].join('\u0000');
}

function functionIdForSpan(record, span) {
  return encodedStaticId(`function\u0000${functionSpanKey(record, span)}`);
}

function functionDependencyEdgeId({ sourceNode, targetNode, scope, importInfo }) {
  return encodedStaticId([
    'function-edge',
    sourceNode?.id,
    targetNode?.id,
    scope,
    importInfo?.specifier || '',
    importInfo?.loadKind || '',
    importInfo?.bindingKind || '',
    importInfo?.importedName || '',
    importInfo?.localName || '',
  ].join('\u0000'));
}

function compareFunctionNode(a, b) {
  return compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || compareLocale(a.name, b.name)
    || compareLocale(a.kind, b.kind);
}

function compareFunctionEdge(a, b) {
  return compareLocale(a.sourceModulePath, b.sourceModulePath)
    || a.sourceStartLine - b.sourceStartLine
    || compareLocale(a.targetModulePath, b.targetModulePath)
    || a.targetStartLine - b.targetStartLine
    || compareLocale(a.scope, b.scope)
    || compareLocale(a.targetFunction, b.targetFunction)
    || compareLocale(a.import?.localName || '', b.import?.localName || '');
}

function functionNodeForSpan(record, span) {
  const name = normalizeString(span?.name).trim();
  return {
    id: functionIdForSpan(record, span),
    modulePath: record.rel,
    name,
    declarationName: name,
    kind: normalizeString(span?.kind).trim() || 'function',
    component: /^[A-Z]/.test(name),
    startLine: span.startLine,
    endLine: span.endLine,
    lineCount: span.lineCount,
  };
}

function functionNodeDescriptors(graph) {
  const descriptors = [];
  const bySpanKey = new Map();
  const byModulePath = new Map();

  for (const record of moduleRecords(graph)) {
    const spans = (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
      .filter((span) => ['function', 'arrow'].includes(span?.kind))
      .sort((a, b) => a.startLine - b.startLine
        || a.endLine - b.endLine
        || compareLocale(a.name, b.name)
        || compareLocale(a.kind, b.kind));
    for (const span of spans) {
      const node = functionNodeForSpan(record, span);
      const descriptor = { node, record, span };
      descriptors.push(descriptor);
      bySpanKey.set(functionSpanKey(record, span), descriptor);
      if (!byModulePath.has(record.rel)) byModulePath.set(record.rel, []);
      byModulePath.get(record.rel).push(descriptor);
    }
  }

  descriptors.sort((a, b) => compareFunctionNode(a.node, b.node));
  for (const list of byModulePath.values()) {
    list.sort((a, b) => compareFunctionNode(a.node, b.node));
  }
  return { descriptors, bySpanKey, byModulePath };
}

function uniqueSameModuleTargets(descriptors) {
  const targets = new Map();
  for (const descriptor of descriptors) {
    if (!targets.has(descriptor.node.name)) targets.set(descriptor.node.name, descriptor);
  }
  return Array.from(targets.values());
}

function sameModuleReferenceLocations(record, callerSpan, targetSpan) {
  return declarationReferenceLocations(record, callerSpan, targetSpan?.name, {
    ignoredBindingLocations: [{
      index: targetSpan?.nameStartIndex,
      endIndex: targetSpan?.nameEndIndex,
    }],
  });
}

function declarationSearchText(record, span) {
  const source = normalizeString(record?.source);
  const endIndex = declarationSpanExclusiveEnd(span);
  if (!Number.isInteger(span?.nameEndIndex) || !Number.isInteger(endIndex) || endIndex <= span.nameEndIndex) {
    return '';
  }
  return source.slice(span.nameEndIndex, endIndex);
}

function functionImportInfo(target, binding, ref) {
  const localName = normalizeString(target?.localName || binding?.local).trim();
  return {
    specifier: normalizeString(ref?.specifier).trim(),
    loadKind: normalizeString(ref?.kind).trim() || 'import',
    bindingKind: normalizeString(binding?.kind || 'named').trim() || 'named',
    importedName: normalizeString(target?.importedName || binding?.imported).trim(),
    localName,
    inferred: Boolean(binding?.inferred),
  };
}

function createFunctionDependencyEdge({
  sourceDescriptor,
  targetDescriptor,
  scope,
  referenceLocations,
  importInfo = null,
}) {
  const usages = compactReferenceUsages(sourceDescriptor.record, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  const sourceNode = sourceDescriptor.node;
  const targetNode = targetDescriptor.node;
  return {
    id: functionDependencyEdgeId({ sourceNode, targetNode, scope, importInfo }),
    scope,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    sourceId: sourceNode.id,
    sourceModulePath: sourceNode.modulePath,
    sourceFunction: sourceNode.name,
    sourceKind: sourceNode.kind,
    sourceStartLine: sourceNode.startLine,
    sourceEndLine: sourceNode.endLine,
    targetId: targetNode.id,
    targetModulePath: targetNode.modulePath,
    targetFunction: targetNode.name,
    targetKind: targetNode.kind,
    targetStartLine: targetNode.startLine,
    targetEndLine: targetNode.endLine,
    ...(importInfo ? { import: importInfo } : {}),
  };
}

function mergeFunctionDependencyEdge(edgeMap, edge) {
  if (!edgeMap.has(edge.id)) {
    edgeMap.set(edge.id, edge);
    return;
  }

  const existing = edgeMap.get(edge.id);
  existing.referenceCount += edge.referenceCount;
  const usages = [...existing.usages, ...edge.usages]
    .filter((usage, index, all) => (
      all.findIndex((candidate) => (
        candidate.line === usage.line && candidate.syntax === usage.syntax
      )) === index
    ))
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
  existing.usages = usages;
  existing.usageLines = usageLinesForUsages(usages);
  existing.syntaxKinds = syntaxKindsForUsages(usages);
  existing.relationKind = relationKindForSyntaxKinds(existing.syntaxKinds);
}

function buildSameModuleFunctionEdges({ byModulePath }) {
  const edgeMap = new Map();
  for (const descriptors of byModulePath.values()) {
    const targets = uniqueSameModuleTargets(descriptors);
    for (const callerDescriptor of descriptors) {
      const searchText = declarationSearchText(callerDescriptor.record, callerDescriptor.span);
      for (const targetDescriptor of targets) {
        if (callerDescriptor.node.id === targetDescriptor.node.id) continue;
        if (!searchText.includes(targetDescriptor.node.name)) continue;
        const referenceLocations = sameModuleReferenceLocations(
          callerDescriptor.record,
          callerDescriptor.span,
          targetDescriptor.span,
        );
        if (referenceLocations.length === 0) continue;
        mergeFunctionDependencyEdge(edgeMap, createFunctionDependencyEdge({
          sourceDescriptor: callerDescriptor,
          targetDescriptor,
          scope: 'same-module',
          referenceLocations,
        }));
      }
    }
  }
  return edgeMap;
}

function buildImportedFunctionEdges(graph, { bySpanKey }) {
  const edgeMap = new Map();
  for (const importerRecord of graph.modules.values()) {
    const importerSpans = Array.from(declarationSpansByName(importerRecord).values());
    if (importerSpans.length === 0) continue;
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        for (const importerSpan of importerSpans) {
          const sourceDescriptor = bySpanKey.get(functionSpanKey(importerRecord, importerSpan));
          if (!sourceDescriptor) continue;
          for (const { target, referenceLocations } of bindingReferenceGroups({
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const targetDescriptor = bySpanKey.get(functionSpanKey(targetRecord, target.span));
            if (!targetDescriptor || referenceLocations.length === 0) continue;
            mergeFunctionDependencyEdge(edgeMap, createFunctionDependencyEdge({
              sourceDescriptor,
              targetDescriptor,
              scope: 'imported',
              referenceLocations,
              importInfo: functionImportInfo(target, binding, ref),
            }));
          }
        }
      }
    }
  }
  return edgeMap;
}

function buildFunctionDependencyMap(graph) {
  const descriptorIndex = functionNodeDescriptors(graph);
  const sameModuleEdges = buildSameModuleFunctionEdges(descriptorIndex);
  const importedEdges = buildImportedFunctionEdges(graph, descriptorIndex);
  const edges = [
    ...sameModuleEdges.values(),
    ...importedEdges.values(),
  ].sort(compareFunctionEdge);
  return {
    limitations: FUNCTION_DEPENDENCY_LIMITATIONS,
    functions: descriptorIndex.descriptors
      .map((descriptor) => descriptor.node)
      .sort(compareFunctionNode),
    edges,
  };
}

function buildMermaid(graph, importEdges, declarationImportMetrics, { reachableOnly = false } = {}) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly });
  const classIds = buildClassIds(jsxModules);
  const lines = ['classDiagram'];
  if (jsxModules.length === 0) {
    lines.push('  %% No JSX modules found.');
    return lines.join('\n');
  }
  for (const record of jsxModules) {
    const classId = classIds.get(record.rel);
    const variables = importedScriptMembersForJsx(record, graph, declarationImportMetrics);
    const components = componentSpans(record);
    if (variables.length === 0 && components.length === 0) {
      lines.push(`  ${mermaidClassHeader(record, classId)}`);
      continue;
    }
    lines.push(`  ${mermaidClassHeader(record, classId)} {`);
    for (const variable of variables) {
      lines.push(`    +${memberMetricLabel(variable.name, variable.lineCount, variable.metrics)}`);
    }
    for (const [component] of components) {
      const lineCount = declarationLineCount(record, component);
      lines.push(`    +${memberMetricLabel(
        `${component}()`,
        lineCount,
        declarationImportMetricsFor(declarationImportMetrics, record, component),
      )}`);
    }
    lines.push('  }');
  }
  for (const edge of importEdges) {
    if (!classIds.has(edge.sourcePath) || !classIds.has(edge.targetPath)) continue;
    lines.push(`  ${edge.source} --> ${edge.target} : ${edgeRestingLabel(edge.loadKinds)}`);
  }
  return lines.join('\n');
}

function buildSourceCode(graph, declarationImportMetrics, declarationRelationships) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly: true });
  const classIds = buildClassIds(jsxModules);
  const modules = moduleRecords(graph)
    .map((record) => ({
      path: record.rel,
      lineCount: record.stats.lineCount,
      maxLineLength: record.stats.maxLineLength,
      code: record.source,
    }));
  const declarations = [];
  const seen = new Set();

  const pushEntry = (entry) => {
    const key = entry && `${entry.moduleId}\u0000${entry.sourceOrigin}\u0000${entry.name}`;
    if (!entry || seen.has(key)) return;
    seen.add(key);
    declarations.push(entry);
  };

  for (const record of jsxModules) {
    const moduleId = classIds.get(record.rel);
    for (const entry of importedScriptSourceDeclarationsForJsx(
      record,
      graph,
      moduleId,
      declarationImportMetrics,
      declarationRelationships,
    )) {
      pushEntry(entry);
    }
    for (const [component, span] of componentSpans(record)) {
      pushEntry(sourceDeclarationEntry({
        moduleId,
        visibleName: component,
        record,
        span,
        sourceOrigin: 'current-file-declaration',
        metrics: declarationImportMetricsFor(declarationImportMetrics, record, component),
        relationships: declarationRelationshipsFor(declarationRelationships, record, component),
      }));
    }
  }

  return { modules, declarations };
}

function buildTreeText(graph) {
  const entry = graph.modules.get(graph.entryRel);
  if (!entry) return '';
  const lines = [];
  const seen = new Set();
  const visit = (rel, depth) => {
    const prefix = depth === 0 ? '' : `${'  '.repeat(depth - 1)}- `;
    lines.push(`${prefix}${rel}`);
    if (seen.has(rel)) return;
    seen.add(rel);
    const record = graph.modules.get(rel);
    if (!record) return;
    for (const dep of [...record.localDeps].sort(compareLocale)) {
      visit(dep, depth + 1);
    }
    for (const external of [...record.externalDeps].sort(compareLocale)) {
      lines.push(`${'  '.repeat(depth)}- [external] ${external}`);
    }
  };
  visit(entry.rel, 0);
  return lines.join('\n');
}

function createTreeNode() {
  return {
    dirs: new Map(),
    files: [],
  };
}

function buildJsxTreeText(jsxScripts) {
  if (!Array.isArray(jsxScripts) || jsxScripts.length === 0) return 'No JSX files found.';
  const root = createTreeNode();

  for (const script of jsxScripts) {
    const parts = toPosixPath(script.path).split('/').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) continue;

    let node = root;
    for (const dirName of parts) {
      if (!node.dirs.has(dirName)) node.dirs.set(dirName, createTreeNode());
      node = node.dirs.get(dirName);
    }
    node.files.push({
      name: fileName,
      lineCount: script.lineCount,
    });
  }

  const lines = ['.'];
  const render = (node, prefix) => {
    const entries = [
      ...Array.from(node.dirs, ([name, child]) => ({ type: 'dir', name, child })),
      ...node.files.map((file) => ({ type: 'file', ...file })),
    ].sort((a, b) => compareLocale(a.name, b.name) || compareLocale(a.type, b.type));

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '`-- ' : '|-- ';
      if (entry.type === 'file') {
        lines.push(`${prefix}${connector}${entry.name} (${formatLineCount(entry.lineCount)})`);
        return;
      }
      lines.push(`${prefix}${connector}${entry.name}`);
      render(entry.child, `${prefix}${isLast ? '    ' : '|   '}`);
    });
  };

  render(root, '');
  return lines.join('\n');
}

function buildReachableModuleSet(modules, entryRel) {
  const reachable = new Set();
  const queue = [entryRel];
  while (queue.length > 0) {
    const rel = queue.shift();
    if (!rel || reachable.has(rel) || !modules.has(rel)) continue;
    reachable.add(rel);
    const record = modules.get(rel);
    for (const dep of Array.isArray(record.localDeps) ? record.localDeps : []) {
      if (!reachable.has(dep)) queue.push(dep);
    }
  }
  return reachable;
}

function reachableGraphView(graph) {
  return {
    ...graph,
    modules: new Map(moduleRecords(graph, { reachableOnly: true }).map((record) => [record.rel, record])),
  };
}

export async function analyzeProject({ rootDir, entry, moduleLimit = 500, routeAliases = [] } = {}) {
  const resolvedRoot = path.resolve(normalizeString(rootDir).trim() || '.');
  const resolvedEntry = await resolveEntry(resolvedRoot, entry);
  const aliases = await loadImportAliases(resolvedRoot, resolvedEntry.rel);
  const resolvedRouteAliases = [
    ...normalizeRouteAliases(routeAliases),
    ...DEFAULT_ROUTE_ALIASES,
  ];
  const discoveredModules = await discoverAnalyzableModules(resolvedRoot, moduleLimit);
  const discoveredByRel = new Map(discoveredModules.map((module) => [module.rel, module]));
  if (!discoveredByRel.has(resolvedEntry.rel)) {
    discoveredByRel.set(resolvedEntry.rel, resolvedEntry);
    if (discoveredByRel.size > moduleLimit) {
      throw new Error(`Module limit exceeded (${moduleLimit}).`);
    }
  }
  const discoveredRelSet = new Set(discoveredByRel.keys());
  const modules = new Map();
  const externals = new Set();

  for (const current of Array.from(discoveredByRel.values()).sort((a, b) => compareLocale(a.rel, b.rel))) {
    const source = await fs.readFile(current.filePath, 'utf8');
    const importRefs = extractImportRefs(source);
    const localDeps = [];
    const externalDeps = [];
    const normalizedImportRefs = [];

    for (const ref of importRefs) {
      const local = await resolveImport({
        rootDir: resolvedRoot,
        specifier: ref.specifier,
        importerRel: current.rel,
        aliases,
        routeAliases: resolvedRouteAliases,
      });
      if (local && discoveredRelSet.has(local.rel)) {
        localDeps.push(local.rel);
        normalizedImportRefs.push({ ...ref, localRel: local.rel });
      } else {
        const label = externalLabel(ref.specifier);
        if (label && !isIgnoredExternalLabel(label)) {
          externals.add(label);
          externalDeps.push(label);
        }
        normalizedImportRefs.push({ ...ref, localRel: null });
      }
    }

    modules.set(current.rel, {
      rel: current.rel,
      source,
      stats: scriptStats(current.rel, source),
      declarationSpans: extractDeclarationSpans(source),
      importRefs: normalizedImportRefs,
      localDeps: Array.from(new Set(localDeps)).sort(compareLocale),
      externalDeps: Array.from(new Set(externalDeps)).sort(compareLocale),
    });
  }

  const reachableModules = buildReachableModuleSet(modules, resolvedEntry.rel);
  for (const record of modules.values()) {
    record.reachable = reachableModules.has(record.rel);
  }

  const graph = {
    rootDir: resolvedRoot,
    entryRel: resolvedEntry.rel,
    modules,
    reachableModules,
    externals,
  };

  const jsScripts = moduleRecords(graph)
    .map((record) => ({ ...record.stats, reachable: Boolean(record.reachable) }))
    .sort((a, b) => compareLocale(a.path, b.path));
  const jsxScripts = jsScripts
    .filter((script) => isJsxModule(script.path))
    .sort((a, b) => compareLocale(a.path, b.path));
  const reachableJsScripts = jsScripts
    .filter((script) => script.reachable)
    .sort((a, b) => compareLocale(a.path, b.path));
  const reachableJsxScripts = reachableJsScripts
    .filter((script) => isJsxModule(script.path))
    .sort((a, b) => compareLocale(a.path, b.path));
  const jsxClassCount = reachableJsxScripts.length;
  const reachableGraph = reachableGraphView(graph);
  const importEdges = buildImportEdges(graph, { reachableOnly: true });
  const reachableDeclarationImportMetrics = buildDeclarationImportMetrics(reachableGraph);
  const declarationRelationships = buildDeclarationRelationships(graph);
  const functionDependencyMap = buildFunctionDependencyMap(graph);
  const mermaid = buildMermaid(graph, importEdges, reachableDeclarationImportMetrics, { reachableOnly: true });
  const sourceCode = buildSourceCode(
    graph,
    reachableDeclarationImportMetrics,
    declarationRelationships,
  );
  const treeText = buildTreeText(graph);
  const jsxTreeText = buildJsxTreeText(reachableJsxScripts);

  return {
    rootDir: resolvedRoot,
    entryRel: resolvedEntry.rel,
    graph,
    treeText,
    jsxTreeText,
    jsScripts,
    jsxScripts,
    mermaid,
    importEdges,
    sourceCode,
    functionDependencyMap,
    summary: {
      moduleCount: modules.size,
      reachableModuleCount: reachableModules.size,
      unreachableModuleCount: modules.size - reachableModules.size,
      jsxClassCount,
      jsxFileCount: jsxScripts.length,
      reachableJsxFileCount: reachableJsxScripts.length,
      jsScriptCount: jsScripts.length,
      reachableJsScriptCount: reachableJsScripts.length,
      externalCount: externals.size,
    },
  };
}
