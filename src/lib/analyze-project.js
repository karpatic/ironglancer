import fs from 'node:fs/promises';
import path from 'node:path';

import { extractComponents, extractImportRefs } from './import-parser.js';
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
  if (!routeAliases) return [];
  if (routeAliases instanceof Map) {
    return Array.from(routeAliases, ([from, to]) => ({ from, to }));
  }
  if (Array.isArray(routeAliases)) return routeAliases;
  if (typeof routeAliases === 'string') return [parseRouteAliasString(routeAliases)];
  if (typeof routeAliases === 'object') {
    if ('from' in routeAliases || 'to' in routeAliases) return [routeAliases];
    return Object.entries(routeAliases).map(([from, to]) => ({ from, to }));
  }
  throw new Error('routeAliases must be an array, object, Map, or route=path string.');
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
      const source = typeof entry === 'string' ? parseRouteAliasString(entry) : entry;
      const from = normalizeRouteAliasFrom(Array.isArray(source) ? source[0] : source?.from);
      const targetSource = Array.isArray(source) ? source[1] : source?.to;
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
  if (!ref || Array.isArray(ref.symbols) === false || ref.symbols.length === 0) return '';
  return ref.symbols[0] || '';
}

function importedScriptVariablesForJsx(record) {
  const variables = new Set();
  for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
    if (ref?.localRel && isJsxModule(ref.localRel)) continue;
    if (isIgnoredExternalLabel(ref?.specifier)) continue;
    const name = importedScriptVariableName(ref);
    if (name === 'React') continue;
    if (name) variables.add(name);
  }
  return Array.from(variables).sort(compareLocale);
}

function buildMermaid(graph) {
  const jsxModules = Array.from(graph.modules.values())
    .filter((record) => isJsxModule(record.rel))
    .sort((a, b) => compareLocale(a.rel, b.rel));
  const classIds = buildClassIds(jsxModules);
  const lines = ['classDiagram'];
  if (jsxModules.length === 0) {
    lines.push('  %% No JSX modules found.');
    return lines.join('\n');
  }
  for (const record of jsxModules) {
    const classId = classIds.get(record.rel);
    const variables = importedScriptVariablesForJsx(record);
    const components = extractComponents(record.source);
    if (variables.length === 0 && components.length === 0) {
      lines.push(`  class ${classId}`);
      continue;
    }
    lines.push(`  class ${classId} {`);
    for (const variable of variables) lines.push(`    +${variable}`);
    for (const component of components) lines.push(`    +${component}()`);
    lines.push('  }');
  }
  for (const record of jsxModules) {
    const sourceId = classIds.get(record.rel);
    const jsxDeps = Array.from(new Set(record.localDeps))
      .filter((rel) => isJsxModule(rel) && classIds.has(rel))
      .sort(compareLocale);
    for (const dep of jsxDeps) {
      lines.push(`  ${sourceId} --> ${classIds.get(dep)} : imports`);
    }
  }
  return lines.join('\n');
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
  const mermaid = buildMermaid(graph);
  const treeText = buildTreeText(graph);
  const jsxTreeText = buildJsxTreeText(jsxScripts);

  return {
    rootDir: resolvedRoot,
    entryRel: resolvedEntry.rel,
    graph,
    treeText,
    jsxTreeText,
    jsScripts,
    jsxScripts,
    mermaid,
    summary: {
      moduleCount: modules.size,
      jsxClassCount,
      jsxFileCount: jsxScripts.length,
      jsScriptCount: jsScripts.length,
      externalCount: externals.size,
    },
  };
}
