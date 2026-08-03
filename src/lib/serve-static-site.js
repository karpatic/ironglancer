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

function createAnalysisIndex(outputPayload, sourcePayload, moduleSourcePayload) {
  const declarationSourceIsUsable = sourcePayloadMatchesOutput(outputPayload, sourcePayload)
    && Array.isArray(sourcePayload?.declarations);
  const modernModuleSourceIsUsable = sourcePayloadMatchesOutput(outputPayload, moduleSourcePayload)
    && Array.isArray(moduleSourcePayload?.modules);
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

  const index = {
    output: outputPayload,
    source: sourcePayload,
    sourceIsUsable: declarationSourceIsUsable || modernModuleSourceIsUsable || legacyModuleSourceIsUsable,
    declarationSourceIsUsable,
    moduleSourceIsUsable: modernModuleSourceIsUsable || legacyModuleSourceIsUsable,
    legacyModuleSourceIsUsable,
    modules: Array.from(moduleByPath.values()).sort((a, b) => compareLocale(a.path, b.path)),
    moduleByPath,
    moduleById,
    sourceModuleByPath,
    symbols,
    symbolById,
    symbolsByModulePath,
  };
  index.moduleSummary = createModuleSummaryFactory(index);
  return index;
}

export async function loadStaticAnalysisRun({ outDir } = {}) {
  const resolvedOutDir = path.resolve(normalizeString(outDir).trim() || 'ironglancer-site');
  const output = await readJsonFile(path.join(resolvedOutDir, 'output.json'));
  let source = {};
  let moduleSource = {};
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
  return {
    outDir: resolvedOutDir,
    index: createAnalysisIndex(output, source, moduleSource),
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
    { method: 'GET', path: '/api/v1/modules/:id/source', description: 'Return a bounded source excerpt from saved analyzed module source.' },
    { method: 'GET', path: '/api/v1/source', description: 'Return a bounded source excerpt by exact analyzed module path.' },
    { method: 'GET', path: '/api/v1/symbols', description: 'List saved source symbols with search, modulePath, kind, sourceOrigin, limit, and offset filters.' },
    { method: 'GET', path: '/api/v1/symbols/search', description: 'Search saved source symbols using q or search.' },
    { method: 'GET', path: '/api/v1/symbols/:id', description: 'Return one saved source symbol and its declaration source snippet.' },
    { method: 'GET', path: '/api/v1/symbols/:id/references', description: 'Return captured static reference/importer relationships for one symbol.' },
    { method: 'GET', path: '/api/v1/symbols/:id/callers', description: 'Alias for static importer relationships; this is not a runtime call graph.' },
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
      '/api/v1/modules/<module-id>/source?startLine=1&endLine=40',
      '/api/v1/symbols/search?q=App',
      '/api/v1/query?modulePath=src/app.jsx&symbol=RootApp',
    ],
    semantics: {
      analysis: 'Responses are served from generated output.json, source-code.json, and .ironglancer-api/source-modules.json loaded once at server start.',
      relations: 'Symbol relation endpoints expose static import/export/reference relationships captured by IronGlancer, not runtime call graphs or data lineage.',
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
      moduleSourceCount: index.sourceModuleByPath.size,
      symbolSourceCount: index.symbols.length,
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

function symbolList(index, url, { requireSearch = false, modulePath } = {}) {
  const search = lowerSearch(url.searchParams.get('search') || url.searchParams.get('q'));
  if (requireSearch && !search) throw apiError(400, 'missing_query', 'Provide q or search.');
  const kind = lowerSearch(url.searchParams.get('kind'));
  const sourceOrigin = lowerSearch(url.searchParams.get('sourceOrigin'));
  const explicitModulePath = modulePath || normalizeString(url.searchParams.get('modulePath')).trim();
  const moduleFilter = explicitModulePath ? getModuleByPath(index, explicitModulePath).path : '';
  const items = index.symbols
    .filter((symbol) => !moduleFilter || symbol.modulePath === moduleFilter)
    .filter((symbol) => !search || [
      symbol.name,
      symbol.declarationName,
      symbol.modulePath,
      symbol.sourceOrigin,
    ].some((value) => lowerSearch(value).includes(search)))
    .filter((symbol) => !kind || lowerSearch(symbol.kind) === kind)
    .filter((symbol) => !sourceOrigin || lowerSearch(symbol.sourceOrigin) === sourceOrigin)
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

  if (!resource) return sendApiData(response, discovery(index));
  if (resource === 'run' && parts.length === 3) return sendApiData(response, runMetadata(index, outDir));
  if (resource === 'modules') {
    if (parts.length === 3) return sendApiData(response, moduleList(index, url));
    const module = getModuleById(index, parts[3]);
    if (parts.length === 4) return sendApiData(response, moduleDetail(index, module));
    if (parts.length === 5 && parts[4] === 'dependencies') {
      return sendApiData(response, moduleRelationPayload(index, module));
    }
    if (parts.length === 5 && parts[4] === 'dependents') {
      return sendApiData(response, moduleDependentsPayload(index, module));
    }
    if (parts.length === 5 && parts[4] === 'source') {
      return sendApiData(response, sourceExcerpt(index, module, url));
    }
  }
  if (resource === 'source' && parts.length === 3) {
    const module = getModuleByPath(index, url.searchParams.get('path'));
    return sendApiData(response, sourceExcerpt(index, module, url));
  }
  if (resource === 'symbols') {
    if (parts.length === 3) return sendApiData(response, symbolList(index, url));
    if (parts.length === 4 && parts[3] === 'search') {
      return sendApiData(response, symbolList(index, url, { requireSearch: true }));
    }
    const symbol = getSymbolById(index, parts[3]);
    if (parts.length === 4) return sendApiData(response, symbolDetail(symbol));
    if (parts.length === 5 && (parts[4] === 'references' || parts[4] === 'callers')) {
      return sendApiData(response, symbolReferences(symbol));
    }
  }
  if (resource === 'query' && parts.length === 3) return sendApiData(response, queryPayload(index, url));

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
