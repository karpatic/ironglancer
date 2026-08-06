#!/usr/bin/env node
import { createRequire } from 'node:module';
import path from 'node:path';

import { loadStaticAnalysisRun } from './lib/serve-static-site.js';

const require = createRequire(import.meta.url);
const packageMeta = require('../package.json');
const MCP_PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'ironglancer-mcp';
const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:4173/bridge/v1/';
const NEIGHBORHOOD_DIRECTIONS = new Set(['both', 'dependencies', 'users']);
const NEIGHBORHOOD_RELATION_ORDER = new Map([
  ['root', 0],
  ['dependency', 1],
  ['user', 2],
  ['both', 3],
]);

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    analysisDir: process.env.IRONGLANCER_ANALYSIS_DIR || process.cwd(),
    bridgeUrl: process.env.IRONGLANCER_BRIDGE_URL || '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--analysis-dir' || arg === '--out-dir') {
      options.analysisDir = argv[++index] || options.analysisDir;
    } else if (arg === '--bridge-url') {
      options.bridgeUrl = argv[++index] || options.bridgeUrl;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }
  return options;
}

function usage() {
  return [
    'Usage: ironglancer-mcp --analysis-dir ./docs/analysis [--bridge-url http://127.0.0.1:4173/bridge/v1]',
    '',
    'Environment:',
    '  IRONGLANCER_ANALYSIS_DIR   Generated IronGlancer output directory.',
    '  IRONGLANCER_BRIDGE_URL     Optional running viewer bridge URL.',
    '',
  ].join('\n');
}

function jsonText(value) {
  return JSON.stringify(value, null, 2);
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}

function compactCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : 0;
}

function outputArray(index, field) {
  const value = index.output?.[field];
  return Array.isArray(value) ? value : [];
}

function compactModule(index, module) {
  const imports = index.imports.filter((item) => item.sourcePath === module.path);
  return {
    id: module.id,
    stableId: module.stableId,
    path: module.path,
    extension: module.extension,
    reachable: module.reachable,
    isJsx: module.isJsx,
    lineCount: module.lineCount,
    dependencyCount: module.localDependencies.length,
    dependentCount: module.dependents.length,
    externalDependencyCount: module.externalDependencies.length,
    importCount: imports.length,
    componentCount: outputArray(index, 'components').filter((item) => item.modulePath === module.path).length,
    lazyBoundaryCount: outputArray(index, 'lazyBoundaries').filter((item) => item.sourceModulePath === module.path).length,
    assetCount: outputArray(index, 'assets').filter((item) => item.sourceModulePath === module.path).length,
    functionCount: (index.functionsByModulePath.get(module.path) || []).length,
    sourceAvailable: index.sourceModuleByPath.has(module.path),
  };
}

function resolveModule(index, args = {}) {
  const id = String(args.id || args.moduleId || '').trim();
  const stableId = String(args.stableId || args.moduleStableId || '').trim();
  const modulePath = String(args.path || args.modulePath || '').trim();
  if (id) {
    const module = index.moduleById.get(id) || index.moduleByStableId.get(id);
    if (module) return module;
  }
  if (stableId) {
    const module = index.moduleByStableId.get(stableId) || index.moduleById.get(stableId);
    if (module) return module;
  }
  if (modulePath) {
    const module = index.moduleByPath.get(modulePath);
    if (module) return module;
  }
  throw new Error('Provide module path, id, or stableId.');
}

function listModules({ index }, args = {}) {
  const q = lower(args.q || args.search || '');
  const reachable = args.reachable == null ? null : Boolean(args.reachable);
  const limit = Math.max(1, Math.min(100, Number(args.limit) || 25));
  const items = index.modules
    .filter((module) => !q || lower(module.path).includes(q))
    .filter((module) => reachable == null || Boolean(module.reachable) === reachable)
    .slice(0, limit)
    .map((module) => compactModule(index, module));
  return { q, reachable, items, totalReturned: items.length };
}

function getModule({ index }, args = {}) {
  const module = resolveModule(index, args);
  const imports = index.imports
    .filter((item) => item.sourcePath === module.path)
    .sort((a, b) => compareText(a.specifier, b.specifier) || compareText(a.loadKind, b.loadKind));
  return {
    module: compactModule(index, module),
    dependencies: module.localDependencies.map((modulePath) => compactModule(index, index.moduleByPath.get(modulePath))),
    dependents: module.dependents.map((modulePath) => compactModule(index, index.moduleByPath.get(modulePath))),
    imports,
    components: outputArray(index, 'components').filter((item) => item.modulePath === module.path),
    lazyBoundaries: outputArray(index, 'lazyBoundaries').filter((item) => item.sourceModulePath === module.path),
    assets: outputArray(index, 'assets').filter((item) => item.sourceModulePath === module.path),
    findings: outputArray(index, 'findings').filter((item) => item.modulePath === module.path),
  };
}

function listOutputRecords({ index }, args = {}, field, modulePathField = 'modulePath') {
  const q = lower(args.q || args.search || '');
  const modulePath = String(args.modulePath || args.path || '').trim();
  const limit = Math.max(1, Math.min(100, Number(args.limit) || 25));
  const items = outputArray(index, field)
    .filter((item) => !modulePath || item[modulePathField] === modulePath)
    .filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q))
    .slice(0, limit);
  return { q, modulePath: modulePath || null, items, totalReturned: items.length };
}

function parseBoundedInteger(value, defaultValue, { min, max, name }) {
  if (value == null || value === '') return defaultValue;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  }
  return number;
}

function compareFunctionRecords(a, b) {
  return compareText(a?.modulePath, b?.modulePath)
    || compactCount(a?.startLine) - compactCount(b?.startLine)
    || compactCount(a?.endLine) - compactCount(b?.endLine)
    || compareText(a?.name, b?.name)
    || compareText(a?.id, b?.id);
}

function compareFunctionIds(index, a, b) {
  return compareFunctionRecords(index.functionById.get(a), index.functionById.get(b));
}

function compareFunctionEdges(index, a, b) {
  const sourceA = index.functionById.get(a?.sourceId);
  const sourceB = index.functionById.get(b?.sourceId);
  const targetA = index.functionById.get(a?.targetId);
  const targetB = index.functionById.get(b?.targetId);
  return compareFunctionRecords(sourceA, sourceB)
    || compareFunctionRecords(targetA, targetB)
    || compareText(a?.scope, b?.scope)
    || compareText(a?.relationKind, b?.relationKind)
    || compareText(a?.id, b?.id);
}

function compactFunction(index, node) {
  const evidence = node.placement?.evidence || {};
  return {
    id: node.id,
    stableId: node.stableId,
    modulePath: node.modulePath,
    name: node.name,
    kind: node.kind,
    component: Boolean(node.component),
    exported: Boolean(node.exported),
    reachable: node.reachable,
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
  };
}

function edgeSummary(index, edge) {
  const source = index.functionById.get(edge.sourceId);
  const target = index.functionById.get(edge.targetId);
  return {
    id: edge.id,
    stableId: edge.stableId,
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    usageLines: edge.usageLines,
    referenceCount: edge.referenceCount,
    source: source ? compactFunction(index, source) : null,
    target: target ? compactFunction(index, target) : null,
    ...(edge.import ? { import: edge.import } : {}),
  };
}

function resolveFunction(index, args = {}) {
  const id = String(args.id || args.functionId || '').trim();
  const stableId = String(args.stableId || args.functionStableId || '').trim();
  if (id) {
    const node = index.functionById.get(id) || index.functionByStableId.get(id);
    if (node) return node;
  }
  if (stableId) {
    const node = index.functionByStableId.get(stableId) || index.functionById.get(stableId);
    if (node) return node;
  }
  const name = String(args.name || args.functionName || '').trim();
  const modulePath = String(args.modulePath || '').trim();
  if (!name) throw new Error('Provide id, stableId, or name.');
  const matches = index.functions.filter((node) => (
    node.name === name
    && (!modulePath || node.modulePath === modulePath)
  ));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Function name "${name}" is ambiguous; provide modulePath or stableId.`);
  throw new Error('No saved function declaration matched.');
}

function sourceExcerpt(index, node, contextLines = 4) {
  const sourceModule = index.sourceModuleByPath.get(node.modulePath);
  if (!sourceModule) {
    return {
      available: false,
      sourceMode: index.sourceMode || 'unknown',
      reason: `Saved module source is not available with sourceMode=${index.sourceMode || 'unknown'}.`,
      modulePath: node.modulePath,
    };
  }
  const lines = sourceModule.code.split(/\r\n|\r|\n/);
  const startLine = Math.max(1, (node.startLine || 1) - contextLines);
  const endLine = Math.min(lines.length, (node.endLine || node.startLine || 1) + contextLines);
  return {
    available: true,
    sourceMode: index.sourceMode || 'unknown',
    modulePath: node.modulePath,
    startLine,
    endLine,
    lines: lines.slice(startLine - 1, endLine).map((text, offset) => ({
      line: startLine + offset,
      text,
    })),
  };
}

function runSummary({ outDir, index }) {
  const meta = index.output?.meta || {};
  return {
    outDir,
    apiVersion: meta.apiVersion || 'v1',
    schemaVersion: meta.schemaVersion || null,
    package: {
      name: meta.packageName || 'ironglancer',
      version: meta.version || null,
    },
    generatedAt: meta.generatedAt || null,
    buildId: meta.buildId || null,
    sourceCodeHash: meta.sourceCodeHash || null,
    rootDir: meta.rootDir || index.output.rootDir || null,
    entry: meta.entry || index.output.entry || null,
    summary: index.output.summary || {},
    counts: {
      modules: index.modules.length,
      components: outputArray(index, 'components').length,
      componentEdges: outputArray(index, 'componentEdges').length,
      lazyBoundaries: outputArray(index, 'lazyBoundaries').length,
      assets: outputArray(index, 'assets').length,
      findings: outputArray(index, 'findings').length,
      functions: index.functions.length,
      functionEdges: index.functionEdges.length,
      symbols: index.symbols.length,
    },
    staticAnalysis: {
      functionDependencies: index.functionLimitations,
    },
    source: {
      sourceMode: index.sourceMode || 'unknown',
      declarationSourceAvailable: Boolean(index.declarationSourceIsUsable),
      moduleSourceAvailable: Boolean(index.moduleSourceIsUsable),
      functionMapAvailable: Boolean(index.functionMapIsUsable),
      capabilities: index.privacy?.capabilities || {},
    },
  };
}

function searchFunctions({ index }, args = {}) {
  const q = lower(args.q || args.search || '');
  const modulePath = String(args.modulePath || '').trim();
  const limit = Math.max(1, Math.min(100, Number(args.limit) || 25));
  const items = index.functions
    .filter((node) => !q || [node.name, node.declarationName, node.modulePath]
      .some((value) => lower(value).includes(q)))
    .filter((node) => !modulePath || node.modulePath === modulePath)
    .slice(0, limit)
    .map((node) => compactFunction(index, node));
  return { q, modulePath: modulePath || null, items, totalReturned: items.length };
}

function getFunction({ index }, args = {}) {
  const node = resolveFunction(index, args);
  return {
    function: compactFunction(index, node),
    placement: node.placement || null,
    dependencies: (index.dependenciesByFunctionId.get(node.id) || []).map((edge) => edgeSummary(index, edge)),
    users: (index.usersByFunctionId.get(node.id) || []).map((edge) => edgeSummary(index, edge)),
    source: sourceExcerpt(index, node, Number(args.contextLines) || 4),
    staticAnalysis: {
      functionDependencies: index.functionLimitations,
      placement: 'Static placement evidence is deterministic review context, not runtime ownership proof or definitive dead-code detection.',
    },
  };
}

function compactNeighborhoodFunction(index, node, { depth, relation }) {
  return {
    ...compactFunction(index, node),
    depth,
    relation,
  };
}

function compactNeighborhoodEdge(index, edge, traversalRelations = new Set()) {
  const source = index.functionById.get(edge.sourceId);
  const target = index.functionById.get(edge.targetId);
  return {
    id: edge.id,
    stableId: edge.stableId,
    sourceId: edge.sourceId,
    sourceStableId: source?.stableId || null,
    sourceName: source?.name || edge.sourceFunction || null,
    sourceModulePath: source?.modulePath || edge.sourceModulePath || null,
    targetId: edge.targetId,
    targetStableId: target?.stableId || null,
    targetName: target?.name || edge.targetFunction || null,
    targetModulePath: target?.modulePath || edge.targetModulePath || null,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    usageLines: edge.usageLines,
    referenceCount: edge.referenceCount,
    traversalRelations: Array.from(traversalRelations).sort(compareText),
  };
}

function normalizeNeighborhoodDirection(value) {
  const direction = lower(value || 'both') || 'both';
  if (!NEIGHBORHOOD_DIRECTIONS.has(direction)) {
    throw new Error('direction must be one of: both, dependencies, users.');
  }
  return direction;
}

function neighborhoodTraversalDirections(direction) {
  if (direction === 'dependencies') return ['dependency'];
  if (direction === 'users') return ['user'];
  return ['dependency', 'user'];
}

function neighborEntriesForDirection(index, functionId, relation) {
  const edges = relation === 'dependency'
    ? (index.dependenciesByFunctionId.get(functionId) || [])
    : (index.usersByFunctionId.get(functionId) || []);
  return edges
    .map((edge) => ({
      id: relation === 'dependency' ? edge.targetId : edge.sourceId,
      edge,
      relation,
    }))
    .filter((entry) => index.functionById.has(entry.id))
    .sort((a, b) => compareFunctionIds(index, a.id, b.id)
      || compareFunctionEdges(index, a.edge, b.edge)
      || compareText(a.relation, b.relation));
}

function relationLabelFor(tags) {
  if (tags.has('root')) return 'root';
  if (tags.has('dependency') && tags.has('user')) return 'both';
  if (tags.has('dependency')) return 'dependency';
  if (tags.has('user')) return 'user';
  return 'unknown';
}

function functionNeighborhood({ index }, args = {}) {
  const root = resolveFunction(index, args);
  const direction = normalizeNeighborhoodDirection(args.direction);
  const maxDepth = parseBoundedInteger(args.maxDepth, 2, {
    min: 1,
    max: 50,
    name: 'maxDepth',
  });
  const limit = parseBoundedInteger(args.limit, 200, {
    min: 1,
    max: 1000,
    name: 'limit',
  });

  const queue = [{ id: root.id, depth: 0 }];
  const depthById = new Map([[root.id, 0]]);
  const relationTagsById = new Map([[root.id, new Set(['root'])]]);
  const edgeRelationsById = new Map();
  const truncationReasons = new Set();
  let visitedCount = 1;

  for (let position = 0; position < queue.length; position += 1) {
    const current = queue[position];
    const traversalDirections = neighborhoodTraversalDirections(direction);
    if (current.depth >= maxDepth) {
      if (traversalDirections.some((relation) => neighborEntriesForDirection(index, current.id, relation)
        .some((entry) => !depthById.has(entry.id)))) {
        truncationReasons.add('maxDepth');
      }
      continue;
    }

    for (const relation of traversalDirections) {
      for (const entry of neighborEntriesForDirection(index, current.id, relation)) {
        if (!edgeRelationsById.has(entry.edge.id)) edgeRelationsById.set(entry.edge.id, {
          edge: entry.edge,
          relations: new Set(),
        });
        edgeRelationsById.get(entry.edge.id).relations.add(relation);

        if (!relationTagsById.has(entry.id)) relationTagsById.set(entry.id, new Set());
        relationTagsById.get(entry.id).add(relation);
        if (depthById.has(entry.id)) continue;
        if (depthById.size >= limit) {
          truncationReasons.add('limit');
          continue;
        }
        const depth = current.depth + 1;
        depthById.set(entry.id, depth);
        visitedCount += 1;
        queue.push({ id: entry.id, depth });
      }
    }
  }

  const nodeIds = Array.from(depthById.keys()).sort((a, b) => (
    (depthById.get(a) || 0) - (depthById.get(b) || 0)
      || (NEIGHBORHOOD_RELATION_ORDER.get(relationLabelFor(relationTagsById.get(a) || new Set())) || 9)
        - (NEIGHBORHOOD_RELATION_ORDER.get(relationLabelFor(relationTagsById.get(b) || new Set())) || 9)
      || compareFunctionIds(index, a, b)
  ));
  const nodeIdSet = new Set(nodeIds);
  const neighborhoodEdges = Array.from(edgeRelationsById.values())
    .filter(({ edge }) => nodeIdSet.has(edge.sourceId) && nodeIdSet.has(edge.targetId))
    .sort((a, b) => compareFunctionEdges(index, a.edge, b.edge));

  return {
    root: compactNeighborhoodFunction(index, root, { depth: 0, relation: 'root' }),
    direction,
    maxDepth,
    limit,
    nodes: nodeIds.map((id) => {
      const node = index.functionById.get(id);
      return compactNeighborhoodFunction(index, node, {
        depth: depthById.get(id) || 0,
        relation: relationLabelFor(relationTagsById.get(id) || new Set()),
      });
    }),
    edges: neighborhoodEdges.map(({ edge, relations }) => compactNeighborhoodEdge(index, edge, relations)),
    metadata: {
      visitedCount,
      returnedNodeCount: nodeIds.length,
      returnedEdgeCount: neighborhoodEdges.length,
      truncated: truncationReasons.size > 0,
      truncationReasons: Array.from(truncationReasons).sort(compareText),
    },
    staticAnalysis: {
      functionDependencies: index.functionLimitations,
    },
  };
}

function getSource({ index }, args = {}) {
  const modulePath = String(args.modulePath || args.path || '').trim();
  if (!modulePath) throw new Error('Provide modulePath.');
  const sourceModule = index.sourceModuleByPath.get(modulePath);
  if (!sourceModule) {
    throw new Error(`Saved module source is not available for ${modulePath} with sourceMode=${index.sourceMode || 'unknown'}.`);
  }
  const lines = sourceModule.code.split(/\r\n|\r|\n/);
  const startLine = Math.max(1, Number(args.startLine) || 1);
  const endLine = Math.min(lines.length, Math.max(startLine, Number(args.endLine) || startLine + 40));
  return {
    modulePath,
    startLine,
    endLine,
    lines: lines.slice(startLine - 1, endLine).map((text, offset) => ({
      line: startLine + offset,
      text,
    })),
  };
}

function bridgeUrlFor(options, args = {}) {
  const bridgeUrl = String(args.bridgeUrl || options.bridgeUrl || DEFAULT_BRIDGE_URL).replace(/\/?$/, '/');
  const url = new URL(bridgeUrl);
  const host = url.hostname.toLowerCase();
  const loopback = host === 'localhost' || host === '127.0.0.1' || host.startsWith('127.') || host === '::1';
  if (!loopback) throw new Error('IronGlancer viewer bridge URLs must be loopback-only.');
  return bridgeUrl;
}

async function fetchBridgeJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Viewer bridge returned HTTP ${response.status}.`);
  }
  return body.data || body;
}

async function viewerState(options, args = {}) {
  const bridgeUrl = bridgeUrlFor(options, args);
  return fetchBridgeJson(new URL('state', bridgeUrl));
}

async function viewerCommand(options, args = {}) {
  const bridgeUrl = bridgeUrlFor(options, args);
  const command = {
    type: args.type || args.command,
    targetStableId: args.targetStableId || args.functionStableId,
    targetId: args.targetId || args.functionId,
    modulePath: args.modulePath,
    name: args.name || args.functionName,
    startLine: args.startLine || args.line,
    primaryView: args.primaryView,
    layout: args.layout,
    scope: args.scope,
    depth: args.depth,
    showFiles: args.showFiles,
    showFunctions: args.showFunctions,
  };
  return fetchBridgeJson(new URL('commands', bridgeUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command }),
  });
}

const tools = [
  {
    name: 'ironglancer_run_summary',
    description: 'Return immutable IronGlancer run metadata and saved analysis counts.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'ironglancer_list_modules',
    description: 'List saved browser-reachable/front-end modules with compact architecture counts.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        q: { type: 'string' },
        search: { type: 'string' },
        reachable: { type: 'boolean' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'ironglancer_get_module',
    description: 'Return one saved module with imports, dependencies, components, lazy boundaries, assets, and findings.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        stableId: { type: 'string' },
        moduleId: { type: 'string' },
        moduleStableId: { type: 'string' },
        path: { type: 'string' },
        modulePath: { type: 'string' },
      },
    },
  },
  {
    name: 'ironglancer_list_components',
    description: 'List JSX/React component records discovered in saved browser modules.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        q: { type: 'string' },
        search: { type: 'string' },
        modulePath: { type: 'string' },
        path: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'ironglancer_list_assets',
    description: 'List browser asset and worker edges referenced by saved modules.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        q: { type: 'string' },
        search: { type: 'string' },
        modulePath: { type: 'string' },
        path: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'ironglancer_list_findings',
    description: 'List front-end architecture findings from the saved analysis.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        q: { type: 'string' },
        search: { type: 'string' },
        modulePath: { type: 'string' },
        path: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'ironglancer_search_functions',
    description: 'Search saved advanced static function declarations and compact placement evidence.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        q: { type: 'string' },
        search: { type: 'string' },
        modulePath: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'ironglancer_get_function',
    description: 'Return one saved advanced static function with placement evidence, dependencies/users, and a source excerpt.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        stableId: { type: 'string' },
        functionId: { type: 'string' },
        functionStableId: { type: 'string' },
        name: { type: 'string' },
        modulePath: { type: 'string' },
        contextLines: { type: 'integer', minimum: 0, maximum: 40 },
      },
    },
  },
  {
    name: 'ironglancer_function_neighborhood',
    description: 'Return a deterministic advanced static function neighborhood from the saved snapshot without requiring a viewer.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        stableId: { type: 'string' },
        functionId: { type: 'string' },
        functionStableId: { type: 'string' },
        name: { type: 'string' },
        modulePath: { type: 'string' },
        direction: { enum: ['both', 'dependencies', 'users'] },
        maxDepth: { type: 'integer', minimum: 1, maximum: 50 },
        limit: { type: 'integer', minimum: 1, maximum: 1000 },
      },
    },
  },
  {
    name: 'ironglancer_investigate_function_placement',
    description: 'Return focused advanced function-placement/cohesion evidence for a saved function.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        stableId: { type: 'string' },
        name: { type: 'string' },
        modulePath: { type: 'string' },
      },
    },
  },
  {
    name: 'ironglancer_source_excerpt',
    description: 'Return a bounded excerpt from saved analyzed source.',
    inputSchema: {
      type: 'object',
      required: ['modulePath'],
      additionalProperties: false,
      properties: {
        modulePath: { type: 'string' },
        startLine: { type: 'integer', minimum: 1 },
        endLine: { type: 'integer', minimum: 1 },
      },
    },
  },
  {
    name: 'ironglancer_viewer_state',
    description: 'Read optional structured state from a running localhost IronGlancer viewer bridge.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        bridgeUrl: { type: 'string' },
      },
    },
  },
  {
    name: 'ironglancer_viewer_command',
    description: 'Queue a presentation-only command for a running IronGlancer viewer bridge.',
    inputSchema: {
      type: 'object',
      required: ['type'],
      additionalProperties: false,
      properties: {
        bridgeUrl: { type: 'string' },
        type: { enum: ['focusFunction', 'openFunction', 'openSource', 'highlightFunction', 'scrollToFunction', 'clearHighlight', 'setGraphView'] },
        targetStableId: { type: 'string' },
        targetId: { type: 'string' },
        functionStableId: { type: 'string' },
        functionId: { type: 'string' },
        modulePath: { type: 'string' },
        name: { type: 'string' },
        startLine: { type: 'integer', minimum: 1 },
        primaryView: { enum: ['function-graphs', 'jsx-map'] },
        layout: { enum: ['network', 'radial', 'by-file'] },
        scope: { enum: ['full', 'dependencies', 'parents', 'both'] },
        depth: { enum: ['1', '2', '3', 'all'] },
        showFiles: { type: 'boolean' },
        showFunctions: { type: 'boolean' },
      },
    },
  },
];

function contentResult(value) {
  return {
    content: [{ type: 'text', text: jsonText(value) }],
  };
}

function errorResult(error) {
  return {
    isError: true,
    content: [{ type: 'text', text: error?.message || String(error) }],
  };
}

function createServer(options) {
  let runPromise = null;
  const getRun = () => {
    if (!runPromise) {
      runPromise = loadStaticAnalysisRun({ outDir: path.resolve(options.analysisDir) });
    }
    return runPromise;
  };

  const callTool = async (name, args = {}) => {
    if (name === 'ironglancer_viewer_state') return viewerState(options, args);
    if (name === 'ironglancer_viewer_command') return viewerCommand(options, args);

    const run = await getRun();
    if (name === 'ironglancer_run_summary') return runSummary(run);
    if (name === 'ironglancer_list_modules') return listModules(run, args);
    if (name === 'ironglancer_get_module') return getModule(run, args);
    if (name === 'ironglancer_list_components') return listOutputRecords(run, args, 'components');
    if (name === 'ironglancer_list_assets') return listOutputRecords(run, args, 'assets', 'sourceModulePath');
    if (name === 'ironglancer_list_findings') return listOutputRecords(run, args, 'findings');
    if (name === 'ironglancer_search_functions') return searchFunctions(run, args);
    if (name === 'ironglancer_get_function') return getFunction(run, args);
    if (name === 'ironglancer_function_neighborhood') return functionNeighborhood(run, args);
    if (name === 'ironglancer_investigate_function_placement') {
      const payload = getFunction(run, args);
      return {
        function: payload.function,
        placement: payload.placement,
        staticAnalysis: payload.staticAnalysis,
      };
    }
    if (name === 'ironglancer_source_excerpt') return getSource(run, args);
    throw new Error(`Unknown tool: ${name}`);
  };

  return {
    async handle(message) {
      if (!message || typeof message !== 'object') return null;
      const id = message.id;
      const method = String(message.method || '');
      if (!id && method.startsWith('notifications/')) return null;
      try {
        if (method === 'initialize') {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: message.params?.protocolVersion || MCP_PROTOCOL_VERSION,
              capabilities: { tools: {} },
              serverInfo: { name: SERVER_NAME, version: packageMeta.version || 'unknown' },
            },
          };
        }
        if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
        if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools } };
        if (method === 'tools/call') {
          const result = await callTool(message.params?.name, message.params?.arguments || {});
          return { jsonrpc: '2.0', id, result: contentResult(result) };
        }
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
      } catch (error) {
        if (method === 'tools/call') return { jsonrpc: '2.0', id, result: errorResult(error) };
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: error?.message || String(error) },
        };
      }
    },
  };
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function runStdioServer(options) {
  const server = createServer(options);
  const keepAlive = setInterval(() => {}, 1000);
  let buffer = '';
  let queue = Promise.resolve();

  const handleLine = async (line) => {
    if (!line.trim()) return;
    try {
      const response = await server.handle(JSON.parse(line));
      if (response) writeMessage(response);
    } catch (error) {
      writeMessage({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: error?.message || String(error) },
      });
    }
  };

  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    let lineEnd = buffer.indexOf('\n');
    while (lineEnd !== -1) {
      const line = buffer.slice(0, lineEnd).replace(/\r$/, '');
      buffer = buffer.slice(lineEnd + 1);
      queue = queue.then(() => handleLine(line));
      lineEnd = buffer.indexOf('\n');
    }
  });

  try {
    await new Promise((resolve) => {
      process.stdin.once('end', resolve);
    });
    if (buffer.trim()) {
      const trailingLine = buffer.replace(/\r$/, '');
      queue = queue.then(() => handleLine(trailingLine));
    }
    await queue;
  } finally {
    clearInterval(keepAlive);
  }
}

const options = parseArgs();
if (options.help) {
  process.stdout.write(usage());
} else {
  runStdioServer(options).catch((error) => {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  });
}
