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

test('cli documents localhost serve mode flags', async () => {
  const stdout = memoryStream();
  const exitCode = await runCli(['--help'], { stdout });

  assert.equal(exitCode, 0);
  assert.match(stdout.text(), /--serve/);
  assert.match(stdout.text(), /--host 127\.0\.0\.1/);
  assert.match(stdout.text(), /--port 4173/);
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
