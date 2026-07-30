import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { generateStaticSite } from '../src/lib/generate-static-site.js';

const browserTestsEnabled = process.env.IRONGLANCER_BROWSER_TESTS === '1';

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next common browser path.
    }
  }
  return null;
}

async function availablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html;charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json;charset=utf-8';
  if (filePath.endsWith('.mjs') || filePath.endsWith('.js')) return 'text/javascript;charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css;charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml;charset=utf-8';
  return 'application/octet-stream';
}

function safeRequestPath(rootDir, requestUrl) {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const filePath = path.resolve(rootDir, relativePath);
  const relativeToRoot = path.relative(rootDir, filePath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) return null;
  return filePath;
}

async function startStaticServer(rootDir) {
  const server = http.createServer(async (request, response) => {
    try {
      let filePath = safeRequestPath(rootDir, request.url || '/');
      if (!filePath) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      const stat = await fs.stat(filePath).catch(() => null);
      if (stat?.isDirectory()) filePath = path.join(filePath, 'index.html');
      const body = await fs.readFile(filePath);
      response.writeHead(200, { 'content-type': contentType(filePath) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    server,
    url: `http://127.0.0.1:${port}/`,
  };
}

async function readJson(url, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function waitForChrome(debugPort, chrome, chromeOutput) {
  const endpoint = `http://127.0.0.1:${debugPort}/json/version`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (chrome.exitCode != null) {
      throw new Error(`Chrome exited before CDP was ready.\n${chromeOutput()}`);
    }
    try {
      return await readJson(endpoint);
    } catch {
      await delay(100);
    }
  }
  throw new Error(`Timed out waiting for Chrome CDP.\n${chromeOutput()}`);
}

async function newPageWebSocketUrl(debugPort, url) {
  const target = await readJson(
    `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`,
    { method: 'PUT' },
  );
  if (target.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;

  const pages = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
  const page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  if (!page) throw new Error('Chrome did not expose a page target WebSocket URL.');
  return page.webSocketDebuggerUrl;
}

async function stopChrome(chrome) {
  if (chrome.exitCode != null) return;
  chrome.kill('SIGTERM');
  const exited = await Promise.race([
    once(chrome, 'exit').then(() => true),
    delay(2000).then(() => false),
  ]);
  if (!exited && chrome.exitCode == null) {
    chrome.kill('SIGKILL');
    await once(chrome, 'exit').catch(() => {});
  }
}

function parseCdpMessage(data) {
  const text = typeof data === 'string' ? data : Buffer.from(data).toString('utf8');
  return JSON.parse(text);
}

async function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = parseCdpMessage(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(message.error.message || JSON.stringify(message.error)));
      return;
    }
    resolve(message.result || {});
  });
  socket.addEventListener('close', () => {
    for (const { reject } of pending.values()) reject(new Error('CDP socket closed.'));
    pending.clear();
  });

  return {
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
    close() {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    },
  };
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(description);
  }
  return result.result?.value;
}

async function waitForExpression(client, expression, timeoutMs = 15_000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = await evaluate(client, expression);
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for expression: ${expression}\n${lastError?.message || ''}`);
}

async function writeDenseFixture(rootDir) {
  const components = [
    'CreatorLogin',
    'CreatorShell',
    ...Array.from({ length: 150 }, (_, index) => `DenseRow${String(index + 1).padStart(3, '0')}`),
  ];
  const source = components.map((name) => [
    `export function ${name}() {`,
    `  return <section>{'${name}'}</section>;`,
    '}',
  ].join('\n')).join('\n\n');

  await fs.mkdir(path.join(rootDir, 'src'), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'src/app.jsx'), source, 'utf8');
}

test('real browser dense source labels open the clicked declaration at 20 percent zoom', {
  skip: browserTestsEnabled ? false : 'Set IRONGLANCER_BROWSER_TESTS=1 to run Chrome verification.',
}, async (t) => {
  const chromePath = await findChrome();
  if (!chromePath) {
    t.skip('Chrome or Chromium was not found.');
    return;
  }
  if (typeof WebSocket !== 'function') {
    t.skip('The current Node runtime does not expose WebSocket.');
    return;
  }

  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-dense-browser-root-'));
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-dense-browser-site-'));
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-chrome-profile-'));
  t.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  t.after(() => fs.rm(outDir, { recursive: true, force: true }));
  t.after(() => fs.rm(profileDir, { recursive: true, force: true }));

  await writeDenseFixture(rootDir);
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });
  let site;
  try {
    site = await startStaticServer(outDir);
  } catch (error) {
    if (error?.code === 'EPERM' || error?.code === 'EACCES') {
      t.skip(`Cannot start local HTTP server in this environment: ${error.message}`);
      return;
    }
    throw error;
  }
  const { server, url } = site;
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  }));

  let debugPort;
  try {
    debugPort = await availablePort();
  } catch (error) {
    if (error?.code === 'EPERM' || error?.code === 'EACCES') {
      t.skip(`Cannot reserve Chrome debug port in this environment: ${error.message}`);
      return;
    }
    throw error;
  }
  let stderr = '';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  chrome.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });
  t.after(() => stopChrome(chrome));

  await waitForChrome(debugPort, chrome, () => stderr);
  const client = await createCdpClient(await newPageWebSocketUrl(debugPort, url));
  t.after(() => client.close());

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Page.navigate', { url });
  await waitForExpression(client, `
    document.getElementById('mermaid')?.textContent.includes('CreatorLogin')
      && document.querySelectorAll('.source-member-trigger').length > 100
      && document.querySelectorAll('.source-member-hit-target').length > 100
      && fetch('./output.json').then((response) => response.ok)
  `);

  const probe = await evaluate(client, `
    (() => {
      const viewport = document.getElementById('diagram-viewport');
      const zoomOut = document.getElementById('zoom-out-btn');
      for (let index = 0; index < 20; index += 1) zoomOut.click();
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;

      const label = Array.from(document.querySelectorAll('.source-member-trigger'))
        .find((element) => element.textContent.includes('CreatorLogin'));
      if (!label) return { ok: false, reason: 'missing CreatorLogin label' };

      label.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = label.getBoundingClientRect();
      const x = rect.left + (rect.width / 2);
      const y = rect.top + (rect.height / 2);
      const stack = document.elementsFromPoint(x, y);
      const labelId = label.getAttribute('data-source-member-target-id');
      const hitTargets = stack
        .filter((element) => element.classList?.contains('source-member-hit-target'))
        .map((element) => element.getAttribute('data-source-member-target-id'));

      return {
        ok: true,
        x,
        y,
        labelId,
        hitTargets,
        zoom: document.getElementById('zoom-status').textContent,
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      };
    })()
  `);

  assert.equal(probe.ok, true, probe.reason);
  assert.equal(probe.zoom, 'Zoom 20%');
  assert.ok(probe.rect.width > 0);
  assert.ok(probe.rect.height > 0);
  assert.ok(
    probe.hitTargets.length >= 2,
    `expected overlapping source hit targets at CreatorLogin center: ${JSON.stringify(probe)}`,
  );
  assert.ok(
    probe.hitTargets.some((targetId) => targetId !== probe.labelId),
    `expected a neighboring hit target at CreatorLogin center: ${JSON.stringify(probe)}`,
  );

  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: probe.x, y: probe.y });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: probe.x,
    y: probe.y,
    button: 'left',
    buttons: 1,
    clickCount: 1,
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: probe.x,
    y: probe.y,
    button: 'left',
    buttons: 0,
    clickCount: 1,
  });

  const title = await waitForExpression(client, `
    document.getElementById('source-dialog')?.open
      && document.getElementById('source-dialog-title')?.textContent
  `);
  const sourcePath = await evaluate(client, "document.getElementById('source-dialog-path')?.textContent");
  assert.equal(title, 'CreatorLogin');
  assert.match(sourcePath, /^src\/app\.jsx:/);
});
