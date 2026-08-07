import fs from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_FRAMEWORK, DEFAULT_MODULE_LIMIT, normalizeFramework, normalizeModuleLimit } from '../options.js';
import { createJavaScriptAstAnalysisContext } from '../javascript-ast-analysis.js';
import { compareLocale, isWithinPath, normalizeString } from '../utils.js';
import { mergeAliasMaps, normalizeImportAliases, normalizeRouteAliases, normalizeRouteAliasTarget } from '../resolution/aliases.js';
import { moduleEntriesForHtmlEntry } from '../resolution/html-entry.js';
import {
  DEFAULT_ROUTE_ALIASES,
  discoverAnalyzableModules,
  externalLabel,
  importSpecifierLooksLocal,
  includeUnreachableDiscoveryRoots,
  isAnalyzableModulePath,
  isIgnoredExternalLabel,
  isRemoteSpecifier,
  loadImportAliases,
  nodeBuiltinSpecifier,
  normalizeExcludes,
  pathMatchesExclude,
  remoteAliasTargetForSpecifier,
  resolveEntry,
  resolveImport,
} from '../resolution/module-resolver.js';
import { buildBrowserApis } from './browser-api-analysis.js';
import {
  buildDeclarationImportMetrics,
  buildDeclarationRelationships,
  buildFunctionDependencyMap,
  buildSourceCode,
} from './function-analysis.js';
import {
  buildAssets,
  buildBrowserIncompatibleImports,
  buildCommonJsSyntax,
  buildComponentRenderEdges,
  buildComponents,
  buildImportEdges,
  buildJsxTreeText,
  buildLazyBoundaries,
  buildMermaid,
  buildReachableModuleSet,
  buildRemoteImports,
  buildRoutes,
  buildTreeText,
  buildUnresolvedImports,
  filterGraphToReachable,
  reachableGraphView,
} from './module-graph.js';
import { isJsxModule, moduleRecords } from './module-records.js';
import { scriptStats } from './source-metrics.js';
import { frontEndFindings } from '../findings/findings.js';

export async function analyzeProject({
  rootDir,
  entry,
  moduleLimit = DEFAULT_MODULE_LIMIT,
  routeAliases = [],
  aliases: explicitAliases = [],
  framework = DEFAULT_FRAMEWORK,
  sourceRoot = '',
  includeUnreachable = false,
  exclude = [],
} = {}) {
  const effectiveModuleLimit = normalizeModuleLimit(moduleLimit);
  const effectiveFramework = normalizeFramework(framework);
  const requestedRoot = path.resolve(normalizeString(rootDir).trim() || '.');
  const normalizedSourceRoot = normalizeRouteAliasTarget(sourceRoot);
  const resolvedSourceRoot = normalizedSourceRoot
    ? path.resolve(requestedRoot, normalizedSourceRoot)
    : requestedRoot;
  if (!isWithinPath(requestedRoot, resolvedSourceRoot)) {
    throw new Error('--source-root must stay inside the project root.');
  }
  const resolvedRouteAliases = [
    ...normalizeRouteAliases(routeAliases),
    ...DEFAULT_ROUTE_ALIASES,
  ];
  let resolvedEntry = await resolveEntry(requestedRoot, entry);
  let htmlEntry = null;
  if (resolvedEntry.kind === 'html') {
    try {
      htmlEntry = await moduleEntriesForHtmlEntry({ rootDir: requestedRoot, htmlEntry: resolvedEntry, routeAliases: resolvedRouteAliases });
    } catch (error) {
      if (normalizeString(entry).trim()) throw error;
      resolvedEntry = await resolveEntry(requestedRoot, entry, { allowHtml: false });
    }
  }
  const entryModules = htmlEntry
    ? htmlEntry.entries
    : [resolvedEntry];
  const aliases = mergeAliasMaps(
    await loadImportAliases(requestedRoot, resolvedEntry.rel),
    htmlEntry?.aliases || new Map(),
    normalizeImportAliases(explicitAliases),
  );
  const normalizedExcludes = normalizeExcludes(exclude);
  for (const entryModule of entryModules) {
    if (!isAnalyzableModulePath(entryModule.rel)) {
      throw new Error(`Entry ${entryModule.rel} is not a browser JavaScript module (.js, .jsx, .mjs).`);
    }
    if (pathMatchesExclude(entryModule.rel, normalizedExcludes)) {
      throw new Error(`Entry ${entryModule.rel} is excluded from analysis.`);
    }
  }
  const astContext = createJavaScriptAstAnalysisContext();
  const modules = new Map();
  const queuedModules = new Map();
  const externals = new Set();

  const enqueueModule = (module) => {
    if (!module?.rel || modules.has(module.rel) || queuedModules.has(module.rel)) return;
    if (pathMatchesExclude(module.rel, normalizedExcludes)) return;
    if (modules.size + queuedModules.size >= effectiveModuleLimit) {
      throw new Error(`Module limit exceeded (${effectiveModuleLimit}).`);
    }
    queuedModules.set(module.rel, module);
  };

  const analyzeModule = async (current, {
    enqueueReachableImports = false,
    allowedUnreachableModules = null,
  } = {}) => {
    if (modules.has(current.rel)) return;
    if (modules.size >= effectiveModuleLimit) {
      throw new Error(`Module limit exceeded (${effectiveModuleLimit}).`);
    }
    const source = await fs.readFile(current.filePath, 'utf8');
    const ast = astContext.analyzeFile(current.filePath, source);
    const importRefs = ast.importRefs;
    const localDeps = [];
    const externalDeps = [];
    const normalizedImportRefs = [];

    for (const ref of importRefs) {
      const nodeBuiltin = nodeBuiltinSpecifier(ref.specifier);
      if (nodeBuiltin) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'browser-incompatible',
          unresolvedReason: 'node_builtin',
          nodeBuiltin,
        });
        continue;
      }

      if (isRemoteSpecifier(ref.specifier)) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'remote',
          unresolvedReason: null,
        });
        continue;
      }

      const remoteAliasTarget = remoteAliasTargetForSpecifier(ref.specifier, aliases);
      if (remoteAliasTarget) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          remoteUrl: remoteAliasTarget,
          resolution: 'remote',
          unresolvedReason: null,
        });
        continue;
      }

      const local = await resolveImport({
        rootDir: requestedRoot,
        specifier: ref.specifier,
        importerRel: current.rel,
        aliases,
        routeAliases: resolvedRouteAliases,
      });
      const localModuleAllowed = local?.kind === 'module'
        && !pathMatchesExclude(local.rel, normalizedExcludes)
        && (enqueueReachableImports || !allowedUnreachableModules || modules.has(local.rel) || allowedUnreachableModules.has(local.rel));
      if (localModuleAllowed) {
        localDeps.push(local.rel);
        normalizedImportRefs.push({
          ...ref,
          localRel: local.rel,
          resolution: 'local',
          unresolvedReason: null,
        });
        if (enqueueReachableImports) enqueueModule(local);
      } else if (local?.kind === 'asset') {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          assetRel: local.rel,
          assetKind: local.assetKind || 'unknown',
          resolution: 'asset',
          unresolvedReason: null,
        });
      } else if (local?.kind === 'unsupported-module') {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'unresolved',
          unresolvedReason: `unsupported_module_type${local.unsupportedExtension ? `:${local.unsupportedExtension}` : ''}`,
        });
      } else if (importSpecifierLooksLocal(ref.specifier, aliases, resolvedRouteAliases)) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'unresolved',
          unresolvedReason: local ? 'outside_analysis' : 'not_found',
        });
      } else {
        const label = externalLabel(ref.specifier);
        if (label && !isIgnoredExternalLabel(label)) {
          externals.add(label);
          externalDeps.push(label);
        }
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'external',
          unresolvedReason: null,
        });
      }
    }

    modules.set(current.rel, {
      rel: current.rel,
      source,
      stats: scriptStats(current.rel, source),
      declarationSpans: ast.declarationSpans,
      typeOnlyRanges: ast.typeOnlyRanges,
      components: ast.components,
      componentRefs: ast.componentRefs,
      routes: effectiveFramework === 'vanilla' ? [] : ast.routes,
      browserApis: ast.browserApis,
      commonJsRefs: ast.commonJsRefs,
      importRefs: normalizedImportRefs,
      localDeps: Array.from(new Set(localDeps)).sort(compareLocale),
      externalDeps: Array.from(new Set(externalDeps)).sort(compareLocale),
    });
  };

  for (const entryModule of entryModules) enqueueModule(entryModule);
  while (queuedModules.size > 0) {
    const [rel, current] = Array.from(queuedModules).sort(([left], [right]) => compareLocale(left, right))[0];
    queuedModules.delete(rel);
    await analyzeModule(current, { enqueueReachableImports: true });
  }

  if (includeUnreachable) {
    const discoveryRoots = includeUnreachableDiscoveryRoots({
      sourceRoot: normalizedSourceRoot,
      entryModules,
    });
    const discoveredModules = await discoverAnalyzableModules(
      requestedRoot,
      effectiveModuleLimit,
      normalizedExcludes,
      discoveryRoots,
    );
    const allowedUnreachableModules = new Set(discoveredModules.map((module) => module.rel));
    for (const current of discoveredModules) {
      await analyzeModule(current, { allowedUnreachableModules });
    }
  }

  const reachableModules = new Set();
  for (const entryModule of entryModules) {
    for (const rel of buildReachableModuleSet(modules, entryModule.rel)) reachableModules.add(rel);
  }
  for (const record of modules.values()) {
    record.reachable = reachableModules.has(record.rel);
  }

  const graph = {
    rootDir: requestedRoot,
    projectRoot: requestedRoot,
    sourceRoot: normalizedSourceRoot || '.',
    entryRel: resolvedEntry.rel,
    entryKind: resolvedEntry.kind,
    entryModuleRels: entryModules.map((module) => module.rel).sort(compareLocale),
    modules,
    reachableModules,
    externals,
  };
  if (!includeUnreachable) filterGraphToReachable(graph);

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
    functionDependencyMap,
  );
  const treeText = buildTreeText(graph);
  const jsxTreeText = buildJsxTreeText(reachableJsxScripts);
  const components = buildComponents(graph);
  const componentEdges = buildComponentRenderEdges(graph, components);
  const routes = buildRoutes(graph);
  const browserApis = buildBrowserApis(graph);
  const commonJsSyntax = buildCommonJsSyntax(graph);
  const assets = buildAssets(graph);
  const lazyBoundaries = buildLazyBoundaries(graph);
  const remoteImports = buildRemoteImports(graph);
  const unresolvedImports = buildUnresolvedImports(graph);
  const browserIncompatibleImports = buildBrowserIncompatibleImports(graph);
  const findings = frontEndFindings({
    unresolvedImports,
    browserIncompatibleImports,
    remoteImports,
    commonJsSyntax,
  });

  return {
    rootDir: requestedRoot,
    entryRel: resolvedEntry.rel,
    entryKind: resolvedEntry.kind,
    entryModules: graph.entryModuleRels,
    graph,
    treeText,
    jsxTreeText,
    jsScripts,
    jsxScripts,
    mermaid,
    importEdges,
    components,
    componentEdges,
    routes,
    lazyBoundaries,
    assets,
    browserApis,
    remoteImports,
    unresolvedImports,
    browserIncompatibleImports,
    commonJsSyntax,
    findings,
    sourceCode,
    functionDependencyMap,
    metadata: {
      analyzer: {
        ...astContext.analyzer,
      },
      backend: {
        ...astContext.analyzer,
      },
      framework: effectiveFramework,
      includeUnreachable: Boolean(includeUnreachable),
      excludes: normalizedExcludes,
      aliases: Array.from(aliases, ([from, to]) => ({ from, to })).sort((a, b) => compareLocale(a.from, b.from)),
      moduleLimit: {
        limit: effectiveModuleLimit,
        count: modules.size,
      },
    },
    summary: {
      moduleCount: modules.size,
      reachableModuleCount: reachableModules.size,
      unreachableModuleCount: modules.size - reachableModules.size,
      jsxClassCount,
      jsxFileCount: jsxScripts.length,
      reachableJsxFileCount: reachableJsxScripts.length,
      jsScriptCount: jsScripts.length,
      reachableJsScriptCount: reachableJsScripts.length,
      externalCount: graph.externals.size,
      componentCount: components.length,
      componentEdgeCount: componentEdges.length,
      routeCount: routes.length,
      lazyBoundaryCount: lazyBoundaries.length,
      assetCount: assets.length,
      browserApiCount: browserApis.length,
      remoteImportCount: remoteImports.length,
      unresolvedImportCount: unresolvedImports.length,
      browserIncompatibleImportCount: browserIncompatibleImports.length,
      findingCount: findings.length,
    },
  };
}
