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

async function resolveImport({ rootDir, specifier, importerRel, aliases }) {
  const raw = normalizeString(specifier).trim();
  if (!raw || /^https?:\/\//i.test(raw)) return null;
  const aliasTarget = aliases.get(raw);
  if (aliasTarget) {
    const normalizedAlias = aliasTarget
      .replace('__REVIEW_ORIGIN__/', 'public/')
      .replace(/^\.\//, '')
      .replace(/^\//, '');
    return resolveFromRoot(rootDir, normalizedAlias);
  }
  if (raw.startsWith('/')) {
    const direct = await resolveFromRoot(rootDir, raw.replace(/^\//, ''));
    if (direct) return direct;
    return resolveFromRoot(rootDir, path.posix.join('public', raw.replace(/^\//, '')));
  }
  if (raw.startsWith('./') || raw.startsWith('../')) {
    const importerDir = path.posix.dirname(toPosixPath(importerRel));
    const relativePath = path.posix.normalize(path.posix.join(importerDir, raw));
    return resolveFromRoot(rootDir, relativePath);
  }
  return null;
}

function scriptStats(rel, source) {
  const lines = normalizeString(source).split(/\r?\n/);
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
    const name = importedScriptVariableName(ref);
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

export async function analyzeProject({ rootDir, entry, moduleLimit = 500 } = {}) {
  const resolvedRoot = path.resolve(normalizeString(rootDir).trim() || '.');
  const resolvedEntry = await resolveEntry(resolvedRoot, entry);
  const aliases = await loadImportAliases(resolvedRoot, resolvedEntry.rel);
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
      });
      if (local) {
        localDeps.push(local.rel);
        normalizedImportRefs.push({ ...ref, localRel: local.rel });
        if (!visited.has(local.rel)) queue.push(local);
      } else {
        const label = externalLabel(ref.specifier);
        if (label) {
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
  const jsxClassCount = Array.from(modules.keys()).filter((rel) => isJsxModule(rel)).length;
  const mermaid = buildMermaid(graph);
  const treeText = buildTreeText(graph);

  return {
    rootDir: resolvedRoot,
    entryRel: resolvedEntry.rel,
    graph,
    treeText,
    jsScripts,
    mermaid,
    summary: {
      moduleCount: modules.size,
      jsxClassCount,
      jsScriptCount: jsScripts.length,
      externalCount: externals.size,
    },
  };
}
