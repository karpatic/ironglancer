import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';

import { analyzeProject } from './analyze-project.js';
import {
  DEFAULT_MODULE_LIMIT,
  DEFAULT_SOURCE_MODE,
  normalizeModuleLimit,
  normalizeSourceMode,
  sourcePrivacyMetadata,
} from './options.js';
import { compareLocale, toPosixPath } from './utils.js';
import { viewerHtml } from '../viewer/html.js';

const require = createRequire(import.meta.url);
const execFile = promisify(execFileCallback);
const packageMeta = require('../../package.json');
const viewerAppUrl = new URL('../viewer/app.js', import.meta.url);
const API_VERSION = 'v1';
const SCHEMA_VERSION = '0.2.0';
const API_DATA_DIR = '.ironglancer-api';
const OUTPUT_MARKER_FILE = '.ironglancer-output.json';

const CREDENTIAL_VALUE_PATTERNS = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk_live_[A-Za-z0-9]{16,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const CREDENTIAL_ASSIGNMENT_PATTERN = /(?:^|[^\w$])([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g;

function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map((item) => stableJson(item)).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => (
      JSON.stringify(key) + ':' + stableJson(value[key])
    )).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeCredentialIdentifier(identifier) {
  return String(identifier || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function isSensitiveCredentialName(identifier) {
  const normalized = normalizeCredentialIdentifier(identifier);
  const parts = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const joined = parts.join('_');
  return [
    'api_key',
    'access_key',
    'access_token',
    'auth_token',
    'id_token',
    'refresh_token',
    'client_secret',
    'private_key',
    'secret_access_key',
    'secret_key',
  ].some((phrase) => joined.includes(phrase))
    || parts.includes('credential')
    || parts.includes('credentials')
    || parts.includes('passwd')
    || parts.includes('password')
    || parts.includes('secret')
    || parts.includes('token');
}

function looksLikeCredentialValue(value) {
  const text = String(value || '').trim();
  if (CREDENTIAL_VALUE_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (text.length < 16) return false;
  if (/\s/.test(text)) return false;
  if (!/^[A-Za-z0-9_./+=:-]+$/.test(text)) return false;

  const characterClassCount = [
    /[a-z]/.test(text),
    /[A-Z]/.test(text),
    /\d/.test(text),
    /[_./+=:-]/.test(text),
  ].filter(Boolean).length;
  return characterClassCount >= 2;
}

function hasCredentialLiteral(code) {
  if (CREDENTIAL_VALUE_PATTERNS.some((pattern) => pattern.test(code))) return true;

  let match;
  CREDENTIAL_ASSIGNMENT_PATTERN.lastIndex = 0;
  while ((match = CREDENTIAL_ASSIGNMENT_PATTERN.exec(code))) {
    if (isSensitiveCredentialName(match[1]) && looksLikeCredentialValue(match[3])) return true;
  }
  return false;
}

function assertNoCredentialLiterals(sourceCode = {}) {
  for (const moduleSource of Array.isArray(sourceCode.modules) ? sourceCode.modules : []) {
    const code = typeof moduleSource.code === 'string' ? moduleSource.code : '';
    if (!code) continue;
    if (!hasCredentialLiteral(code)) continue;
    const sourcePath = moduleSource.path || 'unknown source';
    const endLine = moduleSource.lineCount || '?';
    throw new Error(
      `Refusing to write source module data: credential-looking literal in ${sourcePath}:1-${endLine}.`,
    );
  }
  for (const declaration of Array.isArray(sourceCode.declarations) ? sourceCode.declarations : []) {
    const code = typeof declaration.code === 'string' ? declaration.code : '';
    if (!code) continue;
    if (!hasCredentialLiteral(code)) continue;
    const sourcePath = declaration.modulePath || 'unknown source';
    const startLine = declaration.startLine || '?';
    const endLine = declaration.endLine || '?';
    throw new Error(
      `Refusing to write source-code.json: credential-looking literal in ${sourcePath}:${startLine}-${endLine}.`,
    );
  }
}

async function copyMermaidAsset(outDir) {
  const packageJsonPath = require.resolve('mermaid/package.json');
  const mermaidDistDir = path.join(path.dirname(packageJsonPath), 'dist');
  const vendorDir = path.join(outDir, 'vendor');
  await fs.mkdir(vendorDir, { recursive: true });
  await fs.copyFile(
    path.join(mermaidDistDir, 'mermaid.esm.min.mjs'),
    path.join(vendorDir, 'mermaid.esm.min.mjs'),
  );

  const mermaidChunksDir = path.join(mermaidDistDir, 'chunks');
  await fs.cp(
    mermaidChunksDir,
    path.join(vendorDir, 'chunks'),
    { recursive: true },
  );
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function contentHash(value) {
  return sha256(stableJson(value));
}

async function gitCommitForRoot(rootDir) {
  try {
    const { stdout } = await execFile('git', ['-C', rootDir, 'rev-parse', 'HEAD']);
    const commit = stdout.trim();
    return /^[a-f0-9]{40}$/i.test(commit) ? commit : null;
  } catch {
    return null;
  }
}

function analysisPayload(analysis) {
  return {
    rootDir: null,
    entry: analysis.entryRel,
    entryKind: analysis.entryKind || 'module',
    entryModules: Array.isArray(analysis.entryModules) ? analysis.entryModules : [analysis.entryRel].filter(Boolean),
    modules: analysisModulesPayload(analysis),
    treeText: analysis.treeText,
    jsxTreeText: analysis.jsxTreeText,
    jsScripts: analysis.jsScripts,
    jsxScripts: analysis.jsxScripts,
    mermaid: analysis.mermaid,
    importEdges: analysis.importEdges,
    components: Array.isArray(analysis.components) ? analysis.components : [],
    componentEdges: Array.isArray(analysis.componentEdges) ? analysis.componentEdges : [],
    routes: Array.isArray(analysis.routes) ? analysis.routes : [],
    lazyBoundaries: Array.isArray(analysis.lazyBoundaries) ? analysis.lazyBoundaries : [],
    assets: Array.isArray(analysis.assets) ? analysis.assets : [],
    browserApis: Array.isArray(analysis.browserApis) ? analysis.browserApis : [],
    remoteImports: Array.isArray(analysis.remoteImports) ? analysis.remoteImports : [],
    unresolvedImports: Array.isArray(analysis.unresolvedImports) ? analysis.unresolvedImports : [],
    browserIncompatibleImports: Array.isArray(analysis.browserIncompatibleImports) ? analysis.browserIncompatibleImports : [],
    commonJsSyntax: Array.isArray(analysis.commonJsSyntax) ? analysis.commonJsSyntax : [],
    findings: Array.isArray(analysis.findings) ? analysis.findings : [],
    functionMap: functionDependencyPayload(analysis.functionDependencyMap),
    summary: analysis.summary,
  };
}

function declarationSourcePayload(sourceCode = {}) {
  return {
    declarations: Array.isArray(sourceCode.declarations) ? sourceCode.declarations : [],
  };
}

function safeRelativeModulePath(modulePath) {
  const normalized = toPosixPath(String(modulePath || '').trim()).replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return '';
  if (normalized.split('/').includes('..')) return '';
  return normalized;
}

function moduleSourcePayload(sourceCode = {}) {
  return {
    modules: (Array.isArray(sourceCode.modules) ? sourceCode.modules : []).map((moduleSource) => {
      const modulePath = safeRelativeModulePath(moduleSource?.path);
      if (!modulePath) {
        throw new Error(`Refusing to write source module data: unsafe module path ${JSON.stringify(moduleSource?.path)}.`);
      }
      return {
        ...moduleSource,
        path: modulePath,
        code: typeof moduleSource?.code === 'string' ? moduleSource.code : '',
      };
    }),
  };
}

function functionDependencyPayload(functionDependencyMap = {}) {
  return {
    limitations: Array.isArray(functionDependencyMap.limitations) ? functionDependencyMap.limitations : [],
    functions: Array.isArray(functionDependencyMap.functions) ? functionDependencyMap.functions : [],
    edges: Array.isArray(functionDependencyMap.edges) ? functionDependencyMap.edges : [],
  };
}

function isJsxModulePath(modulePath) {
  return /\.jsx$/i.test(modulePath);
}

function sanitizedImportRef(ref = {}) {
  return {
    specifier: typeof ref.specifier === 'string' ? ref.specifier : '',
    kind: typeof ref.kind === 'string' ? ref.kind : '',
    typeOnly: Boolean(ref.typeOnly),
    localRel: typeof ref.localRel === 'string' ? ref.localRel : null,
    assetRel: typeof ref.assetRel === 'string' ? ref.assetRel : null,
    assetKind: typeof ref.assetKind === 'string' ? ref.assetKind : null,
    remoteUrl: typeof ref.remoteUrl === 'string' ? ref.remoteUrl : null,
    nodeBuiltin: typeof ref.nodeBuiltin === 'string' ? ref.nodeBuiltin : null,
    resolution: ['local', 'asset', 'external', 'remote', 'browser-incompatible', 'unresolved'].includes(ref.resolution)
      ? ref.resolution
      : null,
    unresolvedReason: typeof ref.unresolvedReason === 'string' ? ref.unresolvedReason : null,
    bindings: Array.isArray(ref.bindings)
      ? ref.bindings.map((binding) => ({
        imported: typeof binding.imported === 'string' ? binding.imported : '',
        local: typeof binding.local === 'string' ? binding.local : '',
        kind: typeof binding.kind === 'string' ? binding.kind : '',
        inferred: Boolean(binding.inferred),
        typeOnly: Boolean(binding.typeOnly),
      }))
      : [],
  };
}

function analysisModulesPayload(analysis = {}) {
  const modules = analysis?.graph?.modules instanceof Map
    ? Array.from(analysis.graph.modules.values())
    : [];
  return modules
    .map((record) => ({
      path: record.rel,
      lineCount: record.stats?.lineCount || 0,
      maxLineLength: record.stats?.maxLineLength || 0,
      reachable: Boolean(record.reachable),
      isJsx: isJsxModulePath(record.rel),
      localDependencies: Array.isArray(record.localDeps) ? record.localDeps : [],
      externalDependencies: Array.isArray(record.externalDeps) ? record.externalDeps : [],
      importRefs: Array.isArray(record.importRefs) ? record.importRefs.map(sanitizedImportRef) : [],
    }))
    .sort((a, b) => compareLocale(a.path, b.path));
}

function samePath(a, b) {
  return path.resolve(a) === path.resolve(b);
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function normalizeOutputExclude(value) {
  return toPosixPath(String(value || '').trim())
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/g, '');
}

function outputRelativeExclude({ rootDir, outDir }) {
  const resolvedRoot = path.resolve(rootDir || '.');
  const resolvedOut = path.resolve(outDir);
  if (!isPathInside(resolvedRoot, resolvedOut)) return '';
  return normalizeOutputExclude(path.relative(resolvedRoot, resolvedOut));
}

function withAutomaticOutputExclude(exclude, { rootDir, outDir }) {
  const outputExclude = outputRelativeExclude({ rootDir, outDir });
  if (!outputExclude) return exclude;
  const values = Array.isArray(exclude) ? [...exclude] : [exclude].filter((value) => value != null && value !== false);
  const hasOutputExclude = values.some((value) => normalizeOutputExclude(value) === outputExclude);
  return hasOutputExclude ? values : [...values, outputExclude];
}

function unsafeOutputReason({ outDir, rootDir }) {
  const resolvedOut = path.resolve(outDir);
  const resolvedRoot = path.resolve(rootDir);
  const home = path.resolve(os.homedir());
  const cwd = path.resolve(process.cwd());
  if (samePath(resolvedOut, path.parse(resolvedOut).root)) return 'filesystem root';
  if (samePath(resolvedOut, home)) return 'home directory';
  if (samePath(resolvedOut, cwd)) return 'current working directory';
  if (samePath(resolvedOut, resolvedRoot)) return 'project/source root';
  if (isPathInside(resolvedOut, resolvedRoot)) return 'source ancestor';
  return '';
}

async function assertReplaceableOutputDir(outDir) {
  try {
    const stat = await fs.stat(outDir);
    if (!stat.isDirectory()) {
      throw new Error(`Refusing to replace output target ${outDir}: target exists and is not a directory.`);
    }
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  const entries = await fs.readdir(outDir);
  if (entries.length === 0) return;

  try {
    const marker = JSON.parse(await fs.readFile(path.join(outDir, OUTPUT_MARKER_FILE), 'utf8'));
    if (marker?.packageName !== packageMeta.name || marker?.owner !== 'IronGlancer') {
      throw new Error('marker does not belong to IronGlancer');
    }
  } catch (error) {
    throw new Error(
      `Refusing to replace ${outDir}: existing directory lacks a valid IronGlancer ownership marker (${OUTPUT_MARKER_FILE}).`,
    );
  }
}

async function replaceOutputDirAtomically(tempDir, outDir) {
  let backupDir = '';
  try {
    await fs.stat(outDir);
    backupDir = path.join(path.dirname(outDir), `.${path.basename(outDir)}.previous-${process.pid}-${Date.now()}`);
    await fs.rename(outDir, backupDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  try {
    await fs.rename(tempDir, outDir);
  } catch (error) {
    if (backupDir) {
      await fs.rename(backupDir, outDir).catch(() => {});
    }
    throw error;
  }

  if (backupDir) await fs.rm(backupDir, { recursive: true, force: true });
}

export async function generateStaticSite({
  rootDir,
  entry,
  outDir,
  routeAliases,
  aliases,
  framework,
  sourceRoot,
  includeSource = false,
  includeUnreachable = false,
  exclude = [],
  sourceMode = DEFAULT_SOURCE_MODE,
  moduleLimit = DEFAULT_MODULE_LIMIT,
} = {}) {
  const effectiveSourceMode = includeSource ? 'full' : normalizeSourceMode(sourceMode);
  const effectiveModuleLimit = normalizeModuleLimit(moduleLimit);
  const resolvedOutDir = path.resolve(outDir || 'ironglancer-site');
  const analysisExclude = withAutomaticOutputExclude(exclude, {
    rootDir,
    outDir: resolvedOutDir,
  });
  const analysis = await analyzeProject({
    rootDir,
    entry,
    routeAliases,
    aliases,
    framework,
    sourceRoot,
    includeUnreachable,
    exclude: analysisExclude,
    moduleLimit: effectiveModuleLimit,
  });
  const unsafeReason = unsafeOutputReason({ outDir: resolvedOutDir, rootDir: analysis.rootDir });
  if (unsafeReason) {
    throw new Error(`Refusing destructive IronGlancer output target ${resolvedOutDir}: ${unsafeReason}.`);
  }
  await assertReplaceableOutputDir(resolvedOutDir);
  const declarationSource = declarationSourcePayload(analysis.sourceCode);
  const moduleSource = effectiveSourceMode === 'full'
    ? moduleSourcePayload(analysis.sourceCode)
    : { modules: [] };
  if (effectiveSourceMode === 'declarations') {
    assertNoCredentialLiterals(declarationSource);
  } else if (effectiveSourceMode === 'full') {
    assertNoCredentialLiterals(analysis.sourceCode);
  }
  const generatedAt = new Date().toISOString();
  const sourceCodeHash = contentHash(analysis.sourceCode);
  const output = analysisPayload(analysis);
  const appJs = await fs.readFile(viewerAppUrl, 'utf8');
  const appScriptSrc = `./app.js?v=${sha256(appJs)}`;
  const gitCommit = await gitCommitForRoot(analysis.rootDir);
  const buildId = contentHash({
    packageName: packageMeta.name,
    version: packageMeta.version,
    ...output,
    sourceCodeHash,
  });
  const meta = {
    apiVersion: API_VERSION,
    schemaVersion: SCHEMA_VERSION,
    packageName: packageMeta.name,
    version: packageMeta.version,
    generatedAt,
    rootDir: null,
    entry: analysis.entryRel,
    entryKind: analysis.entryKind || 'module',
    entryModules: Array.isArray(analysis.entryModules) ? analysis.entryModules : [analysis.entryRel].filter(Boolean),
    gitCommit,
    buildId,
    sourceCodeHash,
    privacy: sourcePrivacyMetadata(effectiveSourceMode, {
      declarationCount: declarationSource.declarations.length,
      moduleSourceCount: moduleSource.modules.length,
    }),
    analysis: {
      analyzer: analysis.metadata?.analyzer
        || analysis.metadata?.backend
        || { name: 'javascript-ast', parser: '@babel/parser', language: 'browser-jsx' },
      backend: analysis.metadata?.backend
        || analysis.metadata?.analyzer
        || { name: 'javascript-ast', parser: '@babel/parser', language: 'browser-jsx' },
      framework: analysis.metadata?.framework || 'auto',
      includeUnreachable: Boolean(analysis.metadata?.includeUnreachable),
      moduleLimit: analysis.metadata?.moduleLimit || {
        limit: effectiveModuleLimit,
        count: output.modules.length,
      },
    },
  };
  const tempOutDir = path.join(path.dirname(resolvedOutDir), `.${path.basename(resolvedOutDir)}.tmp-${process.pid}-${Date.now()}`);
  await fs.rm(tempOutDir, { recursive: true, force: true });
  await fs.mkdir(tempOutDir, { recursive: true });
  await fs.writeFile(path.join(tempOutDir, OUTPUT_MARKER_FILE), JSON.stringify({
    owner: 'IronGlancer',
    packageName: packageMeta.name,
    version: packageMeta.version,
    generatedAt,
  }, null, 2) + '\n', 'utf8');
  await fs.writeFile(path.join(tempOutDir, 'index.html'), viewerHtml({ appScriptSrc }), 'utf8');
  await fs.writeFile(path.join(tempOutDir, 'app.js'), appJs, 'utf8');
  await fs.writeFile(path.join(tempOutDir, 'diagram.mmd'), analysis.mermaid + '\n', 'utf8');
  await fs.mkdir(path.join(tempOutDir, API_DATA_DIR), { recursive: true });
  if (effectiveSourceMode === 'declarations' || effectiveSourceMode === 'full') {
    await writeJson(path.join(tempOutDir, 'source-code.json'), {
      ...declarationSource,
      meta,
    });
  }
  if (effectiveSourceMode === 'full') {
    const moduleSourceOutput = {
      ...moduleSource,
      meta,
    };
    await writeJson(path.join(tempOutDir, 'source-modules.json'), moduleSourceOutput);
    await writeJson(path.join(tempOutDir, API_DATA_DIR, 'source-modules.json'), moduleSourceOutput);
  }
  await writeJson(path.join(tempOutDir, API_DATA_DIR, 'function-map.json'), {
    ...functionDependencyPayload(analysis.functionDependencyMap),
    meta,
  });
  await writeJson(path.join(tempOutDir, 'output.json'), { ...output, meta });
  await copyMermaidAsset(tempOutDir);
  await replaceOutputDirAtomically(tempOutDir, resolvedOutDir);
  return { outDir: resolvedOutDir, ...analysis };
}
