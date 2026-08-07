import path from 'node:path';

import { compareLocale, normalizeString, toPosixPath } from '../utils.js';
import { nodeBuiltinSpecifier } from '../resolution/module-resolver.js';
import {
  componentSpans,
  declarationImportMetricsFor,
  declarationLineCount,
  defaultExportDeclarationName,
  emptyDeclarationImportMetrics,
  importBindingDeclarationTarget,
  importedScriptMembersForJsx,
  importRefIsTypeOnly,
} from './function-analysis.js';
import { buildClassIds, isJsxModule, jsxModuleRecords, moduleRecords, uniqueRecords } from './module-records.js';
import { formatLineCount } from './source-metrics.js';

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
  const target = importBindingDeclarationTarget(targetRecord, binding);
  return target?.span?.lineCount || declarationLineCount(targetRecord, target?.declarationName);
}

function edgeRestingLabel(loadKinds) {
  const kinds = Array.isArray(loadKinds) ? loadKinds : Array.from(loadKinds || []);
  const isLazyOnly = kinds.length > 0
    && kinds.every((kind) => kind === 'lazy' || kind === 'dynamic');
  return isLazyOnly ? 'lazy' : 'import';
}

export function buildImportEdges(graph, { reachableOnly = false } = {}) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly });
  const classIds = buildClassIds(jsxModules);
  const edgeMap = new Map();

  for (const record of jsxModules) {
    const source = classIds.get(record.rel);
    for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
      if (importRefIsTypeOnly(ref)) continue;
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

export function buildMermaid(graph, importEdges, declarationImportMetrics, { reachableOnly = false } = {}) {
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

export function buildTreeText(graph) {
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

export function buildJsxTreeText(jsxScripts) {
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

export function buildReachableModuleSet(modules, entryRel) {
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

export function reachableGraphView(graph) {
  return {
    ...graph,
    modules: new Map(moduleRecords(graph, { reachableOnly: true }).map((record) => [record.rel, record])),
  };
}

function componentKey(modulePath, name) {
  return `${modulePath}\u0000${name}`;
}

export function buildComponents(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.components) ? record.components : [])
      .map((component) => ({
        ...component,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
      || compareLocale(a.name, b.name)
      || a.startLine - b.startLine);
}

function importedBindingComponentTarget(record, graph, componentByModuleAndName, localName) {
  for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
    if (!ref.localRel) continue;
    const binding = (Array.isArray(ref.bindings) ? ref.bindings : [])
      .find((candidate) => candidate.local === localName);
    if (!binding) continue;
    const targetName = binding.imported === 'default' ? defaultExportDeclarationName(graph.modules.get(ref.localRel)) : binding.imported;
    const key = componentKey(ref.localRel, targetName || localName);
    if (componentByModuleAndName.has(key)) return componentByModuleAndName.get(key);
  }
  return null;
}

export function buildComponentRenderEdges(graph, components) {
  const componentByModuleAndName = new Map(components.map((component) => [
    componentKey(component.modulePath, component.name),
    component,
  ]));
  const edges = [];
  for (const record of moduleRecords(graph)) {
    for (const ref of Array.isArray(record.componentRefs) ? record.componentRefs : []) {
      if (!ref.owner || ref.owner === ref.component) continue;
      const localTarget = componentByModuleAndName.get(componentKey(record.rel, ref.component));
      const importedTarget = localTarget || importedBindingComponentTarget(record, graph, componentByModuleAndName, ref.component);
      edges.push({
        sourceModulePath: record.rel,
        sourceComponent: ref.owner,
        targetModulePath: importedTarget?.modulePath || null,
        targetComponent: importedTarget?.name || ref.component,
        kind: ref.sourceKind || 'jsx-element',
        line: ref.line,
        resolved: Boolean(importedTarget || localTarget),
      });
    }
  }
  return uniqueRecords(edges, (edge) => [
    edge.sourceModulePath,
    edge.sourceComponent,
    edge.targetModulePath || '',
    edge.targetComponent,
    edge.kind,
    edge.line,
  ].join('\u0000')).sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
    || compareLocale(a.sourceComponent, b.sourceComponent)
    || compareLocale(a.targetModulePath || '', b.targetModulePath || '')
    || compareLocale(a.targetComponent, b.targetComponent)
    || a.line - b.line);
}

export function buildRoutes(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.routes) ? record.routes : [])
      .map((route) => ({
        ...route,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.path, b.path)
      || compareLocale(a.modulePath, b.modulePath)
      || compareLocale(a.component, b.component)
      || a.line - b.line);
}

export function buildCommonJsSyntax(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.commonJsRefs) ? record.commonJsRefs : [])
      .map((ref) => ({
        ...ref,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
      || a.line - b.line
      || compareLocale(a.kind, b.kind));
}

function assetRecordForRef(record, ref) {
  return {
    sourceModulePath: record.rel,
    specifier: ref.specifier,
    path: ref.assetRel || ref.localRel || null,
    kind: ref.kind === 'worker' ? 'worker' : ref.assetKind || 'unknown',
    loadKind: ref.kind,
    resolved: ref.resolution === 'asset' || (ref.kind === 'worker' && ref.resolution === 'local'),
  };
}

export function buildAssets(graph) {
  return uniqueRecords(moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'asset' || ref.kind === 'worker')
      .map((ref) => assetRecordForRef(record, ref))), (asset) => [
      asset.sourceModulePath,
      asset.specifier,
      asset.path || '',
      asset.loadKind,
    ].join('\u0000'))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.path || '', b.path || '')
      || compareLocale(a.specifier, b.specifier));
}

export function buildLazyBoundaries(graph) {
  return uniqueRecords(moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ['lazy', 'dynamic', 'worker'].includes(ref.kind))
      .map((ref) => ({
        sourceModulePath: record.rel,
        targetModulePath: ref.localRel || null,
        specifier: ref.specifier,
        kind: ref.kind === 'worker' ? 'worker' : ref.kind === 'lazy' ? 'react-lazy' : 'dynamic-import',
        resolved: ref.resolution === 'local',
      }))), (boundary) => [
      boundary.sourceModulePath,
      boundary.targetModulePath || '',
      boundary.specifier,
      boundary.kind,
    ].join('\u0000'))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.targetModulePath || '', b.targetModulePath || '')
      || compareLocale(a.specifier, b.specifier));
}

export function buildRemoteImports(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'remote')
      .map((ref) => ({
        sourceModulePath: record.rel,
        specifier: ref.specifier,
        loadKind: ref.kind,
      })))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.specifier, b.specifier));
}

export function buildUnresolvedImports(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'unresolved')
      .map((ref) => ({
        sourceModulePath: record.rel,
        specifier: ref.specifier,
        loadKind: ref.kind,
        unresolvedReason: ref.unresolvedReason || 'not_found',
      })))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.specifier, b.specifier));
}

export function buildBrowserIncompatibleImports(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'browser-incompatible')
      .map((ref) => ({
        sourceModulePath: record.rel,
        specifier: ref.specifier,
        nodeBuiltin: ref.nodeBuiltin || nodeBuiltinSpecifier(ref.specifier),
        loadKind: ref.kind,
      })))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.specifier, b.specifier));
}

export function filterGraphToReachable(graph) {
  const reachableModules = new Map(moduleRecords(graph, { reachableOnly: true }).map((record) => [record.rel, record]));
  const externals = new Set();
  for (const record of reachableModules.values()) {
    record.localDeps = record.localDeps.filter((dep) => reachableModules.has(dep));
    for (const external of record.externalDeps) externals.add(external);
  }
  graph.modules = reachableModules;
  graph.externals = externals;
  graph.reachableModules = new Set(reachableModules.keys());
}
