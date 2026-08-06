import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { maskIgnorableSyntax } from './import-parser.js';
import { compareLocale, isWithinPath, normalizeString, toPosixPath } from './utils.js';

const API_VERSION = 'v1';
const DEFAULT_SCHEMA_VERSION = '1.2.0';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 200;
const MAX_SOURCE_EXCERPT_LINES = 80;
const MAX_OCCURRENCE_SCAN_CHARACTERS = 5_000_000;
const MAX_OCCURRENCE_MATCHES = 10_000;
const DEFAULT_GRAPH_DEPTH = 10;
const MAX_GRAPH_DEPTH = 50;
const MAX_GRAPH_VISITED = 10_000;
const DEFAULT_BLAST_LIMIT = 200;
const MAX_BLAST_LIMIT = 1_000;
const API_DATA_DIR = '.ironglancer-api';
const BRIDGE_VERSION = 'v1';
const MAX_BRIDGE_BODY_BYTES = 64_000;
const MAX_BRIDGE_COMMANDS = 200;
const VIEWER_COMMAND_TYPES = new Set([
  'focusFunction',
  'openFunction',
  'openSource',
  'highlightFunction',
  'scrollToFunction',
  'clearHighlight',
  'setGraphView',
]);
const VIEWER_PRIMARY_VIEW_VALUES = new Set(['function-graphs', 'jsx-map']);
const VIEWER_GRAPH_LAYOUT_VALUES = new Set(['network', 'radial', 'by-file']);
const VIEWER_GRAPH_SCOPE_VALUES = new Set(['full', 'dependencies', 'parents', 'both']);
const VIEWER_LEGACY_GRAPH_DIRECTION_ALIASES = new Map([
  ['both', 'both'],
  ['uses', 'dependencies'],
  ['used-by', 'parents'],
]);
const VIEWER_GRAPH_DEPTH_VALUES = new Set(['1', '2', '3', 'all']);
const PAGINATION_QUERY_PARAMS = ['limit', 'offset'];
const MODULE_LIST_QUERY_PARAMS = [
  'search', 'q', 'extension', 'reachable', 'jsx', 'sort', 'order', 'fields', ...PAGINATION_QUERY_PARAMS,
];
const MODULE_DETAIL_QUERY_PARAMS = ['include'];
const SOURCE_QUERY_PARAMS = ['startLine', 'endLine'];
const SOURCE_BY_PATH_QUERY_PARAMS = ['path', ...SOURCE_QUERY_PARAMS];
const FUNCTION_LIST_QUERY_PARAMS = [
  'search',
  'q',
  'modulePath',
  'name',
  'kind',
  'component',
  'reachable',
  'exported',
  'standalone',
  'userCount',
  'dependencyCount',
  'sort',
  'order',
  'fields',
  ...PAGINATION_QUERY_PARAMS,
];
const MODULE_FUNCTION_QUERY_PARAMS = [
  'detail',
  'search',
  'q',
  'name',
  'kind',
  'component',
  'reachable',
  'exported',
  'standalone',
  'userCount',
  'dependencyCount',
  'sort',
  'order',
  'fields',
  ...PAGINATION_QUERY_PARAMS,
];
const SYMBOL_LIST_QUERY_PARAMS = [
  'search',
  'q',
  'modulePath',
  'name',
  'kind',
  'sourceOrigin',
  'referenceCount',
  'fields',
  ...PAGINATION_QUERY_PARAMS,
];
const FUNCTION_DETAIL_QUERY_PARAMS = ['include'];
const FUNCTION_PLACEMENT_QUERY_PARAMS = [];
const QUERY_AGGREGATE_PARAMS = ['modulePath', 'path', 'symbol', 'q', ...PAGINATION_QUERY_PARAMS];
const UNIFIED_SEARCH_QUERY_PARAMS = ['q', 'match', 'types', 'modulePath', ...PAGINATION_QUERY_PARAMS];
const UNIFIED_SEARCH_TYPES = ['module', 'function', 'symbol', 'occurrence'];
const IMPORT_LIST_QUERY_PARAMS = [
  'sourcePath', 'targetPath', 'specifier', 'resolution', 'loadKind', 'dynamic', 'sourceReachable',
  'sort', 'order', 'fields', ...PAGINATION_QUERY_PARAMS,
];
const FRONTEND_ENTITY_QUERY_PARAMS = ['search', 'q', 'modulePath', ...PAGINATION_QUERY_PARAMS];
const SHORTEST_PATH_QUERY_PARAMS = ['targetId', 'maxDepth'];
const BLAST_RADIUS_QUERY_PARAMS = ['maxDepth', 'limit'];
const MODULE_SUMMARY_FIELDS = [
  'id', 'stableId', 'path', 'extension', 'lineCount', 'maxLineLength', 'reachable', 'isJsx',
  'dependencyCount', 'dependentCount', 'externalDependencyCount', 'symbolCount', 'functionCount', 'sourceAvailable',
];
const FUNCTION_SUMMARY_FIELDS = [
  'id', 'stableId', 'moduleId', 'moduleStableId', 'modulePath', 'name', 'declarationName', 'kind', 'component',
  'reachable', 'exported', 'exportedNames', 'exportKinds', 'declarationType', 'standalone',
  'declarationLine', 'declarationColumn', 'startLine', 'endLine', 'lineCount', 'dependencyCount', 'userCount',
  'placementAssessment', 'placementConfidence', 'sameFileCalleeCount', 'projectLocalCalleeCount',
  'sameFileCallerCount', 'projectLocalCallerCount', 'sourceAvailable',
];
const SYMBOL_SUMMARY_FIELDS = [
  'id', 'stableId', 'moduleId', 'modulePath', 'name', 'declarationName', 'kind', 'sourceOrigin', 'startLine', 'endLine',
  'referenceCount', 'sameFileReferenceCount', 'incomingReferenceCount', 'directIdentifierReferenceCount',
  'importerFileCount', 'relationshipCount', 'sourceAvailable',
];
const IMPORT_SUMMARY_FIELDS = [
  'stableId', 'sourceId', 'sourceStableId', 'sourcePath', 'sourceReachable',
  'targetId', 'targetStableId', 'targetPath', 'specifier', 'loadKind', 'dynamic',
  'resolution', 'unresolvedReason', 'assetPath', 'assetKind', 'remoteUrl', 'nodeBuiltin', 'typeOnly', 'bindings',
];
const FUNCTION_DEPENDENCY_LIMITATIONS = [
  'Static function dependencies are based on identifier references inside saved declaration spans; IronGlancer does not execute code or prove runtime control flow.',
  'Usage syntax is labeled as call, optional-call, tagged-template, jsx-element, or reference from nearby source syntax; reference entries are not claimed to be definite runtime calls.',
  'Imported targets are limited to browser ESM imports, dynamic imports, React.lazy boundaries, and module worker entries with statically resolvable bindings.',
  'Same-module targets are limited to named function declarations and named arrow-function variable declarations discovered in the same file; dynamic property dispatch, aliasing through arbitrary values, and unresolved re-exports are outside this map.',
  'Placement review is deterministic static affinity evidence; it is a review aid, not a runtime ownership proof or definitive dead-code detector.',
];

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function apiError(status, code, message, details) {
  return new ApiError(status, code, message, details);
}

function jsonPayload(response, status, payload, { contentType = 'application/json; charset=utf-8', headers = {} } = {}) {
  const body = JSON.stringify(payload, null, 2) + '\n';
  response.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    ...headers,
  });
  response.end(body);
}

function sendApiData(response, data, status = 200) {
  jsonPayload(response, status, { ok: true, data });
}

function sendRawSchema(response, schema) {
  jsonPayload(response, 200, schema, { contentType: 'application/schema+json; charset=utf-8' });
}

function sendApiError(response, error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const code = typeof error?.code === 'string' ? error.code : 'internal_error';
  const message = typeof error?.message === 'string' ? error.message : 'Internal server error.';
  jsonPayload(response, status, {
    ok: false,
    error: {
      status,
      code,
      message,
      ...(error?.details === undefined ? {} : { details: error.details }),
    },
  });
}

function bridgeHeaders(extra = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    ...extra,
  };
}

function sendBridgeData(response, data, status = 200) {
  jsonPayload(response, status, { ok: true, data }, { headers: bridgeHeaders() });
}

function sendBridgeError(response, error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const code = typeof error?.code === 'string' ? error.code : 'bridge_error';
  const message = typeof error?.message === 'string' ? error.message : 'Bridge error.';
  jsonPayload(response, status, {
    ok: false,
    error: { status, code, message },
  }, { headers: bridgeHeaders() });
}

function sendBridgeOptions(response) {
  response.writeHead(204, bridgeHeaders());
  response.end();
}

async function readJsonFile(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function encodedId(value) {
  return Buffer.from(normalizeString(value), 'utf8').toString('base64url');
}

function compactStableId(prefix, parts) {
  const digest = createHash('sha256')
    .update(parts.map((part) => normalizeString(part)).join('\u0000'))
    .digest('hex')
    .slice(0, 16);
  return `${prefix}_${digest}`;
}

function moduleStableIdForPath(modulePath) {
  return compactStableId('mod', [modulePath]);
}

function symbolStableIdForDeclaration(declaration = {}) {
  return compactStableId('sym', [
    declaration.modulePath,
    declaration.sourceOrigin,
    declaration.name,
    declaration.kind,
  ]);
}

function functionStableIdForDeclaration(declaration = {}) {
  return compactStableId('fn', [
    declaration.modulePath,
    declaration.scopePath,
    declaration.name,
    declaration.kind,
  ]);
}

function functionEdgeStableIdForRecord(edge = {}, functionById = new Map()) {
  const source = functionById.get(edge.sourceId);
  const target = functionById.get(edge.targetId);
  return compactStableId('fedge', [
    source?.stableId,
    target?.stableId,
    edge.scope,
    edge.import?.specifier,
    edge.import?.importedName,
    edge.import?.localName,
  ]);
}

function canonicalImportBindings(bindings) {
  return (Array.isArray(bindings) ? bindings : [])
    .map((binding) => ({
      kind: normalizeString(binding?.kind).trim(),
      imported: normalizeString(binding?.imported).trim(),
      local: normalizeString(binding?.local).trim(),
      inferred: Boolean(binding?.inferred),
    }))
    .sort((a, b) => compareLocale(a.kind, b.kind)
      || compareLocale(a.imported, b.imported)
      || compareLocale(a.local, b.local)
      || Number(a.inferred) - Number(b.inferred));
}

function importStableIdForRecord(record = {}) {
  return compactStableId('imp', [
    record.sourcePath,
    record.specifier,
    record.loadKind,
    record.targetPath,
    JSON.stringify(canonicalImportBindings(record.bindings)),
  ]);
}

function withCollisionSafeStableIds(items, stableIdForItem) {
  const counts = new Map();
  return items.map((item) => {
    const baseId = stableIdForItem(item);
    const ordinal = (counts.get(baseId) || 0) + 1;
    counts.set(baseId, ordinal);
    return { ...item, stableId: ordinal === 1 ? baseId : `${baseId}_${ordinal}` };
  });
}

function moduleIdForPath(modulePath) {
  return encodedId(modulePath);
}

function symbolIdForDeclaration(declaration = {}) {
  return encodedId([
    declaration.modulePath,
    declaration.sourceOrigin,
    declaration.name,
    declaration.startLine,
    declaration.endLine,
  ].map((part) => normalizeString(part)).join('\u0000'));
}

function functionIdForDeclaration(declaration = {}) {
  return encodedId([
    'function',
    declaration.modulePath,
    declaration.name,
    declaration.kind,
    declaration.startLine,
    declaration.endLine,
  ].map((part) => normalizeString(part)).join('\u0000'));
}

function extensionForPath(modulePath) {
  return path.posix.extname(toPosixPath(modulePath)).toLowerCase();
}

function isJsxModulePath(modulePath) {
  return extensionForPath(modulePath) === '.jsx';
}

function sourceLines(source) {
  const normalized = normalizeString(source);
  if (!normalized) return [];
  const lines = normalized.split(/\r\n|\r|\n/);
  if (/[\r\n]$/.test(normalized)) lines.pop();
  return lines;
}

function sourceLineOffsets(source) {
  const text = normalizeString(source);
  const offsets = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\r' && text[index + 1] === '\n') {
      offsets.push(index + 2);
      index += 1;
    } else if (text[index] === '\r' || text[index] === '\n') {
      offsets.push(index + 1);
    }
  }
  if (/[\r\n]$/.test(text)) offsets.pop();
  return offsets;
}

function sourcePayloadMatchesOutput(outputPayload = {}, sourcePayload = {}) {
  const outputMeta = outputPayload && typeof outputPayload.meta === 'object' ? outputPayload.meta : {};
  const sourceMeta = sourcePayload && typeof sourcePayload.meta === 'object' ? sourcePayload.meta : {};
  return ['buildId', 'sourceCodeHash'].every((key) => outputMeta[key] && outputMeta[key] === sourceMeta[key]);
}

function modulePayloadsFromLegacyOutput(outputPayload = {}) {
  const modules = new Map();
  const ensureModule = (script = {}) => {
    const modulePath = normalizeString(script.path).trim();
    if (!modulePath || modules.has(modulePath)) return;
    modules.set(modulePath, {
      path: modulePath,
      lineCount: Number.isInteger(script.lineCount) ? script.lineCount : 0,
      maxLineLength: Number.isInteger(script.maxLineLength) ? script.maxLineLength : 0,
      reachable: script.reachable == null ? null : Boolean(script.reachable),
      isJsx: isJsxModulePath(modulePath),
      localDependencies: [],
      externalDependencies: [],
      importRefs: [],
    });
  };

  for (const script of Array.isArray(outputPayload.jsScripts) ? outputPayload.jsScripts : []) {
    ensureModule(script);
  }
  for (const edge of Array.isArray(outputPayload.importEdges) ? outputPayload.importEdges : []) {
    ensureModule({ path: edge.sourcePath });
    ensureModule({ path: edge.targetPath, lineCount: edge.targetLineCount || 0 });
    const source = modules.get(edge.sourcePath);
    if (source && edge.targetPath && !source.localDependencies.includes(edge.targetPath)) {
      source.localDependencies.push(edge.targetPath);
    }
  }

  return Array.from(modules.values())
    .map((module) => ({
      ...module,
      localDependencies: module.localDependencies.sort(compareLocale),
      externalDependencies: module.externalDependencies.sort(compareLocale),
    }))
    .sort((a, b) => compareLocale(a.path, b.path));
}

function normalizedModulePayloads(outputPayload = {}) {
  const modulePayloads = Array.isArray(outputPayload.modules) && outputPayload.modules.length > 0
    ? outputPayload.modules
    : modulePayloadsFromLegacyOutput(outputPayload);
  return modulePayloads
    .map((module) => ({
      path: normalizeString(module.path).trim(),
      lineCount: Number.isInteger(module.lineCount) ? module.lineCount : 0,
      maxLineLength: Number.isInteger(module.maxLineLength) ? module.maxLineLength : 0,
      reachable: module.reachable == null ? null : Boolean(module.reachable),
      isJsx: module.isJsx == null ? isJsxModulePath(module.path) : Boolean(module.isJsx),
      localDependencies: Array.isArray(module.localDependencies)
        ? Array.from(new Set(module.localDependencies.map((item) => normalizeString(item).trim()).filter(Boolean))).sort(compareLocale)
        : [],
      externalDependencies: Array.isArray(module.externalDependencies)
        ? Array.from(new Set(module.externalDependencies.map((item) => normalizeString(item).trim()).filter(Boolean))).sort(compareLocale)
        : [],
      importRefs: Array.isArray(module.importRefs) ? module.importRefs.map((ref) => ({
        specifier: normalizeString(ref?.specifier).trim(),
        kind: normalizeString(ref?.kind).trim() || 'unknown',
        loadKind: normalizeString(ref?.kind).trim() || 'unknown',
        typeOnly: Boolean(ref?.typeOnly),
        localRel: normalizeString(ref?.localRel).trim() || null,
        assetRel: normalizeString(ref?.assetRel).trim() || null,
        assetKind: normalizeString(ref?.assetKind).trim() || null,
        remoteUrl: normalizeString(ref?.remoteUrl).trim() || null,
        nodeBuiltin: normalizeString(ref?.nodeBuiltin).trim() || null,
        resolution: ['local', 'asset', 'external', 'remote', 'browser-incompatible', 'unresolved'].includes(ref?.resolution)
          ? ref.resolution
          : null,
        unresolvedReason: normalizeString(ref?.unresolvedReason).trim() || null,
        bindings: Array.isArray(ref?.bindings) ? ref.bindings.map((binding) => ({
          ...binding,
          typeOnly: Boolean(binding?.typeOnly),
        })) : [],
      })).filter((ref) => ref.specifier) : [],
    }))
    .filter((module) => module.path)
    .sort((a, b) => compareLocale(a.path, b.path));
}

function jsxTextMaskForSource(source) {
  const masked = maskIgnorableSyntax(normalizeString(source));
  const textMask = new Uint8Array(masked.length);
  let jsxDepth = 0;
  let inTag = false;
  let closingTag = false;
  let selfClosing = false;
  let expressionDepth = 0;
  let tagBraceDepth = 0;
  const jsxExpressionStack = [];
  const canOpenTag = (index) => {
    if (!/^<(?:[A-Za-z]|>)/.test(masked.slice(index, index + 2))) return false;
    let previous = index - 1;
    while (previous >= 0 && /\s/.test(masked[previous])) previous -= 1;
    if (previous < 0 || '=([{,:;>!&|?'.includes(masked[previous])) return true;
    let wordStart = previous;
    while (wordStart >= 0 && /[A-Za-z]/.test(masked[wordStart])) wordStart -= 1;
    return ['return', 'case', 'yield'].includes(masked.slice(wordStart + 1, previous + 1));
  };
  for (let index = 0; index < masked.length; index += 1) {
    const char = masked[index];
    if (inTag) {
      if (char === '{') tagBraceDepth += 1;
      else if (char === '}' && tagBraceDepth > 0) tagBraceDepth -= 1;
      else if (tagBraceDepth === 0 && char === '/' && masked[index + 1] === '>') selfClosing = true;
      else if (tagBraceDepth === 0 && char === '>') {
        if (closingTag) {
          jsxDepth = Math.max(0, jsxDepth - 1);
          const suspended = jsxExpressionStack.at(-1);
          if (suspended?.jsxDepth === jsxDepth) {
            expressionDepth = suspended.expressionDepth;
            jsxExpressionStack.pop();
          }
        } else if (!selfClosing) jsxDepth += 1;
        if (selfClosing) {
          const suspended = jsxExpressionStack.at(-1);
          if (suspended?.jsxDepth === jsxDepth) {
            expressionDepth = suspended.expressionDepth;
            jsxExpressionStack.pop();
          }
        }
        inTag = false;
      }
      continue;
    }
    if (expressionDepth > 0) {
      if (char === '<' && canOpenTag(index)) {
        jsxExpressionStack.push({ jsxDepth, expressionDepth });
        expressionDepth = 0;
        inTag = true;
        closingTag = false;
        selfClosing = false;
        tagBraceDepth = 0;
      } else if (char === '{') expressionDepth += 1;
      else if (char === '}') expressionDepth -= 1;
      continue;
    }
    if (char === '<' && (jsxDepth > 0 || canOpenTag(index))) {
      inTag = true;
      closingTag = masked[index + 1] === '/';
      selfClosing = false;
      tagBraceDepth = 0;
      continue;
    }
    if (jsxDepth > 0 && char === '{') {
      expressionDepth = 1;
      continue;
    }
    if (jsxDepth > 0 && !/\s/.test(char)) textMask[index] = 1;
  }
  return textMask;
}

function normalizeSourceModules(sourcePayload = {}) {
  return (Array.isArray(sourcePayload.modules) ? sourcePayload.modules : [])
    .map((module) => ({
      path: normalizeString(module.path).trim(),
      lineCount: Number.isInteger(module.lineCount) ? module.lineCount : sourceLines(module.code).length,
      maxLineLength: Number.isInteger(module.maxLineLength) ? module.maxLineLength : 0,
      code: normalizeString(module.code),
      maskedCode: maskIgnorableSyntax(normalizeString(module.code)),
      jsxTextMask: jsxTextMaskForSource(module.code),
    }))
    .filter((module) => module.path && module.code);
}

function normalizeDeclarations(sourcePayload = {}) {
  return (Array.isArray(sourcePayload.declarations) ? sourcePayload.declarations : [])
    .map((declaration) => ({
      ...declaration,
      modulePath: normalizeString(declaration.modulePath).trim(),
      moduleId: normalizeString(declaration.moduleId).trim(),
      name: normalizeString(declaration.name).trim(),
      declarationName: normalizeString(declaration.declarationName || declaration.name).trim(),
      kind: normalizeString(declaration.kind).trim(),
      sourceOrigin: normalizeString(declaration.sourceOrigin).trim(),
      startLine: Number.isInteger(declaration.startLine) ? declaration.startLine : null,
      endLine: Number.isInteger(declaration.endLine) ? declaration.endLine : null,
      referenceCount: Number.isInteger(declaration.referenceCount) ? declaration.referenceCount : 0,
      sameFileReferenceCount: Number.isInteger(declaration.sameFileReferenceCount) ? declaration.sameFileReferenceCount : 0,
      incomingReferenceCount: Number.isInteger(declaration.incomingReferenceCount) ? declaration.incomingReferenceCount : 0,
      directIdentifierReferenceCount: Number.isInteger(declaration.directIdentifierReferenceCount)
        ? declaration.directIdentifierReferenceCount
        : Number.isInteger(declaration.referenceCount) ? declaration.referenceCount : 0,
      importerFileCount: Number.isInteger(declaration.importerFileCount) ? declaration.importerFileCount : 0,
      importedFunctionUses: Array.isArray(declaration.importedFunctionUses) ? declaration.importedFunctionUses : [],
      importedBy: Array.isArray(declaration.importedBy) ? declaration.importedBy : [],
      code: normalizeString(declaration.code),
    }))
    .filter((declaration) => declaration.modulePath && declaration.name);
}

function normalizeUsageLine(value) {
  const line = Number(value);
  return Number.isInteger(line) && line > 0 ? line : null;
}

function normalizeUsages(value) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((usage) => ({
      line: normalizeUsageLine(usage?.line),
      syntax: normalizeString(usage?.syntax).trim(),
    }))
    .filter((usage) => usage.line && usage.syntax)
    .filter((usage) => {
      const key = `${usage.line}\u0000${usage.syntax}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
}

function normalizeUsageLines(value, usages) {
  const lines = Array.isArray(value) && value.length > 0
    ? value.map(normalizeUsageLine)
    : normalizeUsages(usages).map((usage) => usage.line);
  return Array.from(new Set(lines.filter(Boolean))).sort((a, b) => a - b);
}

function normalizeStringList(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => normalizeString(item).trim()).filter(Boolean))).sort(compareLocale)
    : [];
}

function normalizePlacementAssessment(value = {}) {
  return {
    assessment: normalizeString(value.assessment).trim() || 'unknown',
    confidence: normalizeString(value.confidence).trim() || 'low',
    summary: normalizeString(value.summary).trim(),
    rationale: normalizeStringList(value.rationale),
  };
}

function normalizePlacementEvidence(value = {}) {
  const int = (name) => (Number.isInteger(value?.[name]) && value[name] >= 0 ? value[name] : 0);
  return {
    sameFileCalleeCount: int('sameFileCalleeCount'),
    projectLocalCalleeCount: int('projectLocalCalleeCount'),
    packageCalleeCount: int('packageCalleeCount'),
    platformCalleeCount: int('platformCalleeCount'),
    unresolvedCalleeCount: int('unresolvedCalleeCount'),
    sameFileCallerCount: int('sameFileCallerCount'),
    projectLocalCallerCount: int('projectLocalCallerCount'),
    internalHelperCount: int('internalHelperCount'),
    transitiveInternalHelperCount: int('transitiveInternalHelperCount'),
    transitiveInternalHelperLineCount: int('transitiveInternalHelperLineCount'),
  };
}

function normalizePlacementFunctionRef(value = {}) {
  const ref = {
    id: normalizeString(value.id).trim(),
    stableId: normalizeString(value.stableId).trim() || null,
    modulePath: normalizeString(value.modulePath).trim(),
    name: normalizeString(value.name).trim(),
    kind: normalizeString(value.kind || 'function').trim() || 'function',
    component: Boolean(value.component),
    exported: Boolean(value.exported),
    startLine: Number.isInteger(value.startLine) ? value.startLine : null,
    endLine: Number.isInteger(value.endLine) ? value.endLine : null,
    lineCount: Number.isInteger(value.lineCount) ? value.lineCount : null,
  };
  return ref.id || ref.stableId || (ref.modulePath && ref.name) ? ref : null;
}

function normalizePlacementEdgeRef(value = {}) {
  const syntaxKinds = normalizeStringList(value.syntaxKinds);
  return {
    id: normalizeString(value.id).trim(),
    scope: normalizeString(value.scope).trim(),
    relationKind: normalizeString(value.relationKind).trim(),
    syntaxKinds,
    usageLines: normalizeUsageLines(value.usageLines, value.usages),
    referenceCount: Number.isInteger(value.referenceCount) ? value.referenceCount : 0,
    source: normalizePlacementFunctionRef(value.source),
    target: normalizePlacementFunctionRef(value.target),
    ...(value.import && typeof value.import === 'object' ? { import: normalizeFunctionImportInfo(value.import) } : {}),
  };
}

function normalizePlacementExternalRef(value = {}) {
  const usages = normalizeUsages(value.usages);
  const rawSyntaxKinds = Array.isArray(value.syntaxKinds) && value.syntaxKinds.length > 0
    ? value.syntaxKinds
    : usages.map((usage) => usage.syntax);
  const syntaxKinds = normalizeStringList(rawSyntaxKinds);
  return {
    category: ['package', 'platform', 'unresolved'].includes(value.category) ? value.category : 'package',
    resolution: ['external', 'unresolved'].includes(value.resolution) ? value.resolution : 'external',
    unresolvedReason: normalizeString(value.unresolvedReason).trim() || null,
    specifier: normalizeString(value.specifier).trim(),
    loadKind: normalizeString(value.loadKind || 'import').trim() || 'import',
    bindingKind: normalizeString(value.bindingKind || 'named').trim() || 'named',
    importedName: normalizeString(value.importedName).trim(),
    localName: normalizeString(value.localName).trim(),
    modulePath: normalizeString(value.modulePath).trim(),
    functionId: normalizeString(value.functionId).trim(),
    functionStableId: normalizeString(value.functionStableId).trim() || null,
    functionName: normalizeString(value.functionName).trim(),
    referenceCount: Number.isInteger(value.referenceCount) ? value.referenceCount : normalizeUsageLines(value.usageLines, usages).length,
    relationKind: normalizeString(value.relationKind).trim(),
    syntaxKinds,
    usageLines: normalizeUsageLines(value.usageLines, usages),
    usages,
  };
}

function normalizePlacementReview(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const groups = value.groups && typeof value.groups === 'object' ? value.groups : {};
  const callees = groups.callees && typeof groups.callees === 'object' ? groups.callees : {};
  const callers = groups.callers && typeof groups.callers === 'object' ? groups.callers : {};
  return {
    assessment: normalizePlacementAssessment(value.assessment),
    evidence: normalizePlacementEvidence(value.evidence),
    groups: {
      callees: {
        sameFile: (Array.isArray(callees.sameFile) ? callees.sameFile : []).map(normalizePlacementEdgeRef),
        projectLocal: (Array.isArray(callees.projectLocal) ? callees.projectLocal : []).map(normalizePlacementEdgeRef),
        package: (Array.isArray(callees.package) ? callees.package : []).map(normalizePlacementExternalRef),
        platform: (Array.isArray(callees.platform) ? callees.platform : []).map(normalizePlacementExternalRef),
        unresolved: (Array.isArray(callees.unresolved) ? callees.unresolved : []).map(normalizePlacementExternalRef),
      },
      callers: {
        sameFile: (Array.isArray(callers.sameFile) ? callers.sameFile : []).map(normalizePlacementEdgeRef),
        projectLocal: (Array.isArray(callers.projectLocal) ? callers.projectLocal : []).map(normalizePlacementEdgeRef),
      },
      internalHelpers: (Array.isArray(groups.internalHelpers) ? groups.internalHelpers : [])
        .map(normalizePlacementFunctionRef)
        .filter(Boolean),
      transitiveInternalHelpers: (Array.isArray(groups.transitiveInternalHelpers) ? groups.transitiveInternalHelpers : [])
        .map((item) => ({
          depth: Number.isInteger(item?.depth) ? item.depth : 0,
          function: normalizePlacementFunctionRef(item?.function),
          via: normalizePlacementEdgeRef(item?.via),
        }))
        .filter((item) => item.function),
    },
  };
}

function normalizeFunctionNode(node = {}) {
  const normalized = {
    id: normalizeString(node.id).trim(),
    modulePath: normalizeString(node.modulePath).trim(),
    name: normalizeString(node.name).trim(),
    declarationName: normalizeString(node.declarationName || node.name).trim(),
    kind: normalizeString(node.kind || 'function').trim() || 'function',
    component: Boolean(node.component),
    reachable: node.reachable == null ? null : Boolean(node.reachable),
    exported: node.exported == null ? null : Boolean(node.exported),
    exportedNames: Array.isArray(node.exportedNames)
      ? Array.from(new Set(node.exportedNames.map((name) => normalizeString(name).trim()).filter(Boolean))).sort(compareLocale)
      : [],
    exportKinds: Array.isArray(node.exportKinds)
      ? Array.from(new Set(node.exportKinds.map((kind) => normalizeString(kind).trim()).filter(Boolean))).sort(compareLocale)
      : [],
    declarationType: normalizeString(node.declarationType).trim() || null,
    standalone: node.standalone == null ? null : Boolean(node.standalone),
    scopePath: normalizeString(node.scopePath).trim(),
    declarationLine: Number.isInteger(node.declarationLine) ? node.declarationLine : null,
    declarationColumn: Number.isInteger(node.declarationColumn) ? node.declarationColumn : null,
    startLine: Number.isInteger(node.startLine) ? node.startLine : null,
    endLine: Number.isInteger(node.endLine) ? node.endLine : null,
    lineCount: Number.isInteger(node.lineCount) ? node.lineCount : null,
    placement: normalizePlacementReview(node.placement),
  };
  if (!normalized.id) normalized.id = functionIdForDeclaration(normalized);
  return normalized;
}

function compareFunctionNode(a, b) {
  return compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || compareLocale(a.name, b.name)
    || compareLocale(a.kind, b.kind);
}

function normalizeFunctionImportInfo(value = {}) {
  const info = {
    specifier: normalizeString(value.specifier).trim(),
    loadKind: normalizeString(value.loadKind || 'import').trim() || 'import',
    bindingKind: normalizeString(value.bindingKind || 'named').trim() || 'named',
    importedName: normalizeString(value.importedName).trim(),
    localName: normalizeString(value.localName).trim(),
    inferred: Boolean(value.inferred),
  };
  return Object.values(info).some((entry) => entry === true || normalizeString(entry).trim())
    ? info
    : null;
}

function normalizeFunctionEdge(edge = {}) {
  const usages = normalizeUsages(edge.usages);
  const usageLines = normalizeUsageLines(edge.usageLines, usages);
  const syntaxKinds = Array.from(new Set(
    (Array.isArray(edge.syntaxKinds) ? edge.syntaxKinds : usages.map((usage) => usage.syntax))
      .map((kind) => normalizeString(kind).trim())
      .filter(Boolean),
  )).sort(compareLocale);
  const relationKind = normalizeString(edge.relationKind).trim()
    || (syntaxKinds.length === 1 && syntaxKinds[0] === 'reference'
      ? 'static-reference'
      : syntaxKinds.length === 1 && syntaxKinds[0] === 'jsx-element'
        ? 'static-jsx-element'
        : syntaxKinds.length === 1
          ? 'static-call'
          : 'mixed-static-usage');
  const importInfo = edge.import && typeof edge.import === 'object'
    ? normalizeFunctionImportInfo(edge.import)
    : null;
  return {
    id: normalizeString(edge.id).trim(),
    scope: normalizeString(edge.scope).trim() || 'same-module',
    relationKind,
    syntaxKinds,
    usageLines,
    usages,
    referenceCount: Number.isInteger(edge.referenceCount) ? edge.referenceCount : usageLines.length,
    sourceId: normalizeString(edge.sourceId).trim(),
    sourceModulePath: normalizeString(edge.sourceModulePath).trim(),
    sourceFunction: normalizeString(edge.sourceFunction).trim(),
    sourceKind: normalizeString(edge.sourceKind).trim(),
    sourceStartLine: Number.isInteger(edge.sourceStartLine) ? edge.sourceStartLine : null,
    sourceEndLine: Number.isInteger(edge.sourceEndLine) ? edge.sourceEndLine : null,
    targetId: normalizeString(edge.targetId).trim(),
    targetModulePath: normalizeString(edge.targetModulePath).trim(),
    targetFunction: normalizeString(edge.targetFunction).trim(),
    targetKind: normalizeString(edge.targetKind).trim(),
    targetStartLine: Number.isInteger(edge.targetStartLine) ? edge.targetStartLine : null,
    targetEndLine: Number.isInteger(edge.targetEndLine) ? edge.targetEndLine : null,
    ...(importInfo ? { import: importInfo } : {}),
  };
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

function createModuleSummaryFactory(index) {
  return (module) => ({
    id: module.id,
    stableId: module.stableId,
    path: module.path,
    extension: module.extension,
    lineCount: module.lineCount,
    maxLineLength: module.maxLineLength,
    reachable: module.reachable,
    isJsx: module.isJsx,
    dependencyCount: module.localDependencies.length,
    dependentCount: module.dependents.length,
    externalDependencyCount: module.externalDependencies.length,
    symbolCount: (index.symbolsByModulePath.get(module.path) || []).length,
    functionCount: (index.functionsByModulePath.get(module.path) || []).length,
    sourceAvailable: index.sourceModuleByPath.has(module.path),
  });
}

function createSymbolSummary(declaration) {
  return {
    id: declaration.id,
    stableId: declaration.stableId,
    moduleId: declaration.moduleId,
    modulePath: declaration.modulePath,
    name: declaration.name,
    declarationName: declaration.declarationName,
    kind: declaration.kind,
    sourceOrigin: declaration.sourceOrigin,
    startLine: declaration.startLine,
    endLine: declaration.endLine,
    referenceCount: declaration.referenceCount,
    sameFileReferenceCount: declaration.sameFileReferenceCount,
    incomingReferenceCount: declaration.incomingReferenceCount,
    directIdentifierReferenceCount: declaration.directIdentifierReferenceCount,
    importerFileCount: declaration.importerFileCount,
    relationshipCount: declaration.importedFunctionUses.length + declaration.importedBy.length,
    sourceAvailable: Boolean(declaration.code),
  };
}

function createFunctionSummary(index, node) {
  const evidence = node.placement?.evidence || {};
  return {
    id: node.id,
    stableId: node.stableId,
    moduleId: moduleIdForPath(node.modulePath),
    moduleStableId: moduleStableIdForPath(node.modulePath),
    modulePath: node.modulePath,
    name: node.name,
    declarationName: node.declarationName,
    kind: node.kind,
    component: node.component,
    reachable: node.reachable,
    exported: node.exported,
    exportedNames: node.exportedNames,
    exportKinds: node.exportKinds,
    declarationType: node.declarationType,
    standalone: node.standalone,
    declarationLine: node.declarationLine,
    declarationColumn: node.declarationColumn,
    startLine: node.startLine,
    endLine: node.endLine,
    lineCount: node.lineCount,
    dependencyCount: (index.dependenciesByFunctionId.get(node.id) || []).length,
    userCount: (index.usersByFunctionId.get(node.id) || []).length,
    placementAssessment: node.placement?.assessment?.assessment || null,
    placementConfidence: node.placement?.assessment?.confidence || null,
    sameFileCalleeCount: evidence.sameFileCalleeCount || 0,
    projectLocalCalleeCount: evidence.projectLocalCalleeCount || 0,
    sameFileCallerCount: evidence.sameFileCallerCount || 0,
    projectLocalCallerCount: evidence.projectLocalCallerCount || 0,
    sourceAvailable: index.sourceModuleByPath.has(node.modulePath),
  };
}

function createAnalysisIndex(outputPayload, sourcePayload, moduleSourcePayload, functionMapPayload = {}) {
  const outputMeta = outputPayload?.meta && typeof outputPayload.meta === 'object' ? outputPayload.meta : {};
  const privacy = outputMeta.privacy && typeof outputMeta.privacy === 'object'
    ? outputMeta.privacy
    : {};
  const sourceMode = normalizeString(privacy.sourceMode || outputMeta.sourceMode || 'full').trim() || 'full';
  const declarationSourceIsUsable = sourcePayloadMatchesOutput(outputPayload, sourcePayload)
    && Array.isArray(sourcePayload?.declarations);
  const modernModuleSourceIsUsable = sourcePayloadMatchesOutput(outputPayload, moduleSourcePayload)
    && Array.isArray(moduleSourcePayload?.modules);
  const functionMapIsUsable = sourcePayloadMatchesOutput(outputPayload, functionMapPayload)
    && Array.isArray(functionMapPayload?.functions)
    && Array.isArray(functionMapPayload?.edges);
  const legacyModuleSourceIsUsable = declarationSourceIsUsable
    && Array.isArray(sourcePayload?.modules)
    && !modernModuleSourceIsUsable;
  const modulePayload = modernModuleSourceIsUsable ? moduleSourcePayload : sourcePayload;
  const sourceModuleByPath = new Map();
  const declarations = declarationSourceIsUsable ? normalizeDeclarations(sourcePayload) : [];
  const modulePayloads = normalizedModulePayloads(outputPayload);

  if (modernModuleSourceIsUsable || legacyModuleSourceIsUsable) {
    for (const moduleSource of normalizeSourceModules(modulePayload)) {
      sourceModuleByPath.set(moduleSource.path, moduleSource);
    }
  }

  const moduleByPath = new Map();
  const moduleById = new Map();
  const moduleByStableId = new Map();
  const modules = withCollisionSafeStableIds(
    modulePayloads.map((payload) => ({
      ...payload,
      id: moduleIdForPath(payload.path),
      extension: extensionForPath(payload.path),
      dependents: [],
    })),
    (module) => moduleStableIdForPath(module.path),
  );
  for (const module of modules) {
    moduleByPath.set(module.path, module);
    moduleById.set(module.id, module);
    moduleByStableId.set(module.stableId, module);
  }

  for (const module of moduleByPath.values()) {
    module.localDependencies = module.localDependencies.filter((modulePath) => moduleByPath.has(modulePath));
    for (const dependencyPath of module.localDependencies) {
      moduleByPath.get(dependencyPath).dependents.push(module.path);
    }
  }
  for (const module of moduleByPath.values()) {
    module.dependents.sort(compareLocale);
  }

  const importRecordsByKey = new Map();
  for (const module of moduleByPath.values()) {
    for (const ref of module.importRefs) {
      const target = ref.localRel ? moduleByPath.get(ref.localRel) : null;
      const record = {
        sourceId: module.id,
        sourceStableId: module.stableId,
        sourcePath: module.path,
        sourceReachable: module.reachable,
        targetId: target?.id || null,
        targetStableId: target?.stableId || null,
        targetPath: target?.path || null,
        assetPath: ref.assetRel || null,
        assetKind: ref.assetKind || null,
        specifier: ref.specifier,
        loadKind: ref.loadKind,
        typeOnly: Boolean(ref.typeOnly),
        dynamic: ['dynamic', 'lazy', 'worker'].includes(ref.loadKind),
        resolution: ref.resolution || (target ? 'local' : 'unknown'),
        unresolvedReason: ref.unresolvedReason,
        remoteUrl: ref.remoteUrl || null,
        nodeBuiltin: ref.nodeBuiltin || null,
        bindings: ref.bindings,
      };
      const key = [
        record.sourcePath,
        record.specifier,
        record.loadKind,
        record.targetPath || '',
        JSON.stringify(record.bindings || []),
      ].join('\u0000');
      if (!importRecordsByKey.has(key)) importRecordsByKey.set(key, record);
    }
  }
  const imports = withCollisionSafeStableIds(
    Array.from(importRecordsByKey.values()).sort((a, b) => compareLocale(a.sourcePath, b.sourcePath)
      || compareLocale(a.specifier, b.specifier)
      || compareLocale(a.loadKind, b.loadKind)),
    importStableIdForRecord,
  );

  const symbols = withCollisionSafeStableIds(
    declarations
      .map((declaration) => ({ ...declaration, id: symbolIdForDeclaration(declaration) }))
      .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
        || a.startLine - b.startLine
        || compareLocale(a.name, b.name)),
    symbolStableIdForDeclaration,
  );
  const symbolById = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  const symbolByStableId = new Map(symbols.map((symbol) => [symbol.stableId, symbol]));
  const symbolsByModulePath = new Map();
  for (const symbol of symbols) {
    if (!symbolsByModulePath.has(symbol.modulePath)) symbolsByModulePath.set(symbol.modulePath, []);
    symbolsByModulePath.get(symbol.modulePath).push(symbol);
  }

  const functions = functionMapIsUsable
    ? withCollisionSafeStableIds(
      (Array.isArray(functionMapPayload.functions) ? functionMapPayload.functions : [])
        .map(normalizeFunctionNode)
        .filter((node) => node.id && node.modulePath && node.name && moduleByPath.has(node.modulePath))
        .map((node) => ({
          ...node,
          reachable: node.reachable == null ? moduleByPath.get(node.modulePath).reachable : node.reachable,
        }))
        .sort(compareFunctionNode),
      functionStableIdForDeclaration,
    )
    : [];
  const functionById = new Map();
  const functionByStableId = new Map();
  const functionsByModulePath = new Map();
  for (const node of functions) {
    if (functionById.has(node.id)) continue;
    functionById.set(node.id, node);
    functionByStableId.set(node.stableId, node);
    if (!functionsByModulePath.has(node.modulePath)) functionsByModulePath.set(node.modulePath, []);
    functionsByModulePath.get(node.modulePath).push(node);
  }

  const functionEdges = functionMapIsUsable
    ? withCollisionSafeStableIds(
      (Array.isArray(functionMapPayload.edges) ? functionMapPayload.edges : [])
        .map(normalizeFunctionEdge)
        .filter((edge) => edge.id && functionById.has(edge.sourceId) && functionById.has(edge.targetId))
        .sort(compareFunctionEdge),
      (edge) => functionEdgeStableIdForRecord(edge, functionById),
    )
    : [];
  const dependenciesByFunctionId = new Map();
  const usersByFunctionId = new Map();
  for (const edge of functionEdges) {
    if (!dependenciesByFunctionId.has(edge.sourceId)) dependenciesByFunctionId.set(edge.sourceId, []);
    if (!usersByFunctionId.has(edge.targetId)) usersByFunctionId.set(edge.targetId, []);
    dependenciesByFunctionId.get(edge.sourceId).push(edge);
    usersByFunctionId.get(edge.targetId).push(edge);
  }

  const index = {
    output: outputPayload,
    source: sourcePayload,
    sourceMode,
    privacy,
    sourceIsUsable: declarationSourceIsUsable || modernModuleSourceIsUsable || legacyModuleSourceIsUsable,
    declarationSourceIsUsable,
    moduleSourceIsUsable: modernModuleSourceIsUsable || legacyModuleSourceIsUsable,
    legacyModuleSourceIsUsable,
    functionMapIsUsable,
    functionLimitations: Array.isArray(functionMapPayload?.limitations) && functionMapPayload.limitations.length > 0
      ? functionMapPayload.limitations
      : FUNCTION_DEPENDENCY_LIMITATIONS,
    modules: Array.from(moduleByPath.values()).sort((a, b) => compareLocale(a.path, b.path)),
    moduleByPath,
    moduleById,
    moduleByStableId,
    sourceModuleByPath,
    imports,
    symbols,
    symbolById,
    symbolByStableId,
    symbolsByModulePath,
    functions,
    functionById,
    functionByStableId,
    functionsByModulePath,
    functionEdges,
    dependenciesByFunctionId,
    usersByFunctionId,
  };
  index.moduleSummary = createModuleSummaryFactory(index);
  return index;
}

export async function loadStaticAnalysisRun({ outDir } = {}) {
  const resolvedOutDir = path.resolve(normalizeString(outDir).trim() || 'ironglancer-site');
  const output = await readJsonFile(path.join(resolvedOutDir, 'output.json'));
  let source = {};
  let moduleSource = {};
  let functionMap = {};
  try {
    source = await readJsonFile(path.join(resolvedOutDir, 'source-code.json'));
  } catch {
    source = {};
  }
  try {
    moduleSource = await readJsonFile(path.join(resolvedOutDir, API_DATA_DIR, 'source-modules.json'));
  } catch {
    moduleSource = {};
  }
  try {
    functionMap = await readJsonFile(path.join(resolvedOutDir, API_DATA_DIR, 'function-map.json'));
  } catch {
    functionMap = {};
  }
  return {
    outDir: resolvedOutDir,
    index: createAnalysisIndex(output, source, moduleSource, functionMap),
  };
}

function createViewerBridge(index) {
  return {
    snapshot: {
      buildId: index.output?.meta?.buildId || null,
      sourceCodeHash: index.output?.meta?.sourceCodeHash || null,
      generatedAt: index.output?.meta?.generatedAt || null,
      entry: index.output?.entry || index.output?.meta?.entry || null,
    },
    stateByClientId: new Map(),
    latestState: null,
    commands: [],
    acknowledgements: [],
    commandRevision: 0,
    commandOrdinal: 0,
  };
}

async function readRequestJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BRIDGE_BODY_BYTES) {
      throw apiError(413, 'bridge_body_too_large', 'Bridge request body is too large.');
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw apiError(400, 'invalid_json', 'Bridge request body must be valid JSON.');
  }
}

function bridgeDiscovery(bridge) {
  return {
    bridgeVersion: BRIDGE_VERSION,
    snapshot: bridge.snapshot,
    semantics: {
      trustBoundary: 'The viewer bridge is intended for localhost use. It has no authentication and accepts presentation-only commands; do not expose it on an untrusted network.',
      analysisSeparation: 'Analysis queries remain under read-only /api/v1. Bridge commands under /bridge/v1 can only change viewer presentation state.',
      state: 'Viewer state uses stable IDs when available, the saved analysis build identity, and monotonic viewer revisions.',
    },
    routes: [
      { method: 'GET', path: '/bridge/v1' },
      { method: 'GET', path: '/bridge/v1/state' },
      { method: 'POST', path: '/bridge/v1/state' },
      { method: 'GET', path: '/bridge/v1/commands?clientId=<viewer-client>&afterRevision=0' },
      { method: 'POST', path: '/bridge/v1/commands' },
      { method: 'POST', path: '/bridge/v1/ack' },
    ],
    commands: Array.from(VIEWER_COMMAND_TYPES).sort(compareLocale),
  };
}

function bridgeStatePayload(bridge) {
  return {
    bridgeVersion: BRIDGE_VERSION,
    snapshot: bridge.snapshot,
    latestState: bridge.latestState,
    commandRevision: bridge.commandRevision,
    acknowledgements: bridge.acknowledgements.slice(-25),
  };
}

function normalizeBridgeClientId(value) {
  const clientId = normalizeString(value).trim();
  if (!clientId) throw apiError(400, 'missing_client_id', 'Bridge clientId is required.');
  return clientId;
}

function updateBridgeViewerState(bridge, payload = {}) {
  const clientId = normalizeBridgeClientId(payload.clientId);
  const revision = Number(payload.revision);
  if (!Number.isInteger(revision) || revision < 0) {
    throw apiError(400, 'invalid_revision', 'Viewer state revision must be a non-negative integer.');
  }
  const previous = bridge.stateByClientId.get(clientId);
  const accepted = !previous || revision >= previous.revision;
  if (accepted) {
    const state = {
      clientId,
      revision,
      receivedAt: new Date().toISOString(),
      reason: normalizeString(payload.reason).trim() || null,
      snapshot: payload.snapshot && typeof payload.snapshot === 'object' ? payload.snapshot : null,
      primaryView: normalizeString(payload.primaryView).trim() || null,
      graph: payload.graph && typeof payload.graph === 'object' ? payload.graph : null,
      selectedFunction: payload.selectedFunction && typeof payload.selectedFunction === 'object' ? payload.selectedFunction : null,
      selectedFile: payload.selectedFile && typeof payload.selectedFile === 'object' ? payload.selectedFile : null,
      openSource: payload.openSource && typeof payload.openSource === 'object' ? payload.openSource : null,
      highlighted: payload.highlighted && typeof payload.highlighted === 'object' ? payload.highlighted : null,
      viewport: payload.viewport && typeof payload.viewport === 'object' ? payload.viewport : null,
    };
    bridge.stateByClientId.set(clientId, state);
    bridge.latestState = state;
  }
  return {
    accepted,
    latestState: bridge.latestState,
  };
}

function validateViewerEnumCommandValue(command, fieldName, allowedValues) {
  if (!Object.prototype.hasOwnProperty.call(command, fieldName)) return;
  const value = normalizeString(command[fieldName]).trim();
  if (!allowedValues.has(value)) {
    throw apiError(
      400,
      'invalid_bridge_command',
      `${fieldName} must be one of: ${Array.from(allowedValues).sort(compareLocale).join(', ')}.`,
    );
  }
  command[fieldName] = value;
}

function validateViewerBooleanCommandValue(command, fieldName) {
  if (!Object.prototype.hasOwnProperty.call(command, fieldName)) return;
  if (typeof command[fieldName] !== 'boolean') {
    throw apiError(400, 'invalid_bridge_command', `${fieldName} must be a boolean.`);
  }
}

function normalizeViewerEnumCommandAlias(command, aliasField, canonicalField, allowedValues, aliases = null) {
  if (!Object.prototype.hasOwnProperty.call(command, aliasField)) return;
  const aliasValue = normalizeString(command[aliasField]).trim();
  const value = aliases ? aliases.get(aliasValue) : aliasValue;
  if (!allowedValues.has(value)) {
    throw apiError(
      400,
      'invalid_bridge_command',
      `${aliasField} must be one of: ${Array.from(aliases ? aliases.keys() : allowedValues).sort(compareLocale).join(', ')}.`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(command, canonicalField)) {
    const canonicalValue = normalizeString(command[canonicalField]).trim();
    if (canonicalValue !== value) {
      throw apiError(
        400,
        'invalid_bridge_command',
        `${aliasField} conflicts with ${canonicalField}.`,
      );
    }
  }
  command[canonicalField] = value;
  delete command[aliasField];
}

function validateSetGraphViewCommand(command) {
  normalizeViewerEnumCommandAlias(
    command,
    'direction',
    'scope',
    VIEWER_GRAPH_SCOPE_VALUES,
    VIEWER_LEGACY_GRAPH_DIRECTION_ALIASES,
  );
  normalizeViewerEnumCommandAlias(command, 'hops', 'depth', VIEWER_GRAPH_DEPTH_VALUES);
  validateViewerEnumCommandValue(command, 'primaryView', VIEWER_PRIMARY_VIEW_VALUES);
  validateViewerEnumCommandValue(command, 'layout', VIEWER_GRAPH_LAYOUT_VALUES);
  validateViewerEnumCommandValue(command, 'scope', VIEWER_GRAPH_SCOPE_VALUES);
  validateViewerEnumCommandValue(command, 'depth', VIEWER_GRAPH_DEPTH_VALUES);
  validateViewerBooleanCommandValue(command, 'showFiles');
  validateViewerBooleanCommandValue(command, 'showFunctions');
  if (command.showFiles === false && command.showFunctions === false) {
    throw apiError(400, 'invalid_bridge_command', 'showFiles and showFunctions cannot both be false.');
  }
}

function queueBridgeCommand(bridge, payload = {}) {
  const rawCommand = payload.command && typeof payload.command === 'object' ? payload.command : payload;
  const type = normalizeString(rawCommand.type || rawCommand.command).trim();
  if (!VIEWER_COMMAND_TYPES.has(type)) {
    throw apiError(400, 'invalid_bridge_command', `Bridge command type must be one of: ${Array.from(VIEWER_COMMAND_TYPES).sort(compareLocale).join(', ')}.`);
  }
  const command = {
    ...rawCommand,
    type,
  };
  delete command.command;
  if (type === 'setGraphView') validateSetGraphViewCommand(command);
  const record = {
    commandId: normalizeString(payload.commandId).trim() || `vcmd_${++bridge.commandOrdinal}`,
    revision: ++bridge.commandRevision,
    createdAt: new Date().toISOString(),
    command,
  };
  bridge.commands.push(record);
  if (bridge.commands.length > MAX_BRIDGE_COMMANDS) bridge.commands.splice(0, bridge.commands.length - MAX_BRIDGE_COMMANDS);
  return record;
}

function bridgeCommandsSince(bridge, url) {
  const clientId = normalizeBridgeClientId(url.searchParams.get('clientId'));
  const afterRevision = parseIntegerParam(url.searchParams, 'afterRevision', 0, {
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  });
  const acknowledged = new Set(bridge.acknowledgements
    .filter((ack) => ack.clientId === clientId && ack.status === 'applied')
    .map((ack) => ack.commandId));
  return {
    clientId,
    afterRevision,
    commands: bridge.commands
      .filter((record) => record.revision > afterRevision && !acknowledged.has(record.commandId)),
  };
}

function acknowledgeBridgeCommand(bridge, payload = {}) {
  const clientId = normalizeBridgeClientId(payload.clientId);
  const commandId = normalizeString(payload.commandId).trim();
  if (!commandId) throw apiError(400, 'missing_command_id', 'Bridge commandId is required.');
  const status = normalizeString(payload.status).trim() || 'applied';
  const ack = {
    clientId,
    commandId,
    commandRevision: Number.isInteger(payload.commandRevision) ? payload.commandRevision : null,
    stateRevision: Number.isInteger(payload.stateRevision) ? payload.stateRevision : null,
    status,
    message: normalizeString(payload.message).trim() || null,
    receivedAt: new Date().toISOString(),
  };
  bridge.acknowledgements.push(ack);
  if (bridge.acknowledgements.length > MAX_BRIDGE_COMMANDS) {
    bridge.acknowledgements.splice(0, bridge.acknowledgements.length - MAX_BRIDGE_COMMANDS);
  }
  return ack;
}

async function handleBridgeRequest({ request, response, bridge }) {
  if (request.method === 'OPTIONS') {
    sendBridgeOptions(response);
    return;
  }
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'bridge' || parts[1] !== BRIDGE_VERSION) {
    throw apiError(404, 'bridge_not_found', 'Bridge route not found.');
  }
  try {
    if (request.method === 'GET' && parts.length === 2) {
      rejectUnknownQueryParams(url, []);
      sendBridgeData(response, bridgeDiscovery(bridge));
      return;
    }
    if (parts.length === 3 && parts[2] === 'state') {
      if (request.method === 'GET') {
        rejectUnknownQueryParams(url, []);
        sendBridgeData(response, bridgeStatePayload(bridge));
        return;
      }
      if (request.method === 'POST') {
        rejectUnknownQueryParams(url, []);
        sendBridgeData(response, updateBridgeViewerState(bridge, await readRequestJson(request)));
        return;
      }
    }
    if (parts.length === 3 && parts[2] === 'commands') {
      if (request.method === 'GET') {
        rejectUnknownQueryParams(url, ['clientId', 'afterRevision']);
        sendBridgeData(response, bridgeCommandsSince(bridge, url));
        return;
      }
      if (request.method === 'POST') {
        rejectUnknownQueryParams(url, []);
        sendBridgeData(response, { command: queueBridgeCommand(bridge, await readRequestJson(request)) }, 201);
        return;
      }
    }
    if (parts.length === 3 && parts[2] === 'ack' && request.method === 'POST') {
      rejectUnknownQueryParams(url, []);
      sendBridgeData(response, { acknowledgement: acknowledgeBridgeCommand(bridge, await readRequestJson(request)) });
      return;
    }
    throw apiError(404, 'bridge_not_found', 'Bridge route not found.');
  } catch (error) {
    if (error instanceof ApiError) {
      sendBridgeError(response, error);
      return;
    }
    sendBridgeError(response, apiError(500, 'bridge_error', 'Bridge error.'));
  }
}

export async function createStaticAnalysisRequestHandler({ outDir } = {}) {
  const { outDir: resolvedOutDir, index } = await loadStaticAnalysisRun({ outDir });
  const bridge = createViewerBridge(index);
  const handler = async (request, response) => {
    try {
      const pathname = decodedStaticPathname(request.url);
      if (pathname === '/bridge/v1' || pathname?.startsWith('/bridge/v1/')) {
        await handleBridgeRequest({ request, response, bridge });
        return;
      }
      if (pathname === '/api/v1' || pathname?.startsWith('/api/v1/')) {
        handleApiRequest({ request, response, index, outDir: resolvedOutDir });
        return;
      }
      await serveStaticFile({ request, response, outDir: resolvedOutDir });
    } catch (error) {
      if (error instanceof ApiError) {
        sendApiError(response, error);
        return;
      }
      sendApiError(response, apiError(500, 'internal_error', 'Internal server error.'));
    }
  };
  handler.outDir = resolvedOutDir;
  handler.index = index;
  return handler;
}

function routeEntries() {
  return [
    { method: 'GET', path: '/api/v1', description: 'Discover available API routes and static-analysis semantics.' },
    { method: 'GET', path: '/api/v1/schema', description: 'Return an enveloped JSON Schema catalog for API clients.' },
    { method: 'GET', path: '/api/v1/schema.json', description: 'Return the raw application/schema+json catalog.' },
    { method: 'GET', path: '/api/v1/run', description: 'Return immutable run, package, schema, source, and summary metadata.' },
    { method: 'GET', path: '/api/v1/modules', description: 'List saved browser modules with search, extension, reachability, limit, and offset filters.' },
    { method: 'GET', path: '/api/v1/modules/:id', description: 'Return one saved browser module with dependencies, dependents, imports, and symbols.' },
    { method: 'GET', path: '/api/v1/modules/:id/dependencies', description: 'Return local and external dependencies for one saved browser module.' },
    { method: 'GET', path: '/api/v1/modules/:id/dependents', description: 'Return modules that import one saved browser module.' },
    { method: 'GET', path: '/api/v1/modules/:id/shortest-path', description: 'Return a bounded shortest local dependency path to a target module.' },
    { method: 'GET', path: '/api/v1/modules/:id/blast-radius', description: 'Return bounded direct and transitive importers affected by one module.' },
    { method: 'GET', path: '/api/v1/components', description: 'List saved component and hook declarations from reachable browser modules.' },
    { method: 'GET', path: '/api/v1/component-edges', description: 'List saved JSX render edges between component-shaped declarations.' },
    { method: 'GET', path: '/api/v1/routes', description: 'List framework-adapter route records such as React Router route declarations.' },
    { method: 'GET', path: '/api/v1/lazy-boundaries', description: 'List dynamic import, React.lazy, and module worker lazy boundaries.' },
    { method: 'GET', path: '/api/v1/assets', description: 'List CSS, image, font, JSON, WASM, worker, and unknown asset imports.' },
    { method: 'GET', path: '/api/v1/browser-apis', description: 'List browser global/API references seen in reachable modules.' },
    { method: 'GET', path: '/api/v1/findings', description: 'List structural front-end findings from the saved snapshot.' },
    { method: 'GET', path: '/api/v1/imports', description: 'Filter saved local, asset, remote, browser-incompatible, external, unresolved, static, and dynamic import evidence.' },
    { method: 'GET', path: '/api/v1/modules/:id/source', description: 'Return a bounded source excerpt from saved analyzed module source.' },
    { method: 'GET', path: '/api/v1/source', description: 'Return a bounded source excerpt by exact analyzed module path.' },
    { method: 'GET', path: '/api/v1/symbols', description: 'List saved source symbols with search, exact name, modulePath, kind, sourceOrigin, referenceCount, limit, and offset filters.' },
    { method: 'GET', path: '/api/v1/symbols/search', description: 'Search saved source symbols using q or search.' },
    { method: 'GET', path: '/api/v1/symbols/:id', description: 'Return one saved source symbol and its declaration source snippet.' },
    { method: 'GET', path: '/api/v1/symbols/:id/references', description: 'Return captured static reference/importer relationships for one symbol.' },
    { method: 'GET', path: '/api/v1/symbols/:id/callers', description: 'Alias for static importer relationships; this is not a runtime call graph.' },
    { method: 'GET', path: '/api/v1/modules/:id/functions', description: 'Return advanced static function records declared in one module with detail, exact/count filters, limit, and offset controls.' },
    { method: 'GET', path: '/api/v1/functions', description: 'List advanced static function declarations with search, exact name, modulePath, kind, component, dependencyCount, userCount, limit, and offset filters.' },
    { method: 'GET', path: '/api/v1/functions/search', description: 'Search advanced static function declarations using q or search.' },
    { method: 'GET', path: '/api/v1/functions/:id', description: 'Return one advanced static function with dependencies and reverse users.' },
    { method: 'GET', path: '/api/v1/functions/:id/dependencies', description: 'Return outgoing static dependency evidence for one function.' },
    { method: 'GET', path: '/api/v1/functions/:id/users', description: 'Return reverse static user evidence for one function.' },
    { method: 'GET', path: '/api/v1/functions/:id/placement', description: 'Return deterministic static placement/cohesion evidence for one function.' },
    { method: 'GET', path: '/api/v1/functions/:id/shortest-path', description: 'Return a bounded shortest static dependency path to a target function.' },
    { method: 'GET', path: '/api/v1/functions/:id/blast-radius', description: 'Return bounded direct and transitive static user evidence affected by one function.' },
    { method: 'GET', path: '/api/v1/search', description: 'Unified module, function, symbol, and exact lexical-occurrence search.' },
    { method: 'GET', path: '/api/v1/query', description: 'Aggregate exact modulePath and symbol search results without adding inferred semantics.' },
  ];
}

function apiSchema(index) {
  const stringOrNull = { type: ['string', 'null'] };
  const integerOrNull = { type: ['integer', 'null'] };
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: '/api/v1/schema.json',
    title: 'IronGlancer front-end architecture API',
    description: 'Schemas for API v1 browser-module architecture summaries. Legacy id fields remain supported; stableId fields are compact semantic joins.',
    type: 'object',
    $defs: {
      moduleSummary: {
        type: 'object',
        required: ['id', 'stableId'],
        properties: {
          id: { type: 'string' },
          stableId: { type: 'string', pattern: '^mod_[a-f0-9]{16}(?:_(?:[2-9]|[1-9][0-9]+))?$' },
          path: { type: 'string' },
          lineCount: { type: 'integer', minimum: 0 },
          reachable: { type: ['boolean', 'null'] },
        },
        additionalProperties: true,
      },
      functionSummary: {
        type: 'object',
        required: ['id', 'stableId'],
        properties: {
          id: { type: 'string' },
          stableId: { type: 'string', pattern: '^fn_[a-f0-9]{16}(?:_(?:[2-9]|[1-9][0-9]+))?$' },
          modulePath: { type: 'string' },
          name: { type: 'string' },
          kind: { type: 'string' },
          startLine: integerOrNull,
          endLine: integerOrNull,
        },
        additionalProperties: true,
      },
      symbolSummary: {
        type: 'object',
        required: ['id', 'stableId'],
        properties: {
          id: { type: 'string' },
          stableId: { type: 'string', pattern: '^sym_[a-f0-9]{16}(?:_(?:[2-9]|[1-9][0-9]+))?$' },
          modulePath: { type: 'string' },
          name: { type: 'string' },
          sourceOrigin: stringOrNull,
        },
        additionalProperties: true,
      },
      importSummary: {
        type: 'object',
        required: ['stableId'],
        properties: {
          stableId: { type: 'string', pattern: '^imp_[a-f0-9]{16}(?:_(?:[2-9]|[1-9][0-9]+))?$' },
          sourcePath: { type: 'string' },
          targetPath: stringOrNull,
          specifier: { type: 'string' },
          loadKind: { type: 'string' },
          dynamic: { type: 'boolean' },
          resolution: { enum: ['local', 'asset', 'external', 'remote', 'browser-incompatible', 'unresolved', 'unknown'] },
          unresolvedReason: stringOrNull,
        },
        additionalProperties: true,
      },
      graphBounds: {
        type: 'object',
        required: ['maxDepth', 'maxVisited'],
        properties: {
          maxDepth: { type: 'integer', minimum: 0, maximum: MAX_GRAPH_DEPTH },
          maxVisited: { const: MAX_GRAPH_VISITED },
          limit: { type: 'integer', minimum: 1, maximum: MAX_BLAST_LIMIT },
        },
        additionalProperties: false,
      },
      shortestPathResult: {
        type: 'object',
        required: ['source', 'target', 'direction', 'found', 'distance', 'nodes', 'edges', 'bounds', 'truncated'],
        properties: {
          direction: { enum: ['dependencies'] },
          found: { type: 'boolean' },
          distance: integerOrNull,
          nodes: { type: 'array' },
          edges: { type: 'array' },
          bounds: { $ref: '#/$defs/graphBounds' },
          truncated: { type: 'boolean' },
          truncationReasons: {
            type: 'array',
            items: { enum: ['maxDepth', 'maxVisited'] },
          },
        },
        additionalProperties: true,
      },
      blastRadiusResult: {
        type: 'object',
        required: ['source', 'direction', 'direct', 'transitive', 'items', 'bounds', 'truncated'],
        properties: {
          direction: { enum: ['dependents', 'users'] },
          direct: { type: 'array' },
          transitive: { type: 'array' },
          items: { type: 'array' },
          bounds: { $ref: '#/$defs/graphBounds' },
          truncated: { type: 'boolean' },
          truncationReasons: {
            type: 'array',
            items: { enum: ['limit', 'maxDepth', 'maxVisited'] },
          },
        },
        additionalProperties: true,
      },
      pagination: {
        type: 'object',
        required: ['offset', 'limit', 'total', 'nextOffset'],
        properties: {
          offset: { type: 'integer', minimum: 0 },
          limit: { type: 'integer', minimum: 0 },
          total: { type: 'integer', minimum: 0 },
          nextOffset: integerOrNull,
        },
        additionalProperties: false,
      },
      successEnvelope: {
        type: 'object',
        required: ['ok', 'data'],
        properties: { ok: { const: true }, data: {} },
        additionalProperties: false,
      },
      errorEnvelope: {
        type: 'object',
        required: ['ok', 'error'],
        properties: {
          ok: { const: false },
          error: {
            type: 'object',
            required: ['status', 'code', 'message'],
            properties: {
              status: { type: 'integer' },
              code: { type: 'string' },
              message: { type: 'string' },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: false,
      },
    },
    'x-ironglancer-routes': {
      '/api/v1/modules': {
        query: MODULE_LIST_QUERY_PARAMS,
        itemSchema: '#/$defs/moduleSummary',
      },
      '/api/v1/functions': {
        query: FUNCTION_LIST_QUERY_PARAMS,
        itemSchema: '#/$defs/functionSummary',
      },
      '/api/v1/symbols': {
        query: SYMBOL_LIST_QUERY_PARAMS,
        itemSchema: '#/$defs/symbolSummary',
      },
      '/api/v1/imports': {
        query: IMPORT_LIST_QUERY_PARAMS,
        itemSchema: '#/$defs/importSummary',
      },
      '/api/v1/components': {
        query: FRONTEND_ENTITY_QUERY_PARAMS,
      },
      '/api/v1/routes': {
        query: FRONTEND_ENTITY_QUERY_PARAMS,
      },
      '/api/v1/lazy-boundaries': {
        query: FRONTEND_ENTITY_QUERY_PARAMS,
      },
      '/api/v1/assets': {
        query: FRONTEND_ENTITY_QUERY_PARAMS,
      },
      '/api/v1/browser-apis': {
        query: FRONTEND_ENTITY_QUERY_PARAMS,
      },
      '/api/v1/findings': {
        query: FRONTEND_ENTITY_QUERY_PARAMS,
      },
      '/api/v1/search': {
        query: UNIFIED_SEARCH_QUERY_PARAMS,
        match: ['exact', 'substring'],
        types: UNIFIED_SEARCH_TYPES,
      },
      '/api/v1/modules/:id/shortest-path': {
        query: SHORTEST_PATH_QUERY_PARAMS,
        responseSchema: '#/$defs/shortestPathResult',
      },
      '/api/v1/functions/:id/shortest-path': {
        query: SHORTEST_PATH_QUERY_PARAMS,
        responseSchema: '#/$defs/shortestPathResult',
      },
      '/api/v1/functions/:id/placement': {
        query: FUNCTION_PLACEMENT_QUERY_PARAMS,
      },
      '/api/v1/modules/:id/blast-radius': {
        query: BLAST_RADIUS_QUERY_PARAMS,
        responseSchema: '#/$defs/blastRadiusResult',
      },
      '/api/v1/functions/:id/blast-radius': {
        query: BLAST_RADIUS_QUERY_PARAMS,
        responseSchema: '#/$defs/blastRadiusResult',
      },
    },
    apiVersion: API_VERSION,
    analysisSchemaVersion: index.output?.meta?.schemaVersion || DEFAULT_SCHEMA_VERSION,
  };
}

function discovery(index) {
  return {
    apiVersion: API_VERSION,
    schemaVersion: index.output?.meta?.schemaVersion || DEFAULT_SCHEMA_VERSION,
    schema: {
      href: '/api/v1/schema',
      mediaType: 'application/json',
      envelope: true,
      draft: '2020-12',
    },
    rawSchema: {
      href: '/api/v1/schema.json',
      mediaType: 'application/schema+json',
      draft: '2020-12',
    },
    routes: routeEntries(),
    examples: [
      '/api/v1/run',
      '/api/v1/modules?reachable=true&extension=.jsx&limit=25',
      '/api/v1/components?modulePath=src/App.jsx',
      '/api/v1/routes?modulePath=src/App.jsx',
      '/api/v1/lazy-boundaries',
      '/api/v1/assets?modulePath=src/main.jsx',
      '/api/v1/findings',
      '/api/v1/imports?resolution=browser-incompatible',
      '/api/v1/imports?resolution=unresolved&dynamic=true',
      '/api/v1/modules/<module-id>/functions?detail=summary&limit=25&offset=0',
      '/api/v1/modules/<module-id>/source?startLine=1&endLine=40',
      '/api/v1/symbols?name=App&referenceCount=1',
      '/api/v1/symbols/search?q=App',
      '/api/v1/functions?name=DashboardShell&dependencyCount=2',
      '/api/v1/functions/search?q=DashboardShell',
      '/api/v1/functions?exported=false&standalone=true&userCount=0&sort=lineCount&order=desc',
      '/api/v1/search?q=DashboardShell&match=exact&types=function,occurrence',
      '/api/v1/modules/<module-id>/shortest-path?targetId=<module-id>&maxDepth=10',
      '/api/v1/functions/<function-id>/blast-radius?maxDepth=10&limit=200',
      '/api/v1/functions/<function-id>/placement',
      '/api/v1/query?modulePath=src/app.jsx&symbol=RootApp',
    ],
    semantics: {
      analysis: 'Responses are served from generated output.json, source-code.json, .ironglancer-api/source-modules.json, and .ironglancer-api/function-map.json loaded once at server start. Browser entry reachability is authoritative.',
      relations: 'Symbol relation endpoints expose static import/export/reference relationships captured by IronGlancer, not runtime call graphs or data lineage.',
      functionDependencies: index.functionLimitations,
      queryParameters: {
        unknown: 'Unknown query parameters are rejected with HTTP 400 instead of being ignored.',
        pagination: `General list endpoints default to limit ${DEFAULT_PAGE_LIMIT}. Explicit limit must be a positive integer up to ${MAX_PAGE_LIMIT}; offset must be non-negative. The module-functions endpoint preserves its legacy all-functions response when limit and offset are both omitted.`,
        exactFilters: 'name, userCount, dependencyCount, and referenceCount are exact matches. search and q remain case-insensitive substring filters.',
        moduleFunctions: 'GET /api/v1/modules/:id/functions defaults to backwards-compatible detail=full. Use detail=summary with limit and offset for compact pageable function summaries.',
        projections: 'fields is an opt-in sparse projection for summary lists; include is an opt-in relationship expansion control. Legacy id and compact stableId join keys remain in projected records.',
        graphBounds: `Shortest paths and blast radius use deterministic breadth-first traversal over saved indexes only. maxDepth defaults to ${DEFAULT_GRAPH_DEPTH} and is capped at ${MAX_GRAPH_DEPTH}; traversal visits at most ${MAX_GRAPH_VISITED} nodes. Blast results default to ${DEFAULT_BLAST_LIMIT} and cap at ${MAX_BLAST_LIMIT}.`,
        imports: 'Import resolution and dynamic flags describe saved static evidence; they do not prove runtime loading.',
      },
      source: `Source excerpts are bounded to ${MAX_SOURCE_EXCERPT_LINES} lines and only come from modules saved in the analyzed run.`,
    },
  };
}

function runMetadata(index, outDir) {
  const meta = index.output?.meta || {};
  return {
    apiVersion: API_VERSION,
    schemaVersion: meta.schemaVersion || DEFAULT_SCHEMA_VERSION,
    package: {
      name: meta.packageName || 'ironglancer',
      version: meta.version || 'unknown',
    },
    generatedAt: meta.generatedAt || null,
    rootDir: meta.rootDir || index.output.rootDir || null,
    entry: meta.entry || index.output.entry || null,
    gitCommit: meta.gitCommit || null,
    buildId: meta.buildId || null,
    sourceCodeHash: meta.sourceCodeHash || null,
    outDir: path.basename(outDir),
    summary: index.output.summary || {},
    source: {
      sourceMode: index.sourceMode,
      sourceCodeAvailable: index.sourceIsUsable,
      declarationSourceAvailable: index.declarationSourceIsUsable,
      moduleSourceAvailable: index.moduleSourceIsUsable,
      functionMapAvailable: index.functionMapIsUsable,
      capabilities: index.privacy?.capabilities || {},
      moduleSourceCount: index.sourceModuleByPath.size,
      symbolSourceCount: index.symbols.length,
      functionCount: index.functions.length,
      functionEdgeCount: index.functionEdges.length,
    },
  };
}

function lowerSearch(value) {
  return normalizeString(value).trim().toLowerCase();
}

function parseBoolean(value, name) {
  if (value == null || value === '') return null;
  const normalized = normalizeString(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  throw apiError(400, 'invalid_query', `${name} must be true or false.`);
}

function parseIntegerParam(searchParams, name, defaultValue, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = searchParams.get(name);
  if (raw == null || raw === '') return defaultValue;
  if (!/^\d+$/.test(raw)) throw apiError(400, 'invalid_query', `${name} must be a non-negative integer.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw apiError(400, 'invalid_query', `${name} must be between ${min} and ${max}.`);
  }
  return value;
}

function rejectUnknownQueryParams(url, allowedNames) {
  const allowed = new Set(allowedNames);
  const unknown = Array.from(new Set(Array.from(url.searchParams.keys())
    .filter((name) => !allowed.has(name))))
    .sort(compareLocale);
  if (unknown.length === 0) return;

  const label = unknown.length === 1 ? 'parameter' : 'parameters';
  throw apiError(
    400,
    'unknown_query_parameter',
    `Unknown query ${label}: ${unknown.join(', ')}.`,
    {
      unknown,
      allowed: Array.from(allowed).sort(compareLocale),
    },
  );
}

function parseSelectorList(url, name, defaultValues = null) {
  if (!url.searchParams.has(name)) return defaultValues == null ? null : [...defaultValues];
  const values = url.searchParams.getAll(name)
    .flatMap((raw) => normalizeString(raw).split(','))
    .map((value) => value.trim());
  if (values.length === 0 || values.some((value) => !value)) {
    throw apiError(400, 'invalid_query', `${name} must be a non-empty comma-separated list.`);
  }
  return Array.from(new Set(values));
}

function parseFieldProjection(url, allowedFields) {
  const fields = parseSelectorList(url, 'fields');
  if (!fields) return null;
  const allowed = new Set(allowedFields);
  const invalid = fields.filter((field) => !allowed.has(field)).sort(compareLocale);
  if (invalid.length > 0) {
    throw apiError(400, 'invalid_query', `Unknown projection fields: ${invalid.join(', ')}.`, {
      invalid,
      allowed: [...allowed].sort(compareLocale),
    });
  }
  return fields;
}

function projectSummaryItems(items, url, allowedFields) {
  const fields = parseFieldProjection(url, allowedFields);
  if (!fields) return items;
  const selected = Array.from(new Set(['id', 'stableId', ...fields]));
  return items.map((item) => Object.fromEntries(
    selected.filter((field) => Object.hasOwn(item, field)).map((field) => [field, item[field]]),
  ));
}

function parseInclude(url, allowedValues, defaultValues) {
  const values = parseSelectorList(url, 'include', defaultValues);
  const allowed = new Set(allowedValues);
  const invalid = values.filter((value) => !allowed.has(value)).sort(compareLocale);
  if (invalid.length > 0) {
    throw apiError(400, 'invalid_query', `Unknown include values: ${invalid.join(', ')}.`, {
      invalid,
      allowed: [...allowed].sort(compareLocale),
    });
  }
  return values;
}

function sortRecords(items, url, { allowed, valueFor, tieBreaker }) {
  const sort = normalizeString(url.searchParams.get('sort')).trim();
  const order = lowerSearch(url.searchParams.get('order')) || 'asc';
  if (!sort) {
    if (url.searchParams.has('order')) throw apiError(400, 'invalid_query', 'order requires sort.');
    return items;
  }
  if (!allowed.includes(sort)) {
    throw apiError(400, 'invalid_query', `sort must be one of: ${allowed.join(', ')}.`);
  }
  if (!['asc', 'desc'].includes(order)) {
    throw apiError(400, 'invalid_query', 'order must be asc or desc.');
  }
  const direction = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const left = valueFor(a, sort);
    const right = valueFor(b, sort);
    let primary = 0;
    if (typeof left === 'number' && typeof right === 'number') primary = left - right;
    else primary = compareLocale(normalizeString(left), normalizeString(right));
    return direction * primary || tieBreaker(a, b);
  });
}

function parseExactCountParam(searchParams, name) {
  return parseIntegerParam(searchParams, name, null, {
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  });
}

function pagination(url) {
  const limit = parseIntegerParam(url.searchParams, 'limit', DEFAULT_PAGE_LIMIT, {
    min: 1,
    max: MAX_PAGE_LIMIT,
  });
  const offset = parseIntegerParam(url.searchParams, 'offset', 0, {
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  });
  return { limit, offset };
}

function hasPaginationParam(url) {
  return url.searchParams.has('limit') || url.searchParams.has('offset');
}

function paginated(items, url) {
  const { limit, offset } = pagination(url);
  const page = items.slice(offset, offset + limit);
  const nextOffset = offset + limit < items.length ? offset + limit : null;
  return {
    items: page,
    pagination: {
      offset,
      limit,
      total: items.length,
      nextOffset,
    },
  };
}

function optionallyPaginated(items, url) {
  if (hasPaginationParam(url)) return paginated(items, url);
  return {
    items,
    pagination: {
      offset: 0,
      limit: items.length,
      total: items.length,
      nextOffset: null,
    },
  };
}

function moduleList(index, url) {
  const search = lowerSearch(url.searchParams.get('search') || url.searchParams.get('q'));
  const extensionRaw = lowerSearch(url.searchParams.get('extension'));
  const extension = extensionRaw && !extensionRaw.startsWith('.') ? `.${extensionRaw}` : extensionRaw;
  const reachable = parseBoolean(url.searchParams.get('reachable'), 'reachable');
  const jsx = parseBoolean(url.searchParams.get('jsx'), 'jsx');

  const filtered = index.modules
    .filter((module) => !search || module.path.toLowerCase().includes(search))
    .filter((module) => !extension || module.extension === extension)
    .filter((module) => reachable == null || module.reachable === reachable)
    .filter((module) => jsx == null || module.isJsx === jsx);
  const sorted = sortRecords(filtered, url, {
    allowed: ['path', 'lineCount', 'dependencyCount', 'dependentCount'],
    valueFor: (module, sort) => ({
      path: module.path,
      lineCount: module.lineCount,
      dependencyCount: module.localDependencies.length,
      dependentCount: module.dependents.length,
    })[sort],
    tieBreaker: (a, b) => compareLocale(a.path, b.path),
  });
  const items = sorted.map(index.moduleSummary);
  return paginated(projectSummaryItems(items, url, MODULE_SUMMARY_FIELDS), url);
}

function invalidModulePath(value) {
  const raw = normalizeString(value).trim();
  if (!raw || raw.includes('\0') || /^[A-Za-z]:/.test(raw)) return true;
  const normalized = toPosixPath(raw);
  return normalized.startsWith('/') || normalized.split('/').some((part) => part === '..');
}

function getModuleByPath(index, value) {
  if (invalidModulePath(value)) {
    throw apiError(400, 'invalid_module_path', 'Module path must be an exact analyzed relative path.');
  }
  const modulePath = toPosixPath(normalizeString(value).trim()).replace(/^\.\//, '');
  const module = index.moduleByPath.get(modulePath);
  if (!module) throw apiError(404, 'module_not_found', `No analyzed module exists at ${modulePath}.`);
  return module;
}

function getModuleById(index, id) {
  const normalizedId = normalizeString(id).trim();
  const module = index.moduleById.get(normalizedId) || index.moduleByStableId.get(normalizedId);
  if (!module) throw apiError(404, 'module_not_found', 'No analyzed module exists for that id.');
  return module;
}

function moduleRelationPayload(index, module) {
  return {
    module: index.moduleSummary(module),
    local: module.localDependencies.map((modulePath) => index.moduleSummary(index.moduleByPath.get(modulePath))),
    external: module.externalDependencies,
  };
}

function moduleDependentsPayload(index, module) {
  return {
    module: index.moduleSummary(module),
    local: module.dependents.map((modulePath) => index.moduleSummary(index.moduleByPath.get(modulePath))),
  };
}

function moduleDetail(index, module, url) {
  const include = new Set(parseInclude(url, ['dependencies', 'dependents', 'imports', 'symbols'], [
    'dependencies', 'dependents', 'imports', 'symbols',
  ]));
  return {
    module: index.moduleSummary(module),
    ...(include.has('dependencies') ? {
      dependencies: {
        local: module.localDependencies.map((modulePath) => index.moduleSummary(index.moduleByPath.get(modulePath))),
        external: module.externalDependencies,
      },
    } : {}),
    ...(include.has('dependents') ? {
      dependents: {
        local: module.dependents.map((modulePath) => index.moduleSummary(index.moduleByPath.get(modulePath))),
      },
    } : {}),
    ...(include.has('imports') ? { imports: module.importRefs } : {}),
    ...(include.has('symbols') ? {
      symbols: (index.symbolsByModulePath.get(module.path) || []).map(createSymbolSummary),
    } : {}),
  };
}

function sourceExcerpt(index, module, url) {
  const sourceModule = index.sourceModuleByPath.get(module.path);
  if (!sourceModule) {
    throw apiError(
      404,
      'source_not_available',
      `Saved module source is not available for ${module.path} with sourceMode=${index.sourceMode}.`,
      {
        sourceMode: index.sourceMode,
        moduleSourceAvailable: index.moduleSourceIsUsable,
      },
    );
  }
  const lines = sourceLines(sourceModule.code);
  const startLine = parseIntegerParam(url.searchParams, 'startLine', 1, {
    min: 1,
    max: Math.max(1, lines.length),
  });
  const defaultEndLine = Math.min(lines.length, startLine + MAX_SOURCE_EXCERPT_LINES - 1);
  const endLine = parseIntegerParam(url.searchParams, 'endLine', defaultEndLine, {
    min: startLine,
    max: Math.max(startLine, lines.length),
  });
  const requestedLineCount = endLine - startLine + 1;
  if (requestedLineCount > MAX_SOURCE_EXCERPT_LINES) {
    throw apiError(
      400,
      'source_range_too_large',
      `Source excerpts are limited to ${MAX_SOURCE_EXCERPT_LINES} lines.`,
      { maxLines: MAX_SOURCE_EXCERPT_LINES },
    );
  }
  const excerptLines = lines.slice(startLine - 1, endLine)
    .map((text, indexOffset) => ({ line: startLine + indexOffset, text }));
  return {
    module: index.moduleSummary(module),
    startLine,
    endLine,
    lineCount: excerptLines.length,
    maxLines: MAX_SOURCE_EXCERPT_LINES,
    lines: excerptLines,
    text: excerptLines.map((line) => line.text).join('\n'),
  };
}

function functionDependencySemantics(index) {
  return {
    relationSemantics: 'Static function dependency edges record identifier usage syntax inside caller declaration spans. call, optional-call, tagged-template, and jsx-element are syntax observations; reference is not a definite runtime call.',
    limitations: index.functionLimitations,
  };
}

function functionEdgePayload(index, edge, { includeNodes = true, includeLinks = false } = {}) {
  const source = index.functionById.get(edge.sourceId);
  const target = index.functionById.get(edge.targetId);
  const sourceSummary = source ? createFunctionSummary(index, source) : null;
  const targetSummary = target ? createFunctionSummary(index, target) : null;
  const payload = {
    id: edge.id,
    stableId: edge.stableId,
    sourceId: edge.sourceId,
    sourceStableId: source?.stableId || null,
    targetId: edge.targetId,
    targetStableId: target?.stableId || null,
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    usageLines: edge.usageLines,
    usages: edge.usages,
    referenceCount: edge.referenceCount,
    sourceModulePath: edge.sourceModulePath,
    sourceFunction: edge.sourceFunction,
    sourceStartLine: edge.sourceStartLine,
    targetModulePath: edge.targetModulePath,
    targetFunction: edge.targetFunction,
    targetStartLine: edge.targetStartLine,
    ...(edge.import ? { import: edge.import } : {}),
    ...(includeLinks ? {
      sourceLink: sourceSummary ? {
        id: sourceSummary.id,
        stableId: sourceSummary.stableId,
        href: `/api/v1/functions/${sourceSummary.stableId}`,
      } : null,
      targetLink: targetSummary ? {
        id: targetSummary.id,
        stableId: targetSummary.stableId,
        href: `/api/v1/functions/${targetSummary.stableId}`,
      } : null,
    } : {}),
    ...(includeNodes ? { source: sourceSummary, target: targetSummary } : {}),
  };
  return payload;
}

function functionRelationshipIncludes(url) {
  const include = new Set(parseInclude(url, ['nodes', 'links'], ['nodes']));
  return { includeNodes: include.has('nodes'), includeLinks: include.has('links') };
}

function functionDetail(index, node, url) {
  const includes = functionRelationshipIncludes(url);
  return {
    function: createFunctionSummary(index, node),
    staticAnalysis: functionDependencySemantics(index),
    placement: functionPlacementPayload(index, node).placement,
    dependencies: (index.dependenciesByFunctionId.get(node.id) || [])
      .map((edge) => functionEdgePayload(index, edge, includes)),
    users: (index.usersByFunctionId.get(node.id) || [])
      .map((edge) => functionEdgePayload(index, edge, includes)),
  };
}

function functionPlacementPayload(index, node) {
  return {
    function: createFunctionSummary(index, node),
    staticAnalysis: {
      ...functionDependencySemantics(index),
      placement: 'Placement review is a deterministic summary of saved lexical evidence. It helps prioritize human review; it does not prove runtime ownership, execution, or dead code.',
    },
    placement: node.placement || null,
  };
}

function functionDependenciesPayload(index, node, url) {
  const includes = functionRelationshipIncludes(url);
  return {
    function: createFunctionSummary(index, node),
    staticAnalysis: functionDependencySemantics(index),
    dependencies: (index.dependenciesByFunctionId.get(node.id) || [])
      .map((edge) => functionEdgePayload(index, edge, includes)),
  };
}

function functionUsersPayload(index, node, url) {
  const includes = functionRelationshipIncludes(url);
  return {
    function: createFunctionSummary(index, node),
    staticAnalysis: functionDependencySemantics(index),
    users: (index.usersByFunctionId.get(node.id) || [])
      .map((edge) => functionEdgePayload(index, edge, includes)),
  };
}

function moduleFunctionDetailMode(url) {
  const detail = lowerSearch(url.searchParams.get('detail')) || 'full';
  if (detail !== 'full' && detail !== 'summary') {
    throw apiError(400, 'invalid_query', 'detail must be full or summary.');
  }
  return detail;
}

function filteredFunctionNodes(index, url, { requireSearch = false, modulePath } = {}) {
  const search = lowerSearch(url.searchParams.get('search') || url.searchParams.get('q'));
  if (requireSearch && !search) throw apiError(400, 'missing_query', 'Provide q or search.');
  const exactName = normalizeString(url.searchParams.get('name')).trim();
  const kind = lowerSearch(url.searchParams.get('kind'));
  const component = parseBoolean(url.searchParams.get('component'), 'component');
  const reachable = parseBoolean(url.searchParams.get('reachable'), 'reachable');
  const exported = parseBoolean(url.searchParams.get('exported'), 'exported');
  const standalone = parseBoolean(url.searchParams.get('standalone'), 'standalone');
  const userCount = parseExactCountParam(url.searchParams, 'userCount');
  const dependencyCount = parseExactCountParam(url.searchParams, 'dependencyCount');
  const explicitModulePath = modulePath || normalizeString(url.searchParams.get('modulePath')).trim();
  const moduleFilter = explicitModulePath ? getModuleByPath(index, explicitModulePath).path : '';
  const filtered = index.functions
    .filter((node) => !moduleFilter || node.modulePath === moduleFilter)
    .filter((node) => !exactName || node.name === exactName)
    .filter((node) => !search || [
      node.name,
      node.declarationName,
      node.modulePath,
    ].some((value) => lowerSearch(value).includes(search)))
    .filter((node) => !kind || lowerSearch(node.kind) === kind)
    .filter((node) => component == null || node.component === component)
    .filter((node) => reachable == null || node.reachable === reachable)
    .filter((node) => exported == null || node.exported === exported)
    .filter((node) => standalone == null || node.standalone === standalone)
    .filter((node) => userCount == null || (index.usersByFunctionId.get(node.id) || []).length === userCount)
    .filter((node) => (
      dependencyCount == null || (index.dependenciesByFunctionId.get(node.id) || []).length === dependencyCount
    ));
  return sortRecords(filtered, url, {
    allowed: ['name', 'modulePath', 'lineCount', 'userCount', 'dependencyCount'],
    valueFor: (node, sort) => ({
      name: node.name,
      modulePath: node.modulePath,
      lineCount: node.lineCount || 0,
      userCount: (index.usersByFunctionId.get(node.id) || []).length,
      dependencyCount: (index.dependenciesByFunctionId.get(node.id) || []).length,
    })[sort],
    tieBreaker: compareFunctionNode,
  });
}

function moduleFunctionsPayload(index, module, url) {
  const detail = moduleFunctionDetailMode(url);
  const page = optionallyPaginated(filteredFunctionNodes(index, url, { modulePath: module.path }), url);
  const functions = page.items.map((node) => (
    detail === 'summary' ? createFunctionSummary(index, node) : functionDetail(index, node, new URL(url.href))
  ));
  if (url.searchParams.has('fields') && detail !== 'summary') {
    throw apiError(400, 'invalid_query', 'fields requires detail=summary on module function lists.');
  }
  return {
    module: index.moduleSummary(module),
    staticAnalysis: functionDependencySemantics(index),
    detail,
    functions: detail === 'summary'
      ? projectSummaryItems(functions, url, FUNCTION_SUMMARY_FIELDS)
      : functions,
    pagination: page.pagination,
  };
}

function getFunctionById(index, id) {
  const normalizedId = normalizeString(id).trim();
  const node = index.functionById.get(normalizedId) || index.functionByStableId.get(normalizedId);
  if (!node) throw apiError(404, 'function_not_found', 'No saved function declaration exists for that id.');
  return node;
}

function functionList(index, url, { requireSearch = false, modulePath } = {}) {
  const items = filteredFunctionNodes(index, url, { requireSearch, modulePath })
    .map((node) => createFunctionSummary(index, node));
  return {
    ...paginated(projectSummaryItems(items, url, FUNCTION_SUMMARY_FIELDS), url),
    staticAnalysis: functionDependencySemantics(index),
  };
}

function filteredSymbols(index, url, { requireSearch = false, modulePath } = {}) {
  const search = lowerSearch(url.searchParams.get('search') || url.searchParams.get('q'));
  if (requireSearch && !search) throw apiError(400, 'missing_query', 'Provide q or search.');
  const exactName = normalizeString(url.searchParams.get('name')).trim();
  const kind = lowerSearch(url.searchParams.get('kind'));
  const sourceOrigin = lowerSearch(url.searchParams.get('sourceOrigin'));
  const referenceCount = parseExactCountParam(url.searchParams, 'referenceCount');
  const explicitModulePath = modulePath || normalizeString(url.searchParams.get('modulePath')).trim();
  const moduleFilter = explicitModulePath ? getModuleByPath(index, explicitModulePath).path : '';
  return index.symbols
    .filter((symbol) => !moduleFilter || symbol.modulePath === moduleFilter)
    .filter((symbol) => !exactName || symbol.name === exactName)
    .filter((symbol) => !search || [
      symbol.name,
      symbol.declarationName,
      symbol.modulePath,
      symbol.sourceOrigin,
    ].some((value) => lowerSearch(value).includes(search)))
    .filter((symbol) => !kind || lowerSearch(symbol.kind) === kind)
    .filter((symbol) => !sourceOrigin || lowerSearch(symbol.sourceOrigin) === sourceOrigin)
    .filter((symbol) => referenceCount == null || symbol.referenceCount === referenceCount);
}

function symbolList(index, url, { requireSearch = false, modulePath } = {}) {
  const items = filteredSymbols(index, url, { requireSearch, modulePath })
    .map(createSymbolSummary);
  return paginated(projectSummaryItems(items, url, SYMBOL_SUMMARY_FIELDS), url);
}

function getSymbolById(index, id) {
  const normalizedId = normalizeString(id).trim();
  const symbol = index.symbolById.get(normalizedId) || index.symbolByStableId.get(normalizedId);
  if (!symbol) throw apiError(404, 'symbol_not_found', 'No saved source symbol exists for that id.');
  return symbol;
}

function symbolDetail(symbol) {
  return {
    symbol: createSymbolSummary(symbol),
    source: {
      modulePath: symbol.modulePath,
      startLine: symbol.startLine,
      endLine: symbol.endLine,
      code: symbol.code,
    },
  };
}

function symbolReferences(symbol) {
  return {
    symbol: createSymbolSummary(symbol),
    relationSemantics: 'Static import/export/reference relationships captured by IronGlancer; this is not a runtime call graph or data lineage.',
    referenceCount: symbol.referenceCount,
    sameFileReferenceCount: symbol.sameFileReferenceCount,
    incomingReferenceCount: symbol.incomingReferenceCount,
    directIdentifierReferenceCount: symbol.directIdentifierReferenceCount,
    importerFileCount: symbol.importerFileCount,
    importedBy: symbol.importedBy,
    importedFunctionUses: symbol.importedFunctionUses,
  };
}

function graphBounds(url, { blast = false } = {}) {
  return {
    maxDepth: parseIntegerParam(url.searchParams, 'maxDepth', DEFAULT_GRAPH_DEPTH, {
      min: 0,
      max: MAX_GRAPH_DEPTH,
    }),
    maxVisited: MAX_GRAPH_VISITED,
    ...(blast ? {
      limit: parseIntegerParam(url.searchParams, 'limit', DEFAULT_BLAST_LIMIT, {
        min: 1,
        max: MAX_BLAST_LIMIT,
      }),
    } : {}),
  };
}

function uniqueNeighborEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (!entry?.id || seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function boundedShortestPath(sourceId, targetId, bounds, neighborsFor) {
  if (sourceId === targetId) {
    return {
      found: true,
      ids: [sourceId],
      edges: [],
      visitedCount: 1,
      truncated: false,
      truncationReasons: [],
    };
  }
  const queue = [{ id: sourceId, depth: 0 }];
  const visited = new Set([sourceId]);
  const parentById = new Map();
  const edgeById = new Map();
  const truncationReasons = new Set();
  let found = false;
  for (let position = 0; position < queue.length && !found; position += 1) {
    const current = queue[position];
    const neighbors = uniqueNeighborEntries(neighborsFor(current.id));
    if (current.depth >= bounds.maxDepth) {
      if (neighbors.some((entry) => !visited.has(entry.id))) truncationReasons.add('maxDepth');
      continue;
    }
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.id)) continue;
      if (visited.size >= bounds.maxVisited) {
        truncationReasons.add('maxVisited');
        break;
      }
      visited.add(neighbor.id);
      parentById.set(neighbor.id, current.id);
      edgeById.set(neighbor.id, neighbor.edge);
      queue.push({ id: neighbor.id, depth: current.depth + 1 });
      if (neighbor.id === targetId) {
        found = true;
        break;
      }
    }
  }
  const ids = [];
  const edges = [];
  if (found) {
    let cursor = targetId;
    while (cursor) {
      ids.push(cursor);
      if (cursor === sourceId) break;
      edges.push(edgeById.get(cursor));
      cursor = parentById.get(cursor);
    }
    ids.reverse();
    edges.reverse();
  }
  return {
    found,
    ids,
    edges,
    visitedCount: visited.size,
    truncated: truncationReasons.size > 0,
    truncationReasons: Array.from(truncationReasons).sort(compareLocale),
  };
}

function boundedBlastRadius(sourceId, bounds, neighborsFor) {
  const queue = [{ id: sourceId, depth: 0 }];
  const visited = new Set([sourceId]);
  const results = [];
  const truncationReasons = new Set();
  for (let position = 0; position < queue.length; position += 1) {
    const current = queue[position];
    const neighbors = uniqueNeighborEntries(neighborsFor(current.id));
    if (current.depth >= bounds.maxDepth) {
      if (neighbors.some((entry) => !visited.has(entry.id))) truncationReasons.add('maxDepth');
      continue;
    }
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.id)) continue;
      if (visited.size >= bounds.maxVisited) {
        truncationReasons.add('maxVisited');
        continue;
      }
      if (results.length >= bounds.limit) {
        truncationReasons.add('limit');
        continue;
      }
      const depth = current.depth + 1;
      visited.add(neighbor.id);
      results.push({ id: neighbor.id, depth });
      queue.push({ id: neighbor.id, depth });
    }
  }
  return {
    results,
    visitedCount: visited.size,
    truncated: truncationReasons.size > 0,
    truncationReasons: Array.from(truncationReasons).sort(compareLocale),
  };
}

function moduleGraphEdge(index, sourcePath, targetPath) {
  const source = index.moduleByPath.get(sourcePath);
  const target = index.moduleByPath.get(targetPath);
  return {
    sourceId: source.id,
    sourceStableId: source.stableId,
    targetId: target.id,
    targetStableId: target.stableId,
    sourceLink: { href: `/api/v1/modules/${encodeURIComponent(source.stableId)}` },
    targetLink: { href: `/api/v1/modules/${encodeURIComponent(target.stableId)}` },
  };
}

function moduleDependencyNeighbors(index, modulePath) {
  const module = index.moduleByPath.get(modulePath);
  return module.localDependencies.map((targetPath) => ({
    id: targetPath,
    edge: moduleGraphEdge(index, modulePath, targetPath),
  }));
}

function moduleDependentNeighbors(index, modulePath) {
  const module = index.moduleByPath.get(modulePath);
  return module.dependents.map((dependentPath) => ({
    id: dependentPath,
    edge: moduleGraphEdge(index, dependentPath, modulePath),
  }));
}

function moduleShortestPathPayload(index, source, url) {
  const targetId = normalizeString(url.searchParams.get('targetId')).trim();
  if (!targetId) throw apiError(400, 'missing_query', 'Provide targetId.');
  const target = getModuleById(index, targetId);
  const bounds = graphBounds(url);
  const result = boundedShortestPath(
    source.path,
    target.path,
    bounds,
    (modulePath) => moduleDependencyNeighbors(index, modulePath),
  );
  return {
    source: index.moduleSummary(source),
    target: index.moduleSummary(target),
    direction: 'dependencies',
    found: result.found,
    distance: result.found ? result.ids.length - 1 : null,
    nodes: result.ids.map((modulePath) => index.moduleSummary(index.moduleByPath.get(modulePath))),
    edges: result.edges,
    bounds,
    visitedCount: result.visitedCount,
    truncated: result.truncated,
    truncationReasons: result.truncationReasons,
  };
}

function moduleBlastRadiusPayload(index, source, url) {
  const bounds = graphBounds(url, { blast: true });
  const result = boundedBlastRadius(
    source.path,
    bounds,
    (modulePath) => moduleDependentNeighbors(index, modulePath),
  );
  const records = result.results.map(({ id, depth }) => ({
    depth,
    node: index.moduleSummary(index.moduleByPath.get(id)),
  }));
  return {
    source: index.moduleSummary(source),
    direction: 'dependents',
    direct: records.filter((record) => record.depth === 1).map((record) => record.node),
    transitive: records.filter((record) => record.depth > 1).map((record) => record.node),
    items: records,
    bounds,
    visitedCount: result.visitedCount,
    truncated: result.truncated,
    truncationReasons: result.truncationReasons,
  };
}

function functionDependencyNeighbors(index, functionId) {
  return (index.dependenciesByFunctionId.get(functionId) || []).map((edge) => ({
    id: edge.targetId,
    edge,
  }));
}

function functionUserNeighbors(index, functionId) {
  return (index.usersByFunctionId.get(functionId) || []).map((edge) => ({
    id: edge.sourceId,
    edge,
  }));
}

function functionShortestPathPayload(index, source, url) {
  const targetId = normalizeString(url.searchParams.get('targetId')).trim();
  if (!targetId) throw apiError(400, 'missing_query', 'Provide targetId.');
  const target = getFunctionById(index, targetId);
  const bounds = graphBounds(url);
  const result = boundedShortestPath(
    source.id,
    target.id,
    bounds,
    (functionId) => functionDependencyNeighbors(index, functionId),
  );
  return {
    source: createFunctionSummary(index, source),
    target: createFunctionSummary(index, target),
    direction: 'dependencies',
    found: result.found,
    distance: result.found ? result.ids.length - 1 : null,
    nodes: result.ids.map((functionId) => createFunctionSummary(index, index.functionById.get(functionId))),
    edges: result.edges.map((edge) => functionEdgePayload(index, edge, { includeNodes: false, includeLinks: true })),
    bounds,
    visitedCount: result.visitedCount,
    truncated: result.truncated,
    truncationReasons: result.truncationReasons,
    staticAnalysis: functionDependencySemantics(index),
  };
}

function functionBlastRadiusPayload(index, source, url) {
  const bounds = graphBounds(url, { blast: true });
  const result = boundedBlastRadius(
    source.id,
    bounds,
    (functionId) => functionUserNeighbors(index, functionId),
  );
  const records = result.results.map(({ id, depth }) => ({
    depth,
    node: createFunctionSummary(index, index.functionById.get(id)),
  }));
  return {
    source: createFunctionSummary(index, source),
    direction: 'users',
    direct: records.filter((record) => record.depth === 1).map((record) => record.node),
    transitive: records.filter((record) => record.depth > 1).map((record) => record.node),
    items: records,
    bounds,
    visitedCount: result.visitedCount,
    truncated: result.truncated,
    truncationReasons: result.truncationReasons,
    staticAnalysis: functionDependencySemantics(index),
  };
}

function importList(index, url) {
  const sourcePathParam = normalizeString(url.searchParams.get('sourcePath')).trim();
  const targetPathParam = normalizeString(url.searchParams.get('targetPath')).trim();
  const specifier = normalizeString(url.searchParams.get('specifier')).trim();
  const sourcePath = sourcePathParam ? getModuleByPath(index, sourcePathParam).path : '';
  const targetPath = targetPathParam ? getModuleByPath(index, targetPathParam).path : '';
  const resolution = lowerSearch(url.searchParams.get('resolution'));
  const allowedResolutions = ['local', 'asset', 'external', 'remote', 'browser-incompatible', 'unresolved', 'unknown'];
  if (resolution && !allowedResolutions.includes(resolution)) {
    throw apiError(400, 'invalid_query', `resolution must be one of: ${allowedResolutions.join(', ')}.`);
  }
  const loadKind = lowerSearch(url.searchParams.get('loadKind'));
  const dynamic = parseBoolean(url.searchParams.get('dynamic'), 'dynamic');
  const sourceReachable = parseBoolean(url.searchParams.get('sourceReachable'), 'sourceReachable');
  const filtered = index.imports
    .filter((item) => !sourcePath || item.sourcePath === sourcePath)
    .filter((item) => !targetPath || item.targetPath === targetPath)
    .filter((item) => !specifier || item.specifier === specifier)
    .filter((item) => !resolution || item.resolution === resolution)
    .filter((item) => !loadKind || lowerSearch(item.loadKind) === loadKind)
    .filter((item) => dynamic == null || item.dynamic === dynamic)
    .filter((item) => sourceReachable == null || item.sourceReachable === sourceReachable);
  const sorted = sortRecords(filtered, url, {
    allowed: ['sourcePath', 'targetPath', 'specifier', 'loadKind', 'resolution'],
    valueFor: (item, sort) => item[sort] || '',
    tieBreaker: (a, b) => compareLocale(a.sourcePath, b.sourcePath)
      || compareLocale(a.specifier, b.specifier)
      || compareLocale(a.loadKind, b.loadKind),
  });
  const projected = projectSummaryItems(sorted, url, IMPORT_SUMMARY_FIELDS);
  return {
    ...paginated(projected, url),
    semantics: {
      resolution: 'local identifies an indexed browser module, asset identifies a browser asset, remote identifies a URL import, browser-incompatible identifies a Node builtin import, external identifies a bare package specifier, unresolved identifies a local-looking specifier that did not resolve, and unknown is retained for legacy artifacts without classification.',
      dynamic: 'dynamic includes saved dynamic import, React.lazy, and module worker evidence; it does not imply runtime execution.',
    },
  };
}

function parseUnifiedSearchTypes(url) {
  const types = parseSelectorList(url, 'types', ['module', 'function', 'symbol']);
  const invalid = types.filter((type) => !UNIFIED_SEARCH_TYPES.includes(type)).sort(compareLocale);
  if (invalid.length > 0) {
    throw apiError(400, 'invalid_query', `Unknown search types: ${invalid.join(', ')}.`, {
      invalid,
      allowed: UNIFIED_SEARCH_TYPES,
    });
  }
  return types;
}

function enclosingFunctionAtLine(index, modulePath, line) {
  return (index.functionsByModulePath.get(modulePath) || [])
    .filter((node) => node.startLine <= line && node.endLine >= line)
    .sort((a, b) => (a.lineCount || Number.MAX_SAFE_INTEGER) - (b.lineCount || Number.MAX_SAFE_INTEGER)
      || b.startLine - a.startLine
      || compareFunctionNode(a, b))[0] || null;
}

function isJsxTextAt(sourceModule, sourceIndex) {
  return sourceModule.jsxTextMask?.[sourceIndex] === 1;
}

function exactOccurrences(index, query, modulePath) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(query)) {
    throw apiError(400, 'invalid_query', 'Occurrence search requires an exact JavaScript identifier.');
  }
  const items = [];
  const identifierPart = /[A-Za-z0-9_$]/;
  const sourceModules = Array.from(index.sourceModuleByPath.values())
    .filter((item) => !modulePath || item.path === modulePath);
  if (sourceModules.length === 0) {
    throw apiError(
      404,
      'source_not_available',
      `Occurrence search requires saved module source, but sourceMode=${index.sourceMode}.`,
      {
        sourceMode: index.sourceMode,
        moduleSourceAvailable: index.moduleSourceIsUsable,
      },
    );
  }
  const scanCharacters = sourceModules.reduce((total, item) => total + item.code.length, 0);
  if (scanCharacters > MAX_OCCURRENCE_SCAN_CHARACTERS) {
    throw apiError(413, 'occurrence_search_too_large', 'Occurrence search exceeds the saved-source scan limit.', {
      maxCharacters: MAX_OCCURRENCE_SCAN_CHARACTERS,
      scannedCharacters: scanCharacters,
      suggestion: 'Provide modulePath to narrow the search.',
    });
  }
  for (const sourceModule of sourceModules) {
    const lines = sourceLines(sourceModule.maskedCode);
    const lineOffsets = sourceLineOffsets(sourceModule.maskedCode);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const lineText = lines[lineIndex];
      let fromIndex = 0;
      while (fromIndex <= lineText.length - query.length) {
        const columnIndex = lineText.indexOf(query, fromIndex);
        if (columnIndex === -1) break;
        fromIndex = columnIndex + Math.max(1, query.length);
        const before = columnIndex > 0 ? lineText[columnIndex - 1] : '';
        const after = lineText[columnIndex + query.length] || '';
        if ((before && identifierPart.test(before)) || (after && identifierPart.test(after))) continue;
        const line = lineIndex + 1;
        const column = columnIndex + 1;
        const owner = enclosingFunctionAtLine(index, sourceModule.path, line);
        const isDeclaration = (index.functionsByModulePath.get(sourceModule.path) || []).some((node) => (
          node.name === query
          && node.declarationLine === line
          && node.declarationColumn === column
        ));
        const role = isDeclaration
          ? 'declaration'
          : isJsxTextAt(sourceModule, lineOffsets[lineIndex] + columnIndex) ? 'jsx-text' : 'reference';
        items.push({
          type: 'occurrence',
          name: query,
          modulePath: sourceModule.path,
          line,
          column,
          endColumn: columnIndex + query.length + 1,
          role,
          enclosingFunction: owner ? createFunctionSummary(index, owner) : null,
        });
        if (items.length > MAX_OCCURRENCE_MATCHES) {
          throw apiError(413, 'occurrence_search_too_large', 'Occurrence search exceeds the match limit.', {
            maxMatches: MAX_OCCURRENCE_MATCHES,
            suggestion: 'Provide modulePath to narrow the search.',
          });
        }
      }
    }
  }
  return items;
}

function unifiedSearch(index, url) {
  const query = normalizeString(url.searchParams.get('q')).trim();
  if (!query) throw apiError(400, 'missing_query', 'Provide q.');
  const match = lowerSearch(url.searchParams.get('match')) || 'substring';
  if (!['exact', 'substring'].includes(match)) {
    throw apiError(400, 'invalid_query', 'match must be exact or substring.');
  }
  const types = parseUnifiedSearchTypes(url);
  if (types.includes('occurrence') && match !== 'exact') {
    throw apiError(400, 'invalid_query', 'Occurrence search requires match=exact.');
  }
  const requestedModulePath = normalizeString(url.searchParams.get('modulePath')).trim();
  const modulePath = requestedModulePath ? getModuleByPath(index, requestedModulePath).path : '';
  const normalizedQuery = lowerSearch(query);
  const matches = (value, { pathMatch = false } = {}) => (
    match === 'exact'
      ? normalizeString(value) === query
      : lowerSearch(value).includes(normalizedQuery)
  ) && (!pathMatch || !modulePath || normalizeString(value) === modulePath);
  const items = [];
  if (types.includes('module')) {
    for (const module of index.modules) {
      if ((!modulePath || module.path === modulePath) && matches(module.path)) {
        items.push({ type: 'module', module: index.moduleSummary(module) });
      }
    }
  }
  if (types.includes('function')) {
    for (const node of index.functions) {
      if ((!modulePath || node.modulePath === modulePath) && matches(node.name)) {
        items.push({ type: 'function', function: createFunctionSummary(index, node) });
      }
    }
  }
  if (types.includes('symbol')) {
    for (const symbol of index.symbols) {
      if ((!modulePath || symbol.modulePath === modulePath) && matches(symbol.name)) {
        items.push({ type: 'symbol', symbol: createSymbolSummary(symbol) });
      }
    }
  }
  if (types.includes('occurrence')) items.push(...exactOccurrences(index, query, modulePath));
  const typeOrder = new Map(UNIFIED_SEARCH_TYPES.map((type, position) => [type, position]));
  items.sort((a, b) => (typeOrder.get(a.type) - typeOrder.get(b.type))
    || compareLocale(a.module?.path || a.function?.modulePath || a.symbol?.modulePath || a.modulePath || '',
      b.module?.path || b.function?.modulePath || b.symbol?.modulePath || b.modulePath || '')
    || (a.line || a.function?.startLine || a.symbol?.startLine || 0)
      - (b.line || b.function?.startLine || b.symbol?.startLine || 0)
    || compareLocale(a.name || a.function?.name || a.symbol?.name || '', b.name || b.function?.name || b.symbol?.name || ''));
  return {
    query,
    match,
    types,
    ...paginated(items, url),
    semantics: {
      occurrences: 'Exact lexical identifier evidence from saved analyzed source. Comments, literal strings, template text, and regex bodies are masked; template expressions remain searchable. Inline JSX text is labeled jsx-text rather than reference.',
      ownership: 'enclosingFunction is the innermost recognized saved declaration span and does not prove binding identity or runtime execution.',
    },
  };
}

function queryPayload(index, url) {
  const modulePath = normalizeString(url.searchParams.get('modulePath') || url.searchParams.get('path')).trim();
  const symbolQuery = normalizeString(url.searchParams.get('symbol') || url.searchParams.get('q')).trim();
  if (!modulePath && !symbolQuery) {
    throw apiError(400, 'missing_query', 'Provide modulePath, path, symbol, or q.');
  }

  const payload = {};
  if (modulePath) {
    const module = getModuleByPath(index, modulePath);
    payload.module = index.moduleSummary(module);
    payload.dependencies = moduleRelationPayload(index, module);
    payload.dependents = moduleDependentsPayload(index, module);
  }
  if (symbolQuery) {
    const scopedUrl = new URL(url.href);
    scopedUrl.searchParams.set('search', symbolQuery);
    scopedUrl.searchParams.delete('q');
    if (modulePath) scopedUrl.searchParams.set('modulePath', modulePath);
    payload.symbols = symbolList(index, scopedUrl);
  }
  return payload;
}

function rawOutputArray(index, field) {
  return Array.isArray(index.output?.[field]) ? index.output[field] : [];
}

function frontEndEntityList(index, url, field) {
  const search = lowerSearch(url.searchParams.get('search') || url.searchParams.get('q'));
  const modulePath = normalizeString(url.searchParams.get('modulePath')).trim();
  const filtered = rawOutputArray(index, field)
    .filter((item) => !modulePath || item.modulePath === modulePath || item.sourceModulePath === modulePath)
    .filter((item) => !search || JSON.stringify(item).toLowerCase().includes(search))
    .sort((a, b) => compareLocale(a.modulePath || a.sourceModulePath || a.path || '', b.modulePath || b.sourceModulePath || b.path || '')
      || compareLocale(a.name || a.component || a.specifier || a.ruleId || '', b.name || b.component || b.specifier || b.ruleId || '')
      || (a.line || 0) - (b.line || 0));
  return paginated(filtered, url);
}

function handleApiRequest({ request, response, index, outDir }) {
  if (request.method !== 'GET') {
    throw apiError(405, 'method_not_allowed', 'The analysis API is read-only and supports GET requests only.');
  }

  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'api' || parts[1] !== API_VERSION) {
    throw apiError(404, 'not_found', 'API route not found.');
  }
  const resource = parts[2] || '';

  if (!resource) {
    rejectUnknownQueryParams(url, []);
    return sendApiData(response, discovery(index));
  }
  if (resource === 'schema.json' && parts.length === 3) {
    rejectUnknownQueryParams(url, []);
    return sendRawSchema(response, apiSchema(index));
  }
  if (resource === 'schema' && parts.length === 3) {
    rejectUnknownQueryParams(url, []);
    return sendApiData(response, apiSchema(index));
  }
  if (resource === 'run' && parts.length === 3) {
    rejectUnknownQueryParams(url, []);
    return sendApiData(response, runMetadata(index, outDir));
  }
  if (resource === 'imports' && parts.length === 3) {
    rejectUnknownQueryParams(url, IMPORT_LIST_QUERY_PARAMS);
    return sendApiData(response, importList(index, url));
  }
  if (resource === 'components' && parts.length === 3) {
    rejectUnknownQueryParams(url, FRONTEND_ENTITY_QUERY_PARAMS);
    return sendApiData(response, frontEndEntityList(index, url, 'components'));
  }
  if (resource === 'component-edges' && parts.length === 3) {
    rejectUnknownQueryParams(url, FRONTEND_ENTITY_QUERY_PARAMS);
    return sendApiData(response, frontEndEntityList(index, url, 'componentEdges'));
  }
  if (resource === 'routes' && parts.length === 3) {
    rejectUnknownQueryParams(url, FRONTEND_ENTITY_QUERY_PARAMS);
    return sendApiData(response, frontEndEntityList(index, url, 'routes'));
  }
  if (resource === 'lazy-boundaries' && parts.length === 3) {
    rejectUnknownQueryParams(url, FRONTEND_ENTITY_QUERY_PARAMS);
    return sendApiData(response, frontEndEntityList(index, url, 'lazyBoundaries'));
  }
  if (resource === 'assets' && parts.length === 3) {
    rejectUnknownQueryParams(url, FRONTEND_ENTITY_QUERY_PARAMS);
    return sendApiData(response, frontEndEntityList(index, url, 'assets'));
  }
  if (resource === 'browser-apis' && parts.length === 3) {
    rejectUnknownQueryParams(url, FRONTEND_ENTITY_QUERY_PARAMS);
    return sendApiData(response, frontEndEntityList(index, url, 'browserApis'));
  }
  if (resource === 'findings' && parts.length === 3) {
    rejectUnknownQueryParams(url, FRONTEND_ENTITY_QUERY_PARAMS);
    return sendApiData(response, frontEndEntityList(index, url, 'findings'));
  }
  if (resource === 'modules') {
    if (parts.length === 3) {
      rejectUnknownQueryParams(url, MODULE_LIST_QUERY_PARAMS);
      return sendApiData(response, moduleList(index, url));
    }
    const module = getModuleById(index, parts[3]);
    if (parts.length === 4) {
      rejectUnknownQueryParams(url, MODULE_DETAIL_QUERY_PARAMS);
      return sendApiData(response, moduleDetail(index, module, url));
    }
    if (parts.length === 5 && parts[4] === 'dependencies') {
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, moduleRelationPayload(index, module));
    }
    if (parts.length === 5 && parts[4] === 'dependents') {
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, moduleDependentsPayload(index, module));
    }
    if (parts.length === 5 && parts[4] === 'functions') {
      rejectUnknownQueryParams(url, MODULE_FUNCTION_QUERY_PARAMS);
      return sendApiData(response, moduleFunctionsPayload(index, module, url));
    }
    if (parts.length === 5 && parts[4] === 'shortest-path') {
      rejectUnknownQueryParams(url, SHORTEST_PATH_QUERY_PARAMS);
      return sendApiData(response, moduleShortestPathPayload(index, module, url));
    }
    if (parts.length === 5 && parts[4] === 'blast-radius') {
      rejectUnknownQueryParams(url, BLAST_RADIUS_QUERY_PARAMS);
      return sendApiData(response, moduleBlastRadiusPayload(index, module, url));
    }
    if (parts.length === 5 && parts[4] === 'source') {
      rejectUnknownQueryParams(url, SOURCE_QUERY_PARAMS);
      return sendApiData(response, sourceExcerpt(index, module, url));
    }
  }
  if (resource === 'source' && parts.length === 3) {
    rejectUnknownQueryParams(url, SOURCE_BY_PATH_QUERY_PARAMS);
    const module = getModuleByPath(index, url.searchParams.get('path'));
    return sendApiData(response, sourceExcerpt(index, module, url));
  }
  if (resource === 'symbols') {
    if (parts.length === 3) {
      rejectUnknownQueryParams(url, SYMBOL_LIST_QUERY_PARAMS);
      return sendApiData(response, symbolList(index, url));
    }
    if (parts.length === 4 && parts[3] === 'search') {
      rejectUnknownQueryParams(url, SYMBOL_LIST_QUERY_PARAMS);
      return sendApiData(response, symbolList(index, url, { requireSearch: true }));
    }
    const symbol = getSymbolById(index, parts[3]);
    if (parts.length === 4) {
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, symbolDetail(symbol));
    }
    if (parts.length === 5 && (parts[4] === 'references' || parts[4] === 'callers')) {
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, symbolReferences(symbol));
    }
  }
  if (resource === 'functions') {
    if (parts.length === 3) {
      rejectUnknownQueryParams(url, FUNCTION_LIST_QUERY_PARAMS);
      return sendApiData(response, functionList(index, url));
    }
    if (parts.length === 4 && parts[3] === 'search') {
      rejectUnknownQueryParams(url, FUNCTION_LIST_QUERY_PARAMS);
      return sendApiData(response, functionList(index, url, { requireSearch: true }));
    }
    const node = getFunctionById(index, parts[3]);
    if (parts.length === 4) {
      rejectUnknownQueryParams(url, FUNCTION_DETAIL_QUERY_PARAMS);
      return sendApiData(response, functionDetail(index, node, url));
    }
    if (parts.length === 5 && parts[4] === 'dependencies') {
      rejectUnknownQueryParams(url, FUNCTION_DETAIL_QUERY_PARAMS);
      return sendApiData(response, functionDependenciesPayload(index, node, url));
    }
    if (parts.length === 5 && parts[4] === 'users') {
      rejectUnknownQueryParams(url, FUNCTION_DETAIL_QUERY_PARAMS);
      return sendApiData(response, functionUsersPayload(index, node, url));
    }
    if (parts.length === 5 && parts[4] === 'placement') {
      rejectUnknownQueryParams(url, FUNCTION_PLACEMENT_QUERY_PARAMS);
      return sendApiData(response, functionPlacementPayload(index, node));
    }
    if (parts.length === 5 && parts[4] === 'shortest-path') {
      rejectUnknownQueryParams(url, SHORTEST_PATH_QUERY_PARAMS);
      return sendApiData(response, functionShortestPathPayload(index, node, url));
    }
    if (parts.length === 5 && parts[4] === 'blast-radius') {
      rejectUnknownQueryParams(url, BLAST_RADIUS_QUERY_PARAMS);
      return sendApiData(response, functionBlastRadiusPayload(index, node, url));
    }
  }
  if (resource === 'search' && parts.length === 3) {
    rejectUnknownQueryParams(url, UNIFIED_SEARCH_QUERY_PARAMS);
    return sendApiData(response, unifiedSearch(index, url));
  }
  if (resource === 'query' && parts.length === 3) {
    rejectUnknownQueryParams(url, QUERY_AGGREGATE_PARAMS);
    return sendApiData(response, queryPayload(index, url));
  }

  throw apiError(404, 'not_found', 'API route not found.');
}

function contentTypeForPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mmd': 'text/plain; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
  }[ext] || 'application/octet-stream';
}

function decodedStaticPathname(rawUrl) {
  const rawPathname = normalizeString(rawUrl || '/').split(/[?#]/, 1)[0] || '/';
  try {
    return decodeURIComponent(rawPathname);
  } catch {
    return null;
  }
}

function safeStaticFilePath(outDir, rawUrl) {
  const pathname = decodedStaticPathname(rawUrl);
  if (!pathname || pathname.includes('\0')) return null;
  const normalizedPathname = toPosixPath(pathname);
  if (normalizedPathname.split('/').some((part) => part === '..' || part === API_DATA_DIR)) return null;
  const relativePath = normalizedPathname === '/'
    ? 'index.html'
    : normalizedPathname.replace(/^\/+/, '');
  const resolved = path.resolve(outDir, relativePath);
  return isWithinPath(outDir, resolved) ? resolved : null;
}

async function resolveStaticFile(outDir, rawUrl) {
  let filePath = safeStaticFilePath(outDir, rawUrl);
  if (!filePath) return null;

  try {
    const firstStat = await fs.stat(filePath);
    if (firstStat.isDirectory()) filePath = path.join(filePath, 'index.html');

    const [realOutDir, realFilePath] = await Promise.all([
      fs.realpath(outDir),
      fs.realpath(filePath),
    ]);
    if (!isWithinPath(realOutDir, realFilePath)) return null;

    const stat = await fs.stat(realFilePath);
    if (!stat.isFile()) return null;
    return { filePath: realFilePath, stat };
  } catch {
    return null;
  }
}

async function serveStaticFile({ request, response, outDir }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed.\n');
    return;
  }

  const staticFile = await resolveStaticFile(outDir, request.url);
  if (!staticFile) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found.\n');
    return;
  }

  try {
    const headers = {
      'content-type': contentTypeForPath(staticFile.filePath),
      'content-length': staticFile.stat.size,
      'cache-control': 'no-store',
    };
    response.writeHead(200, headers);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    response.end(await fs.readFile(staticFile.filePath));
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found.\n');
  }
}

function hostForUrl(host) {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

function isLoopbackHost(host) {
  const normalized = normalizeString(host).trim().toLowerCase();
  return normalized === 'localhost'
    || normalized === '127.0.0.1'
    || normalized.startsWith('127.')
    || normalized === '::1'
    || normalized === '[::1]';
}

export async function startStaticAnalysisServer({
  outDir,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
} = {}) {
  const resolvedHost = normalizeString(host).trim() || DEFAULT_HOST;
  if (!isLoopbackHost(resolvedHost)) {
    throw new Error('IronGlancer serve mode is loopback-only; use 127.0.0.1 or localhost.');
  }
  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
    throw new Error('port must be an integer between 0 and 65535.');
  }

  const handler = await createStaticAnalysisRequestHandler({ outDir });
  const server = http.createServer(handler);

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(parsedPort, resolvedHost, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const resolvedPort = typeof address === 'object' && address ? address.port : parsedPort;
  const resolvedAddress = typeof address === 'object' && address?.address ? address.address : resolvedHost;
  const urlHost = hostForUrl(resolvedAddress === '::' ? 'localhost' : resolvedAddress);
  const url = `http://${urlHost}:${resolvedPort}/`;

  return {
    server,
    outDir: handler.outDir,
    host: resolvedHost,
    port: resolvedPort,
    url,
    apiBaseUrl: `${url}api/v1`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}
