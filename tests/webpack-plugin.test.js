import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const webpack = require('webpack');
const RequiredWebpackPlugin = require('ironglancer/webpack');
const { IronGlancerWebpackPlugin: ImportedWebpackPlugin, default: DefaultWebpackPlugin } = await import('ironglancer/webpack');
const packageExports = await import('ironglancer');

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

function createHook() {
  const taps = [];
  return {
    tap(_name, callback) {
      taps.push(callback);
    },
    tapPromise(_name, callback) {
      taps.push(callback);
    },
    call(...args) {
      return taps.map((callback) => callback(...args));
    },
    async promise(...args) {
      let result;
      for (const callback of taps) result = await callback(...args);
      return result;
    },
  };
}

function memoryLogger() {
  const entries = [];
  const write = (level) => (message) => entries.push({ level, message: String(message) });
  return {
    entries,
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
    debug: write('debug'),
  };
}

function createCompiler({ context = fixtureRoot } = {}) {
  const logger = memoryLogger();
  return {
    context,
    logger,
    hooks: {
      done: createHook(),
      watchClose: createHook(),
      shutdown: createHook(),
    },
    getInfrastructureLogger() {
      return logger;
    },
  };
}

function successfulStats() {
  return { hasErrors: () => false };
}

function failedStats() {
  return { hasErrors: () => true };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  return { response, body: await response.json() };
}

async function listenOnReleasedPort(port) {
  const server = http.createServer((_request, response) => {
    response.writeHead(204);
    response.end();
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function createWebpackWatchQueue() {
  const events = [];
  const waiters = [];
  return {
    push(error, stats) {
      const event = { error, stats };
      const waiter = waiters.shift();
      if (waiter) {
        waiter.resolve(event);
      } else {
        events.push(event);
      }
    },
    next(timeoutMs = 15000) {
      if (events.length > 0) return Promise.resolve(events.shift());
      return new Promise((resolve, reject) => {
        let waiter;
        const timer = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index !== -1) waiters.splice(index, 1);
          reject(new Error(`Timed out waiting for Webpack watch build after ${timeoutMs}ms.`));
        }, timeoutMs);
        waiter = {
          resolve(event) {
            clearTimeout(timer);
            resolve(event);
          },
        };
        waiters.push(waiter);
      });
    },
  };
}

function assertCleanWebpackBuild({ error, stats }) {
  if (error) throw error;
  if (stats?.hasErrors()) {
    throw new Error(stats.toString({ all: false, errors: true }));
  }
}

async function closeWebpackWatching(watching) {
  if (!watching) return;
  await new Promise((resolve, reject) => {
    watching.close((error) => (error ? reject(error) : resolve()));
  });
}

async function closeWebpackCompiler(compiler) {
  if (!compiler || typeof compiler.close !== 'function') return;
  await new Promise((resolve, reject) => {
    compiler.close((error) => (error ? reject(error) : resolve()));
  });
}

async function writeTinyBrowserProject(projectDir, message) {
  await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
  await fs.writeFile(path.join(projectDir, 'index.html'), [
    '<!doctype html>',
    '<meta charset="utf-8">',
    '<title>Tiny Webpack App</title>',
    '<script type="module" src="./src/main.js"></script>',
    '',
  ].join('\n'), 'utf8');
  await fs.writeFile(path.join(projectDir, 'src/main.js'), [
    "import { message, decorate } from './message.js';",
    '',
    'const mount = document.createElement("main");',
    'mount.id = "app";',
    'mount.textContent = decorate(message);',
    'document.body.append(mount);',
    '',
    'export function currentMessage() {',
    '  return decorate(message);',
    '}',
    '',
  ].join('\n'), 'utf8');
  await fs.writeFile(path.join(projectDir, 'src/message.js'), message, 'utf8');
}

test('package exposes the Webpack plugin for import and require', () => {
  assert.equal(ImportedWebpackPlugin, DefaultWebpackPlugin);
  assert.equal(packageExports.IronGlancerWebpackPlugin, ImportedWebpackPlugin);
  assert.equal(RequiredWebpackPlugin.IronGlancerWebpackPlugin, RequiredWebpackPlugin);
  assert.equal(new ImportedWebpackPlugin({ enabled: false }).constructor.name, 'IronGlancerWebpackPlugin');
  assert.equal(new RequiredWebpackPlugin({ enabled: false }).constructor.name, 'IronGlancerWebpackPlugin');
});

test('successful Webpack builds generate a viewer and refresh the managed API and bridge service', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-webpack-site-'));
  const plugin = new ImportedWebpackPlugin({
    rootDir: fixtureRoot,
    entry: 'src/app.jsx',
    outDir,
    sourceMode: 'full',
    port: 0,
  });
  const compiler = createCompiler();
  plugin.apply(compiler);

  try {
    await compiler.hooks.done.promise(successfulStats());
    const firstState = plugin.getState();
    assert.equal(firstState.status, 'ready');
    assert.equal(firstState.outDir, outDir);
    assert.match(firstState.serviceUrl, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    assert.equal(firstState.apiUrl, `${firstState.serviceUrl}api/v1`);
    assert.equal(firstState.bridgeUrl, `${firstState.serviceUrl}bridge/v1/`);
    assert.ok(compiler.logger.entries.some((entry) => entry.message.includes('IronGlancer URLs:')));

    const indexHtml = await fs.readFile(path.join(outDir, 'index.html'), 'utf8');
    assert.match(indexHtml, /<title>IronGlancer<\/title>/);

    const viewer = await fetch(firstState.serviceUrl);
    assert.equal(viewer.status, 200);
    assert.match(await viewer.text(), /<title>IronGlancer<\/title>/);

    const firstRun = await fetchJson(`${firstState.apiUrl}/run`);
    assert.equal(firstRun.response.status, 200);
    assert.equal(firstRun.body.data.entry, 'src/app.jsx');

    const firstBridge = await fetchJson(firstState.bridgeUrl);
    assert.equal(firstBridge.response.status, 200);
    assert.equal(firstBridge.body.data.snapshot.entry, 'src/app.jsx');

    const queued = await fetchJson(`${firstState.bridgeUrl}commands`, {
      method: 'POST',
      body: JSON.stringify({ command: { type: 'setGraphView', layout: 'radial', scope: 'both', depth: '2' } }),
    });
    assert.equal(queued.response.status, 201);
    const commands = await fetchJson(`${firstState.bridgeUrl}commands?clientId=webpack-viewer&afterRevision=0`);
    assert.equal(commands.body.data.commands[0].command.type, 'setGraphView');

    plugin.options.entry = 'src/components/App.jsx';
    await compiler.hooks.done.promise(successfulStats());
    const secondState = plugin.getState();
    assert.equal(secondState.serviceUrl, firstState.serviceUrl);
    const secondRun = await fetchJson(`${secondState.apiUrl}/run`);
    assert.equal(secondRun.body.data.entry, 'src/components/App.jsx');
    const secondBridge = await fetchJson(secondState.bridgeUrl);
    assert.equal(secondBridge.body.data.snapshot.entry, 'src/components/App.jsx');
    assert.notEqual(secondBridge.body.data.snapshot.buildId, firstBridge.body.data.snapshot.buildId);
  } finally {
    await plugin.close();
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('actual Webpack 5 watch rebuild refreshes the generated viewer service and releases its listener', { timeout: 30000 }, async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-webpack-watch-'));
  const projectDir = path.join(tempRoot, 'project');
  const outDir = path.join(tempRoot, 'analysis');
  const bundleDir = path.join(tempRoot, 'dist');
  const messagePath = path.join(projectDir, 'src/message.js');
  const watchQueue = createWebpackWatchQueue();
  const firstMessageModule = [
    "export const message = 'alpha';",
    'export function decorate(value) {',
    '  return `first:${value}`;',
    '}',
    '',
  ].join('\n');
  const secondMessageModule = [
    "export const message = 'bravo';",
    'export function decorate(value) {',
    '  return `second:${value.toUpperCase()}`;',
    '}',
    '',
  ].join('\n');
  let compiler;
  let plugin;
  let watching;
  let serviceUrl;
  let servicePort;

  try {
    await writeTinyBrowserProject(projectDir, firstMessageModule);
    plugin = new ImportedWebpackPlugin({
      rootDir: projectDir,
      entry: 'src/main.js',
      outDir,
      sourceMode: 'full',
      moduleLimit: 20,
      port: 0,
    });
    compiler = webpack({
      mode: 'development',
      target: 'web',
      context: projectDir,
      entry: './src/main.js',
      output: {
        path: bundleDir,
        filename: 'bundle.js',
        clean: true,
      },
      cache: false,
      optimization: {
        minimize: false,
      },
      plugins: [plugin],
      infrastructureLogging: {
        level: 'none',
      },
    });

    watching = compiler.watch({
      aggregateTimeout: 50,
      ignored: /node_modules/,
      poll: 100,
    }, (error, stats) => {
      watchQueue.push(error, stats);
    });

    assertCleanWebpackBuild(await watchQueue.next());
    await plugin.whenIdle();
    const firstState = plugin.getState();
    assert.equal(firstState.status, 'ready');
    assert.equal(firstState.outDir, outDir);
    assert.match(firstState.serviceUrl, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    serviceUrl = firstState.serviceUrl;
    servicePort = firstState.service.port;

    const firstOutput = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
    assert.equal(firstOutput.meta.entry, 'src/main.js');
    assert.equal(firstOutput.modules.some((module) => module.path === 'src/message.js'), true);

    const firstServedOutput = await fetchJson(new URL('/output.json', serviceUrl));
    assert.equal(firstServedOutput.response.status, 200);
    assert.equal(firstServedOutput.body.meta.buildId, firstOutput.meta.buildId);

    const viewer = await fetch(serviceUrl);
    assert.equal(viewer.status, 200);
    assert.match(await viewer.text(), /<title>IronGlancer<\/title>/);

    const firstRun = await fetchJson(new URL('/api/v1/run', serviceUrl));
    assert.equal(firstRun.response.status, 200);
    assert.equal(firstRun.body.data.entry, 'src/main.js');
    assert.equal(firstRun.body.data.buildId, firstOutput.meta.buildId);

    const firstBridge = await fetchJson(new URL('/bridge/v1/', serviceUrl));
    assert.equal(firstBridge.response.status, 200);
    assert.equal(firstBridge.body.data.snapshot.entry, 'src/main.js');
    assert.equal(firstBridge.body.data.snapshot.buildId, firstOutput.meta.buildId);

    await new Promise((resolve) => setTimeout(resolve, 150));
    await fs.writeFile(messagePath, secondMessageModule, 'utf8');
    const changedTime = new Date(Date.now() + 1000);
    await fs.utimes(messagePath, changedTime, changedTime);

    assertCleanWebpackBuild(await watchQueue.next());
    await plugin.whenIdle();
    const secondState = plugin.getState();
    assert.equal(secondState.status, 'ready');
    assert.equal(secondState.serviceUrl, serviceUrl);
    assert.equal(secondState.service.port, servicePort);

    const secondOutput = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
    const secondServedOutput = await fetchJson(new URL('/output.json', serviceUrl));
    const secondRun = await fetchJson(new URL('/api/v1/run', serviceUrl));
    const secondBridge = await fetchJson(new URL('/bridge/v1/', serviceUrl));
    assert.equal(secondServedOutput.response.status, 200);
    assert.equal(secondRun.response.status, 200);
    assert.equal(secondBridge.response.status, 200);
    assert.notEqual(secondOutput.meta.buildId, firstOutput.meta.buildId);
    assert.equal(secondServedOutput.body.meta.buildId, secondOutput.meta.buildId);
    assert.equal(secondRun.body.data.buildId, secondOutput.meta.buildId);
    assert.equal(secondBridge.body.data.snapshot.buildId, secondOutput.meta.buildId);
    assert.equal(secondRun.body.data.sourceCodeHash, secondOutput.meta.sourceCodeHash);
    assert.notEqual(secondRun.body.data.sourceCodeHash, firstRun.body.data.sourceCodeHash);

    await closeWebpackWatching(watching);
    watching = null;
    await plugin.whenClosed();
    await closeWebpackCompiler(compiler);
    compiler = null;

    await assert.rejects(fetch(serviceUrl));
    await listenOnReleasedPort(servicePort);
    assert.equal(plugin.getState().status, 'closed');
  } finally {
    await closeWebpackWatching(watching);
    await closeWebpackCompiler(compiler);
    if (plugin) await plugin.close();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test('failed Webpack compilations skip IronGlancer generation', async () => {
  let generateCalls = 0;
  const plugin = new ImportedWebpackPlugin({ enabled: false }, {
    async generateStaticSite(options) {
      generateCalls += 1;
      return { outDir: options.outDir };
    },
  });
  const compiler = createCompiler();
  plugin.apply(compiler);

  await compiler.hooks.done.promise(failedStats());

  assert.equal(generateCalls, 0);
  assert.equal(plugin.getState().status, 'idle');
  assert.ok(compiler.logger.entries.some((entry) => entry.level === 'warn' && entry.message.includes('Skipping IronGlancer')));
});

test('rapid rebuilds are serialized and coalesced while analysis is running', async () => {
  let generateCalls = 0;
  let active = 0;
  let maxActive = 0;
  const plugin = new ImportedWebpackPlugin({ enabled: false, entry: 'src/app.jsx' }, {
    async generateStaticSite(options) {
      generateCalls += 1;
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 25));
      active -= 1;
      return { outDir: options.outDir };
    },
  });
  const compiler = createCompiler();
  plugin.apply(compiler);

  const first = compiler.hooks.done.promise(successfulStats());
  const second = compiler.hooks.done.promise(successfulStats());
  const third = compiler.hooks.done.promise(successfulStats());
  await Promise.all([first, second, third]);

  assert.equal(maxActive, 1);
  assert.equal(generateCalls, 2);
  assert.equal(plugin.getState().status, 'ready');
});

test('generation failure preserves the previous output and live service', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-webpack-preserve-'));
  const plugin = new ImportedWebpackPlugin({
    rootDir: fixtureRoot,
    entry: 'src/app.jsx',
    outDir,
    sourceMode: 'full',
    port: 0,
  });
  const compiler = createCompiler();
  plugin.apply(compiler);

  try {
    await compiler.hooks.done.promise(successfulStats());
    const firstState = plugin.getState();
    const firstOutput = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
    const firstRun = await fetchJson(`${firstState.apiUrl}/run`);

    await plugin.refresh({ entry: 'src/does-not-exist.jsx' });

    const secondState = plugin.getState();
    const secondOutput = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
    const secondRun = await fetchJson(`${secondState.apiUrl}/run`);

    assert.equal(secondState.status, 'stale');
    assert.equal(secondOutput.meta.buildId, firstOutput.meta.buildId);
    assert.equal(secondRun.body.data.buildId, firstRun.body.data.buildId);
    assert.equal(secondRun.body.data.entry, 'src/app.jsx');
    assert.equal(secondState.serviceUrl, firstState.serviceUrl);
  } finally {
    await plugin.close();
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('service refresh failure preserves the previous report and handler', async () => {
  let generationCount = 0;
  let handlerCount = 0;
  const plugin = new ImportedWebpackPlugin({ entry: 'src/app.jsx', port: 0 }, {
    async generateStaticSite(options) {
      generationCount += 1;
      return { outDir: `${options.outDir}-${generationCount}` };
    },
    async createStaticAnalysisRequestHandler({ outDir }) {
      handlerCount += 1;
      if (handlerCount === 2) throw new Error('handler refresh failed');
      return (request, response) => {
        if (request.url === '/api/v1/run') {
          response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify({ ok: true, data: { outDir } }) + '\n');
          return;
        }
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end('<title>IronGlancer</title>');
      };
    },
  });
  const compiler = createCompiler();
  plugin.apply(compiler);

  try {
    await compiler.hooks.done.promise(successfulStats());
    const firstState = plugin.getState();
    const firstRun = await fetchJson(`${firstState.apiUrl}/run`);
    assert.equal(firstRun.body.data.outDir.endsWith('-1'), true);
    assert.equal(plugin.lastResult.outDir.endsWith('-1'), true);

    await compiler.hooks.done.promise(successfulStats());

    const secondState = plugin.getState();
    const secondRun = await fetchJson(`${secondState.apiUrl}/run`);
    assert.equal(secondState.status, 'stale');
    assert.equal(secondState.serviceUrl, firstState.serviceUrl);
    assert.equal(plugin.lastResult.outDir.endsWith('-1'), true);
    assert.equal(secondRun.body.data.outDir, firstRun.body.data.outDir);
  } finally {
    await plugin.close();
  }
});

test('constructor options are passed to normal IronGlancer generation', async () => {
  const rootDir = path.join(os.tmpdir(), 'ironglancer-webpack-options');
  let captured = null;
  const plugin = new ImportedWebpackPlugin({
    rootDir,
    entry: 'src/main.jsx',
    outDir: 'site',
    framework: 'react',
    sourceRoot: 'src',
    aliases: ['@/=src/'],
    alias: new Map([['~/', 'lib/']]),
    includeUnreachable: true,
    exclude: 'dist/**',
    sourceMode: 'declarations',
    includeSource: true,
    moduleLimit: 42,
    enabled: false,
  }, {
    async generateStaticSite(options) {
      captured = options;
      return { outDir: options.outDir };
    },
  });
  const compiler = createCompiler({ context: path.join(os.tmpdir(), 'unused-context') });
  plugin.apply(compiler);

  await compiler.hooks.done.promise(successfulStats());

  assert.equal(captured.rootDir, path.resolve(rootDir));
  assert.equal(captured.entry, 'src/main.jsx');
  assert.equal(captured.outDir, path.resolve(rootDir, 'site'));
  assert.equal(captured.framework, 'react');
  assert.equal(captured.sourceRoot, 'src');
  assert.deepEqual(captured.aliases, ['@/=src/', { from: '~/', to: 'lib/' }]);
  assert.deepEqual(captured.exclude, ['dist/**']);
  assert.equal(captured.includeUnreachable, true);
  assert.equal(captured.includeSource, true);
  assert.equal(captured.sourceMode, 'full');
  assert.equal(captured.moduleLimit, 42);
  assert.equal(plugin.getState().service, null);
});

test('watch shutdown closes listeners and releases the managed service port', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-webpack-close-'));
  const plugin = new ImportedWebpackPlugin({
    rootDir: fixtureRoot,
    entry: 'src/app.jsx',
    outDir,
    sourceMode: 'full',
    port: 0,
  });
  const compiler = createCompiler();
  plugin.apply(compiler);

  try {
    await compiler.hooks.done.promise(successfulStats());
    const { port, serviceUrl } = plugin.getState().service;
    const beforeClose = await fetch(serviceUrl);
    assert.equal(beforeClose.status, 200);

    compiler.hooks.watchClose.call();
    await plugin.whenClosed();

    await assert.rejects(fetch(serviceUrl));
    await listenOnReleasedPort(port);
    assert.equal(plugin.getState().status, 'closed');
  } finally {
    await plugin.close();
    await fs.rm(outDir, { recursive: true, force: true });
  }
});
