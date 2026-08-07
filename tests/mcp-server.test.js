import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

import { makeTempDir } from './helpers/temp-dir.js';
import { generateStaticSite } from '../src/lib/generate-static-site.js';

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

function encodeMcpMessage(message) {
  return `${JSON.stringify(message)}\n`;
}

function withTimeout(promise, message, ms = 2000) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function createMcpClient(analysisDir) {
  const child = spawn(process.execPath, ['src/mcp-server.mjs', '--analysis-dir', analysisDir], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let buffer = '';
  let stderr = '';
  const exitPromise = new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  const readMessage = () => new Promise((resolve, reject) => {
    const onExit = () => reject(new Error(stderr || 'MCP server exited before responding.'));
    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      const lineEnd = buffer.indexOf('\n');
      if (lineEnd === -1) return;
      const line = buffer.slice(0, lineEnd).replace(/\r$/, '');
      buffer = buffer.slice(lineEnd + 1);
      cleanup();
      try {
        resolve(JSON.parse(line));
      } catch (error) {
        reject(new Error(`MCP response was not newline-delimited JSON: ${line}`));
      }
    };
    const cleanup = () => {
      child.stdout.off('data', onData);
      child.off('exit', onExit);
    };
    child.stdout.on('data', onData);
    child.once('exit', onExit);
  });

  return {
    child,
    async request(message) {
      const response = withTimeout(readMessage(), `MCP server did not respond to ${message.method}.`);
      child.stdin.write(encodeMcpMessage(message));
      return response;
    },
    notify(message) {
      child.stdin.write(encodeMcpMessage(message));
    },
    async close() {
      if (child.exitCode !== null) return { code: child.exitCode, signal: child.signalCode };
      child.stdin.end();
      return withTimeout(exitPromise, stderr || 'MCP server did not exit after stdin closed.');
    },
  };
}

test('ironglancer MCP server exposes saved function placement tools over newline-delimited stdio', async () => {
  const outDir = await makeTempDir('ironglancer-mcp-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
  const client = createMcpClient(outDir);

  try {
    const initialized = await client.request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    assert.equal(initialized.result.serverInfo.name, 'ironglancer-mcp');
    client.notify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

    const list = await client.request({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    assert.deepEqual(list.result.tools.map((tool) => tool.name), [
      'ironglancer_run_summary',
      'ironglancer_list_modules',
      'ironglancer_get_module',
      'ironglancer_list_components',
      'ironglancer_list_assets',
      'ironglancer_list_findings',
      'ironglancer_search_functions',
      'ironglancer_get_function',
      'ironglancer_function_neighborhood',
      'ironglancer_investigate_function_placement',
      'ironglancer_source_excerpt',
      'ironglancer_viewer_state',
      'ironglancer_viewer_command',
    ]);

    const modules = await client.request({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'ironglancer_list_modules',
        arguments: { q: 'src/' },
      },
    });
    const modulesPayload = JSON.parse(modules.result.content[0].text);
    assert.deepEqual(modulesPayload.items.map((item) => item.path), [
      'src/app.jsx',
      'src/components/App.jsx',
      'src/lib/util.js',
      'src/panes/Inspector.jsx',
    ]);
    assert.equal(modulesPayload.items[0].componentCount, 1);

    const moduleDetail = await client.request({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'ironglancer_get_module',
        arguments: { modulePath: 'src/app.jsx' },
      },
    });
    const modulePayload = JSON.parse(moduleDetail.result.content[0].text);
    assert.equal(modulePayload.module.path, 'src/app.jsx');
    assert.equal(modulePayload.components[0].name, 'RootApp');
    assert.deepEqual(
      modulePayload.lazyBoundaries.map((item) => [item.kind, item.targetModulePath]).sort(),
      [
        ['dynamic-import', null],
        ['dynamic-import', 'src/panes/Inspector.jsx'],
      ],
    );

    const components = await client.request({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'ironglancer_list_components',
        arguments: { modulePath: 'src/components/App.jsx' },
      },
    });
    const componentsPayload = JSON.parse(components.result.content[0].text);
    assert.deepEqual(componentsPayload.items.map((item) => item.name), ['App']);

    const search = await client.request({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'ironglancer_search_functions',
        arguments: { q: 'RootApp' },
      },
    });
    const searchPayload = JSON.parse(search.result.content[0].text);
    assert.equal(searchPayload.items[0].name, 'RootApp');
    assert.equal(searchPayload.items[0].placementAssessment, 'public-entry-surface');

    const placement = await client.request({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'ironglancer_investigate_function_placement',
        arguments: { stableId: searchPayload.items[0].stableId },
      },
    });
    const placementPayload = JSON.parse(placement.result.content[0].text);
    assert.equal(placementPayload.placement.groups.callees.projectLocal.length, 2);
  } finally {
    const exit = await client.close();
    assert.deepEqual(exit, { code: 0, signal: null });
  }
});

test('ironglancer MCP server degrades explicitly when module source is unavailable', async () => {
  const outDir = await makeTempDir('ironglancer-mcp-source-mode-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });
  const client = createMcpClient(outDir);

  try {
    await client.request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    client.notify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

    const summary = await client.request({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'ironglancer_run_summary', arguments: {} },
    });
    const summaryPayload = JSON.parse(summary.result.content[0].text);
    assert.equal(summaryPayload.source.sourceMode, 'none');
    assert.equal(summaryPayload.source.moduleSourceAvailable, false);
    assert.equal(summaryPayload.source.functionMapAvailable, true);

    const search = await client.request({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'ironglancer_search_functions',
        arguments: { q: 'RootApp' },
      },
    });
    const searchPayload = JSON.parse(search.result.content[0].text);
    const detail = await client.request({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'ironglancer_get_function',
        arguments: { stableId: searchPayload.items[0].stableId },
      },
    });
    const detailPayload = JSON.parse(detail.result.content[0].text);
    assert.equal(detailPayload.source.available, false);
    assert.equal(detailPayload.source.sourceMode, 'none');

    const source = await client.request({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'ironglancer_source_excerpt',
        arguments: { modulePath: 'src/app.jsx' },
      },
    });
    assert.equal(source.result.isError, true);
    assert.match(source.result.content[0].text, /sourceMode=none/);
  } finally {
    const exit = await client.close();
    assert.deepEqual(exit, { code: 0, signal: null });
  }
});
