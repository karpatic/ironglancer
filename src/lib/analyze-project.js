import fs from 'node:fs/promises';
import path from 'node:path';

import {
  countIdentifierReferences,
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
      if (!from || normalizeString(targetSource).trim() === '') {
        throw new Error('Route aliases must include a non-empty route and target path.');
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

function defaultExportDeclarationName(record) {
  const source = normalizeString(record?.source);
  if (!source) return '';
  const spans = declarationSpansByName(record);
  const directMatch = source.match(/\bexport\s+default\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
  if (directMatch && spans.has(directMatch[1])) return directMatch[1];
  const reexportMatch = source.match(/\bexport\s*\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+default\s*\}/);
  if (reexportMatch && spans.has(reexportMatch[1])) return reexportMatch[1];
  const identifierMatch = source.match(/\bexport\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/);
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
  const namedExportListPattern = /\bexport\s*\{([\s\S]*?)\}\s*([^;]*)/g;
  const commonJsPropertyPattern = new RegExp(`\\b(?:module\\.)?exports\\s*\\.\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*${escaped}\\b`, 'g');
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
  while ((match = namedExportListPattern.exec(masked))) {
    const trailing = normalizeString(match[2]);
    if (/\bfrom\b/.test(trailing)) continue;
    for (const part of identifierListParts(match[1])) {
      const specifier = parseNamedExportSpecifier(part);
      if (!specifier || specifier.local !== name) continue;
      info.exported = true;
      addPublicApiSignal(info, {
        kind: specifier.exported === 'default' ? 'default-export' : 'named-export',
        exportedName: specifier.exported,
        startIndex: match.index,
        endIndex: namedExportListPattern.lastIndex,
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

function declarationIdentifierMetrics(record, span, publicApiInfo) {
  const locations = identifierReferenceLocations(record?.source, span?.name);
  const declarationLocations = locations.filter((location) => isDeclarationNameLocation(span, location));
  const nonDeclarationLocations = locations.filter((location) => !isDeclarationNameLocation(span, location));
  const publicApiLocations = nonDeclarationLocations
    .filter((location) => locationInRanges(location, publicApiInfo.ranges));
  const publicApiIndexes = new Set(publicApiLocations.map((location) => `${location.index}:${location.endIndex}`));
  const sameFileLocations = nonDeclarationLocations
    .filter((location) => !publicApiIndexes.has(`${location.index}:${location.endIndex}`));

  return {
    identifierOccurrenceCount: locations.length,
    declarationNameOccurrenceCount: declarationLocations.length,
    declarationOnlyNameOccurrence: locations.length === declarationLocations.length,
    sameFileReferenceCount: sameFileLocations.length,
    publicApiReferenceCount: publicApiLocations.length,
  };
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
  candidateId = '',
  metrics = emptyDeclarationImportMetrics(),
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
    candidateId,
    referenceCount: metrics.referenceCount,
    sameFileReferenceCount: metrics.sameFileReferenceCount,
    incomingReferenceCount: metrics.incomingReferenceCount,
    directIdentifierReferenceCount: metrics.directIdentifierReferenceCount,
    importerFileCount: metrics.importerFileCount,
  };
}

function emptyDeclarationImportMetrics() {
  return {
    referenceCount: 0,
    directIdentifierReferenceCount: 0,
    sameFileReferenceCount: 0,
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

function importBindingDeclarationName(targetRecord, binding) {
  const kind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (kind === 'named') return normalizeString(binding?.imported).trim();
  if (kind === 'default') return defaultExportDeclarationName(targetRecord) || normalizeString(binding?.local).trim();
  return '';
}

function declarationImportMetricsFor(metrics, record, declarationName) {
  const key = declarationImportMetricKey(record?.rel, declarationName);
  return key && metrics instanceof Map
    ? (metrics.get(key) || emptyDeclarationImportMetrics())
    : emptyDeclarationImportMetrics();
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
      const targetSpans = declarationSpansByName(targetRecord);
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        const declarationName = importBindingDeclarationName(targetRecord, binding);
        if (!declarationName || !targetSpans.has(declarationName)) continue;
        const key = declarationImportMetricKey(targetRecord.rel, declarationName);
        if (!key) continue;
        if (!buckets.has(key)) {
          buckets.set(key, {
            identifierOccurrenceCount: 0,
            declarationNameOccurrenceCount: 0,
            declarationOnlyNameOccurrence: false,
            sameFileReferenceCount: 0,
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
        const referenceCount = Math.max(0, countIdentifierReferences(importerRecord.source, binding.local) - 1);
        bucket.incomingReferenceCount += referenceCount;
        if (importerRecord.rel !== targetRecord.rel) {
          bucket.importerFiles.add(importerRecord.rel);
          bucket.incomingImports.push({
            importerPath: importerRecord.rel,
            specifier: ref.specifier,
            loadKind: normalizeString(ref.kind).trim() || 'import',
            imported: binding.imported,
            local: binding.local,
            bindingKind: binding.kind,
            inferred: Boolean(binding.inferred),
            referenceCount,
          });
        }
      }
    }
  }

  return new Map(Array.from(buckets, ([key, bucket]) => [key, {
    referenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    directIdentifierReferenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    sameFileReferenceCount: bucket.sameFileReferenceCount,
    sameFileNameOccurrenceCount: Math.max(0, bucket.identifierOccurrenceCount - bucket.declarationNameOccurrenceCount),
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

function jsxModuleRecords(graph) {
  return Array.from(graph.modules.values())
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
    const declarationName = importBindingDeclarationName(targetRecord, binding) || name;
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

function importedScriptSourceDeclarationsForJsx(record, graph, moduleId, declarationImportMetrics) {
  const declarations = new Map();
  for (const candidate of importedScriptCandidatesForJsx(record, graph, declarationImportMetrics)) {
    const { name, targetRecord, binding, declarationName, metrics } = candidate;
    if (!targetRecord || binding?.kind === 'namespace') continue;

    const span = declarationSpansByName(targetRecord).get(declarationName);
    const entry = sourceDeclarationEntry({
      moduleId,
      visibleName: name,
      record: targetRecord,
      span,
      declarationName,
      sourceOrigin: 'imported-script-member',
      metrics,
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
  return declarationLineCount(graph.modules.get(targetRel), binding.imported);
}

function edgeRestingLabel(loadKinds) {
  const kinds = Array.isArray(loadKinds) ? loadKinds : Array.from(loadKinds || []);
  const isLazyOnly = kinds.length > 0
    && kinds.every((kind) => kind === 'lazy' || kind === 'dynamic');
  return isLazyOnly ? 'lazy' : 'import';
}

function buildImportEdges(graph) {
  const jsxModules = jsxModuleRecords(graph);
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

function emptyModuleImportEvidence() {
  return {
    importerFiles: new Set(),
    namespaceImportFiles: new Set(),
    moduleOnlyImportFiles: new Set(),
    loadKinds: new Set(),
    samples: [],
  };
}

function compactImportSample(ref, importerPath) {
  const bindings = Array.isArray(ref?.bindings) ? ref.bindings : [];
  const bindingLabels = bindings
    .map((binding) => {
      if (binding.kind === 'namespace') return `* as ${binding.local}`;
      if (binding.kind === 'default') return `default as ${binding.local}`;
      return binding.imported === binding.local ? binding.local : `${binding.imported} as ${binding.local}`;
    })
    .filter(Boolean);
  return {
    importerPath,
    specifier: ref.specifier,
    loadKind: normalizeString(ref.kind).trim() || 'import',
    bindings: bindingLabels,
  };
}

function buildModuleImportEvidence(graph) {
  const moduleEvidence = new Map();
  for (const record of graph.modules.values()) {
    for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
      const targetRel = normalizeString(ref?.localRel).trim();
      if (!targetRel || !graph.modules.has(targetRel) || record.rel === targetRel) continue;
      if (!moduleEvidence.has(targetRel)) moduleEvidence.set(targetRel, emptyModuleImportEvidence());
      const evidence = moduleEvidence.get(targetRel);
      const loadKind = normalizeString(ref.kind).trim() || 'import';
      const bindings = Array.isArray(ref.bindings) ? ref.bindings : [];
      evidence.importerFiles.add(record.rel);
      evidence.loadKinds.add(loadKind);
      if (bindings.length === 0) evidence.moduleOnlyImportFiles.add(record.rel);
      if (bindings.some((binding) => binding.kind === 'namespace')) evidence.namespaceImportFiles.add(record.rel);
      if (evidence.samples.length < 5) evidence.samples.push(compactImportSample(ref, record.rel));
    }
  }

  return new Map(Array.from(moduleEvidence, ([modulePath, evidence]) => [modulePath, {
    importerFileCount: evidence.importerFiles.size,
    namespaceImportFileCount: evidence.namespaceImportFiles.size,
    moduleOnlyImportFileCount: evidence.moduleOnlyImportFiles.size,
    loadKinds: Array.from(evidence.loadKinds).sort(compareLocale),
    samples: evidence.samples.sort((a, b) => compareLocale(a.importerPath, b.importerPath)
      || compareLocale(a.loadKind, b.loadKind)
      || compareLocale(a.specifier, b.specifier)),
  }]));
}

function deadFunctionCandidateId(record, span) {
  return [
    'dead-function',
    record.rel,
    span.name,
    span.startLine,
    span.endLine,
  ].join(':');
}

function deadFunctionSourceModuleId(modulePath) {
  return `dead_${normalizeString(modulePath)
    .replace(/\.[A-Za-z0-9]+$/g, '')
    .replace(/[^A-Za-z0-9_$]/g, '_') || 'module'}`;
}

function summarizeLoadKinds(loadKinds = []) {
  return Array.isArray(loadKinds) && loadKinds.length > 0 ? loadKinds.join(', ') : 'none';
}

function candidateEvidence(label, detail, tone = 'neutral') {
  return { label, detail, tone };
}

function publicApiLabel(publicApi = {}) {
  const kinds = Array.isArray(publicApi.exportKinds) ? publicApi.exportKinds : [];
  const names = Array.isArray(publicApi.exportedNames) ? publicApi.exportedNames : [];
  const kindText = kinds.length > 0 ? kinds.join(', ') : 'export';
  const nameText = names.length > 0 ? ` as ${names.join(', ')}` : '';
  return `${kindText}${nameText}`;
}

function moduleImportSampleText(moduleEvidence = {}) {
  const samples = Array.isArray(moduleEvidence.samples) ? moduleEvidence.samples : [];
  return samples
    .slice(0, 3)
    .map((sample) => {
      const bindingText = Array.isArray(sample.bindings) && sample.bindings.length > 0
        ? ` (${sample.bindings.join(', ')})`
        : '';
      return `${sample.importerPath} via ${sample.loadKind}${bindingText}`;
    })
    .join('; ');
}

function buildDeadFunctionCandidate({
  graph,
  record,
  span,
  metrics,
  moduleEvidence = {},
}) {
  const publicApi = metrics.publicApi || emptyDeclarationImportMetrics().publicApi;
  const loadKinds = Array.isArray(moduleEvidence.loadKinds) ? moduleEvidence.loadKinds : [];
  const dynamicLoadKinds = loadKinds.filter((kind) => kind === 'dynamic' || kind === 'lazy');
  const isEntrypointModule = record.rel === graph.entryRel;
  const isComponentConvention = /^[A-Z]/.test(span.name);
  const isHookConvention = /^use[A-Z0-9]/.test(span.name);
  const hasNamespaceImport = Number(moduleEvidence.namespaceImportFileCount) > 0;
  const hasModuleOnlyImport = Number(moduleEvidence.moduleOnlyImportFileCount) > 0;
  const hasCommonJsReference = loadKinds.includes('require');
  const hasDynamicReference = dynamicLoadKinds.length > 0;
  const hasExportReference = loadKinds.includes('export');
  const hasSideEffectReference = loadKinds.includes('side-effect');
  const manualSignals = [];
  const evidence = [
    candidateEvidence(
      'Zero direct refs',
      `${metrics.directIdentifierReferenceCount} direct identifier references; ${metrics.sameFileReferenceCount} same-file references; ${metrics.incomingReferenceCount} direct import references.`,
      'good',
    ),
    candidateEvidence(
      'Zero direct importers',
      `${metrics.importerFileCount} files import this declaration by name or default binding.`,
      'good',
    ),
  ];

  if (metrics.declarationOnlyNameOccurrence) {
    evidence.push(candidateEvidence(
      'Declaration-only name',
      `The name occurs ${metrics.identifierOccurrenceCount} time in code, at the declaration.`,
      'good',
    ));
  } else {
    evidence.push(candidateEvidence(
      'Extra name occurrences',
      `${metrics.sameFileNameOccurrenceCount} non-declaration name occurrences; ${metrics.publicApiReferenceCount} are public API/export exposures.`,
      'review',
    ));
    manualSignals.push('extra name occurrences');
  }

  if (publicApi.exported) {
    evidence.push(candidateEvidence('Export/public API', publicApiLabel(publicApi), 'review'));
    manualSignals.push('exported/public API');
  }
  if (isEntrypointModule) {
    evidence.push(candidateEvidence('Entrypoint module', record.rel, 'review'));
    manualSignals.push('entrypoint module');
  }
  if (isComponentConvention) {
    evidence.push(candidateEvidence('Component convention', `${span.name} starts with an uppercase letter.`, 'review'));
    manualSignals.push('component convention');
  }
  if (isHookConvention) {
    evidence.push(candidateEvidence('Hook convention', `${span.name} starts with use*.`, 'review'));
    manualSignals.push('hook convention');
  }
  if (hasNamespaceImport || hasModuleOnlyImport || hasCommonJsReference || hasDynamicReference || hasExportReference || hasSideEffectReference) {
    const sampleText = moduleImportSampleText(moduleEvidence);
    evidence.push(candidateEvidence(
      'Module-level references',
      [
        `${moduleEvidence.importerFileCount || 0} importing files`,
        `kinds: ${summarizeLoadKinds(loadKinds)}`,
        sampleText ? `samples: ${sampleText}` : '',
      ].filter(Boolean).join('; '),
      'review',
    ));
    manualSignals.push('module-level import/reference');
  }

  const confidence = manualSignals.length > 0 ? 'manual-review' : 'high-confidence';
  const reason = confidence === 'high-confidence'
    ? 'No direct references or direct importers, private declaration, and no known convention or module-level caveat.'
    : `No direct references/importers, but review ${Array.from(new Set(manualSignals)).slice(0, 3).join(', ')} evidence.`;

  return {
    id: deadFunctionCandidateId(record, span),
    name: span.name,
    kind: span.kind,
    modulePath: record.rel,
    startLine: span.startLine,
    endLine: span.endLine,
    lineCount: span.lineCount,
    confidence,
    reason,
    counts: {
      directIdentifierReferences: metrics.directIdentifierReferenceCount,
      sameFileReferences: metrics.sameFileReferenceCount,
      incomingImportReferences: metrics.incomingReferenceCount,
      directImportingFiles: metrics.importerFileCount,
      nameOccurrences: metrics.identifierOccurrenceCount,
      publicApiReferences: metrics.publicApiReferenceCount,
      moduleImportingFiles: moduleEvidence.importerFileCount || 0,
      namespaceImportingFiles: moduleEvidence.namespaceImportFileCount || 0,
      moduleOnlyImportingFiles: moduleEvidence.moduleOnlyImportFileCount || 0,
    },
    signals: {
      declarationOnlyNameOccurrence: metrics.declarationOnlyNameOccurrence,
      exported: Boolean(publicApi.exported),
      entrypointModule: isEntrypointModule,
      componentConvention: isComponentConvention,
      hookConvention: isHookConvention,
      namespaceModuleReference: hasNamespaceImport,
      moduleOnlyReference: hasModuleOnlyImport,
      dynamicModuleReference: hasDynamicReference,
      commonJsModuleReference: hasCommonJsReference,
      exportModuleReference: hasExportReference,
      sideEffectModuleReference: hasSideEffectReference,
    },
    exportKinds: Array.isArray(publicApi.exportKinds) ? publicApi.exportKinds : [],
    exportedNames: Array.isArray(publicApi.exportedNames) ? publicApi.exportedNames : [],
    moduleImportKinds: loadKinds,
    evidence,
  };
}

function compareDeadFunctionCandidates(a, b) {
  const confidenceRank = { 'high-confidence': 0, 'manual-review': 1 };
  return (confidenceRank[a.confidence] ?? 9) - (confidenceRank[b.confidence] ?? 9)
    || compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || compareLocale(a.name, b.name);
}

function buildDeadFunctionCandidates(graph, declarationImportMetrics) {
  const moduleImportEvidence = buildModuleImportEvidence(graph);
  const candidates = [];
  for (const record of Array.from(graph.modules.values()).sort((a, b) => compareLocale(a.rel, b.rel))) {
    for (const span of Array.isArray(record.declarationSpans) ? record.declarationSpans : []) {
      const metrics = declarationImportMetricsFor(declarationImportMetrics, record, span.name);
      if (metrics.directIdentifierReferenceCount !== 0 || metrics.importerFileCount !== 0) continue;
      candidates.push(buildDeadFunctionCandidate({
        graph,
        record,
        span,
        metrics,
        moduleEvidence: moduleImportEvidence.get(record.rel) || {},
      }));
    }
  }
  return candidates.sort(compareDeadFunctionCandidates);
}

function buildMermaid(graph, importEdges, declarationImportMetrics) {
  const jsxModules = jsxModuleRecords(graph);
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

function buildSourceCode(graph, declarationImportMetrics, deadFunctionCandidates = []) {
  const jsxModules = jsxModuleRecords(graph);
  const classIds = buildClassIds(jsxModules);
  const declarations = [];
  const seen = new Set();
  const sourceLocations = new Map();

  const sourceLocationKey = (entry) => entry && [
    entry.modulePath,
    entry.name,
    entry.startLine,
    entry.endLine,
  ].join('\u0000');

  const pushEntry = (entry) => {
    const locationKey = sourceLocationKey(entry);
    const existing = locationKey ? sourceLocations.get(locationKey) : null;
    if (existing && entry?.candidateId) {
      existing.candidateId = entry.candidateId;
      return;
    }
    const key = entry && (entry.candidateId
      ? `candidate\u0000${entry.candidateId}`
      : `${entry.moduleId}\u0000${entry.sourceOrigin}\u0000${entry.name}`);
    if (!entry || seen.has(key)) return;
    seen.add(key);
    if (locationKey && !sourceLocations.has(locationKey)) sourceLocations.set(locationKey, entry);
    declarations.push(entry);
  };

  for (const record of jsxModules) {
    const moduleId = classIds.get(record.rel);
    for (const entry of importedScriptSourceDeclarationsForJsx(record, graph, moduleId, declarationImportMetrics)) {
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
      }));
    }
  }

  for (const candidate of Array.isArray(deadFunctionCandidates) ? deadFunctionCandidates : []) {
    const record = graph.modules.get(candidate.modulePath);
    const span = (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
      .find((item) => item.name === candidate.name
        && item.startLine === candidate.startLine
        && item.endLine === candidate.endLine);
    pushEntry(sourceDeclarationEntry({
      moduleId: deadFunctionSourceModuleId(candidate.modulePath),
      visibleName: candidate.name,
      record,
      span,
      sourceOrigin: 'dead-function-candidate',
      candidateId: candidate.id,
      metrics: declarationImportMetricsFor(declarationImportMetrics, record, candidate.name),
    }));
  }

  return { declarations };
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

export async function analyzeProject({ rootDir, entry, moduleLimit = 500, routeAliases = [] } = {}) {
  const resolvedRoot = path.resolve(normalizeString(rootDir).trim() || '.');
  const resolvedEntry = await resolveEntry(resolvedRoot, entry);
  const aliases = await loadImportAliases(resolvedRoot, resolvedEntry.rel);
  const resolvedRouteAliases = [
    ...normalizeRouteAliases(routeAliases),
    ...DEFAULT_ROUTE_ALIASES,
  ];
  const modules = new Map();
  const externals = new Set();
  const queue = [resolvedEntry];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.rel)) continue;
    visited.add(current.rel);
    if (visited.size > moduleLimit) {
      throw new Error(`Module limit exceeded (${moduleLimit}).`);
    }

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
      if (local) {
        localDeps.push(local.rel);
        normalizedImportRefs.push({ ...ref, localRel: local.rel });
        if (!visited.has(local.rel)) queue.push(local);
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

  const graph = {
    rootDir: resolvedRoot,
    entryRel: resolvedEntry.rel,
    modules,
    externals,
  };

  const jsScripts = Array.from(modules.values())
    .map((record) => record.stats)
    .sort((a, b) => compareLocale(a.path, b.path));
  const jsxScripts = jsScripts
    .filter((script) => isJsxModule(script.path))
    .sort((a, b) => compareLocale(a.path, b.path));
  const jsxClassCount = jsxScripts.length;
  const importEdges = buildImportEdges(graph);
  const declarationImportMetrics = buildDeclarationImportMetrics(graph);
  const deadFunctionCandidates = buildDeadFunctionCandidates(graph, declarationImportMetrics);
  const mermaid = buildMermaid(graph, importEdges, declarationImportMetrics);
  const sourceCode = buildSourceCode(graph, declarationImportMetrics, deadFunctionCandidates);
  const treeText = buildTreeText(graph);
  const jsxTreeText = buildJsxTreeText(jsxScripts);
  const deadFunctionHighConfidenceCount = deadFunctionCandidates
    .filter((candidate) => candidate.confidence === 'high-confidence').length;
  const deadFunctionManualReviewCount = deadFunctionCandidates
    .filter((candidate) => candidate.confidence === 'manual-review').length;

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
    deadFunctionCandidates,
    sourceCode,
    summary: {
      moduleCount: modules.size,
      jsxClassCount,
      jsxFileCount: jsxScripts.length,
      jsScriptCount: jsScripts.length,
      externalCount: externals.size,
      deadFunctionCandidateCount: deadFunctionCandidates.length,
      deadFunctionHighConfidenceCount,
      deadFunctionManualReviewCount,
    },
  };
}
