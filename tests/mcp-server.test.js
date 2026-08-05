import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

import { generateStaticSite } from '../src/lib/generate-static-site.js';

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

function encodeMcpMessage(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`;
}

function createMcpClient(analysisDir) {
  const child = spawn(process.execPath, ['src/mcp-server.mjs', '--analysis-dir', analysisDir], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let buffer = Buffer.alloc(0);
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  const readMessage = () => new Promise((resolve, reject) => {
    const onExit = () => reject(new Error(stderr || 'MCP server exited before responding.'));
    const onData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;
      const header = buffer.slice(0, headerEnd).toString('utf8');
      const length = Number(header.match(/content-length:\s*(\d+)/i)?.[1]);
      if (!Number.isInteger(length)) {
        cleanup();
        reject(new Error('MCP response missing Content-Length.'));
        return;
      }
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (buffer.length < bodyEnd) return;
      const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
      buffer = buffer.slice(bodyEnd);
      cleanup();
      resolve(JSON.parse(body));
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
      const response = readMessage();
      child.stdin.write(encodeMcpMessage(message));
      return response;
    },
    close() {
      child.kill();
    },
  };
}

test('ironglancer MCP server exposes saved function placement tools over stdio', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-mcp-'));
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });
  const client = createMcpClient(outDir);

  try {
    const initialized = await client.request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    assert.equal(initialized.result.serverInfo.name, 'ironglancer-mcp');

    const list = await client.request({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    assert.ok(list.result.tools.some((tool) => tool.name === 'ironglancer_investigate_function_placement'));

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
    assert.equal(searchPayload.items[0].name, 'RootApp');
    assert.equal(searchPayload.items[0].placementAssessment, 'public-entry-surface');

    const placement = await client.request({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'ironglancer_investigate_function_placement',
        arguments: { stableId: searchPayload.items[0].stableId },
      },
    });
    const placementPayload = JSON.parse(placement.result.content[0].text);
    assert.equal(placementPayload.placement.groups.callees.projectLocal.length, 2);
  } finally {
    client.close();
  }
});
