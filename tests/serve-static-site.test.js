import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

import { generateStaticSite } from '../src/lib/generate-static-site.js';
import { createStaticAnalysisRequestHandler } from '../src/lib/serve-static-site.js';

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

async function fetchJson(url) {
  const response = await requestUrl(url);
  return { response, body: JSON.parse(response.body) };
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = headers;
  }

  end(chunk = '') {
    this.body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
  }
}

let activeHandler = null;

async function requestUrl(url, { method = 'GET' } = {}) {
  const request = {
    method,
    url: typeof url === 'string' ? url : `${url.pathname}${url.search}`,
  };
  const response = new MockResponse();
  await activeHandler(request, response);
  return {
    status: response.statusCode,
    headers: response.headers,
    body: response.body,
    text: async () => response.body,
    json: async () => JSON.parse(response.body),
  };
}

test('static analysis server exposes viewer files and a versioned cached API', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-server-'));
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });
  activeHandler = await createStaticAnalysisRequestHandler({ outDir });

  try {
    const serviceUrl = new URL('http://127.0.0.1/');
    const viewer = await requestUrl('/');
    assert.equal(viewer.status, 200);
    assert.match(await viewer.text(), /<title>IronGlancer<\/title>/);

    const discovery = await fetchJson(new URL('/api/v1', serviceUrl));
    assert.equal(discovery.response.status, 200);
    assert.equal(discovery.body.ok, true);
    assert.equal(discovery.body.data.apiVersion, 'v1');
    assert.ok(discovery.body.data.routes.some((route) => route.path === '/api/v1/modules'));
    assert.ok(discovery.body.data.routes.some((route) => route.path === '/api/v1/symbols/:id/references'));

    const run = await fetchJson(new URL('/api/v1/run', serviceUrl));
    assert.equal(run.response.status, 200);
    assert.equal(run.body.data.rootDir, fixtureRoot);
    assert.equal(run.body.data.entry, 'src/app.jsx');
    assert.equal(run.body.data.package.name, 'ironglancer');
    assert.equal(run.body.data.summary.moduleCount, 5);
    assert.match(run.body.data.gitCommit, /^[a-f0-9]{40}$/);
    assert.equal(run.body.data.source.declarationSourceAvailable, true);
    assert.equal(run.body.data.source.moduleSourceAvailable, true);
    assert.equal(run.body.data.source.moduleSourceCount, 5);

    const modules = await fetchJson(new URL('/api/v1/modules?reachable=true&extension=.jsx&limit=2', serviceUrl));
    assert.equal(modules.response.status, 200);
    assert.equal(modules.body.data.pagination.total, 3);
    assert.equal(modules.body.data.pagination.limit, 2);
    assert.equal(modules.body.data.pagination.nextOffset, 2);
    assert.deepEqual(modules.body.data.items.map((item) => item.path), [
      'src/app.jsx',
      'src/components/App.jsx',
    ]);

    const allModules = await fetchJson(new URL('/api/v1/modules', serviceUrl));
    const appModule = allModules.body.data.items.find((item) => item.path === 'src/app.jsx');
    assert.ok(appModule, 'expected src/app.jsx in module list');
    assert.equal(appModule.sourceAvailable, true);

    const exactFunctions = await fetchJson(new URL('/api/v1/functions?name=App', serviceUrl));
    assert.equal(exactFunctions.response.status, 200);
    assert.deepEqual(exactFunctions.body.data.items.map((item) => item.name), ['App']);

    const dependencyFilteredFunctions = await fetchJson(new URL('/api/v1/functions?dependencyCount=2', serviceUrl));
    assert.equal(dependencyFilteredFunctions.response.status, 200);
    assert.deepEqual(dependencyFilteredFunctions.body.data.items.map((item) => item.name), ['RootApp']);

    const userFilteredFunctions = await fetchJson(new URL('/api/v1/functions?userCount=1', serviceUrl));
    assert.equal(userFilteredFunctions.response.status, 200);
    assert.deepEqual(userFilteredFunctions.body.data.items.map((item) => item.name), ['App', 'helper']);

    const exactSymbols = await fetchJson(new URL('/api/v1/symbols?name=App', serviceUrl));
    assert.equal(exactSymbols.response.status, 200);
    assert.deepEqual(exactSymbols.body.data.items.map((item) => item.name), ['App']);

    const referenceFilteredSymbols = await fetchJson(new URL('/api/v1/symbols?referenceCount=1', serviceUrl));
    assert.equal(referenceFilteredSymbols.response.status, 200);
    assert.deepEqual(referenceFilteredSymbols.body.data.items.map((item) => item.name), ['App', 'helper']);

    const unknownQuery = await fetchJson(new URL('/api/v1/functions?name=App&unknownFilter=1', serviceUrl));
    assert.equal(unknownQuery.response.status, 400);
    assert.equal(unknownQuery.body.ok, false);
    assert.equal(unknownQuery.body.error.code, 'unknown_query_parameter');
    assert.match(unknownQuery.body.error.message, /unknownFilter/);

    const appDetail = await fetchJson(new URL(`/api/v1/modules/${appModule.id}`, serviceUrl));
    assert.equal(appDetail.response.status, 200);
    assert.equal(appDetail.body.data.module.path, 'src/app.jsx');
    assert.deepEqual(appDetail.body.data.dependencies.local.map((item) => item.path), [
      'shared/theme.js',
      'src/components/App.jsx',
      'src/lib/util.js',
      'src/panes/Inspector.jsx',
    ]);
    assert.deepEqual(appDetail.body.data.dependencies.external, ['cdn.example.com']);

    const source = await fetchJson(new URL(`/api/v1/modules/${appModule.id}/source?startLine=7&endLine=9`, serviceUrl));
    assert.equal(source.response.status, 200);
    assert.equal(source.body.data.module.path, 'src/app.jsx');
    assert.deepEqual(source.body.data.lines, [
      { line: 7, text: 'export default function RootApp() {' },
      { line: 8, text: '  return App({ helper, pane, remoteLib });' },
      { line: 9, text: '}' },
    ]);

    const symbols = await fetchJson(new URL('/api/v1/symbols/search?q=helper', serviceUrl));
    assert.equal(symbols.response.status, 200);
    assert.equal(symbols.body.data.items.length, 1);
    assert.equal(symbols.body.data.items[0].name, 'helper');
    assert.equal(symbols.body.data.items[0].modulePath, 'src/lib/util.js');

    const references = await fetchJson(new URL(`/api/v1/symbols/${symbols.body.data.items[0].id}/references`, serviceUrl));
    assert.equal(references.response.status, 200);
    assert.match(references.body.data.relationSemantics, /not a runtime call graph/i);
    assert.equal(references.body.data.incomingReferenceCount, 1);
    assert.deepEqual(references.body.data.importedBy.map((item) => item.modulePath), ['src/app.jsx']);

    const query = await fetchJson(new URL('/api/v1/query?modulePath=src/app.jsx&symbol=RootApp', serviceUrl));
    assert.equal(query.response.status, 200);
    assert.equal(query.body.data.module.path, 'src/app.jsx');
    assert.deepEqual(query.body.data.symbols.items.map((item) => item.name), ['RootApp']);

    const traversal = await requestUrl('/api/v1/source?path=../package.json&startLine=1&endLine=1');
    assert.equal(traversal.status, 400);
    const traversalBody = await traversal.json();
    assert.equal(traversalBody.ok, false);
    assert.equal(traversalBody.error.code, 'invalid_module_path');

    const staticTraversal = await requestUrl('/%2e%2e/package.json');
    assert.equal(staticTraversal.status, 404);
    assert.doesNotMatch(await staticTraversal.text(), /"name": "ironglancer"/);

    const sourceCodeFile = await requestUrl('/source-code.json');
    assert.equal(sourceCodeFile.status, 200);
    const sourceCodeBody = await sourceCodeFile.json();
    assert.equal(sourceCodeBody.modules, undefined);

    const internalSource = await requestUrl('/.ironglancer-api/source-modules.json');
    assert.equal(internalSource.status, 404);
    assert.doesNotMatch(await internalSource.text(), /RootApp/);
    assert.equal((await requestUrl('/%2eironglancer-api/source-modules.json')).status, 404);

    const unknown = await fetchJson(new URL('/api/v1/nope', serviceUrl));
    assert.equal(unknown.response.status, 404);
    assert.equal(unknown.body.ok, false);
    assert.equal(unknown.body.error.code, 'not_found');
  } finally {
    activeHandler = null;
  }
});

test('module functions API supports compact summary pagination and query bounds', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-module-functions-src-'));
  const sourcePath = path.join(rootDir, 'src/app.jsx');
  await fs.mkdir(path.dirname(sourcePath), { recursive: true });
  await fs.writeFile(sourcePath, [
    'export function Alpha() {',
    '  return Beta();',
    '}',
    '',
    'export function Beta() {',
    "  return 'beta';",
    '}',
    '',
    'export function Gamma() {',
    '  return Beta();',
    '}',
  ].join('\n'), 'utf8');

  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-module-functions-api-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });
  activeHandler = await createStaticAnalysisRequestHandler({ outDir });

  try {
    const serviceUrl = new URL('http://127.0.0.1/');
    const modules = await fetchJson(new URL('/api/v1/modules?search=app', serviceUrl));
    const appModule = modules.body.data.items.find((item) => item.path === 'src/app.jsx');
    assert.ok(appModule, 'expected src/app.jsx module summary');

    const summary = await fetchJson(new URL(
      `/api/v1/modules/${appModule.id}/functions?detail=summary&limit=2&offset=1`,
      serviceUrl,
    ));
    assert.equal(summary.response.status, 200);
    assert.deepEqual(summary.body.data.pagination, {
      offset: 1,
      limit: 2,
      total: 3,
      nextOffset: null,
    });
    assert.deepEqual(summary.body.data.functions.map((item) => item.name), ['Beta', 'Gamma']);
    assert.ok(!('dependencies' in summary.body.data.functions[0]));
    assert.ok(!('users' in summary.body.data.functions[0]));
    assert.deepEqual(
      summary.body.data.functions.map(({ name, dependencyCount, userCount }) => ({ name, dependencyCount, userCount })),
      [
        { name: 'Beta', dependencyCount: 0, userCount: 2 },
        { name: 'Gamma', dependencyCount: 1, userCount: 0 },
      ],
    );

    const full = await fetchJson(new URL(`/api/v1/modules/${appModule.id}/functions`, serviceUrl));
    assert.equal(full.response.status, 200);
    assert.equal(full.body.data.pagination.total, 3);
    assert.equal(full.body.data.functions[0].function.name, 'Alpha');
    assert.ok(Array.isArray(full.body.data.functions[0].dependencies));
    assert.ok(Array.isArray(full.body.data.functions[0].users));

    const invalidLimit = await fetchJson(new URL(
      `/api/v1/modules/${appModule.id}/functions?detail=summary&limit=0`,
      serviceUrl,
    ));
    assert.equal(invalidLimit.response.status, 400);
    assert.equal(invalidLimit.body.error.code, 'invalid_query');

    const invalidDetail = await fetchJson(new URL(
      `/api/v1/modules/${appModule.id}/functions?detail=compact`,
      serviceUrl,
    ));
    assert.equal(invalidDetail.response.status, 400);
    assert.equal(invalidDetail.body.error.code, 'invalid_query');

    const unknownQuery = await fetchJson(new URL(
      `/api/v1/modules/${appModule.id}/functions?detail=summary&mystery=1`,
      serviceUrl,
    ));
    assert.equal(unknownQuery.response.status, 400);
    assert.equal(unknownQuery.body.error.code, 'unknown_query_parameter');
    assert.match(unknownQuery.body.error.message, /mystery/);
  } finally {
    activeHandler = null;
  }
});

test('static analysis server rejects static symlink escapes', async (t) => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-server-symlink-'));
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });
  try {
    await fs.symlink(path.resolve('package.json'), path.join(outDir, 'package-link.json'));
  } catch {
    t.skip('symlink creation is unavailable on this platform');
    return;
  }

  activeHandler = await createStaticAnalysisRequestHandler({ outDir });
  try {
    const response = await requestUrl('/package-link.json');
    assert.equal(response.status, 404);
    assert.doesNotMatch(await response.text(), /"name": "ironglancer"/);
  } finally {
    activeHandler = null;
  }
});
