import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

import { runCli } from '../src/cli.mjs';

const execFile = promisify(execFileCallback);
const fixtureRoot = path.resolve('tests/fixtures/sample-app');
const routeAliasRoot = path.resolve('tests/fixtures/route-alias');

function memoryStream() {
  const chunks = [];
  return {
    write(chunk, callback) {
      chunks.push(String(chunk));
      if (typeof callback === 'function') callback();
      return true;
    },
    text() {
      return chunks.join('');
    },
  };
}

function failingStream(message) {
  return {
    write(chunk, callback) {
      if (typeof callback === 'function') callback(new Error(message));
      return false;
    },
  };
}

function diffSnapshot({ label, modules = [], functions = [], edges = [] } = {}) {
  return {
    entry: 'src/app.js',
    modules,
    importEdges: [],
    functionMap: {
      limitations: ['Static function dependencies are review aids, not runtime call graphs.'],
      functions,
      edges,
    },
    summary: { moduleCount: modules.length },
    meta: {
      schemaVersion: '1.2.0',
      generatedAt: `${label}-generated`,
      buildId: `${label}-build`,
      gitCommit: `${label}-commit`,
      rootDir: `/tmp/private/${label}`,
      entry: 'src/app.js',
    },
  };
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

async function writeText(filePath, text) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, 'utf8');
}

async function git(cwd, args) {
  const { stdout } = await execFile('git', args, { cwd });
  return stdout.trim();
}

async function tempDiffRefDirs() {
  const entries = await fs.readdir(os.tmpdir(), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('ironglancer-diff-ref-'))
    .map((entry) => entry.name)
    .sort();
}

test('cli documents localhost serve mode flags', async () => {
  const stdout = memoryStream();
  const exitCode = await runCli(['--help'], { stdout });

  assert.equal(exitCode, 0);
  assert.match(stdout.text(), /--serve/);
  assert.match(stdout.text(), /--host 127\.0\.0\.1/);
  assert.match(stdout.text(), /--port 4173/);
  assert.match(stdout.text(), /ironglancer diff/);
  assert.match(stdout.text(), /--base <input>/);
  assert.match(stdout.text(), /output\.json file or directory containing output\.json wins; otherwise inputs resolve as Git refs/i);
});

test('cli diff compares saved snapshot file and directory inputs as JSON stdout', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-snapshots-'));
  const basePath = path.join(tempDir, 'base-output.json');
  const headDir = path.join(tempDir, 'head-site');
  await writeJson(basePath, diffSnapshot({
    label: 'base',
    modules: [{ path: 'src/app.js', lineCount: 1, reachable: true, isJsx: false, localDependencies: [], externalDependencies: [] }],
  }));
  await writeJson(path.join(headDir, 'output.json'), diffSnapshot({
    label: 'head',
    modules: [
      { path: 'src/app.js', lineCount: 1, reachable: true, isJsx: false, localDependencies: [], externalDependencies: [] },
      { path: 'src/feature.js', lineCount: 2, reachable: true, isJsx: false, localDependencies: [], externalDependencies: [] },
    ],
  }));

  const stdout = memoryStream();
  const stderr = memoryStream();
  const exitCode = await runCli([
    'diff',
    '--base',
    basePath,
    '--head',
    headDir,
    '--format',
    'json',
  ], { stdout, stderr });

  assert.equal(exitCode, 0);
  assert.equal(stderr.text(), '');
  const output = JSON.parse(stdout.text());
  assert.deepEqual(output.modules.added.map((item) => item.path), ['src/feature.js']);
  assert.equal(output.privacy.sourceMode, 'none');
  assert.equal(stdout.text().includes('/tmp/private'), false);
  assert.equal(stdout.text().includes(tempDir), false);
});

test('cli diff compares git refs without mutating branch, HEAD, or worktree', async () => {
  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-git-'));
  await git(projectDir, ['init', '-b', 'main']);
  await git(projectDir, ['config', 'user.email', 'tests@example.test']);
  await git(projectDir, ['config', 'user.name', 'IronGlancer Tests']);
  await writeText(path.join(projectDir, 'src/app.js'), [
    'export function App() {',
    "  return 'base';",
    '}',
  ].join('\n'));
  await git(projectDir, ['add', '.']);
  await git(projectDir, ['commit', '-m', 'base']);
  const baseCommit = await git(projectDir, ['rev-parse', 'HEAD']);
  await writeText(path.join(projectDir, 'src/app.js'), [
    "import { feature } from './feature.js';",
    'export function App() {',
    '  return feature();',
    '}',
  ].join('\n'));
  await writeText(path.join(projectDir, 'src/feature.js'), [
    'export function feature() {',
    "  return 'head';",
    '}',
  ].join('\n'));
  await git(projectDir, ['add', '.']);
  await git(projectDir, ['commit', '-m', 'head']);
  const branchBefore = await git(projectDir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const headBefore = await git(projectDir, ['rev-parse', 'HEAD']);
  const statusBefore = await git(projectDir, ['status', '--short']);

  const { stdout } = await execFile('node', [
    path.resolve('src/cli.mjs'),
    'diff',
    projectDir,
    '--base',
    baseCommit,
    '--head',
    'HEAD',
    '--entry',
    'src/app.js',
    '--format',
    'json',
  ], { cwd: path.resolve('.') });
  const output = JSON.parse(stdout);

  assert.deepEqual(output.modules.added.map((item) => item.path), ['src/feature.js']);
  assert.equal(output.base.gitCommit, baseCommit);
  assert.equal(output.head.gitCommit, headBefore);
  assert.equal(await git(projectDir, ['rev-parse', '--abbrev-ref', 'HEAD']), branchBefore);
  assert.equal(await git(projectDir, ['rev-parse', 'HEAD']), headBefore);
  assert.equal(await git(projectDir, ['status', '--short']), statusBefore);
});

test('cli diff resolves a same-named directory without output.json as a git ref', async () => {
  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-ref-directory-precedence-'));
  await git(projectDir, ['init', '-b', 'main']);
  await git(projectDir, ['config', 'user.email', 'tests@example.test']);
  await git(projectDir, ['config', 'user.name', 'IronGlancer Tests']);
  await writeText(path.join(projectDir, 'src/app.js'), [
    'export function App() {',
    "  return 'base';",
    '}',
  ].join('\n'));
  await writeText(path.join(projectDir, 'main', 'README.md'), 'same-named directory without snapshot output\n');
  await git(projectDir, ['add', '.']);
  await git(projectDir, ['commit', '-m', 'base']);
  await git(projectDir, ['checkout', '-b', 'feature']);
  await writeText(path.join(projectDir, 'src/app.js'), [
    "import { feature } from './feature.js';",
    'export function App() {',
    '  return feature();',
    '}',
  ].join('\n'));
  await writeText(path.join(projectDir, 'src/feature.js'), [
    'export function feature() {',
    "  return 'head';",
    '}',
  ].join('\n'));
  await git(projectDir, ['add', '.']);
  await git(projectDir, ['commit', '-m', 'head']);
  const branchBefore = await git(projectDir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const headBefore = await git(projectDir, ['rev-parse', 'HEAD']);
  const statusBefore = await git(projectDir, ['status', '--short']);

  const { stdout } = await execFile('node', [
    path.resolve('src/cli.mjs'),
    'diff',
    '--base',
    'main',
    '--head',
    'HEAD',
    '--entry',
    'src/app.js',
    '--format',
    'json',
  ], { cwd: projectDir });
  const output = JSON.parse(stdout);

  assert.deepEqual(output.modules.added.map((item) => item.path), ['src/feature.js']);
  assert.equal(output.base.label, 'main');
  assert.equal(output.head.label, 'HEAD');
  assert.equal(await git(projectDir, ['rev-parse', '--abbrev-ref', 'HEAD']), branchBefore);
  assert.equal(await git(projectDir, ['rev-parse', 'HEAD']), headBefore);
  assert.equal(await git(projectDir, ['status', '--short']), statusBefore);
});

test('cli diff analyzes a nested project folder at each git ref', async () => {
  const repoDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-nested-'));
  const projectDir = path.join(repoDir, 'packages', 'app');
  await git(repoDir, ['init', '-b', 'main']);
  await git(repoDir, ['config', 'user.email', 'tests@example.test']);
  await git(repoDir, ['config', 'user.name', 'IronGlancer Tests']);
  await writeText(path.join(projectDir, 'src/app.js'), 'export function App() { return null; }\n');
  await writeText(path.join(repoDir, 'root-only.js'), 'export const rootOnly = true;\n');
  await git(repoDir, ['add', '.']);
  await git(repoDir, ['commit', '-m', 'base']);
  const baseCommit = await git(repoDir, ['rev-parse', 'HEAD']);
  await writeText(path.join(projectDir, 'src/feature.js'), 'export function feature() { return true; }\n');
  await git(repoDir, ['add', '.']);
  await git(repoDir, ['commit', '-m', 'head']);

  const { stdout } = await execFile('node', [
    path.resolve('src/cli.mjs'),
    'diff',
    projectDir,
    '--base',
    baseCommit,
    '--head',
    'HEAD',
    '--entry',
    'src/app.js',
    '--format',
    'json',
  ], { cwd: path.resolve('.') });
  const output = JSON.parse(stdout);

  assert.deepEqual(output.modules.added.map((item) => item.path), ['src/feature.js']);
  assert.equal(output.modules.added.some((item) => item.path === 'root-only.js'), false);
  assert.equal(await git(repoDir, ['status', '--short']), '');
});

test('cli diff writes HTML and SARIF files for saved snapshots', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-files-'));
  const basePath = path.join(tempDir, 'base.json');
  const headPath = path.join(tempDir, 'head.json');
  const htmlPath = path.join(tempDir, 'architecture-diff.html');
  const sarifPath = path.join(tempDir, 'review.sarif');
  await writeJson(basePath, diffSnapshot({
    label: 'base',
    modules: [{ path: 'src/api.js', lineCount: 3, reachable: true, isJsx: false, localDependencies: [], externalDependencies: [] }],
    functions: [{
      id: 'fn_public_id',
      stableId: 'fn_public',
      modulePath: 'src/api.js',
      name: 'publicApi',
      declarationName: 'publicApi',
      kind: 'function',
      component: false,
      reachable: true,
      exported: true,
      exportedNames: ['publicApi'],
      exportKinds: ['named'],
      scopePath: '',
      startLine: 1,
      endLine: 3,
      lineCount: 3,
    }],
  }));
  await writeJson(headPath, diffSnapshot({ label: 'head', modules: [], functions: [] }));

  const stdout = memoryStream();
  const exitCode = await runCli([
    'diff',
    '--base',
    basePath,
    '--head',
    headPath,
    '--format',
    'html',
    '--out',
    htmlPath,
    '--sarif',
    sarifPath,
  ], { stdout });

  assert.equal(exitCode, 0);
  assert.equal(stdout.text(), '');
  const html = await fs.readFile(htmlPath, 'utf8');
  const sarif = JSON.parse(await fs.readFile(sarifPath, 'utf8'));
  assert.match(html, /IronGlancer Architecture Diff/);
  assert.equal(html.includes('/tmp/private'), false);
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].results[0].ruleId, 'IRONG_DIFF_EXPORT_REMOVED');
});

test('cli diff replaces report files atomically without sibling temporary residue', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-atomic-files-'));
  const basePath = path.join(tempDir, 'base.json');
  const headPath = path.join(tempDir, 'head.json');
  const htmlPath = path.join(tempDir, 'architecture-diff.html');
  const sarifPath = path.join(tempDir, 'review.sarif');
  await writeJson(basePath, diffSnapshot({ label: 'base', modules: [] }));
  await writeJson(headPath, diffSnapshot({
    label: 'head',
    modules: [{ path: 'src/app.js', lineCount: 1, reachable: true, isJsx: false, localDependencies: [], externalDependencies: [] }],
  }));
  await writeText(htmlPath, 'old html report\n');
  await writeText(sarifPath, 'old sarif report\n');
  const htmlBefore = await fs.stat(htmlPath);
  const sarifBefore = await fs.stat(sarifPath);

  const exitCode = await runCli([
    'diff',
    '--base',
    basePath,
    '--head',
    headPath,
    '--format',
    'html',
    '--out',
    htmlPath,
    '--sarif',
    sarifPath,
  ], { stdout: memoryStream() });

  assert.equal(exitCode, 0);
  assert.notEqual((await fs.stat(htmlPath)).ino, htmlBefore.ino);
  assert.notEqual((await fs.stat(sarifPath)).ino, sarifBefore.ino);
  assert.match(await fs.readFile(htmlPath, 'utf8'), /IronGlancer Architecture Diff/);
  assert.equal(JSON.parse(await fs.readFile(sarifPath, 'utf8')).version, '2.1.0');
  assert.equal((await fs.readdir(tempDir)).some((name) => name.includes('.tmp')), false);
});

test('cli diff preserves private permissions when atomically replacing reports', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-private-reports-'));
  const basePath = path.join(tempDir, 'base.json');
  const headPath = path.join(tempDir, 'head.json');
  const htmlPath = path.join(tempDir, 'architecture-diff.html');
  const sarifPath = path.join(tempDir, 'review.sarif');
  await writeJson(basePath, diffSnapshot({ label: 'base', modules: [] }));
  await writeJson(headPath, diffSnapshot({ label: 'head', modules: [] }));
  await writeText(htmlPath, 'private html\n');
  await writeText(sarifPath, 'private sarif\n');
  await fs.chmod(htmlPath, 0o600);
  await fs.chmod(sarifPath, 0o600);

  await runCli([
    'diff', '--base', basePath, '--head', headPath,
    '--format', 'html', '--out', htmlPath, '--sarif', sarifPath,
  ], { stdout: memoryStream() });

  assert.equal((await fs.stat(htmlPath)).mode & 0o777, 0o600);
  assert.equal((await fs.stat(sarifPath)).mode & 0o777, 0o600);
});

test('cli diff leaves every prior report intact when any output cannot be staged', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-report-transaction-'));
  const basePath = path.join(tempDir, 'base.json');
  const headPath = path.join(tempDir, 'head.json');
  const htmlPath = path.join(tempDir, 'architecture-diff.html');
  const blockedParent = path.join(tempDir, 'not-a-directory');
  await writeJson(basePath, diffSnapshot({ label: 'base', modules: [] }));
  await writeJson(headPath, diffSnapshot({ label: 'head', modules: [] }));
  await writeText(htmlPath, 'ORIGINAL PRIMARY\n');
  await writeText(blockedParent, 'regular file\n');

  await assert.rejects(runCli([
    'diff', '--base', basePath, '--head', headPath,
    '--format', 'html', '--out', htmlPath,
    '--sarif', path.join(blockedParent, 'review.sarif'),
  ], { stdout: memoryStream() }));

  assert.equal(await fs.readFile(htmlPath, 'utf8'), 'ORIGINAL PRIMARY\n');
  assert.equal((await fs.readdir(tempDir)).some((name) => name.includes('.tmp') || name.includes('.backup')), false);
});

test('cli diff uses architecture-diff.html when HTML output is omitted', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-default-html-'));
  const basePath = path.join(tempDir, 'base.json');
  const headPath = path.join(tempDir, 'head.json');
  await writeJson(basePath, diffSnapshot({ label: 'base', modules: [] }));
  await writeJson(headPath, diffSnapshot({
    label: 'head',
    modules: [{ path: 'src/app.js', lineCount: 1, reachable: true, isJsx: false, localDependencies: [], externalDependencies: [] }],
  }));

  await execFile('node', [
    path.resolve('src/cli.mjs'),
    'diff',
    '--base',
    basePath,
    '--head',
    headPath,
    '--format',
    'html',
  ], { cwd: tempDir });

  assert.match(await fs.readFile(path.join(tempDir, 'architecture-diff.html'), 'utf8'), /IronGlancer Architecture Diff/);
});

test('cli diff reports bad refs on stderr and cleans temporary ref directories', async () => {
  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-bad-ref-'));
  await git(projectDir, ['init', '-b', 'main']);
  await git(projectDir, ['config', 'user.email', 'tests@example.test']);
  await git(projectDir, ['config', 'user.name', 'IronGlancer Tests']);
  await writeText(path.join(projectDir, 'src/app.js'), 'export function App() { return null; }\n');
  await git(projectDir, ['add', '.']);
  await git(projectDir, ['commit', '-m', 'base']);
  const beforeTemps = await tempDiffRefDirs();

  await assert.rejects(
    execFile('node', [
      path.resolve('src/cli.mjs'),
      'diff',
      projectDir,
      '--base',
      'missing-ref-for-diff-test',
      '--head',
      'HEAD',
      '--entry',
      'src/app.js',
      '--format',
      'json',
    ], { cwd: path.resolve('.') }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unable to resolve diff input "missing-ref-for-diff-test"/);
      return true;
    },
  );

  assert.deepEqual(await tempDiffRefDirs(), beforeTemps);
  assert.equal(await git(projectDir, ['status', '--short']), '');
});

test('cli diff rejects unsupported formats and output path collisions', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-bad-output-'));
  const basePath = path.join(tempDir, 'base.json');
  const headPath = path.join(tempDir, 'head.json');
  await writeJson(basePath, diffSnapshot({ label: 'base', modules: [] }));
  await writeJson(headPath, diffSnapshot({ label: 'head', modules: [] }));
  await assert.rejects(
    runCli(['diff', '--base', basePath, '--head', headPath, '--format', 'xml'], { stdout: memoryStream() }),
    /Unsupported diff format/,
  );
  const samePath = path.join(tempDir, 'same.out');
  await writeText(samePath, 'pre-existing report\n');
  await assert.rejects(
    runCli([
      'diff',
      '--base',
      basePath,
      '--head',
      headPath,
      '--format',
      'html',
      '--out',
      samePath,
      '--sarif',
      samePath,
    ], { stdout: memoryStream() }),
    /must not point to the same path/,
  );
  assert.equal(await fs.readFile(samePath, 'utf8'), 'pre-existing report\n');
});

test('cli diff reports missing entry at a git ref without leaving temp residue', async () => {
  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-diff-missing-entry-'));
  await git(projectDir, ['init', '-b', 'main']);
  await git(projectDir, ['config', 'user.email', 'tests@example.test']);
  await git(projectDir, ['config', 'user.name', 'IronGlancer Tests']);
  await writeText(path.join(projectDir, 'src/app.js'), 'export function App() { return null; }\n');
  await git(projectDir, ['add', '.']);
  await git(projectDir, ['commit', '-m', 'base']);
  const headBefore = await git(projectDir, ['rev-parse', 'HEAD']);
  const beforeTemps = await tempDiffRefDirs();

  await assert.rejects(
    execFile('node', [
      path.resolve('src/cli.mjs'),
      'diff',
      projectDir,
      '--base',
      'HEAD',
      '--head',
      'HEAD',
      '--entry',
      'src/missing.js',
      '--format',
      'json',
    ], { cwd: path.resolve('.') }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unable to resolve entry/);
      return true;
    },
  );

  assert.deepEqual(await tempDiffRefDirs(), beforeTemps);
  assert.equal(await git(projectDir, ['rev-parse', 'HEAD']), headBefore);
  assert.equal(await git(projectDir, ['status', '--short']), '');
});

test('cli serve mode generates once and starts the localhost API', async () => {
  const stdout = memoryStream();
  const stderr = memoryStream();
  const calls = [];
  const exitCode = await runCli([
    fixtureRoot,
    '--entry',
    'src/app.jsx',
    '--out',
    '/tmp/ironglancer-cli-serve',
    '--serve',
    '--host',
    '0.0.0.0',
    '--port',
    '0',
  ], {
    stdout,
    stderr,
    waitForClose: false,
    generateStaticSite: async (options) => {
      calls.push({ name: 'generateStaticSite', options });
      return {
        rootDir: path.resolve(options.rootDir),
        entryRel: options.entry,
        outDir: options.outDir,
        summary: { moduleCount: 1 },
      };
    },
    startStaticAnalysisServer: async (options) => {
      calls.push({ name: 'startStaticAnalysisServer', options });
      return {
        host: options.host,
        port: 49152,
        url: 'http://0.0.0.0:49152/',
        apiBaseUrl: 'http://0.0.0.0:49152/api/v1',
        close: async () => {},
      };
    },
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(calls, [
    {
      name: 'generateStaticSite',
      options: {
        rootDir: fixtureRoot,
        entry: 'src/app.jsx',
        outDir: '/tmp/ironglancer-cli-serve',
        routeAliases: [],
      },
    },
    {
      name: 'startStaticAnalysisServer',
      options: {
        outDir: '/tmp/ironglancer-cli-serve',
        host: '0.0.0.0',
        port: 0,
      },
    },
  ]);
  const output = JSON.parse(stdout.text());
  assert.equal(output.serving, true);
  assert.equal(output.host, '0.0.0.0');
  assert.equal(output.port, 49152);
  assert.equal(output.apiBaseUrl, 'http://0.0.0.0:49152/api/v1');
  assert.match(stderr.text(), /IronGlancer serving/);
});

test('cli serve mode closes the server when status output fails', async () => {
  let closeCount = 0;
  await assert.rejects(
    runCli([
      fixtureRoot,
      '--entry',
      'src/app.jsx',
      '--out',
      '/tmp/ironglancer-cli-serve-output-failure',
      '--serve',
      '--port',
      '0',
    ], {
      stdout: failingStream('stdout failed'),
      stderr: memoryStream(),
      waitForClose: false,
      generateStaticSite: async (options) => ({
        rootDir: path.resolve(options.rootDir),
        entryRel: options.entry,
        outDir: options.outDir,
        summary: { moduleCount: 1 },
      }),
      startStaticAnalysisServer: async (options) => ({
        host: options.host,
        port: 49153,
        url: 'http://127.0.0.1:49153/',
        apiBaseUrl: 'http://127.0.0.1:49153/api/v1',
        close: async () => {
          closeCount += 1;
        },
      }),
    }),
    /stdout failed/,
  );

  assert.equal(closeCount, 1);
});

test('cli runs in one command on a folder', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-'));
  await execFile('node', ['src/cli.mjs', fixtureRoot, '--entry', 'src/app.jsx', '--out', outDir], {
    cwd: path.resolve('.'),
  });

  const output = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  assert.equal(output.entry, 'src/app.jsx');
  assert.equal(output.summary.moduleCount, 5);
});

test('cli accepts route aliases for URL-rooted source imports', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-route-alias-'));
  await execFile('node', [
    'src/cli.mjs',
    routeAliasRoot,
    '--entry',
    'src/web/ceator/app.jsx',
    '--out',
    outDir,
    '--route-alias',
    '/creator/=src/web/ceator/',
  ], {
    cwd: path.resolve('.'),
  });

  const output = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  assert.equal(output.entry, 'src/web/ceator/app.jsx');
  assert.equal(output.summary.moduleCount, 2);
  assert.equal(output.summary.externalCount, 0);
  assert.ok(!output.treeText.includes('[external] /creator/components/creator-linked-content-editor.jsx'));
  assert.ok(!output.mermaid.includes('+LinkedContentEditor'));
});
