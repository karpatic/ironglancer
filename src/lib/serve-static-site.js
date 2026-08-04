import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { compareLocale, isWithinPath, normalizeString, toPosixPath } from './utils.js';

const API_VERSION = 'v1';
const DEFAULT_SCHEMA_VERSION = '1.0.0';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 200;
const MAX_SOURCE_EXCERPT_LINES = 80;
const API_DATA_DIR = '.ironglancer-api';
const PAGINATION_QUERY_PARAMS = ['limit', 'offset'];
const MODULE_LIST_QUERY_PARAMS = ['search', 'q', 'extension', 'reachable', 'jsx', ...PAGINATION_QUERY_PARAMS];
const SOURCE_QUERY_PARAMS = ['startLine', 'endLine'];
const SOURCE_BY_PATH_QUERY_PARAMS = ['path', ...SOURCE_QUERY_PARAMS];
const FUNCTION_LIST_QUERY_PARAMS = [
  'search',
  'q',
  'modulePath',
  'name',
  'kind',
  'component',
  'userCount',
  'dependencyCount',
  ...PAGINATION_QUERY_PARAMS,
];
const MODULE_FUNCTION_QUERY_PARAMS = [
  'detail',
  'search',
  'q',
  'name',
  'kind',
  'component',
  'userCount',
  'dependencyCount',
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
  ...PAGINATION_QUERY_PARAMS,
];
const QUERY_AGGREGATE_PARAMS = ['modulePath', 'path', 'symbol', 'q', ...PAGINATION_QUERY_PARAMS];
const FUNCTION_DEPENDENCY_LIMITATIONS = [
  'Static function dependencies are based on identifier references inside saved declaration spans; IronGlancer does not execute code or prove runtime control flow.',
  'Usage syntax is labeled as call, optional-call, tagged-template, jsx-element, or reference from nearby source syntax; reference entries are not claimed to be definite runtime calls.',
  'Imported targets are limited to statically resolved local imports, dynamic imports, require calls, exact supported Faculty browser import wrappers, and supported lazy-module patterns with resolvable bindings.',
  'Same-module targets are limited to named function declarations and named arrow-function variable declarations discovered in the same file; dynamic property dispatch, aliasing through arbitrary values, and unresolved re-exports are outside this map.',
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

function jsonPayload(response, status, payload) {
  const body = JSON.stringify(payload, null, 2) + '\n';
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(body);
}

function sendApiData(response, data, status = 200) {
  jsonPayload(response, status, { ok: true, data });
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

async function readJsonFile(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function encodedId(value) {
  return Buffer.from(normalizeString(value), 'utf8').toString('base64url');
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
      importRefs: Array.isArray(module.importRefs) ? module.importRefs : [],
    }))
    .filter((module) => module.path)
    .sort((a, b) => compareLocale(a.path, b.path));
}

function normalizeSourceModules(sourcePayload = {}) {
  return (Array.isArray(sourcePayload.modules) ? sourcePayload.modules : [])
    .map((module) => ({
      path: normalizeString(module.path).trim(),
      lineCount: Number.isInteger(module.lineCount) ? module.lineCount : sourceLines(module.code).length,
      maxLineLength: Number.isInteger(module.maxLineLength) ? module.maxLineLength : 0,
      code: normalizeString(module.code),
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

function normalizeFunctionNode(node = {}) {
  const normalized = {
    id: normalizeString(node.id).trim(),
    modulePath: normalizeString(node.modulePath).trim(),
    name: normalizeString(node.name).trim(),
    declarationName: normalizeString(node.declarationName || node.name).trim(),
    kind: normalizeString(node.kind || 'function').trim() || 'function',
    component: Boolean(node.component),
    startLine: Number.isInteger(node.startLine) ? node.startLine : null,
    endLine: Number.isInteger(node.endLine) ? node.endLine : null,
    lineCount: Number.isInteger(node.lineCount) ? node.lineCount : null,
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
  return {
    id: node.id,
    moduleId: moduleIdForPath(node.modulePath),
    modulePath: node.modulePath,
    name: node.name,
    declarationName: node.declarationName,
    kind: node.kind,
    component: node.component,
    startLine: node.startLine,
    endLine: node.endLine,
    lineCount: node.lineCount,
    dependencyCount: (index.dependenciesByFunctionId.get(node.id) || []).length,
    userCount: (index.usersByFunctionId.get(node.id) || []).length,
    sourceAvailable: index.sourceModuleByPath.has(node.modulePath),
  };
}

function createAnalysisIndex(outputPayload, sourcePayload, moduleSourcePayload, functionMapPayload = {}) {
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
  for (const payload of modulePayloads) {
    const module = {
      ...payload,
      id: moduleIdForPath(payload.path),
      extension: extensionForPath(payload.path),
      dependents: [],
    };
    moduleByPath.set(module.path, module);
    moduleById.set(module.id, module);
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

  const symbols = declarations
    .map((declaration) => ({ ...declaration, id: symbolIdForDeclaration(declaration) }))
    .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
      || a.startLine - b.startLine
      || compareLocale(a.name, b.name));
  const symbolById = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  const symbolsByModulePath = new Map();
  for (const symbol of symbols) {
    if (!symbolsByModulePath.has(symbol.modulePath)) symbolsByModulePath.set(symbol.modulePath, []);
    symbolsByModulePath.get(symbol.modulePath).push(symbol);
  }

  const functions = functionMapIsUsable
    ? (Array.isArray(functionMapPayload.functions) ? functionMapPayload.functions : [])
      .map(normalizeFunctionNode)
      .filter((node) => node.id && node.modulePath && node.name && moduleByPath.has(node.modulePath))
      .sort(compareFunctionNode)
    : [];
  const functionById = new Map();
  const functionsByModulePath = new Map();
  for (const node of functions) {
    if (functionById.has(node.id)) continue;
    functionById.set(node.id, node);
    if (!functionsByModulePath.has(node.modulePath)) functionsByModulePath.set(node.modulePath, []);
    functionsByModulePath.get(node.modulePath).push(node);
  }

  const functionEdges = functionMapIsUsable
    ? (Array.isArray(functionMapPayload.edges) ? functionMapPayload.edges : [])
      .map(normalizeFunctionEdge)
      .filter((edge) => edge.id && functionById.has(edge.sourceId) && functionById.has(edge.targetId))
      .sort(compareFunctionEdge)
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
    sourceModuleByPath,
    symbols,
    symbolById,
    symbolsByModulePath,
    functions,
    functionById,
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

export async function createStaticAnalysisRequestHandler({ outDir } = {}) {
  const { outDir: resolvedOutDir, index } = await loadStaticAnalysisRun({ outDir });
  const handler = async (request, response) => {
    try {
      const pathname = decodedStaticPathname(request.url);
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
    { method: 'GET', path: '/api/v1/run', description: 'Return immutable run, package, schema, source, and summary metadata.' },
    { method: 'GET', path: '/api/v1/modules', description: 'List analyzed modules with search, extension, reachability, limit, and offset filters.' },
    { method: 'GET', path: '/api/v1/modules/:id', description: 'Return one analyzed module with dependencies, dependents, imports, and symbols.' },
    { method: 'GET', path: '/api/v1/modules/:id/dependencies', description: 'Return local and external dependencies for one analyzed module.' },
    { method: 'GET', path: '/api/v1/modules/:id/dependents', description: 'Return modules that import one analyzed module.' },
    { method: 'GET', path: '/api/v1/modules/:id/functions', description: 'Return functions declared in one module with detail, exact/count filters, limit, and offset controls.' },
    { method: 'GET', path: '/api/v1/modules/:id/source', description: 'Return a bounded source excerpt from saved analyzed module source.' },
    { method: 'GET', path: '/api/v1/source', description: 'Return a bounded source excerpt by exact analyzed module path.' },
    { method: 'GET', path: '/api/v1/symbols', description: 'List saved source symbols with search, exact name, modulePath, kind, sourceOrigin, referenceCount, limit, and offset filters.' },
    { method: 'GET', path: '/api/v1/symbols/search', description: 'Search saved source symbols using q or search.' },
    { method: 'GET', path: '/api/v1/symbols/:id', description: 'Return one saved source symbol and its declaration source snippet.' },
    { method: 'GET', path: '/api/v1/symbols/:id/references', description: 'Return captured static reference/importer relationships for one symbol.' },
    { method: 'GET', path: '/api/v1/symbols/:id/callers', description: 'Alias for static importer relationships; this is not a runtime call graph.' },
    { method: 'GET', path: '/api/v1/functions', description: 'List saved function declarations with search, exact name, modulePath, kind, component, dependencyCount, userCount, limit, and offset filters.' },
    { method: 'GET', path: '/api/v1/functions/search', description: 'Search saved function declarations using q or search.' },
    { method: 'GET', path: '/api/v1/functions/:id', description: 'Return one function with outgoing static dependencies and reverse users.' },
    { method: 'GET', path: '/api/v1/functions/:id/dependencies', description: 'Return outgoing static function dependencies for one function.' },
    { method: 'GET', path: '/api/v1/functions/:id/users', description: 'Return reverse static users for one function.' },
    { method: 'GET', path: '/api/v1/query', description: 'Aggregate exact modulePath and symbol search results without adding inferred semantics.' },
  ];
}

function discovery(index) {
  return {
    apiVersion: API_VERSION,
    schemaVersion: index.output?.meta?.schemaVersion || DEFAULT_SCHEMA_VERSION,
    routes: routeEntries(),
    examples: [
      '/api/v1/run',
      '/api/v1/modules?reachable=true&extension=.jsx&limit=25',
      '/api/v1/modules/<module-id>/functions?detail=summary&limit=25&offset=0',
      '/api/v1/modules/<module-id>/source?startLine=1&endLine=40',
      '/api/v1/symbols?name=App&referenceCount=1',
      '/api/v1/symbols/search?q=App',
      '/api/v1/functions?name=CreatorShell&dependencyCount=2',
      '/api/v1/functions/search?q=CreatorShell',
      '/api/v1/query?modulePath=src/app.jsx&symbol=RootApp',
    ],
    semantics: {
      analysis: 'Responses are served from generated output.json, source-code.json, .ironglancer-api/source-modules.json, and .ironglancer-api/function-map.json loaded once at server start.',
      relations: 'Symbol relation endpoints expose static import/export/reference relationships captured by IronGlancer, not runtime call graphs or data lineage.',
      functionDependencies: index.functionLimitations,
      queryParameters: {
        unknown: 'Unknown query parameters are rejected with HTTP 400 instead of being ignored.',
        pagination: `General list endpoints default to limit ${DEFAULT_PAGE_LIMIT}. Explicit limit must be a positive integer up to ${MAX_PAGE_LIMIT}; offset must be non-negative. The module-functions endpoint preserves its legacy all-functions response when limit and offset are both omitted.`,
        exactFilters: 'name, userCount, dependencyCount, and referenceCount are exact matches. search and q remain case-insensitive substring filters.',
        moduleFunctions: 'GET /api/v1/modules/:id/functions defaults to backwards-compatible detail=full. Use detail=summary with limit and offset for compact pageable function summaries.',
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
    outDir,
    summary: index.output.summary || {},
    source: {
      sourceCodeAvailable: index.sourceIsUsable,
      declarationSourceAvailable: index.declarationSourceIsUsable,
      moduleSourceAvailable: index.moduleSourceIsUsable,
      functionMapAvailable: index.functionMapIsUsable,
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

  const items = index.modules
    .filter((module) => !search || module.path.toLowerCase().includes(search))
    .filter((module) => !extension || module.extension === extension)
    .filter((module) => reachable == null || module.reachable === reachable)
    .filter((module) => jsx == null || module.isJsx === jsx)
    .map(index.moduleSummary);
  return paginated(items, url);
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
  const module = index.moduleById.get(normalizeString(id).trim());
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

function moduleDetail(index, module) {
  return {
    module: index.moduleSummary(module),
    dependencies: {
      local: module.localDependencies.map((modulePath) => index.moduleSummary(index.moduleByPath.get(modulePath))),
      external: module.externalDependencies,
    },
    dependents: {
      local: module.dependents.map((modulePath) => index.moduleSummary(index.moduleByPath.get(modulePath))),
    },
    imports: module.importRefs,
    symbols: (index.symbolsByModulePath.get(module.path) || []).map(createSymbolSummary),
  };
}

function sourceExcerpt(index, module, url) {
  const sourceModule = index.sourceModuleByPath.get(module.path);
  if (!sourceModule) {
    throw apiError(404, 'source_not_available', `Saved source is not available for ${module.path}.`);
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

function functionEdgePayload(index, edge) {
  const source = index.functionById.get(edge.sourceId);
  const target = index.functionById.get(edge.targetId);
  return {
    id: edge.id,
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    usageLines: edge.usageLines,
    usages: edge.usages,
    referenceCount: edge.referenceCount,
    sourceId: edge.sourceId,
    sourceModulePath: edge.sourceModulePath,
    sourceFunction: edge.sourceFunction,
    sourceStartLine: edge.sourceStartLine,
    targetId: edge.targetId,
    targetModulePath: edge.targetModulePath,
    targetFunction: edge.targetFunction,
    targetStartLine: edge.targetStartLine,
    ...(edge.import ? { import: edge.import } : {}),
    source: source ? createFunctionSummary(index, source) : null,
    target: target ? createFunctionSummary(index, target) : null,
  };
}

function functionDetail(index, node) {
  return {
    function: createFunctionSummary(index, node),
    staticAnalysis: functionDependencySemantics(index),
    dependencies: (index.dependenciesByFunctionId.get(node.id) || []).map((edge) => functionEdgePayload(index, edge)),
    users: (index.usersByFunctionId.get(node.id) || []).map((edge) => functionEdgePayload(index, edge)),
  };
}

function functionDependenciesPayload(index, node) {
  return {
    function: createFunctionSummary(index, node),
    staticAnalysis: functionDependencySemantics(index),
    dependencies: (index.dependenciesByFunctionId.get(node.id) || []).map((edge) => functionEdgePayload(index, edge)),
  };
}

function functionUsersPayload(index, node) {
  return {
    function: createFunctionSummary(index, node),
    staticAnalysis: functionDependencySemantics(index),
    users: (index.usersByFunctionId.get(node.id) || []).map((edge) => functionEdgePayload(index, edge)),
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
  const userCount = parseExactCountParam(url.searchParams, 'userCount');
  const dependencyCount = parseExactCountParam(url.searchParams, 'dependencyCount');
  const explicitModulePath = modulePath || normalizeString(url.searchParams.get('modulePath')).trim();
  const moduleFilter = explicitModulePath ? getModuleByPath(index, explicitModulePath).path : '';
  return index.functions
    .filter((node) => !moduleFilter || node.modulePath === moduleFilter)
    .filter((node) => !exactName || node.name === exactName)
    .filter((node) => !search || [
      node.name,
      node.declarationName,
      node.modulePath,
    ].some((value) => lowerSearch(value).includes(search)))
    .filter((node) => !kind || lowerSearch(node.kind) === kind)
    .filter((node) => component == null || node.component === component)
    .filter((node) => userCount == null || (index.usersByFunctionId.get(node.id) || []).length === userCount)
    .filter((node) => (
      dependencyCount == null || (index.dependenciesByFunctionId.get(node.id) || []).length === dependencyCount
    ));
}

function moduleFunctionsPayload(index, module, url) {
  const detail = moduleFunctionDetailMode(url);
  const page = optionallyPaginated(filteredFunctionNodes(index, url, { modulePath: module.path }), url);
  return {
    module: index.moduleSummary(module),
    staticAnalysis: functionDependencySemantics(index),
    detail,
    functions: page.items.map((node) => (
      detail === 'summary' ? createFunctionSummary(index, node) : functionDetail(index, node)
    )),
    pagination: page.pagination,
  };
}

function getFunctionById(index, id) {
  const node = index.functionById.get(normalizeString(id).trim());
  if (!node) throw apiError(404, 'function_not_found', 'No saved function declaration exists for that id.');
  return node;
}

function functionList(index, url, { requireSearch = false, modulePath } = {}) {
  const items = filteredFunctionNodes(index, url, { requireSearch, modulePath })
    .map((node) => createFunctionSummary(index, node));
  return {
    ...paginated(items, url),
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
  return paginated(items, url);
}

function getSymbolById(index, id) {
  const symbol = index.symbolById.get(normalizeString(id).trim());
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
  if (resource === 'run' && parts.length === 3) {
    rejectUnknownQueryParams(url, []);
    return sendApiData(response, runMetadata(index, outDir));
  }
  if (resource === 'modules') {
    if (parts.length === 3) {
      rejectUnknownQueryParams(url, MODULE_LIST_QUERY_PARAMS);
      return sendApiData(response, moduleList(index, url));
    }
    const module = getModuleById(index, parts[3]);
    if (parts.length === 4) {
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, moduleDetail(index, module));
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
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, functionDetail(index, node));
    }
    if (parts.length === 5 && parts[4] === 'dependencies') {
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, functionDependenciesPayload(index, node));
    }
    if (parts.length === 5 && parts[4] === 'users') {
      rejectUnknownQueryParams(url, []);
      return sendApiData(response, functionUsersPayload(index, node));
    }
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

export async function startStaticAnalysisServer({
  outDir,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
} = {}) {
  const resolvedHost = normalizeString(host).trim() || DEFAULT_HOST;
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
