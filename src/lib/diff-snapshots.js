import { createHash } from 'node:crypto';

import { compareLocale, normalizeString } from './utils.js';

export const DIFF_SCHEMA_VERSION = '1.0.0';
export const SUPPORTED_SNAPSHOT_SCHEMA_VERSION = '1.2.0';

const STATIC_LIMITATIONS = [
  'IronGlancer diffs compare saved static-analysis snapshots; they do not execute code or claim runtime behavior.',
  'Function dependencies are static identifier-use evidence, not a complete runtime call graph.',
  'Source text and absolute project roots are intentionally excluded from diff JSON, HTML, and SARIF output.',
  'Fan-in and fan-out findings use a conservative threshold: at least 3 new edges and at least 2x the previous count.',
];
const FAN_INCREASE_THRESHOLD = {
  minimumDelta: 3,
  minimumRatio: 2,
};

const SEVERITY_ORDER = new Map([
  ['error', 0],
  ['warning', 1],
  ['note', 2],
]);

const RULE_ORDER = new Map([
  ['IRONG_DIFF_EXPORT_REMOVED', 0],
  ['IRONG_DIFF_EXPORT_NARROWED', 1],
  ['IRONG_DIFF_REACHABILITY_REGRESSION', 2],
  ['IRONG_DIFF_MODULE_CYCLE_ADDED', 3],
  ['IRONG_DIFF_FUNCTION_CYCLE_ADDED', 4],
  ['IRONG_DIFF_CROSS_FILE_EDGE_ADDED', 5],
  ['IRONG_DIFF_FAN_INCREASE', 6],
]);

const RULE_DEFINITIONS = [
  {
    id: 'IRONG_DIFF_EXPORT_REMOVED',
    name: 'Exported function removed',
    shortDescription: 'An exported or public static function disappeared.',
    help: 'Review callers before removing exported/static public functions. IronGlancer compares static snapshot export metadata only.',
  },
  {
    id: 'IRONG_DIFF_EXPORT_NARROWED',
    name: 'Export surface narrowed',
    shortDescription: 'A function export surface became narrower.',
    help: 'Review consumers when exported names or export kinds are removed. IronGlancer does not prove runtime usage.',
  },
  {
    id: 'IRONG_DIFF_REACHABILITY_REGRESSION',
    name: 'Reachability regression',
    shortDescription: 'A reachable module or function became unreachable.',
    help: 'Static reachability follows IronGlancer import analysis from the configured entry; dynamic routing may be outside the snapshot.',
  },
  {
    id: 'IRONG_DIFF_MODULE_CYCLE_ADDED',
    name: 'New module dependency cycle',
    shortDescription: 'A new strongly connected module dependency set appeared.',
    help: 'Module cycles are computed from saved local dependency edges and sorted deterministically.',
  },
  {
    id: 'IRONG_DIFF_FUNCTION_CYCLE_ADDED',
    name: 'New function dependency cycle',
    shortDescription: 'A new strongly connected function dependency set appeared.',
    help: 'Function cycles use static identifier-use edges, not runtime call graph proof.',
  },
  {
    id: 'IRONG_DIFF_CROSS_FILE_EDGE_ADDED',
    name: 'New cross-file function edge',
    shortDescription: 'A new static function dependency crosses module boundaries.',
    help: 'Cross-file function edges are static review evidence and may represent references rather than runtime calls.',
  },
  {
    id: 'IRONG_DIFF_FAN_INCREASE',
    name: 'Material fan-in or fan-out increase',
    shortDescription: 'A function fan metric increased by at least 3 and at least 2x.',
    help: 'Fan findings are conservative structural review prompts based on saved static function edges.',
  },
].sort((a, b) => (RULE_ORDER.get(a.id) ?? 99) - (RULE_ORDER.get(b.id) ?? 99));

const ENTITY_ORDER = new Map([
  ['module', 0],
  ['function', 1],
]);

export class SnapshotDiffError extends Error {
  constructor(message, code = 'snapshot_diff_error') {
    super(message);
    this.name = 'SnapshotDiffError';
    this.code = code;
  }
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex').slice(0, 16);
}

function uniqueSortedStrings(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => normalizeString(item).trim()).filter(Boolean))).sort(compareLocale)
    : [];
}

function normalizeBool(value) {
  return value == null ? null : Boolean(value);
}

function normalizeModule(module = {}) {
  return {
    path: normalizeString(module.path).trim(),
    lineCount: Number.isInteger(module.lineCount) ? module.lineCount : 0,
    reachable: normalizeBool(module.reachable),
    isJsx: Boolean(module.isJsx),
    localDependencies: uniqueSortedStrings(module.localDependencies),
    externalDependencies: uniqueSortedStrings(module.externalDependencies),
    importRefs: Array.isArray(module.importRefs) ? module.importRefs : [],
  };
}

function normalizeImportEdge(edge = {}) {
  return {
    sourcePath: normalizeString(edge.sourcePath).trim(),
    targetPath: normalizeString(edge.targetPath).trim(),
    loadKinds: uniqueSortedStrings(edge.loadKinds),
    imports: Array.isArray(edge.imports)
      ? edge.imports.map((binding) => ({
        imported: normalizeString(binding?.imported).trim(),
        local: normalizeString(binding?.local).trim(),
        kind: normalizeString(binding?.kind).trim(),
        inferred: Boolean(binding?.inferred),
      })).sort((a, b) => compareLocale(a.kind, b.kind)
        || compareLocale(a.imported, b.imported)
        || compareLocale(a.local, b.local))
      : [],
  };
}

function normalizeFunctionNode(node = {}) {
  return {
    id: normalizeString(node.id).trim(),
    stableId: normalizeString(node.stableId).trim(),
    modulePath: normalizeString(node.modulePath).trim(),
    name: normalizeString(node.name).trim(),
    declarationName: normalizeString(node.declarationName || node.name).trim(),
    kind: normalizeString(node.kind || 'function').trim() || 'function',
    component: Boolean(node.component),
    reachable: normalizeBool(node.reachable),
    exported: normalizeBool(node.exported),
    exportedNames: uniqueSortedStrings(node.exportedNames),
    exportKinds: uniqueSortedStrings(node.exportKinds),
    scopePath: normalizeString(node.scopePath).trim(),
    startLine: Number.isInteger(node.startLine) ? node.startLine : null,
    endLine: Number.isInteger(node.endLine) ? node.endLine : null,
    lineCount: Number.isInteger(node.lineCount) ? node.lineCount : null,
    placementAssessment: normalizeString(node.placement?.assessment?.assessment).trim() || null,
  };
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
  return Object.values(info).some((entry) => entry === true || normalizeString(entry).trim()) ? info : null;
}

function normalizeFunctionEdge(edge = {}) {
  const syntaxKinds = uniqueSortedStrings(edge.syntaxKinds);
  return {
    id: normalizeString(edge.id).trim(),
    scope: normalizeString(edge.scope || 'same-module').trim() || 'same-module',
    relationKind: normalizeString(edge.relationKind).trim() || 'static-reference',
    syntaxKinds,
    referenceCount: Number.isInteger(edge.referenceCount) ? edge.referenceCount : 0,
    sourceId: normalizeString(edge.sourceId).trim(),
    sourceModulePath: normalizeString(edge.sourceModulePath).trim(),
    sourceFunction: normalizeString(edge.sourceFunction).trim(),
    sourceKind: normalizeString(edge.sourceKind || 'function').trim() || 'function',
    sourceStartLine: Number.isInteger(edge.sourceStartLine) ? edge.sourceStartLine : null,
    sourceEndLine: Number.isInteger(edge.sourceEndLine) ? edge.sourceEndLine : null,
    targetId: normalizeString(edge.targetId).trim(),
    targetModulePath: normalizeString(edge.targetModulePath).trim(),
    targetFunction: normalizeString(edge.targetFunction).trim(),
    targetKind: normalizeString(edge.targetKind || 'function').trim() || 'function',
    targetStartLine: Number.isInteger(edge.targetStartLine) ? edge.targetStartLine : null,
    targetEndLine: Number.isInteger(edge.targetEndLine) ? edge.targetEndLine : null,
    import: edge.import && typeof edge.import === 'object' ? normalizeFunctionImportInfo(edge.import) : null,
  };
}

function normalizeSnapshot(rawSnapshot, role) {
  if (!rawSnapshot || typeof rawSnapshot !== 'object' || Array.isArray(rawSnapshot)) {
    throw new SnapshotDiffError(`${role} snapshot must be a JSON object.`, 'malformed_snapshot');
  }
  const meta = rawSnapshot.meta && typeof rawSnapshot.meta === 'object' ? rawSnapshot.meta : {};
  const schemaVersion = normalizeString(meta.schemaVersion).trim();
  if (schemaVersion !== SUPPORTED_SNAPSHOT_SCHEMA_VERSION) {
    throw new SnapshotDiffError(
      `${role} snapshot schemaVersion must be ${SUPPORTED_SNAPSHOT_SCHEMA_VERSION}.`,
      'incompatible_snapshot',
    );
  }
  if (!Array.isArray(rawSnapshot.modules)) {
    throw new SnapshotDiffError(`${role} snapshot must include a modules array.`, 'malformed_snapshot');
  }
  if (!rawSnapshot.functionMap || !Array.isArray(rawSnapshot.functionMap.functions) || !Array.isArray(rawSnapshot.functionMap.edges)) {
    throw new SnapshotDiffError(`${role} snapshot must include functionMap.functions and functionMap.edges arrays.`, 'malformed_snapshot');
  }
  if (!Array.isArray(rawSnapshot.importEdges)) {
    throw new SnapshotDiffError(`${role} snapshot must include an importEdges array.`, 'malformed_snapshot');
  }

  const modules = rawSnapshot.modules.map(normalizeModule)
    .sort((a, b) => compareLocale(a.path, b.path));
  if (modules.some((module) => !module.path)) {
    throw new SnapshotDiffError(`${role} snapshot contains a module without a path.`, 'malformed_snapshot');
  }
  const functions = rawSnapshot.functionMap.functions.map(normalizeFunctionNode)
    .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
      || (a.startLine || 0) - (b.startLine || 0)
      || compareLocale(a.name, b.name)
      || compareLocale(a.stableId, b.stableId));
  if (functions.some((node) => !node.id || !node.stableId || !node.modulePath || !node.name)) {
    throw new SnapshotDiffError(`${role} snapshot contains a function without id, stableId, modulePath, or name.`, 'malformed_snapshot');
  }
  const functionEdges = rawSnapshot.functionMap.edges.map(normalizeFunctionEdge)
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || (a.sourceStartLine || 0) - (b.sourceStartLine || 0)
      || compareLocale(a.targetModulePath, b.targetModulePath)
      || (a.targetStartLine || 0) - (b.targetStartLine || 0)
      || compareLocale(a.scope, b.scope));
  if (functionEdges.some((edge) => !edge.sourceId || !edge.targetId)) {
    throw new SnapshotDiffError(`${role} snapshot contains a function edge without sourceId or targetId.`, 'malformed_snapshot');
  }
  const importEdges = rawSnapshot.importEdges.map(normalizeImportEdge)
    .sort((a, b) => compareLocale(a.sourcePath, b.sourcePath)
      || compareLocale(a.targetPath, b.targetPath)
      || compareLocale(stableJson(a.imports), stableJson(b.imports)));
  if (importEdges.some((edge) => !edge.sourcePath || !edge.targetPath)) {
    throw new SnapshotDiffError(`${role} snapshot contains an import edge without sourcePath or targetPath.`, 'malformed_snapshot');
  }

  return {
    entry: normalizeString(rawSnapshot.entry || meta.entry).trim() || null,
    meta: {
      schemaVersion,
      generatedAt: normalizeString(meta.generatedAt).trim() || null,
      buildId: normalizeString(meta.buildId).trim() || null,
      gitCommit: normalizeString(meta.gitCommit).trim() || null,
    },
    modules,
    functions,
    functionEdges,
    importEdges,
    limitations: uniqueSortedStrings([
      ...STATIC_LIMITATIONS,
      ...(Array.isArray(rawSnapshot.functionMap.limitations) ? rawSnapshot.functionMap.limitations : []),
    ]),
  };
}

function snapshotIdentity(snapshot, label) {
  return {
    label,
    entry: snapshot.entry,
    schemaVersion: snapshot.meta.schemaVersion,
    generatedAt: snapshot.meta.generatedAt,
    buildId: snapshot.meta.buildId,
    gitCommit: snapshot.meta.gitCommit,
  };
}

function collectionCounts(collection) {
  return {
    added: collection.added.length,
    removed: collection.removed.length,
    changed: collection.changed.length,
  };
}

function moduleSummary(module) {
  return {
    path: module.path,
    lineCount: module.lineCount,
    reachable: module.reachable,
    isJsx: module.isJsx,
    localDependencies: module.localDependencies,
    externalDependencies: module.externalDependencies,
  };
}

function importEdgeKey(edge) {
  return [
    edge.sourcePath,
    edge.targetPath,
    edge.loadKinds.join(','),
    stableJson(edge.imports),
  ].join('\u0000');
}

function moduleImportEdges(snapshot, modulePath) {
  return snapshot.importEdges
    .filter((edge) => edge.sourcePath === modulePath)
    .map((edge) => ({
      sourcePath: edge.sourcePath,
      targetPath: edge.targetPath,
      loadKinds: edge.loadKinds,
      imports: edge.imports,
    }))
    .sort((a, b) => compareLocale(a.targetPath, b.targetPath)
      || compareLocale(a.loadKinds.join(','), b.loadKinds.join(','))
      || compareLocale(stableJson(a.imports), stableJson(b.imports)));
}

function valuesEqual(a, b) {
  return stableJson(a) === stableJson(b);
}

function setChange(field, baseValue, headValue) {
  return valuesEqual(baseValue, headValue) ? null : { field, base: baseValue, head: headValue };
}

function importEdgeChange(base, head, modulePath) {
  const baseEdges = moduleImportEdges(base, modulePath);
  const headEdges = moduleImportEdges(head, modulePath);
  const baseByKey = new Map(baseEdges.map((edge) => [importEdgeKey(edge), edge]));
  const headByKey = new Map(headEdges.map((edge) => [importEdgeKey(edge), edge]));
  const added = headEdges.filter((edge) => !baseByKey.has(importEdgeKey(edge)));
  const removed = baseEdges.filter((edge) => !headByKey.has(importEdgeKey(edge)));
  return added.length || removed.length ? { field: 'importEdges', added, removed } : null;
}

function compareModules(base, head) {
  const baseByPath = new Map(base.modules.map((module) => [module.path, module]));
  const headByPath = new Map(head.modules.map((module) => [module.path, module]));
  const added = head.modules
    .filter((module) => !baseByPath.has(module.path))
    .map(moduleSummary)
    .sort((a, b) => compareLocale(a.path, b.path));
  const removed = base.modules
    .filter((module) => !headByPath.has(module.path))
    .map(moduleSummary)
    .sort((a, b) => compareLocale(a.path, b.path));
  const changed = [];

  for (const baseModule of base.modules) {
    const headModule = headByPath.get(baseModule.path);
    if (!headModule) continue;
    const changes = [
      setChange('reachable', baseModule.reachable, headModule.reachable),
      setChange('isJsx', baseModule.isJsx, headModule.isJsx),
      setChange('lineCount', baseModule.lineCount, headModule.lineCount),
      setChange('localDependencies', baseModule.localDependencies, headModule.localDependencies),
      setChange('externalDependencies', baseModule.externalDependencies, headModule.externalDependencies),
      importEdgeChange(base, head, baseModule.path),
    ].filter(Boolean);
    if (changes.length === 0) continue;
    changed.push({
      path: baseModule.path,
      base: moduleSummary(baseModule),
      head: moduleSummary(headModule),
      changedFields: changes.map((change) => change.field),
      changes,
    });
  }

  changed.sort((a, b) => compareLocale(a.path, b.path));
  return { added, removed, changed };
}

function functionLocation(node) {
  return {
    path: node.modulePath,
    startLine: node.startLine,
    endLine: node.endLine,
  };
}

function functionSummary(node) {
  return {
    id: node.id,
    stableId: node.stableId,
    modulePath: node.modulePath,
    name: node.name,
    declarationName: node.declarationName,
    kind: node.kind,
    component: node.component,
    reachable: node.reachable,
    exported: node.exported,
    exportedNames: node.exportedNames,
    exportKinds: node.exportKinds,
    lineCount: node.lineCount,
    placementAssessment: node.placementAssessment,
    location: functionLocation(node),
  };
}

function compareFunctionPairs(base, head) {
  const baseByStableId = new Map(base.functions.map((node) => [node.stableId, node]));
  const headByStableId = new Map(head.functions.map((node) => [node.stableId, node]));
  const matches = [];
  const matchedBase = new Set();
  const matchedHead = new Set();

  for (const baseNode of base.functions) {
    const headNode = headByStableId.get(baseNode.stableId);
    if (!headNode) continue;
    matches.push({
      base: baseNode,
      head: headNode,
      matchKind: 'exact',
      confidence: 'high',
    });
    matchedBase.add(baseNode.stableId);
    matchedHead.add(headNode.stableId);
  }

  const pairUnique = ({ matchKind, confidence, signatureFor, predicate }) => {
    const baseGroups = new Map();
    const headGroups = new Map();
    for (const node of base.functions.filter((candidate) => !matchedBase.has(candidate.stableId))) {
      const signature = signatureFor(node);
      if (!signature) continue;
      if (!baseGroups.has(signature)) baseGroups.set(signature, []);
      baseGroups.get(signature).push(node);
    }
    for (const node of head.functions.filter((candidate) => !matchedHead.has(candidate.stableId))) {
      const signature = signatureFor(node);
      if (!signature) continue;
      if (!headGroups.has(signature)) headGroups.set(signature, []);
      headGroups.get(signature).push(node);
    }

    const signatures = Array.from(new Set([...baseGroups.keys(), ...headGroups.keys()])).sort(compareLocale);
    for (const signature of signatures) {
      const baseGroup = baseGroups.get(signature) || [];
      const headGroup = headGroups.get(signature) || [];
      if (baseGroup.length !== 1 || headGroup.length !== 1) continue;
      const baseNode = baseGroup[0];
      const headNode = headGroup[0];
      if (!predicate(baseNode, headNode)) continue;
      matches.push({ base: baseNode, head: headNode, matchKind, confidence });
      matchedBase.add(baseNode.stableId);
      matchedHead.add(headNode.stableId);
    }
  };

  pairUnique({
    matchKind: 'move',
    confidence: 'high',
    signatureFor: (node) => [
      node.name,
      node.declarationName,
      node.kind,
      node.scopePath,
      node.lineCount,
      node.component,
      node.exported,
      node.exportedNames.join(','),
      node.exportKinds.join(','),
    ].join('\u0000'),
    predicate: (baseNode, headNode) => baseNode.modulePath !== headNode.modulePath
      && baseNode.name === headNode.name,
  });

  pairUnique({
    matchKind: 'rename',
    confidence: 'medium',
    signatureFor: (node) => [
      node.modulePath,
      node.kind,
      node.scopePath,
      node.lineCount,
      node.startLine,
      node.endLine,
      node.component,
      node.exported,
      node.exportKinds.join(','),
    ].join('\u0000'),
    predicate: (baseNode, headNode) => baseNode.modulePath === headNode.modulePath
      && baseNode.name !== headNode.name,
  });

  return {
    matches: matches.sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
      || compareLocale(a.base.name, b.base.name)
      || compareLocale(a.base.stableId, b.base.stableId)),
    unmatchedBase: base.functions.filter((node) => !matchedBase.has(node.stableId)),
    unmatchedHead: head.functions.filter((node) => !matchedHead.has(node.stableId)),
  };
}

function compareFunctions(base, head) {
  const { matches, unmatchedBase, unmatchedHead } = compareFunctionPairs(base, head);
  const changed = [];

  for (const match of matches) {
    const changes = [
      setChange('modulePath', match.base.modulePath, match.head.modulePath),
      setChange('name', match.base.name, match.head.name),
      setChange('exported', match.base.exported, match.head.exported),
      setChange('exportedNames', match.base.exportedNames, match.head.exportedNames),
      setChange('exportKinds', match.base.exportKinds, match.head.exportKinds),
      setChange('reachable', match.base.reachable, match.head.reachable),
      setChange('component', match.base.component, match.head.component),
      setChange('kind', match.base.kind, match.head.kind),
      setChange('lineCount', match.base.lineCount, match.head.lineCount),
      setChange('placementAssessment', match.base.placementAssessment, match.head.placementAssessment),
    ].filter(Boolean);
    if (changes.length === 0) continue;
    changed.push({
      stableId: match.base.stableId,
      matchKind: match.matchKind,
      confidence: match.confidence,
      base: functionSummary(match.base),
      head: functionSummary(match.head),
      changedFields: changes.map((change) => change.field),
      changes,
    });
  }

  changed.sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
    || compareLocale(a.base.name, b.base.name)
    || compareLocale(a.stableId, b.stableId));

  return {
    added: unmatchedHead.map(functionSummary)
      .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
        || compareLocale(a.name, b.name)
        || compareLocale(a.stableId, b.stableId)),
    removed: unmatchedBase.map(functionSummary)
      .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
        || compareLocale(a.name, b.name)
        || compareLocale(a.stableId, b.stableId)),
    changed,
    moves: matches
      .filter((match) => match.matchKind === 'move')
      .map((match) => ({
        matchKind: match.matchKind,
        confidence: match.confidence,
        base: functionSummary(match.base),
        head: functionSummary(match.head),
      }))
      .sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
        || compareLocale(a.base.name, b.base.name)
        || compareLocale(a.base.stableId, b.base.stableId)),
    renames: matches
      .filter((match) => match.matchKind === 'rename')
      .map((match) => ({
        matchKind: match.matchKind,
        confidence: match.confidence,
        base: functionSummary(match.base),
        head: functionSummary(match.head),
      }))
      .sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
        || compareLocale(a.base.name, b.base.name)
        || compareLocale(a.base.stableId, b.base.stableId)),
    matches,
  };
}

function comparisonIdForPair(baseStableId, headStableId) {
  return `pair:${baseStableId}->${headStableId}`;
}

function edgeFunctionMaps(base, head, functions) {
  const baseFunctionById = new Map(base.functions.map((node) => [node.id, node]));
  const headFunctionById = new Map(head.functions.map((node) => [node.id, node]));
  const baseComparisonIdByFunctionId = new Map();
  const headComparisonIdByFunctionId = new Map();
  for (const match of functions.matches) {
    const comparisonId = comparisonIdForPair(match.base.stableId, match.head.stableId);
    baseComparisonIdByFunctionId.set(match.base.id, comparisonId);
    headComparisonIdByFunctionId.set(match.head.id, comparisonId);
  }
  for (const node of base.functions) {
    if (!baseComparisonIdByFunctionId.has(node.id)) baseComparisonIdByFunctionId.set(node.id, `base:${node.stableId}`);
  }
  for (const node of head.functions) {
    if (!headComparisonIdByFunctionId.has(node.id)) headComparisonIdByFunctionId.set(node.id, `head:${node.stableId}`);
  }
  return {
    baseFunctionById,
    headFunctionById,
    baseComparisonIdByFunctionId,
    headComparisonIdByFunctionId,
  };
}

function edgeImportIdentity(edge) {
  const info = edge.import;
  if (!info) return '';
  return [
    info.loadKind,
    info.bindingKind,
    info.importedName,
    info.localName,
    info.inferred,
  ].join('\u0000');
}

function edgeKey(edge, comparisonIdByFunctionId) {
  return [
    comparisonIdByFunctionId.get(edge.sourceId) || '',
    comparisonIdByFunctionId.get(edge.targetId) || '',
    edge.scope,
    edgeImportIdentity(edge),
  ].join('\u0000');
}

function edgeSummary(edge, functionById) {
  const source = functionById.get(edge.sourceId);
  const target = functionById.get(edge.targetId);
  return {
    source: source ? functionSummary(source) : {
      id: edge.sourceId,
      modulePath: edge.sourceModulePath,
      name: edge.sourceFunction,
      kind: edge.sourceKind,
      location: { path: edge.sourceModulePath, startLine: edge.sourceStartLine, endLine: edge.sourceEndLine },
    },
    target: target ? functionSummary(target) : {
      id: edge.targetId,
      modulePath: edge.targetModulePath,
      name: edge.targetFunction,
      kind: edge.targetKind,
      location: { path: edge.targetModulePath, startLine: edge.targetStartLine, endLine: edge.targetEndLine },
    },
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    referenceCount: edge.referenceCount,
    ...(edge.import ? { import: edge.import } : {}),
  };
}

function compareEdges(base, head, functions) {
  const maps = edgeFunctionMaps(base, head, functions);
  const baseEdges = base.functionEdges
    .filter((edge) => maps.baseComparisonIdByFunctionId.has(edge.sourceId)
      && maps.baseComparisonIdByFunctionId.has(edge.targetId));
  const headEdges = head.functionEdges
    .filter((edge) => maps.headComparisonIdByFunctionId.has(edge.sourceId)
      && maps.headComparisonIdByFunctionId.has(edge.targetId));
  const baseByKey = new Map(baseEdges.map((edge) => [edgeKey(edge, maps.baseComparisonIdByFunctionId), edge]));
  const headByKey = new Map(headEdges.map((edge) => [edgeKey(edge, maps.headComparisonIdByFunctionId), edge]));
  const changed = [];

  for (const [key, baseEdge] of baseByKey) {
    const headEdge = headByKey.get(key);
    if (!headEdge) continue;
    const changes = [
      setChange('relationKind', baseEdge.relationKind, headEdge.relationKind),
      setChange('syntaxKinds', baseEdge.syntaxKinds, headEdge.syntaxKinds),
      setChange('referenceCount', baseEdge.referenceCount, headEdge.referenceCount),
    ].filter(Boolean);
    if (changes.length === 0) continue;
    changed.push({
      base: edgeSummary(baseEdge, maps.baseFunctionById),
      head: edgeSummary(headEdge, maps.headFunctionById),
      changedFields: changes.map((change) => change.field),
      changes,
    });
  }

  const sortEdges = (a, b) => compareLocale(a.source.modulePath, b.source.modulePath)
    || compareLocale(a.source.name, b.source.name)
    || compareLocale(a.target.modulePath, b.target.modulePath)
    || compareLocale(a.target.name, b.target.name)
    || compareLocale(a.scope, b.scope);

  return {
    added: headEdges
      .filter((edge) => !baseByKey.has(edgeKey(edge, maps.headComparisonIdByFunctionId)))
      .map((edge) => edgeSummary(edge, maps.headFunctionById))
      .sort(sortEdges),
    removed: baseEdges
      .filter((edge) => !headByKey.has(edgeKey(edge, maps.baseComparisonIdByFunctionId)))
      .map((edge) => edgeSummary(edge, maps.baseFunctionById))
      .sort(sortEdges),
    changed: changed.sort((a, b) => sortEdges(a.base, b.base)),
  };
}

function relativeLocation(pathValue, startLine = null, endLine = null) {
  return {
    path: pathValue,
    ...(Number.isInteger(startLine) ? { startLine } : {}),
    ...(Number.isInteger(endLine) ? { endLine } : {}),
  };
}

function createFinding({ ruleId, severity, confidence, message, evidence, location }) {
  return {
    id: `finding_${stableHash({ ruleId, evidence, location })}`,
    ruleId,
    severity,
    confidence,
    message,
    evidence,
    ...(location?.path ? { location } : {}),
  };
}

function isPublicFunction(functionInfo = {}) {
  return functionInfo.exported === true || (Array.isArray(functionInfo.exportedNames) && functionInfo.exportedNames.length > 0);
}

function missingSetMembers(baseValues, headValues) {
  const headSet = new Set(headValues || []);
  return (baseValues || []).filter((value) => !headSet.has(value)).sort(compareLocale);
}

function exportFindings(functions) {
  const findings = [];
  for (const removed of functions.removed) {
    if (!isPublicFunction(removed)) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_EXPORT_REMOVED',
      severity: 'error',
      confidence: 'high',
      message: `Exported function ${removed.name} was removed from the static public surface.`,
      evidence: {
        function: {
          stableId: removed.stableId,
          modulePath: removed.modulePath,
          name: removed.name,
        },
        exportedNames: removed.exportedNames,
        exportKinds: removed.exportKinds,
      },
      location: relativeLocation(removed.modulePath, removed.location?.startLine, removed.location?.endLine),
    }));
  }

  for (const change of functions.changed) {
    if (!isPublicFunction(change.base)) continue;
    const removedExportNames = change.base.exported === true && change.head.exported === false
      ? change.base.exportedNames
      : missingSetMembers(change.base.exportedNames, change.head.exportedNames);
    const removedExportKinds = missingSetMembers(change.base.exportKinds, change.head.exportKinds);
    if (change.base.exported === change.head.exported && removedExportNames.length === 0 && removedExportKinds.length === 0) {
      continue;
    }
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_EXPORT_NARROWED',
      severity: 'error',
      confidence: 'high',
      message: `Export surface for ${change.base.name} was narrowed in the static snapshot.`,
      evidence: {
        base: {
          stableId: change.base.stableId,
          modulePath: change.base.modulePath,
          name: change.base.name,
          exported: change.base.exported,
          exportedNames: change.base.exportedNames,
          exportKinds: change.base.exportKinds,
        },
        head: {
          stableId: change.head.stableId,
          modulePath: change.head.modulePath,
          name: change.head.name,
          exported: change.head.exported,
          exportedNames: change.head.exportedNames,
          exportKinds: change.head.exportKinds,
        },
        removedExportNames,
        removedExportKinds,
      },
      location: relativeLocation(change.head.modulePath, change.head.location?.startLine, change.head.location?.endLine),
    }));
  }
  return findings;
}

function reachabilityFindings(modules, functions) {
  const findings = [];
  for (const change of modules.changed) {
    if (change.base.reachable !== true || change.head.reachable !== false) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_REACHABILITY_REGRESSION',
      severity: 'warning',
      confidence: 'high',
      message: `Reachable module ${change.base.path} became unreachable in the static snapshot.`,
      evidence: {
        entityType: 'module',
        path: change.base.path,
        baseReachable: change.base.reachable,
        headReachable: change.head.reachable,
      },
      location: relativeLocation(change.head.path),
    }));
  }
  for (const change of functions.changed) {
    if (change.base.reachable !== true || change.head.reachable !== false) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_REACHABILITY_REGRESSION',
      severity: 'warning',
      confidence: 'high',
      message: `Reachable function ${change.base.name} became unreachable in the static snapshot.`,
      evidence: {
        entityType: 'function',
        stableId: change.base.stableId,
        modulePath: change.base.modulePath,
        name: change.base.name,
        baseReachable: change.base.reachable,
        headReachable: change.head.reachable,
      },
      location: relativeLocation(change.head.modulePath, change.head.location?.startLine, change.head.location?.endLine),
    }));
  }
  return findings;
}

function stronglyConnectedComponents(nodes, outgoingForNode) {
  const orderedNodes = [...nodes].sort(compareLocale);
  const indexByNode = new Map();
  const lowLinkByNode = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];
  let index = 0;

  const visit = (node) => {
    indexByNode.set(node, index);
    lowLinkByNode.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);

    for (const next of [...outgoingForNode(node)].sort(compareLocale)) {
      if (!indexByNode.has(next)) {
        visit(next);
        lowLinkByNode.set(node, Math.min(lowLinkByNode.get(node), lowLinkByNode.get(next)));
      } else if (onStack.has(next)) {
        lowLinkByNode.set(node, Math.min(lowLinkByNode.get(node), indexByNode.get(next)));
      }
    }

    if (lowLinkByNode.get(node) !== indexByNode.get(node)) return;
    const component = [];
    let current = null;
    do {
      current = stack.pop();
      onStack.delete(current);
      component.push(current);
    } while (current !== node);
    components.push(component.sort(compareLocale));
  };

  for (const node of orderedNodes) {
    if (!indexByNode.has(node)) visit(node);
  }
  return components.sort((a, b) => compareLocale(a.join('\u0000'), b.join('\u0000')));
}

function moduleCycles(snapshot) {
  const modulePaths = new Set(snapshot.modules.map((module) => module.path));
  const depsByPath = new Map(snapshot.modules.map((module) => [
    module.path,
    module.localDependencies.filter((dependency) => modulePaths.has(dependency)),
  ]));
  return stronglyConnectedComponents(modulePaths, (node) => depsByPath.get(node) || [])
    .filter((component) => component.length > 1 || (depsByPath.get(component[0]) || []).includes(component[0]))
    .map((members) => ({ key: members.join('\u0000'), members }));
}

function functionComparisonMapsForCycles(base, head, functions) {
  const maps = edgeFunctionMaps(base, head, functions);
  const baseLabelByComparisonId = new Map();
  const headLabelByComparisonId = new Map();
  for (const node of base.functions) {
    const comparisonId = maps.baseComparisonIdByFunctionId.get(node.id);
    if (comparisonId) baseLabelByComparisonId.set(comparisonId, `${node.modulePath}:${node.name}`);
  }
  for (const node of head.functions) {
    const comparisonId = maps.headComparisonIdByFunctionId.get(node.id);
    if (comparisonId) headLabelByComparisonId.set(comparisonId, `${node.modulePath}:${node.name}`);
  }
  return { ...maps, baseLabelByComparisonId, headLabelByComparisonId };
}

function functionCycles(snapshot, { comparisonIdByFunctionId, labelByComparisonId }) {
  const nodes = new Set();
  const depsByComparisonId = new Map();
  for (const edge of snapshot.functionEdges) {
    const source = comparisonIdByFunctionId.get(edge.sourceId);
    const target = comparisonIdByFunctionId.get(edge.targetId);
    if (!source || !target) continue;
    nodes.add(source);
    nodes.add(target);
    if (!depsByComparisonId.has(source)) depsByComparisonId.set(source, []);
    depsByComparisonId.get(source).push(target);
  }
  return stronglyConnectedComponents(nodes, (node) => depsByComparisonId.get(node) || [])
    .filter((component) => component.length > 1 || (depsByComparisonId.get(component[0]) || []).includes(component[0]))
    .map((component) => ({
      key: component.join('\u0000'),
      members: component.map((id) => labelByComparisonId.get(id) || id).sort(compareLocale),
    }))
    .sort((a, b) => compareLocale(a.members.join('\u0000'), b.members.join('\u0000')));
}

function cycleFindings(base, head, functions) {
  const findings = [];
  const baseModuleCycleKeys = new Set(moduleCycles(base).map((cycle) => cycle.key));
  for (const cycle of moduleCycles(head)) {
    if (baseModuleCycleKeys.has(cycle.key)) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_MODULE_CYCLE_ADDED',
      severity: 'warning',
      confidence: 'high',
      message: `New module dependency cycle: ${cycle.members.join(' -> ')}.`,
      evidence: {
        entityType: 'module-cycle',
        members: cycle.members,
      },
      location: relativeLocation(cycle.members[0]),
    }));
  }

  const cycleMaps = functionComparisonMapsForCycles(base, head, functions);
  const baseFunctionCycleKeys = new Set(functionCycles(base, {
    comparisonIdByFunctionId: cycleMaps.baseComparisonIdByFunctionId,
    labelByComparisonId: cycleMaps.baseLabelByComparisonId,
  }).map((cycle) => cycle.key));
  for (const cycle of functionCycles(head, {
    comparisonIdByFunctionId: cycleMaps.headComparisonIdByFunctionId,
    labelByComparisonId: cycleMaps.headLabelByComparisonId,
  })) {
    if (baseFunctionCycleKeys.has(cycle.key)) continue;
    const firstMember = cycle.members[0] || '';
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_FUNCTION_CYCLE_ADDED',
      severity: 'warning',
      confidence: 'high',
      message: `New function dependency cycle: ${cycle.members.join(' -> ')}.`,
      evidence: {
        entityType: 'function-cycle',
        members: cycle.members,
      },
      location: relativeLocation(firstMember.split(':')[0] || null),
    }));
  }
  return findings;
}

function crossFileEdgeFindings(edges) {
  return edges.added
    .filter((edgeInfo) => edgeInfo.source.modulePath && edgeInfo.target.modulePath
      && edgeInfo.source.modulePath !== edgeInfo.target.modulePath)
    .map((edgeInfo) => createFinding({
      ruleId: 'IRONG_DIFF_CROSS_FILE_EDGE_ADDED',
      severity: 'note',
      confidence: 'medium',
      message: `New cross-file static function edge from ${edgeInfo.source.name} to ${edgeInfo.target.name}.`,
      evidence: {
        entityType: 'function-edge',
        edge: {
          source: `${edgeInfo.source.modulePath}:${edgeInfo.source.name}`,
          target: `${edgeInfo.target.modulePath}:${edgeInfo.target.name}`,
          scope: edgeInfo.scope,
          relationKind: edgeInfo.relationKind,
          referenceCount: edgeInfo.referenceCount,
        },
      },
      location: relativeLocation(edgeInfo.source.modulePath, edgeInfo.source.location?.startLine, edgeInfo.source.location?.endLine),
    }));
}

function countFanByComparisonId(snapshot, comparisonIdByFunctionId) {
  const fanIn = new Map();
  const fanOut = new Map();
  for (const edge of snapshot.functionEdges) {
    const source = comparisonIdByFunctionId.get(edge.sourceId);
    const target = comparisonIdByFunctionId.get(edge.targetId);
    if (!source || !target) continue;
    fanOut.set(source, (fanOut.get(source) || 0) + 1);
    fanIn.set(target, (fanIn.get(target) || 0) + 1);
  }
  return { fanIn, fanOut };
}

function isMaterialFanIncrease(baseCount, headCount) {
  const delta = headCount - baseCount;
  if (delta < FAN_INCREASE_THRESHOLD.minimumDelta) return false;
  if (baseCount === 0) return headCount >= FAN_INCREASE_THRESHOLD.minimumDelta;
  return headCount >= baseCount * FAN_INCREASE_THRESHOLD.minimumRatio;
}

function fanIncreaseFindings(base, head, functions) {
  const maps = edgeFunctionMaps(base, head, functions);
  const baseCounts = countFanByComparisonId(base, maps.baseComparisonIdByFunctionId);
  const headCounts = countFanByComparisonId(head, maps.headComparisonIdByFunctionId);
  const findings = [];

  for (const match of functions.matches) {
    const comparisonId = comparisonIdForPair(match.base.stableId, match.head.stableId);
    for (const metric of ['fanIn', 'fanOut']) {
      const baseCount = baseCounts[metric].get(comparisonId) || 0;
      const headCount = headCounts[metric].get(comparisonId) || 0;
      if (!isMaterialFanIncrease(baseCount, headCount)) continue;
      findings.push(createFinding({
        ruleId: 'IRONG_DIFF_FAN_INCREASE',
        severity: 'warning',
        confidence: 'medium',
        message: `${metric} for ${match.head.name} materially increased in the static function graph.`,
        evidence: {
          entityType: 'function',
          metric,
          function: {
            stableId: match.head.stableId,
            modulePath: match.head.modulePath,
            name: match.head.name,
          },
          counts: {
            base: baseCount,
            head: headCount,
            delta: headCount - baseCount,
          },
          threshold: FAN_INCREASE_THRESHOLD,
        },
        location: relativeLocation(match.head.modulePath, match.head.startLine, match.head.endLine),
      }));
    }
  }
  return findings;
}

function compareFindings(a, b) {
  return (SEVERITY_ORDER.get(a.severity) ?? 99) - (SEVERITY_ORDER.get(b.severity) ?? 99)
    || (RULE_ORDER.get(a.ruleId) ?? 99) - (RULE_ORDER.get(b.ruleId) ?? 99)
    || (ENTITY_ORDER.get(a.evidence?.entityType) ?? 99) - (ENTITY_ORDER.get(b.evidence?.entityType) ?? 99)
    || compareLocale(a.location?.path || '', b.location?.path || '')
    || compareLocale(a.message, b.message)
    || compareLocale(a.id, b.id);
}

function buildFindings({ base, head, modules, functions, edges }) {
  return [
    ...exportFindings(functions),
    ...reachabilityFindings(modules, functions),
    ...cycleFindings(base, head, functions),
    ...crossFileEdgeFindings(edges),
    ...fanIncreaseFindings(base, head, functions),
  ].sort(compareFindings);
}

function findingsBySeverity(findings) {
  return {
    error: findings.filter((finding) => finding.severity === 'error').length,
    warning: findings.filter((finding) => finding.severity === 'warning').length,
    note: findings.filter((finding) => finding.severity === 'note').length,
  };
}

function buildDiff(base, head, options) {
  const modules = compareModules(base, head);
  const functions = compareFunctions(base, head);
  const edges = compareEdges(base, head, functions);
  const findings = buildFindings({ base, head, modules, functions, edges });
  const publicFunctions = {
    added: functions.added,
    removed: functions.removed,
    changed: functions.changed,
    moves: functions.moves,
    renames: functions.renames,
  };
  return {
    schemaVersion: DIFF_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? null,
    base: snapshotIdentity(base, options.baseLabel || 'base'),
    head: snapshotIdentity(head, options.headLabel || 'head'),
    privacy: {
      sourceMode: 'none',
      excludes: ['absolute rootDir', 'source text'],
    },
    limitations: Array.from(new Set([...base.limitations, ...head.limitations])).sort(compareLocale),
    summary: {
      modules: collectionCounts(modules),
      functions: {
        ...collectionCounts(functions),
        moves: functions.moves.length,
        renames: functions.renames.length,
      },
      edges: collectionCounts(edges),
      deltas: {
        additions: modules.added.length + functions.added.length + edges.added.length,
        removals: modules.removed.length + functions.removed.length + edges.removed.length,
        changes: modules.changed.length + functions.changed.length + edges.changed.length,
        moves: functions.moves.length,
        renames: functions.renames.length,
      },
      reachable: {
        modules: {
          base: base.modules.filter((module) => module.reachable === true).length,
          head: head.modules.filter((module) => module.reachable === true).length,
          delta: head.modules.filter((module) => module.reachable === true).length
            - base.modules.filter((module) => module.reachable === true).length,
        },
        functions: {
          base: base.functions.filter((node) => node.reachable === true).length,
          head: head.functions.filter((node) => node.reachable === true).length,
          delta: head.functions.filter((node) => node.reachable === true).length
            - base.functions.filter((node) => node.reachable === true).length,
        },
      },
      findingsBySeverity: {
        ...findingsBySeverity(findings),
      },
    },
    modules,
    functions: publicFunctions,
    edges,
    findings,
    id: `diff_${stableHash({
      base: snapshotIdentity(base, options.baseLabel || 'base'),
      head: snapshotIdentity(head, options.headLabel || 'head'),
    })}`,
  };
}

export function compareSnapshots(baseSnapshot, headSnapshot, options = {}) {
  const base = normalizeSnapshot(baseSnapshot, 'base');
  const head = normalizeSnapshot(headSnapshot, 'head');
  if (base.meta.schemaVersion !== head.meta.schemaVersion) {
    throw new SnapshotDiffError('Snapshot schema versions are incompatible.', 'incompatible_snapshot');
  }
  return buildDiff(base, head, options);
}

function escapeHtml(value) {
  return normalizeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStat(label, value) {
  return `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderIdentity(label, identity = {}) {
  return [
    '<dl class="identity">',
    `<dt>${escapeHtml(label)}</dt>`,
    `<dd>${escapeHtml(identity.label || '')}</dd>`,
    '<dt>Entry</dt>',
    `<dd>${escapeHtml(identity.entry || 'unknown')}</dd>`,
    '<dt>Schema</dt>',
    `<dd>${escapeHtml(identity.schemaVersion || 'unknown')}</dd>`,
    '<dt>Build</dt>',
    `<dd>${escapeHtml(identity.buildId || 'unknown')}</dd>`,
    '<dt>Git</dt>',
    `<dd>${escapeHtml(identity.gitCommit || 'unknown')}</dd>`,
    '</dl>',
  ].join('');
}

function renderChangeList(changes = []) {
  if (!changes.length) return '<p class="muted">No field-level changes.</p>';
  return `<ul>${changes.map((change) => (
    `<li><code>${escapeHtml(change.field)}</code></li>`
  )).join('')}</ul>`;
}

function renderFinding(finding) {
  const location = finding.location?.path
    ? `${finding.location.path}${finding.location.startLine ? `:${finding.location.startLine}` : ''}`
    : 'No location';
  return [
    '<article class="finding">',
    `<h4>${escapeHtml(finding.ruleId)} <span>${escapeHtml(finding.severity)}</span></h4>`,
    `<p>${escapeHtml(finding.message)}</p>`,
    `<p class="muted">${escapeHtml(location)} · confidence ${escapeHtml(finding.confidence)}</p>`,
    '<details>',
    '<summary>Evidence</summary>',
    `<pre>${escapeHtml(JSON.stringify(finding.evidence, null, 2))}</pre>`,
    '</details>',
    '</article>',
  ].join('');
}

function renderFindings(findings = []) {
  if (!findings.length) return '<p class="muted">No structural findings.</p>';
  const groups = new Map();
  for (const finding of findings) {
    const key = `${finding.severity}\u0000${finding.ruleId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(finding);
  }
  return Array.from(groups, ([key, group]) => {
    const [severity, ruleId] = key.split('\u0000');
    return [
      '<details open class="group">',
      `<summary>${escapeHtml(severity)} · ${escapeHtml(ruleId)} (${group.length})</summary>`,
      group.map(renderFinding).join(''),
      '</details>',
    ].join('');
  }).join('');
}

function renderModules(modules = {}) {
  return [
    '<details open><summary>Modules</summary>',
    '<div class="columns">',
    renderNamedList('Added', modules.added, (item) => `${item.path} (${item.lineCount} lines)`),
    renderNamedList('Removed', modules.removed, (item) => `${item.path} (${item.lineCount} lines)`),
    renderNamedList('Changed', modules.changed, (item) => `${item.path}: ${item.changedFields.join(', ')}`),
    '</div>',
    '</details>',
  ].join('');
}

function renderFunctions(functions = {}) {
  return [
    '<details open><summary>Functions</summary>',
    '<div class="columns">',
    renderNamedList('Added', functions.added, (item) => `${item.modulePath}:${item.name}`),
    renderNamedList('Removed', functions.removed, (item) => `${item.modulePath}:${item.name}`),
    renderNamedList('Changed', functions.changed, (item) => (
      `${item.base.modulePath}:${item.base.name} -> ${item.head.modulePath}:${item.head.name} (${item.matchKind}, ${item.confidence})`
    ), renderChangeList),
    '</div>',
    '</details>',
  ].join('');
}

function renderEdges(edges = {}) {
  return [
    '<details open><summary>Function Edges</summary>',
    '<div class="columns">',
    renderNamedList('Added', edges.added, (item) => `${item.source.modulePath}:${item.source.name} -> ${item.target.modulePath}:${item.target.name}`),
    renderNamedList('Removed', edges.removed, (item) => `${item.source.modulePath}:${item.source.name} -> ${item.target.modulePath}:${item.target.name}`),
    renderNamedList('Changed', edges.changed, (item) => (
      `${item.base.source.modulePath}:${item.base.source.name} -> ${item.base.target.modulePath}:${item.base.target.name}: ${item.changedFields.join(', ')}`
    )),
    '</div>',
    '</details>',
  ].join('');
}

function renderNamedList(title, items = [], labelForItem, detailForItem = null) {
  const rows = items.length
    ? items.map((item) => [
      '<li>',
      `<span>${escapeHtml(labelForItem(item))}</span>`,
      detailForItem ? detailForItem(item.changes || []) : '',
      '</li>',
    ].join('')).join('')
    : '<li class="muted">None</li>';
  return `<section class="list"><h3>${escapeHtml(title)}</h3><ul>${rows}</ul></section>`;
}

export function renderDiffHtml(diff = {}) {
  const summary = diff.summary || {};
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>IronGlancer Architecture Diff</title>',
    '<style>',
    ':root{color-scheme:light;--ink:#17202a;--muted:#5b6673;--line:#d8dee4;--paper:#fff;--band:#f6f8fa;--accent:#0f766e;--error:#b42318;--warning:#a15c07;--note:#175cd3;}',
    '*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--paper)}',
    'header{padding:28px max(20px,5vw);background:var(--band);border-bottom:1px solid var(--line)}main{padding:24px max(20px,5vw);display:grid;gap:24px}',
    'h1{margin:0 0 8px;font-size:clamp(24px,3vw,38px)}h2{margin:0 0 12px;font-size:20px}h3{margin:0 0 8px;font-size:15px}h4{margin:0 0 6px;font-size:14px}',
    '.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}.stat{border:1px solid var(--line);border-radius:8px;padding:12px;background:#fff}.stat span{display:block;color:var(--muted);font-size:12px}.stat strong{font-size:22px}',
    '.identities{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.identity{display:grid;grid-template-columns:72px 1fr;gap:6px 10px;margin:0}.identity dt{color:var(--muted)}.identity dd{margin:0;overflow-wrap:anywhere}',
    'details{border:1px solid var(--line);border-radius:8px;background:#fff;padding:12px}summary{cursor:pointer;font-weight:700}.group{margin-bottom:10px}.finding{border-top:1px solid var(--line);padding-top:10px;margin-top:10px}.finding h4 span{font-weight:600;color:var(--muted)}',
    '.columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.list ul{margin:0;padding-left:18px}.list li{margin:6px 0;overflow-wrap:anywhere}.muted{color:var(--muted)}code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}pre{white-space:pre-wrap;background:var(--band);padding:10px;border-radius:6px;overflow:auto}',
    '</style>',
    '</head>',
    '<body>',
    '<header>',
    '<h1>IronGlancer Architecture Diff</h1>',
    `<p class="muted">Generated ${escapeHtml(diff.generatedAt || 'unknown')} · sourceMode ${escapeHtml(diff.privacy?.sourceMode || 'none')}</p>`,
    '</header>',
    '<main>',
    '<section>',
    '<h2>Executive Summary</h2>',
    '<div class="summary">',
    renderStat('Module changes', `${summary.modules?.added || 0}+ / ${summary.modules?.removed || 0}- / ${summary.modules?.changed || 0} changed`),
    renderStat('Function changes', `${summary.functions?.added || 0}+ / ${summary.functions?.removed || 0}- / ${summary.functions?.changed || 0} changed`),
    renderStat('Moves / renames', `${summary.functions?.moves || 0} / ${summary.functions?.renames || 0}`),
    renderStat('Edge changes', `${summary.edges?.added || 0}+ / ${summary.edges?.removed || 0}- / ${summary.edges?.changed || 0} changed`),
    renderStat('Findings', `${summary.findingsBySeverity?.error || 0} errors, ${summary.findingsBySeverity?.warning || 0} warnings, ${summary.findingsBySeverity?.note || 0} notes`),
    '</div>',
    '</section>',
    '<section>',
    '<h2>Snapshot Identity</h2>',
    '<div class="identities">',
    renderIdentity('Base', diff.base),
    renderIdentity('Head', diff.head),
    '</div>',
    '</section>',
    '<section><h2>Findings</h2>',
    renderFindings(diff.findings || []),
    '</section>',
    '<section><h2>Changes</h2>',
    renderModules(diff.modules),
    renderFunctions(diff.functions),
    renderEdges(diff.edges),
    '</section>',
    '<section><h2>Static-analysis limitations</h2>',
    `<ul>${(diff.limitations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`,
    `<p class="muted">Privacy: ${escapeHtml((diff.privacy?.excludes || []).join(', '))}; no source excerpts are included.</p>`,
    '</section>',
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}

function safeArtifactUri(value) {
  return normalizeString(value)
    .replace(/\\/g, '/')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\/+/, '')
    .replace(/(?:^|\/)\.\.(?=\/|$)/g, '')
    .trim();
}

function sarifRegion(location = {}) {
  const region = {};
  if (Number.isInteger(location.startLine)) region.startLine = location.startLine;
  if (Number.isInteger(location.endLine)) region.endLine = location.endLine;
  return Object.keys(region).length > 0 ? region : null;
}

function sarifLocation(location = {}) {
  const uri = safeArtifactUri(location.path);
  if (!uri) return null;
  const physicalLocation = {
    artifactLocation: { uri },
  };
  const region = sarifRegion(location);
  if (region) physicalLocation.region = region;
  return { physicalLocation };
}

function sarifLevel(severity) {
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'warning';
  return 'note';
}

export function renderDiffSarif(diff = {}) {
  const rules = RULE_DEFINITIONS.map((rule) => ({
    id: rule.id,
    name: rule.name,
    shortDescription: { text: rule.shortDescription },
    help: { text: rule.help, markdown: rule.help },
    properties: {
      category: 'architecture-diff',
    },
  }));
  const ruleIndexById = new Map(rules.map((rule, index) => [rule.id, index]));
  const results = (Array.isArray(diff.findings) ? diff.findings : []).map((finding) => {
    const location = sarifLocation(finding.location);
    return {
      ruleId: finding.ruleId,
      ruleIndex: ruleIndexById.get(finding.ruleId) ?? -1,
      level: sarifLevel(finding.severity),
      message: { text: normalizeString(finding.message) },
      ...(location ? { locations: [location] } : {}),
      properties: {
        id: finding.id,
        severity: finding.severity,
        confidence: finding.confidence,
        evidence: finding.evidence || {},
      },
    };
  });
  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [{
      tool: {
        driver: {
          name: 'IronGlancer',
          informationUri: 'https://github.com/karpatic/ironglancer',
          rules,
        },
      },
      invocations: [{
        executionSuccessful: true,
        properties: {
          diffSchemaVersion: diff.schemaVersion || DIFF_SCHEMA_VERSION,
          base: diff.base || {},
          head: diff.head || {},
          privacy: diff.privacy || { sourceMode: 'none' },
          limitations: diff.limitations || [],
        },
      }],
      results,
    }],
  };
}
