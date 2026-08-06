import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

function snapshot({ label, functions = [] } = {}) {
  return {
    entry: 'src/app.js',
    modules: [{ path: 'src/app.js', lineCount: 1, reachable: true, isJsx: false, localDependencies: [], externalDependencies: [] }],
    importEdges: [],
    functionMap: {
      limitations: [],
      functions,
      edges: [],
    },
    summary: { moduleCount: 1 },
    meta: {
      schemaVersion: '1.2.0',
      generatedAt: `${label}-generated`,
      buildId: `${label}-build`,
      gitCommit: `${label}-commit`,
      entry: 'src/app.js',
    },
  };
}

function fn(stableId, name, options = {}) {
  return {
    id: `${stableId}_id`,
    stableId,
    modulePath: 'src/app.js',
    name,
    declarationName: name,
    kind: 'function',
    component: false,
    reachable: true,
    exported: Boolean(options.exported),
    exportedNames: options.exportedNames || [],
    exportKinds: options.exportKinds || [],
    scopePath: '',
    startLine: 1,
    endLine: 1,
    lineCount: 1,
  };
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function parseGithubOutput(text) {
  return Object.fromEntries(text.trim().split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }));
}

test('GitHub Action writes reports and outputs before gate failure', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-action-'));
  const basePath = path.join(tempDir, 'base.json');
  const headPath = path.join(tempDir, 'head.json');
  const reportPath = path.join(tempDir, 'architecture-diff.json');
  const sarifPath = path.join(tempDir, 'architecture-diff.sarif');
  const githubOutputPath = path.join(tempDir, 'github-output.txt');
  await writeJson(basePath, snapshot({
    label: 'base',
    functions: [fn('fn_removed', 'removed', {
      exported: true,
      exportedNames: ['removed'],
      exportKinds: ['named-export'],
    })],
  }));
  await writeJson(headPath, snapshot({ label: 'head' }));

  const { stdout, stderr } = await execFile('node', [path.resolve('src/action.mjs')], {
    cwd: path.resolve('.'),
    env: {
      ...process.env,
      GITHUB_OUTPUT: githubOutputPath,
      INPUT_BASE: basePath,
      INPUT_HEAD: headPath,
      INPUT_REPORT_PATH: reportPath,
      INPUT_SARIF_PATH: sarifPath,
      INPUT_FAIL_ON: 'error',
    },
  }).catch((error) => error);

  const output = parseGithubOutput(await fs.readFile(githubOutputPath, 'utf8'));
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const sarif = JSON.parse(await fs.readFile(sarifPath, 'utf8'));

  assert.match(stderr, /architecture diff gate failed/i);
  assert.equal(stdout, '');
  assert.equal(output['gate-triggered'], 'true');
  assert.equal(output['finding-count'], '1');
  assert.equal(output['exit-code'], '2');
  assert.equal(report.findings.length, 1);
  assert.equal(sarif.version, '2.1.0');
});
