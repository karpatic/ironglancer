import fs from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  SnapshotDiffError,
  compareSnapshots,
  renderDiffHtml,
  renderDiffSarif,
} from './diff-snapshots.js';
import { analyzeProject } from './analyze-project.js';
import { compareLocale, normalizeString } from './utils.js';

const execFile = promisify(execFileCallback);
const SNAPSHOT_SCHEMA_VERSION = '1.2.0';

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function contentHash(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

async function readJsonFile(filePath) {
  let text = '';
  try {
    text = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new SnapshotDiffError(`Unable to read snapshot ${filePath}: ${error.message}`, 'snapshot_read_failed');
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new SnapshotDiffError(`Malformed JSON in snapshot ${filePath}: ${error.message}`, 'malformed_snapshot');
  }
}

async function snapshotPathForInput(input) {
  const resolved = path.resolve(normalizeString(input).trim());
  try {
    const stat = await fs.stat(resolved);
    if (stat.isDirectory()) {
      const outputPath = path.join(resolved, 'output.json');
      try {
        const outputStat = await fs.stat(outputPath);
        return outputStat.isFile() ? outputPath : null;
      } catch {
        return null;
      }
    }
    if (stat.isFile()) return resolved;
  } catch {
    // Git-ref support is added by the CLI loader; missing paths fall through to a clear error here.
  }
  return null;
}

function safeSnapshotLabel(input, snapshotPath) {
  const raw = normalizeString(input).trim();
  if (!raw) return 'snapshot';
  if (path.isAbsolute(raw)) {
    return path.basename(raw) || path.basename(snapshotPath) || 'snapshot';
  }
  return raw
    .replace(/\\/g, '/')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\/+/, '')
    || path.basename(snapshotPath)
    || 'snapshot';
}

export async function loadSnapshotFromPath(input) {
  const snapshotPath = await snapshotPathForInput(input);
  if (!snapshotPath) {
    throw new SnapshotDiffError(`Unable to resolve diff input "${input}" as a snapshot file or generated-site directory.`, 'input_not_found');
  }
  return {
    label: safeSnapshotLabel(input, snapshotPath),
    snapshotPath,
    snapshot: await readJsonFile(snapshotPath),
  };
}

async function resolveGitCommit(projectRoot, input) {
  try {
    const { stdout } = await execFile('git', ['-C', projectRoot, 'rev-parse', '--verify', `${input}^{commit}`]);
    const commit = stdout.trim();
    return /^[a-f0-9]{40}$/i.test(commit) ? commit : null;
  } catch {
    return null;
  }
}

function waitForChild(child, name, stderrChunks) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new SnapshotDiffError(
        `${name} exited with code ${code}: ${Buffer.concat(stderrChunks).toString('utf8').trim()}`,
        'git_archive_failed',
      ));
    });
  });
}

async function materializeGitCommit(projectRoot, commit) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-diff-ref-'));
  const checkoutDir = path.join(tempRoot, 'checkout');
  await fs.mkdir(checkoutDir, { recursive: true });
  const gitStderr = [];
  const tarStderr = [];
  const git = spawn('git', ['-C', projectRoot, 'archive', '--format=tar', commit], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const tar = spawn('tar', ['-xf', '-', '-C', checkoutDir], {
    stdio: ['pipe', 'ignore', 'pipe'],
  });
  git.stderr.on('data', (chunk) => gitStderr.push(chunk));
  tar.stderr.on('data', (chunk) => tarStderr.push(chunk));
  git.stdout.pipe(tar.stdin);
  try {
    await Promise.all([
      waitForChild(git, 'git archive', gitStderr),
      waitForChild(tar, 'tar', tarStderr),
    ]);
    return {
      tempRoot,
      checkoutDir,
      async cleanup() {
        await fs.rm(tempRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await fs.rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
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
      isJsx: /\.jsx$/i.test(record.rel),
      localDependencies: Array.isArray(record.localDeps) ? record.localDeps : [],
      externalDependencies: Array.isArray(record.externalDeps) ? record.externalDeps : [],
      importRefs: Array.isArray(record.importRefs) ? record.importRefs.map((ref) => ({
        specifier: typeof ref.specifier === 'string' ? ref.specifier : '',
        kind: typeof ref.kind === 'string' ? ref.kind : '',
        localRel: typeof ref.localRel === 'string' ? ref.localRel : null,
        resolution: ['local', 'external', 'unresolved'].includes(ref.resolution) ? ref.resolution : null,
        unresolvedReason: typeof ref.unresolvedReason === 'string' ? ref.unresolvedReason : null,
        bindings: Array.isArray(ref.bindings) ? ref.bindings.map((binding) => ({
          imported: typeof binding.imported === 'string' ? binding.imported : '',
          local: typeof binding.local === 'string' ? binding.local : '',
          kind: typeof binding.kind === 'string' ? binding.kind : '',
          inferred: Boolean(binding.inferred),
        })) : [],
      })) : [],
    }))
    .sort((a, b) => compareLocale(a.path, b.path));
}

function snapshotFromAnalysis(analysis, { gitCommit, generatedAt }) {
  const payload = {
    entry: analysis.entryRel,
    modules: analysisModulesPayload(analysis),
    treeText: analysis.treeText,
    jsxTreeText: analysis.jsxTreeText,
    jsScripts: analysis.jsScripts,
    jsxScripts: analysis.jsxScripts,
    mermaid: analysis.mermaid,
    importEdges: analysis.importEdges,
    functionMap: {
      limitations: Array.isArray(analysis.functionDependencyMap?.limitations)
        ? analysis.functionDependencyMap.limitations
        : [],
      functions: Array.isArray(analysis.functionDependencyMap?.functions)
        ? analysis.functionDependencyMap.functions
        : [],
      edges: Array.isArray(analysis.functionDependencyMap?.edges)
        ? analysis.functionDependencyMap.edges
        : [],
    },
    summary: analysis.summary,
  };
  return {
    ...payload,
    meta: {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      generatedAt,
      entry: analysis.entryRel,
      gitCommit,
      buildId: contentHash({
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        gitCommit,
        ...payload,
      }),
    },
  };
}

export async function loadSnapshotInput({
  folder = '.',
  input,
  entry,
  routeAliases = [],
  generatedAt = new Date().toISOString(),
} = {}) {
  const snapshotPath = await snapshotPathForInput(input);
  if (snapshotPath) {
    return {
      label: safeSnapshotLabel(input, snapshotPath),
      snapshotPath,
      snapshot: await readJsonFile(snapshotPath),
    };
  }

  const projectRoot = path.resolve(normalizeString(folder).trim() || '.');
  const commit = await resolveGitCommit(projectRoot, input);
  if (!commit) {
    throw new SnapshotDiffError(`Unable to resolve diff input "${input}" as a snapshot path or git ref.`, 'input_not_found');
  }

  const materialized = await materializeGitCommit(projectRoot, commit);
  try {
    const analysis = await analyzeProject({
      rootDir: materialized.checkoutDir,
      entry,
      routeAliases,
    });
    return {
      label: input,
      gitCommit: commit,
      snapshot: snapshotFromAnalysis(analysis, { gitCommit: commit, generatedAt }),
    };
  } finally {
    await materialized.cleanup();
  }
}

function normalizedFormat(format) {
  const value = normalizeString(format || 'json').trim().toLowerCase();
  if (value !== 'json' && value !== 'html') {
    throw new SnapshotDiffError(`Unsupported diff format "${format}". Use json or html.`, 'unsupported_format');
  }
  return value;
}

function assertNoOutputCollision(outPath, sarifPath) {
  if (!outPath || !sarifPath) return;
  if (path.resolve(outPath) === path.resolve(sarifPath)) {
    throw new SnapshotDiffError('Diff --out and --sarif must not point to the same path.', 'output_collision');
  }
}

async function existingReportMode(resolvedPath) {
  try {
    const stats = await fs.lstat(resolvedPath);
    if (!stats.isFile()) {
      throw new SnapshotDiffError(`Diff output "${resolvedPath}" must be a regular file.`, 'invalid_output');
    }
    return stats.mode & 0o7777;
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function stageTextFile(filePath, text) {
  const resolvedPath = path.resolve(filePath);
  const directory = path.dirname(resolvedPath);
  const tempPath = path.join(directory, `.${path.basename(resolvedPath)}.${process.pid}.${randomUUID()}.tmp`);
  await fs.mkdir(directory, { recursive: true });
  const existingMode = await existingReportMode(resolvedPath);
  try {
    await fs.writeFile(tempPath, text, 'utf8');
    if (existingMode !== null) await fs.chmod(tempPath, existingMode);
    return { resolvedPath, tempPath };
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function restoreStagedReports(staged) {
  const rollbackErrors = [];
  for (const report of [...staged].reverse()) {
    try {
      if (report.committed) await fs.rm(report.resolvedPath, { force: true });
      if (report.backupPath) await fs.rename(report.backupPath, report.resolvedPath);
      await fs.rm(report.tempPath, { force: true });
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  return rollbackErrors;
}

async function writeTextFiles(reports) {
  const staged = [];
  try {
    for (const report of reports) staged.push(await stageTextFile(report.filePath, report.text));
  } catch (error) {
    await Promise.all(staged.map((report) => fs.rm(report.tempPath, { force: true }).catch(() => {})));
    throw error;
  }

  try {
    for (const report of staged) {
      const currentMode = await existingReportMode(report.resolvedPath);
      if (currentMode === null) continue;
      await fs.chmod(report.tempPath, currentMode);
      report.backupPath = path.join(
        path.dirname(report.resolvedPath),
        `.${path.basename(report.resolvedPath)}.${process.pid}.${randomUUID()}.backup`,
      );
      await fs.rename(report.resolvedPath, report.backupPath);
    }
    for (const report of staged) {
      await fs.rename(report.tempPath, report.resolvedPath);
      report.committed = true;
    }
  } catch (error) {
    const rollbackErrors = await restoreStagedReports(staged);
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], 'Diff report transaction failed and could not be fully restored.');
    }
    throw error;
  }

  await Promise.all(staged.map((report) => (
    report.backupPath ? fs.rm(report.backupPath, { force: true }) : Promise.resolve()
  )));
}

export async function createArchitectureDiff({
  folder = '.',
  base,
  head,
  entry,
  routeAliases = [],
  format = 'json',
  outPath,
  sarifPath,
  generatedAt = new Date().toISOString(),
} = {}) {
  if (!base) throw new SnapshotDiffError('ironglancer diff requires --base <input>.', 'missing_base');
  if (!head) throw new SnapshotDiffError('ironglancer diff requires --head <input>.', 'missing_head');
  const resolvedFormat = normalizedFormat(format);
  const effectiveOutPath = resolvedFormat === 'html' ? outPath || 'architecture-diff.html' : outPath;
  assertNoOutputCollision(effectiveOutPath, sarifPath);

  const [baseInput, headInput] = await Promise.all([
    loadSnapshotInput({ folder, input: base, entry, routeAliases, generatedAt }),
    loadSnapshotInput({ folder, input: head, entry, routeAliases, generatedAt }),
  ]);
  const diff = compareSnapshots(baseInput.snapshot, headInput.snapshot, {
    baseLabel: baseInput.label,
    headLabel: headInput.label,
    generatedAt,
  });

  let stdoutText = null;
  let outputPath = null;
  const reports = [];
  if (resolvedFormat === 'json') {
    const json = JSON.stringify(diff, null, 2) + '\n';
    if (effectiveOutPath) {
      reports.push({ filePath: effectiveOutPath, text: json });
      outputPath = path.resolve(effectiveOutPath);
    } else {
      stdoutText = json;
    }
  } else {
    reports.push({ filePath: effectiveOutPath, text: renderDiffHtml(diff) });
    outputPath = path.resolve(effectiveOutPath);
  }

  let resolvedSarifPath = null;
  if (sarifPath) {
    reports.push({ filePath: sarifPath, text: JSON.stringify(renderDiffSarif(diff), null, 2) + '\n' });
    resolvedSarifPath = path.resolve(sarifPath);
  }
  if (reports.length > 0) await writeTextFiles(reports);

  return {
    diff,
    format: resolvedFormat,
    stdoutText,
    outputPath,
    sarifPath: resolvedSarifPath,
  };
}
