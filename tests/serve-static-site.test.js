import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';

import { makeTempDir } from './helpers/temp-dir.js';
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

async function requestUrl(url, { method = 'GET', body = '' } = {}) {
  const request = {
    method,
    url: typeof url === 'string' ? url : `${url.pathname}${url.search}`,
    async *[Symbol.asyncIterator]() {
      if (body) yield Buffer.from(body, 'utf8');
    },
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
  const outDir = await makeTempDir('ironglancer-server-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
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
    assert.equal(discovery.body.data.schema.href, '/api/v1/schema');
    assert.equal(discovery.body.data.agentInterop.apiUrl, '/api/v1');
    assert.equal(discovery.body.data.agentInterop.bridgeUrl, '/bridge/v1/');
    assert.equal(discovery.body.data.agentInterop.transport, 'loopback-http-json');
    assert.equal(discovery.body.data.agentInterop.boundaries.analysisApi, 'read-only');
    assert.equal(discovery.body.data.agentInterop.boundaries.viewerBridge, 'presentation-only');
    assert.ok(discovery.body.data.routes.some((route) => route.path === '/api/v1/schema'));
    assert.ok(discovery.body.data.routes.some((route) => route.path === '/api/v1/modules'));
    assert.ok(discovery.body.data.routes.some((route) => route.path === '/api/v1/symbols/:id/references'));

    const run = await fetchJson(new URL('/api/v1/run', serviceUrl));
    assert.equal(run.response.status, 200);
    assert.equal(run.body.data.rootDir, null);
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
    assert.match(appModule.stableId, /^mod_[a-f0-9]{16}$/);
    assert.equal(appModule.sourceAvailable, true);

    const projectedModules = await fetchJson(new URL('/api/v1/modules?fields=path,lineCount&limit=1', serviceUrl));
    assert.deepEqual(Object.keys(projectedModules.body.data.items[0]).sort(), ['id', 'lineCount', 'path', 'stableId']);
    const invalidProjection = await fetchJson(new URL('/api/v1/modules?fields=path,nope', serviceUrl));
    assert.equal(invalidProjection.response.status, 400);
    assert.equal(invalidProjection.body.error.code, 'invalid_query');
    for (const malformedSelector of [
      '/api/v1/modules?fields=',
      '/api/v1/modules?fields=,,,',
      '/api/v1/modules?fields=path&fields=',
      `/api/v1/modules/${appModule.stableId}?include=`,
      `/api/v1/modules/${appModule.stableId}?include=,,,`,
      `/api/v1/modules/${appModule.stableId}?include=dependencies&include=`,
      '/api/v1/search?q=App&types=',
      '/api/v1/search?q=App&types=,,,',
      '/api/v1/search?q=App&types=function&types=',
    ]) {
      const malformed = await fetchJson(new URL(malformedSelector, serviceUrl));
      assert.equal(malformed.response.status, 400, malformedSelector);
      assert.equal(malformed.body.error.code, 'invalid_query', malformedSelector);
    }

    const appByStableId = await fetchJson(new URL(`/api/v1/modules/${appModule.stableId}`, serviceUrl));
    assert.equal(appByStableId.response.status, 200);
    assert.equal(appByStableId.body.data.module.path, 'src/app.jsx');
    assert.ok(appByStableId.body.data.imports.every((ref) => typeof ref.kind === 'string'));
    assert.ok(appByStableId.body.data.imports.every((ref) => ref.loadKind === ref.kind));

    const schema = await fetchJson(new URL('/api/v1/schema', serviceUrl));
    assert.equal(schema.response.status, 200);
    assert.equal(schema.body.data.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.deepEqual(schema.body.data.$defs.moduleSummary.required, ['id', 'stableId']);
    assert.deepEqual(schema.body.data.$defs.importSummary.required, ['stableId']);
    assert.match('fn_0123456789abcdef_10', new RegExp(schema.body.data.$defs.functionSummary.properties.stableId.pattern));
    const rawSchema = await requestUrl('/api/v1/schema.json');
    assert.equal(rawSchema.status, 200);
    assert.match(rawSchema.headers['content-type'], /^application\/schema\+json/);
    assert.equal((await rawSchema.json()).$id, '/api/v1/schema.json');

    const exactFunctions = await fetchJson(new URL('/api/v1/functions?name=App', serviceUrl));
    assert.equal(exactFunctions.response.status, 200);
    assert.deepEqual(exactFunctions.body.data.items.map((item) => item.name), ['App']);
    assert.match(exactFunctions.body.data.items[0].stableId, /^fn_[a-f0-9]{16}$/);
    assert.equal(
      (await fetchJson(new URL(`/api/v1/functions/${exactFunctions.body.data.items[0].stableId}`, serviceUrl))).body.data.function.name,
      'App',
    );

    const dependencyFilteredFunctions = await fetchJson(new URL('/api/v1/functions?dependencyCount=2', serviceUrl));
    assert.equal(dependencyFilteredFunctions.response.status, 200);
    assert.deepEqual(dependencyFilteredFunctions.body.data.items.map((item) => item.name), ['RootApp']);
    const linkedFunction = await fetchJson(new URL(
      `/api/v1/functions/${dependencyFilteredFunctions.body.data.items[0].stableId}?include=links`,
      serviceUrl,
    ));
    const firstLinkedEdge = linkedFunction.body.data.dependencies[0];
    assert.match(firstLinkedEdge.stableId, /^fedge_[a-f0-9]{16}$/);
    assert.match(firstLinkedEdge.sourceStableId, /^fn_[a-f0-9]{16}$/);
    assert.match(firstLinkedEdge.targetStableId, /^fn_[a-f0-9]{16}$/);
    assert.ok(firstLinkedEdge.sourceLink.href.startsWith('/api/v1/functions/fn_'));
    assert.ok(firstLinkedEdge.targetLink.href.startsWith('/api/v1/functions/fn_'));
    assert.equal('source' in firstLinkedEdge, false);
    assert.equal('target' in firstLinkedEdge, false);
    assert.equal(linkedFunction.body.data.function.placementAssessment, 'public-entry-surface');
    assert.equal(linkedFunction.body.data.placement.evidence.projectLocalCalleeCount, 2);

    const placementOnly = await fetchJson(new URL(
      `/api/v1/functions/${dependencyFilteredFunctions.body.data.items[0].stableId}/placement`,
      serviceUrl,
    ));
    assert.equal(placementOnly.response.status, 200);
    assert.equal(placementOnly.body.data.placement.assessment.assessment, 'public-entry-surface');
    assert.equal(placementOnly.body.data.placement.groups.callees.projectLocal.length, 2);

    const userFilteredFunctions = await fetchJson(new URL('/api/v1/functions?userCount=1', serviceUrl));
    assert.equal(userFilteredFunctions.response.status, 200);
    assert.deepEqual(userFilteredFunctions.body.data.items.map((item) => item.name), ['App', 'helper']);

    const exactSymbols = await fetchJson(new URL('/api/v1/symbols?name=App', serviceUrl));
    assert.equal(exactSymbols.response.status, 200);
    assert.deepEqual(exactSymbols.body.data.items.map((item) => item.name), ['App']);
    assert.match(exactSymbols.body.data.items[0].stableId, /^sym_[a-f0-9]{16}$/);
    assert.equal(
      (await fetchJson(new URL(`/api/v1/symbols/${exactSymbols.body.data.items[0].stableId}`, serviceUrl))).body.data.symbol.name,
      'App',
    );

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
    assert.deepEqual(appDetail.body.data.dependencies.external, []);
    const remoteImports = await fetchJson(new URL('/api/v1/imports?resolution=remote', serviceUrl));
    assert.equal(remoteImports.response.status, 200);
    assert.deepEqual(remoteImports.body.data.items.map((item) => item.specifier), ['https://cdn.example.com/widget.js']);

    const dependencyOnlyModule = await fetchJson(new URL(
      `/api/v1/modules/${appModule.stableId}?include=dependencies`,
      serviceUrl,
    ));
    assert.deepEqual(Object.keys(dependencyOnlyModule.body.data).sort(), ['dependencies', 'module']);

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

test('static analysis server reports source privacy limits explicitly', async () => {
  const outDir = await makeTempDir('ironglancer-server-source-mode-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });
  activeHandler = await createStaticAnalysisRequestHandler({ outDir });

  try {
    const run = await fetchJson('/api/v1/run');
    assert.equal(run.response.status, 200);
    assert.equal(run.body.data.source.sourceMode, 'none');
    assert.equal(run.body.data.source.declarationSourceAvailable, false);
    assert.equal(run.body.data.source.moduleSourceAvailable, false);
    assert.equal(run.body.data.source.functionMapAvailable, true);

    const modules = await fetchJson('/api/v1/modules');
    const appModule = modules.body.data.items.find((item) => item.path === 'src/app.jsx');
    const source = await fetchJson(`/api/v1/modules/${appModule.stableId}/source`);
    assert.equal(source.response.status, 404);
    assert.equal(source.body.error.code, 'source_not_available');
    assert.equal(source.body.error.details.sourceMode, 'none');

    const occurrenceSearch = await fetchJson('/api/v1/search?q=RootApp&match=exact&types=occurrence');
    assert.equal(occurrenceSearch.response.status, 404);
    assert.equal(occurrenceSearch.body.error.code, 'source_not_available');
    assert.equal(occurrenceSearch.body.error.details.moduleSourceAvailable, false);
  } finally {
    activeHandler = null;
  }
});

test('source excerpts preserve the API v1 80-line default and maximum', async () => {
  const rootDir = await makeTempDir('ironglancer-source-limit-src-');
  const outDir = await makeTempDir('ironglancer-source-limit-out-');
  await fs.mkdir(path.join(rootDir, 'src'), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, 'src/app.js'),
    ['export function App() { return 1; }', ...Array.from({ length: 119 }, (_, index) => `// line ${index + 2}`)].join('\n'),
    'utf8',
  );
  await generateStaticSite({ rootDir, entry: 'src/app.js', outDir, sourceMode: 'full', includeUnreachable: true });
  activeHandler = await createStaticAnalysisRequestHandler({ outDir });

  try {
    const modules = await fetchJson('/api/v1/modules');
    const appModule = modules.body.data.items.find((item) => item.path === 'src/app.js');
    const source = await fetchJson(`/api/v1/modules/${appModule.stableId}/source`);
    assert.equal(source.response.status, 200);
    assert.equal(source.body.data.startLine, 1);
    assert.equal(source.body.data.endLine, 80);
    assert.equal(source.body.data.lineCount, 80);
    assert.equal(source.body.data.maxLines, 80);
  } finally {
    activeHandler = null;
    await fs.rm(rootDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('module functions API supports compact summary pagination and query bounds', async () => {
  const rootDir = await makeTempDir('ironglancer-module-functions-src-');
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

  const outDir = await makeTempDir('ironglancer-module-functions-api-');
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
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

test('function and module lists expose triage filters and deterministic sorting', async () => {
  const rootDir = await makeTempDir('ironglancer-triage-src-');
  await fs.mkdir(path.join(rootDir, 'src'), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'src/app.js'), [
    "import { a } from './dep.js';",
    "import { b } from './dep.js';",
    'export function PublicEntry() {',
    '  const value = helper();',
    '  return value;',
    '}',
    'function helper() { return 1; }',
    'function unusedPrivate() { return 2; }',
    'function recur() { return recur(); }',
    'const jsxText = <div>hiddenJsxText suffixToken',
    '  multiToken',
    '  {helper}',
    '  {true && <span>nestedToken suffixNested</span>}',
    '</div>;',
    "const missingLazy = import('./missing-lazy.js');",
  ].join('\n'), 'utf8');
  await fs.writeFile(path.join(rootDir, 'src/dep.js'), 'export const a = 1; export const b = 2;\n', 'utf8');
  await fs.writeFile(path.join(rootDir, 'src/orphan.js'), 'export function Orphan() { return 3; }\n', 'utf8');
  const outDir = await makeTempDir('ironglancer-triage-api-');
  await generateStaticSite({ rootDir, entry: 'src/app.js', outDir, sourceMode: 'full', includeUnreachable: true });
  activeHandler = await createStaticAnalysisRequestHandler({ outDir });

  try {
    const serviceUrl = new URL('http://127.0.0.1/');
    const privateZeroUsers = await fetchJson(new URL(
      '/api/v1/functions?exported=false&standalone=true&userCount=0',
      serviceUrl,
    ));
    assert.deepEqual(privateZeroUsers.body.data.items.map((item) => item.name), ['unusedPrivate', 'recur']);
    assert.equal(privateZeroUsers.body.data.items[0].reachable, true);
    assert.deepEqual(privateZeroUsers.body.data.items[0].exportedNames, []);

    const unreachableFunctions = await fetchJson(new URL('/api/v1/functions?reachable=false', serviceUrl));
    assert.deepEqual(unreachableFunctions.body.data.items.map((item) => item.name), ['Orphan']);

    const sortedFunctions = await fetchJson(new URL(
      '/api/v1/functions?sort=lineCount&order=desc',
      serviceUrl,
    ));
    assert.equal(sortedFunctions.body.data.items[0].name, 'PublicEntry');

    const unreachableModules = await fetchJson(new URL('/api/v1/modules?reachable=false', serviceUrl));
    assert.deepEqual(unreachableModules.body.data.items.map((item) => item.path), ['src/orphan.js']);
    const sortedModules = await fetchJson(new URL('/api/v1/modules?sort=lineCount&order=desc', serviceUrl));
    assert.equal(sortedModules.body.data.items[0].path, 'src/app.js');

    const invalidSort = await fetchJson(new URL('/api/v1/functions?sort=nope', serviceUrl));
    assert.equal(invalidSort.response.status, 400);
    assert.equal(invalidSort.body.error.code, 'invalid_query');

    const unresolvedDynamicImports = await fetchJson(new URL(
      '/api/v1/imports?resolution=unresolved&dynamic=true',
      serviceUrl,
    ));
    assert.deepEqual(unresolvedDynamicImports.body.data.items.map((item) => ({
      specifier: item.specifier,
      loadKind: item.loadKind,
      resolution: item.resolution,
      dynamic: item.dynamic,
    })), [{
      specifier: './missing-lazy.js',
      loadKind: 'dynamic',
      resolution: 'unresolved',
      dynamic: true,
    }]);
    assert.match(unresolvedDynamicImports.body.data.items[0].stableId, /^imp_[a-f0-9]{16}$/);
    const importBySpecifier = await fetchJson(new URL(
      '/api/v1/imports?specifier=.%2Fmissing-lazy.js',
      serviceUrl,
    ));
    assert.equal(importBySpecifier.body.data.pagination.total, 1);
    const repeatedImports = await fetchJson(new URL(
      '/api/v1/imports?specifier=.%2Fdep.js',
      serviceUrl,
    ));
    assert.equal(repeatedImports.body.data.pagination.total, 2);
    assert.ok(repeatedImports.body.data.items.every((item) => /^imp_[a-f0-9]{16}$/.test(item.stableId)));
    assert.equal(new Set(repeatedImports.body.data.items.map((item) => item.stableId)).size, 2);
    const projectedImports = await fetchJson(new URL('/api/v1/imports?fields=sourcePath,specifier&limit=1', serviceUrl));
    assert.equal(projectedImports.response.status, 200);
    assert.deepEqual(Object.keys(projectedImports.body.data.items[0]).sort(), ['sourcePath', 'specifier', 'stableId']);
    assert.deepEqual(
      repeatedImports.body.data.items.map((item) => item.bindings[0]?.local).sort(),
      ['a', 'b'],
    );

    const exactSearch = await fetchJson(new URL(
      '/api/v1/search?q=helper&match=exact&types=function,occurrence',
      serviceUrl,
    ));
    assert.equal(exactSearch.body.data.items.filter((item) => item.type === 'function').length, 1);
    const helperOccurrences = exactSearch.body.data.items.filter((item) => item.type === 'occurrence');
    assert.equal(helperOccurrences.length, 3);
    assert.deepEqual(
      helperOccurrences.map((item) => item.enclosingFunction?.name).filter(Boolean).sort(),
      ['PublicEntry', 'helper'],
    );
    assert.ok(helperOccurrences.some((item) => item.enclosingFunction === null && item.role === 'reference'));
    assert.ok(exactSearch.body.data.items.every((item) => !('text' in item)));
    assert.ok(exactSearch.body.data.items
      .filter((item) => item.type === 'occurrence')
      .every((item) => item.role !== 'jsx-text'));

    const recursiveSearch = await fetchJson(new URL(
      '/api/v1/search?q=recur&match=exact&types=occurrence',
      serviceUrl,
    ));
    assert.deepEqual(recursiveSearch.body.data.items.map((item) => item.role), ['declaration', 'reference']);
    const jsxTextSearch = await fetchJson(new URL(
      '/api/v1/search?q=hiddenJsxText&match=exact&types=occurrence',
      serviceUrl,
    ));
    assert.deepEqual(jsxTextSearch.body.data.items.map((item) => item.role), ['jsx-text']);
    for (const jsxQuery of ['suffixToken', 'multiToken']) {
      const jsxSearch = await fetchJson(new URL(
        `/api/v1/search?q=${jsxQuery}&match=exact&types=occurrence`,
        serviceUrl,
      ));
      assert.deepEqual(jsxSearch.body.data.items.map((item) => item.role), ['jsx-text']);
    }

    const invalidOccurrenceSearch = await fetchJson(new URL(
      '/api/v1/search?q=help&match=substring&types=occurrence',
      serviceUrl,
    ));
    assert.equal(invalidOccurrenceSearch.response.status, 400);
    assert.equal(invalidOccurrenceSearch.body.error.code, 'invalid_query');
  } finally {
    activeHandler = null;
  }
});

test('module and function graph APIs return bounded shortest paths and blast radius', async () => {
  const rootDir = await makeTempDir('ironglancer-graph-src-');
  await fs.mkdir(path.join(rootDir, 'src'), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'src/app.js'), [
    "import { Mid } from './mid.js';",
    'export function Root() { return Mid(); }',
  ].join('\n'), 'utf8');
  await fs.writeFile(path.join(rootDir, 'src/mid.js'), [
    "import { Leaf } from './leaf.js';",
    'export function Mid() { return Leaf(); }',
  ].join('\n'), 'utf8');
  await fs.writeFile(path.join(rootDir, 'src/leaf.js'), 'export function Leaf() { return 1; }\n', 'utf8');
  const outDir = await makeTempDir('ironglancer-graph-api-');
  await generateStaticSite({ rootDir, entry: 'src/app.js', outDir, sourceMode: 'full' });
  activeHandler = await createStaticAnalysisRequestHandler({ outDir });

  try {
    const serviceUrl = new URL('http://127.0.0.1/');
    const modules = (await fetchJson(new URL('/api/v1/modules', serviceUrl))).body.data.items;
    const moduleByPath = new Map(modules.map((module) => [module.path, module]));
    const modulePath = await fetchJson(new URL(
      `/api/v1/modules/${moduleByPath.get('src/app.js').stableId}/shortest-path?targetId=${moduleByPath.get('src/leaf.js').stableId}`,
      serviceUrl,
    ));
    assert.equal(modulePath.body.data.found, true);
    assert.equal(modulePath.body.data.distance, 2);
    assert.equal(modulePath.body.data.direction, 'dependencies');
    assert.deepEqual(modulePath.body.data.nodes.map((node) => node.path), [
      'src/app.js', 'src/mid.js', 'src/leaf.js',
    ]);

    const moduleBlast = await fetchJson(new URL(
      `/api/v1/modules/${moduleByPath.get('src/leaf.js').stableId}/blast-radius`,
      serviceUrl,
    ));
    assert.equal(moduleBlast.body.data.direction, 'dependents');
    assert.deepEqual(moduleBlast.body.data.direct.map((node) => node.path), ['src/mid.js']);
    assert.deepEqual(moduleBlast.body.data.transitive.map((node) => node.path), ['src/app.js']);
    assert.equal(moduleBlast.body.data.truncated, false);

    const functions = (await fetchJson(new URL('/api/v1/functions', serviceUrl))).body.data.items;
    const functionByName = new Map(functions.map((fn) => [fn.name, fn]));
    const functionPath = await fetchJson(new URL(
      `/api/v1/functions/${functionByName.get('Root').stableId}/shortest-path?targetId=${functionByName.get('Leaf').stableId}`,
      serviceUrl,
    ));
    assert.equal(functionPath.body.data.found, true);
    assert.equal(functionPath.body.data.distance, 2);
    assert.equal(functionPath.body.data.direction, 'dependencies');
    assert.deepEqual(functionPath.body.data.nodes.map((node) => node.name), ['Root', 'Mid', 'Leaf']);
    assert.equal(functionPath.body.data.edges.length, 2);
    assert.ok(functionPath.body.data.edges.every((edge) => edge.targetLink.href.startsWith('/api/v1/functions/fn_')));

    const functionBlast = await fetchJson(new URL(
      `/api/v1/functions/${functionByName.get('Leaf').stableId}/blast-radius?maxDepth=1`,
      serviceUrl,
    ));
    assert.deepEqual(functionBlast.body.data.direct.map((node) => node.name), ['Mid']);
    assert.deepEqual(functionBlast.body.data.transitive, []);
    assert.equal(functionBlast.body.data.truncated, true);
    assert.ok(functionBlast.body.data.truncationReasons.includes('maxDepth'));

    const invalidDepth = await fetchJson(new URL(
      `/api/v1/functions/${functionByName.get('Leaf').stableId}/blast-radius?maxDepth=51`,
      serviceUrl,
    ));
    assert.equal(invalidDepth.response.status, 400);
    assert.equal(invalidDepth.body.error.code, 'invalid_query');
  } finally {
    activeHandler = null;
  }
});

test('stable IDs survive unrelated line insertions while legacy declaration IDs remain compatible', async () => {
  const rootDir = await makeTempDir('ironglancer-stable-id-src-');
  const sourcePath = path.join(rootDir, 'src/app.jsx');
  await fs.mkdir(path.dirname(sourcePath), { recursive: true });
  const writeVariant = async (prefix) => fs.writeFile(sourcePath, [
    prefix,
    'export function App() {',
    '  function App() { return 1; }',
    '  return <main>{App()}</main>;',
    '}',
  ].filter(Boolean).join('\n'), 'utf8');
  const readIds = async (outDir) => {
    await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
    activeHandler = await createStaticAnalysisRequestHandler({ outDir });
    const module = (await fetchJson(new URL('http://127.0.0.1/api/v1/modules'))).body.data.items[0];
    const functions = (await fetchJson(new URL('http://127.0.0.1/api/v1/functions?name=App'))).body.data.items;
    const symbol = (await fetchJson(new URL('http://127.0.0.1/api/v1/symbols?name=App'))).body.data.items[0];
    return { module, functions, symbol };
  };

  try {
    await writeVariant('');
    const before = await readIds(await makeTempDir('ironglancer-stable-id-before-'));
    await writeVariant('// unrelated header\n\n');
    const after = await readIds(await makeTempDir('ironglancer-stable-id-after-'));

    assert.equal(after.module.stableId, before.module.stableId);
    assert.equal(before.functions.length, 2);
    assert.deepEqual(
      after.functions.map((fn) => fn.stableId),
      before.functions.map((fn) => fn.stableId),
    );
    assert.ok(before.functions.every((fn) => /^fn_[a-f0-9]{16}$/.test(fn.stableId)));
    assert.equal(new Set(before.functions.map((fn) => fn.stableId)).size, 2);
    assert.equal(after.symbol.stableId, before.symbol.stableId);
    assert.notDeepEqual(
      after.functions.map((fn) => fn.id),
      before.functions.map((fn) => fn.id),
    );
    assert.notEqual(after.symbol.id, before.symbol.id);
  } finally {
    activeHandler = null;
  }
});

test('import stable IDs ignore named-binding order', async () => {
  const rootDir = await makeTempDir('ironglancer-import-id-src-');
  const sourcePath = path.join(rootDir, 'src/app.js');
  await fs.mkdir(path.dirname(sourcePath), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'src/dep.js'), 'export const a = 1; export const b = 2;\n', 'utf8');
  const readStableId = async (bindings) => {
    await fs.writeFile(sourcePath, `import { ${bindings} } from './dep.js';\nexport function App() { return a + b; }\n`, 'utf8');
    const outDir = await makeTempDir('ironglancer-import-id-out-');
    await generateStaticSite({ rootDir, entry: 'src/app.js', outDir, sourceMode: 'full' });
    activeHandler = await createStaticAnalysisRequestHandler({ outDir });
    const imports = await fetchJson('/api/v1/imports?sourcePath=src%2Fapp.js');
    return imports.body.data.items[0].stableId;
  };

  try {
    const before = await readStableId('a, b');
    const after = await readStableId('b, a');
    assert.equal(after, before);
  } finally {
    activeHandler = null;
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test('viewer bridge stores structured state and presentation command acknowledgements', async () => {
  const outDir = await makeTempDir('ironglancer-bridge-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
  activeHandler = await createStaticAnalysisRequestHandler({ outDir });

  try {
    const discovery = await fetchJson('/bridge/v1');
    assert.equal(discovery.response.status, 200);
    assert.equal(discovery.body.data.bridgeVersion, 'v1');
    assert.match(discovery.body.data.semantics.trustBoundary, /localhost/);
    const run = await fetchJson('/api/v1/run');
    assert.equal(discovery.body.data.snapshot.buildId, run.body.data.buildId);
    assert.equal(discovery.body.data.snapshot.sourceCodeHash, run.body.data.sourceCodeHash);

    const staleState = await requestUrl('/bridge/v1/state', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'viewer-test',
        revision: 1,
        snapshot: { buildId: 'stale-build', sourceCodeHash: discovery.body.data.snapshot.sourceCodeHash },
      }),
    });
    assert.equal(staleState.status, 409);
    assert.equal((await staleState.json()).error.code, 'snapshot_mismatch');

    const stateResponse = await requestUrl('/bridge/v1/state', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'viewer-test',
        revision: 1,
        reason: 'ready',
        snapshot: discovery.body.data.snapshot,
        primaryView: 'function-graphs',
        graph: {
          layout: 'network',
          nodeVisibility: { files: false, functions: true },
          scope: 'dependencies',
          depth: '2',
        },
        openSource: {
          functionStableId: 'fn_test',
          modulePath: 'src/app.jsx',
          name: 'RootApp',
          startLine: 7,
        },
        viewport: { zoom: 1, scrollLeft: 0, scrollTop: 0 },
      }),
    });
    assert.equal(stateResponse.status, 200);
    assert.equal((await stateResponse.json()).data.accepted, true);

    const staleCommand = await requestUrl('/bridge/v1/commands', {
      method: 'POST',
      body: JSON.stringify({
        snapshot: { buildId: 'stale-build', sourceCodeHash: discovery.body.data.snapshot.sourceCodeHash },
        command: { type: 'setGraphView', layout: 'radial' },
      }),
    });
    assert.equal(staleCommand.status, 409);
    assert.equal((await staleCommand.json()).error.code, 'snapshot_mismatch');

    const queued = await requestUrl('/bridge/v1/commands', {
      method: 'POST',
      body: JSON.stringify({
        snapshot: discovery.body.data.snapshot,
        command: {
          type: 'openFunction',
          targetStableId: 'fn_test',
        },
      }),
    });
    assert.equal(queued.status, 201);
    const queuedBody = await queued.json();
    assert.equal(queuedBody.data.command.revision, 1);
    assert.equal(queuedBody.data.command.snapshot.buildId, discovery.body.data.snapshot.buildId);

    const commands = await fetchJson('/bridge/v1/commands?clientId=viewer-test&afterRevision=0');
    assert.equal(commands.response.status, 200);
    assert.equal(commands.body.data.commands.length, 1);
    assert.equal(commands.body.data.commands[0].command.type, 'openFunction');

    const ack = await requestUrl('/bridge/v1/ack', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'viewer-test',
        commandId: queuedBody.data.command.commandId,
        commandRevision: queuedBody.data.command.revision,
        status: 'applied',
        message: 'source opened',
        stateRevision: 2,
        snapshot: discovery.body.data.snapshot,
      }),
    });
    assert.equal(ack.status, 200);
    assert.equal((await ack.json()).data.acknowledgement.status, 'applied');

    const state = await fetchJson('/bridge/v1/state');
    assert.equal(state.body.data.latestState.clientId, 'viewer-test');
    assert.equal(state.body.data.latestState.primaryView, 'function-graphs');
    assert.equal(state.body.data.latestState.graph.scope, 'dependencies');
    assert.equal(state.body.data.latestState.graph.depth, '2');
    assert.equal(state.body.data.acknowledgements.at(-1).commandId, queuedBody.data.command.commandId);
  } finally {
    activeHandler = null;
  }
});

test('static analysis server rejects static symlink escapes', async (t) => {
  const outDir = await makeTempDir('ironglancer-server-symlink-');
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir, sourceMode: 'full' });
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
