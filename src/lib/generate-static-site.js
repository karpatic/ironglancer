import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

import { analyzeProject } from './analyze-project.js';
import { viewerHtml } from '../viewer/html.js';

const require = createRequire(import.meta.url);
const packageMeta = require('../../package.json');
const viewerAppUrl = new URL('../viewer/app.js', import.meta.url);

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

function analysisPayload(analysis) {
  return {
    rootDir: analysis.rootDir,
    entry: analysis.entryRel,
    treeText: analysis.treeText,
    jsxTreeText: analysis.jsxTreeText,
    jsScripts: analysis.jsScripts,
    jsxScripts: analysis.jsxScripts,
    mermaid: analysis.mermaid,
    importEdges: analysis.importEdges,
    deadFunctionCandidates: analysis.deadFunctionCandidates,
    summary: analysis.summary,
  };
}

export async function generateStaticSite({ rootDir, entry, outDir, routeAliases } = {}) {
  const resolvedOutDir = path.resolve(outDir || 'ironglancer-site');
  const analysis = await analyzeProject({ rootDir, entry, routeAliases });
  assertNoCredentialLiterals(analysis.sourceCode);
  const generatedAt = new Date().toISOString();
  const sourceCodeHash = contentHash(analysis.sourceCode);
  const output = analysisPayload(analysis);
  const appJs = await fs.readFile(viewerAppUrl, 'utf8');
  const appScriptSrc = `./app.js?v=${sha256(appJs)}`;
  const buildId = contentHash({
    packageName: packageMeta.name,
    version: packageMeta.version,
    ...output,
    sourceCodeHash,
  });
  const meta = {
    packageName: packageMeta.name,
    version: packageMeta.version,
    generatedAt,
    buildId,
    sourceCodeHash,
  };
  await fs.rm(resolvedOutDir, { recursive: true, force: true });
  await fs.mkdir(resolvedOutDir, { recursive: true });
  await fs.writeFile(path.join(resolvedOutDir, 'index.html'), viewerHtml({ appScriptSrc }), 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'app.js'), appJs, 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'diagram.mmd'), analysis.mermaid + '\n', 'utf8');
  await writeJson(path.join(resolvedOutDir, 'source-code.json'), {
    ...analysis.sourceCode,
    meta,
  });
  await writeJson(path.join(resolvedOutDir, 'output.json'), { ...output, meta });
  await copyMermaidAsset(resolvedOutDir);
  return { outDir: resolvedOutDir, ...analysis };
}
