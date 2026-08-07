import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import http from 'node:http';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { promisify } from 'node:util';

import { makeTempDir } from './helpers/temp-dir.js';
import { generateStaticSite } from '../src/lib/generate-static-site.js';
import { startStaticAnalysisServer } from '../src/lib/serve-static-site.js';

const execFile = promisify(execFileCallback);
const fixtureRoot = path.resolve('tests/fixtures/sample-app');

async function execAgent(args, options = {}) {
  const { stdout, stderr } = await execFile(process.execPath, ['src/agent-cli.mjs', ...args], {
    cwd: path.resolve('.'),
    ...options,
  });
  return { stdout: JSON.parse(stdout), stderr };
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json();
  return { response, body };
}

async function waitFor(predicate, message, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw lastError || new Error(message);
}

function collectChild(child) {
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString('utf8');
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });
  const exit = new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
  return { exit };
}

function mockModule(pathName, index) {
  return {
    stableId: `module_${String(index).padStart(3, '0')}`,
    path: pathName,
    lineCount: 1,
    reachable: true,
    dependencyCount: 0,
    dependentCount: 0,
    functionCount: 0,
    sourceAvailable: true,
  };
}

async function startAgentApiFixture({
  modules = [],
  failingModuleOffsets = new Set(),
  moduleTotal = modules.length,
  changeSnapshotAfterModuleList = false,
} = {}) {
  const moduleRequests = [];
  const snapshot = {
    buildId: 'a'.repeat(64),
    sourceCodeHash: 'b'.repeat(64),
    generatedAt: '2026-08-07T00:00:00.000Z',
    entry: 'src/app.jsx',
  };
  const changedSnapshot = {
    ...snapshot,
    buildId: 'c'.repeat(64),
    sourceCodeHash: 'd'.repeat(64),
  };
  let moduleListServed = false;
  const currentSnapshot = () => (
    changeSnapshotAfterModuleList && moduleListServed ? changedSnapshot : snapshot
  );

  const writeJson = (response, statusCode, data) => {
    response.writeHead(statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(data));
  };
  const ok = (response, data) => writeJson(response, 200, { ok: true, data });

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    if (url.pathname === '/api/v1' || url.pathname === '/api/v1/') {
      ok(response, {
        apiVersion: 'v1',
        schemaVersion: 'test',
        routes: [],
        agentInterop: {
          boundaries: {
            analysisApi: 'read-only',
            viewerBridge: 'presentation-only',
            execution: 'none',
          },
        },
      });
      return;
    }

    if (url.pathname === '/api/v1/run') {
      ok(response, {
        apiVersion: 'v1',
        schemaVersion: 'test',
        snapshot: currentSnapshot(),
        summary: {},
        source: {},
      });
      return;
    }

    if (url.pathname === '/bridge/v1' || url.pathname === '/bridge/v1/') {
      ok(response, {
        bridgeVersion: 'v1',
        commands: [],
        latestState: null,
        commandRevision: 0,
        snapshot: currentSnapshot(),
      });
      return;
    }

    if (url.pathname === '/api/v1/modules') {
      const limit = Number(url.searchParams.get('limit') || 200);
      const offset = Number(url.searchParams.get('offset') || 0);
      moduleRequests.push({ limit, offset });
      if (failingModuleOffsets.has(offset)) {
        writeJson(response, 503, {
          ok: false,
          error: {
            code: 'module_page_unavailable',
            message: `Module page at offset ${offset} is unavailable.`,
          },
        });
        return;
      }
      const items = modules.slice(offset, offset + limit);
      moduleListServed = true;
      ok(response, {
        items,
        pagination: {
          offset,
          limit,
          total: moduleTotal,
          nextOffset: offset + limit < moduleTotal ? offset + limit : null,
        },
      });
      return;
    }

    const moduleFunctionsMatch = url.pathname.match(/^\/api\/v1\/modules\/([^/]+)\/functions$/);
    if (moduleFunctionsMatch) {
      ok(response, {
        functions: [],
        pagination: {
          offset: 0,
          limit: 200,
          total: 0,
          nextOffset: null,
        },
      });
      return;
    }

    const moduleDetailMatch = url.pathname.match(/^\/api\/v1\/modules\/([^/]+)$/);
    if (moduleDetailMatch) {
      const stableId = decodeURIComponent(moduleDetailMatch[1]);
      const moduleRecord = modules.find((module) => module.stableId === stableId);
      if (!moduleRecord) {
        writeJson(response, 404, {
          ok: false,
          error: { code: 'not_found', message: 'Module not found.' },
        });
        return;
      }
      ok(response, {
        ...moduleRecord,
        dependencies: { local: [], external: [] },
        dependents: { local: [] },
        imports: [],
      });
      return;
    }

    if (url.pathname === '/api/v1/findings') {
      ok(response, {
        items: [],
        pagination: {
          offset: 0,
          limit: 200,
          total: 0,
          nextOffset: null,
        },
      });
      return;
    }

    writeJson(response, 404, {
      ok: false,
      error: { code: 'not_found', message: `No fixture route for ${url.pathname}.` },
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/`,
    moduleRequests,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test('package exposes ironglancer-agent and removes the retired public binary', async () => {
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  const retiredAgentBin = `ironglancer-${String.fromCharCode(109, 99, 112)}`;
  assert.equal(packageJson.bin.ironglancer, 'src/cli.mjs');
  assert.equal(packageJson.bin['ironglancer-agent'], 'src/agent-cli.mjs');
  assert.equal(packageJson.bin[retiredAgentBin], undefined);
  await assert.rejects(fs.stat(`src/${String.fromCharCode(109, 99, 112)}-server.mjs`), { code: 'ENOENT' });
});

test('ironglancer-agent rejects non-loopback service URLs', async () => {
  await assert.rejects(
    execFile(process.execPath, ['src/agent-cli.mjs', '--url', 'https://example.com', 'status'], {
      cwd: path.resolve('.'),
    }),
    (error) => {
      assert.notEqual(error.code, 0);
      assert.match(error.stderr, /loopback-only/i);
      return true;
    },
  );
});

test('ironglancer-agent reads status, search, and cleanup evidence over the loopback API', async () => {
  const outDir = await makeTempDir('ironglancer-agent-site-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
  const service = await startStaticAnalysisServer({ outDir, port: 0 });

  try {
    const status = await execAgent(['--url', service.url, 'status']);
    assert.equal(status.stdout.ok, true);
    assert.equal(status.stdout.command, 'status');
    assert.equal(status.stdout.service.viewerUrl, service.url);
    assert.equal(status.stdout.service.apiUrl, `${service.url}api/v1`);
    assert.equal(status.stdout.service.bridgeUrl, `${service.url}bridge/v1/`);
    assert.equal(status.stdout.readiness.ready, true);
    assert.equal(status.stdout.boundaries.analysisApi, 'read-only');
    assert.equal(status.stdout.boundaries.viewerBridge, 'presentation-only');
    assert.match(status.stdout.snapshot.buildId, /^[a-f0-9]{64}$/);

    const search = await execAgent([
      '--url',
      service.url,
      'search',
      'RootApp',
      '--types',
      'function,symbol',
      '--limit',
      '5',
    ]);
    assert.equal(search.stdout.ok, true);
    assert.equal(search.stdout.command, 'search');
    assert.ok(search.stdout.data.items.some((item) => item.type === 'function' && item.function.name === 'RootApp'));

    const cleanup = await execAgent(['--url', service.url, 'cleanup-evidence', 'src/', '--limit', '10']);
    assert.equal(cleanup.stdout.ok, true);
    assert.equal(cleanup.stdout.command, 'cleanup-evidence');
    assert.deepEqual(cleanup.stdout.data.scope, {
      input: 'src/',
      kind: 'folder',
      pathPrefix: 'src/',
    });
    assert.equal(cleanup.stdout.data.evidence.modules.total, 4);
    assert.ok(cleanup.stdout.data.evidence.dependencies.outgoingOutsideScope
      .some((item) => item.targetPath === 'shared/theme.js'));
    assert.ok(cleanup.stdout.data.evidence.functions.total >= 4);
    assert.equal(cleanup.stdout.data.conclusion, undefined);
    assert.match(cleanup.stdout.data.semantics, /existing static evidence only/i);
  } finally {
    await service.close();
  }
});

test('ironglancer-agent cleanup evidence treats dot scope as the project root', async () => {
  const service = await startAgentApiFixture({
    modules: [
      mockModule('src/app.jsx', 1),
      mockModule('shared/theme.js', 2),
    ],
  });

  try {
    const cleanup = await execAgent(['--url', service.url, 'cleanup-evidence', '.', '--limit', '10']);
    assert.equal(cleanup.stdout.ok, true);
    assert.deepEqual(cleanup.stdout.data.scope, {
      input: '.',
      kind: 'folder',
      pathPrefix: '',
    });
    assert.equal(cleanup.stdout.data.evidence.modules.total, 2);
    assert.deepEqual(
      cleanup.stdout.data.evidence.modules.items.map((module) => module.path),
      ['src/app.jsx', 'shared/theme.js'],
    );
    assert.equal(cleanup.stdout.data.truncated, false);
  } finally {
    await service.close();
  }
});

test('ironglancer-agent cleanup evidence pages module discovery before scoping and truncation', async () => {
  const earlyModules = Array.from({ length: 200 }, (_, index) => mockModule(`early/module-${index}.js`, index));
  const laterModules = Array.from({ length: 15 }, (_, index) => mockModule(`later/module-${index}.js`, index + 200));
  const service = await startAgentApiFixture({
    modules: [...earlyModules, ...laterModules],
  });

  try {
    const cleanup = await execAgent(['--url', service.url, 'cleanup-evidence', 'later/', '--limit', '10']);
    assert.equal(cleanup.stdout.ok, true);
    assert.deepEqual(
      service.moduleRequests.map((request) => request.offset),
      [0, 200],
    );
    assert.equal(cleanup.stdout.data.evidence.modules.total, 15);
    assert.equal(cleanup.stdout.data.evidence.modules.returned, 10);
    assert.equal(cleanup.stdout.data.truncated, true);
    assert.equal(
      cleanup.stdout.data.evidence.modules.items.every((module) => module.path.startsWith('later/')),
      true,
    );
  } finally {
    await service.close();
  }
});

test('ironglancer-agent cleanup evidence fails closed when module pagination cannot complete', async () => {
  const service = await startAgentApiFixture({
    modules: Array.from({ length: 200 }, (_, index) => mockModule(`src/module-${index}.js`, index)),
    moduleTotal: 201,
    failingModuleOffsets: new Set([200]),
  });

  try {
    await assert.rejects(
      execAgent(['--url', service.url, 'cleanup-evidence', 'src/', '--limit', '10']),
      (error) => {
        assert.notEqual(error.code, 0);
        const payload = JSON.parse(error.stdout);
        assert.equal(payload.ok, false);
        assert.equal(payload.error.code, 'module_page_unavailable');
        assert.match(payload.error.message, /offset 200/);
        assert.deepEqual(
          service.moduleRequests.map((request) => request.offset),
          [0, 200],
        );
        return true;
      },
    );
  } finally {
    await service.close();
  }
});

test('ironglancer-agent cleanup evidence fails closed when the snapshot changes during collection', async () => {
  const service = await startAgentApiFixture({
    modules: [mockModule('src/app.jsx', 1)],
    changeSnapshotAfterModuleList: true,
  });

  try {
    await assert.rejects(
      execAgent(['--url', service.url, 'cleanup-evidence', 'src/', '--limit', '10']),
      (error) => {
        assert.notEqual(error.code, 0);
        const payload = JSON.parse(error.stdout);
        assert.equal(payload.ok, false);
        assert.equal(payload.error.code, 'snapshot_mismatch');
        assert.match(payload.error.message, /changed while collecting cleanup evidence/);
        return true;
      },
    );
  } finally {
    await service.close();
  }
});

test('ironglancer-agent correlates bridge commands with viewer acknowledgements', async () => {
  const outDir = await makeTempDir('ironglancer-agent-bridge-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
  const service = await startStaticAnalysisServer({ outDir, port: 0 });

  try {
    const child = spawn(process.execPath, [
      'src/agent-cli.mjs',
      '--url',
      service.url,
      'graph-view',
      '--primary-view',
      'function-graphs',
      '--layout',
      'radial',
      '--scope',
      'both',
      '--depth',
      '2',
      '--show-files',
      'true',
      '--source-file-types',
      'jsx,js',
      '--wait',
      '--timeout-ms',
      '5000',
    ], {
      cwd: path.resolve('.'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const collected = collectChild(child);

    const commandsUrl = new URL('bridge/v1/commands?clientId=viewer-test&afterRevision=0', service.url);
    const commandRecord = await waitFor(async () => {
      const commands = await fetchJson(commandsUrl);
      return commands.body.data.commands[0] || null;
    }, 'agent command was not queued');

    assert.equal(commandRecord.command.type, 'setGraphView');
    assert.equal(commandRecord.command.primaryView, 'function-graphs');
    assert.equal(commandRecord.command.layout, 'radial');
    assert.equal(commandRecord.command.scope, 'both');
    assert.equal(commandRecord.snapshot.buildId, service.snapshot.buildId);

    await fetchJson(new URL('bridge/v1/state', service.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        clientId: 'viewer-test',
        revision: 1,
        reason: 'agent-command-test',
        snapshot: service.snapshot,
        primaryView: 'function-graphs',
        graph: {
          primaryView: 'function-graphs',
          layout: 'radial',
          nodeVisibility: { files: true, functions: true },
          sourceFileTypes: { jsx: true, js: true },
          scope: 'both',
          depth: '2',
          visible: { files: 4, functions: 6, functionEdges: 4, fileEdges: 3 },
        },
      }),
    });
    await fetchJson(new URL('bridge/v1/ack', service.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        clientId: 'viewer-test',
        commandId: commandRecord.commandId,
        commandRevision: commandRecord.revision,
        status: 'applied',
        message: 'graph view updated',
        stateRevision: 1,
        snapshot: service.snapshot,
      }),
    });

    const exit = await collected.exit;
    assert.deepEqual({ code: exit.code, signal: exit.signal }, { code: 0, signal: null }, exit.stderr);
    const payload = JSON.parse(exit.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.command, 'graph-view');
    assert.equal(payload.data.command.commandId, commandRecord.commandId);
    assert.equal(payload.data.acknowledgement.status, 'applied');
    assert.equal(payload.data.verified.latestState.graph.layout, 'radial');
    assert.equal(payload.data.verified.latestState.graph.scope, 'both');
  } finally {
    await service.close();
  }
});
