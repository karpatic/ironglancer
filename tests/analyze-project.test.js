import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

import { analyzeProject } from '../src/lib/analyze-project.js';

function legacyFunctionId(modulePath, name, kind, startLine, endLine) {
  return Buffer.from([
    'function',
    modulePath,
    name,
    kind,
    startLine,
    endLine,
  ].join('\u0000'), 'utf8').toString('base64url');
}

test('function dependency nodes expose conservative reachability and export metadata', async () => {
  const rootDir = await writeTempProject({
    'src/app.js': [
      "import './missing.js';",
      "import 'external-package';",
      "const missingLazy = import('./missing-lazy.js');",
      'export function PublicEntry() {',
      '  return helper();',
      '}',
      'function helper() {',
      "  return 'helper';",
      '}',
      'const exportedArrow = () => helper();',
      'export { exportedArrow };',
      'const callback = function internalName() { return helper(); };',
      'export function same() {',
      '  function same() { return 1; }',
      '  return same();',
      '}',
      'if (true) { function same() { return 2; } }',
    ].join('\n'),
    'src/orphan.js': 'export function Orphan() { return 1; }\n',
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.js' });
  const byName = new Map(result.functionDependencyMap.functions.map((node) => [node.name, node]));

  assert.deepEqual(
    {
      reachable: byName.get('PublicEntry').reachable,
      exported: byName.get('PublicEntry').exported,
      exportedNames: byName.get('PublicEntry').exportedNames,
      declarationType: byName.get('PublicEntry').declarationType,
      standalone: byName.get('PublicEntry').standalone,
    },
    {
      reachable: true,
      exported: true,
      exportedNames: ['PublicEntry'],
      declarationType: 'function-declaration',
      standalone: true,
    },
  );
  assert.equal(byName.get('helper').exported, false);
  assert.equal(byName.get('exportedArrow').exported, true);
  assert.equal(byName.get('internalName').standalone, false);
  const sameNodes = result.functionDependencyMap.functions
    .filter((node) => node.name === 'same')
    .sort((a, b) => a.startLine - b.startLine || b.lineCount - a.lineCount);
  assert.deepEqual(sameNodes.map(({ exported, standalone }) => ({ exported, standalone })), [
    { exported: true, standalone: true },
    { exported: false, standalone: false },
    { exported: false, standalone: false },
  ]);
  assert.equal(byName.has('Orphan'), false);
  const withUnreachable = await analyzeProject({ rootDir, entry: 'src/app.js', includeUnreachable: true });
  const orphan = withUnreachable.functionDependencyMap.functions.find((node) => node.name === 'Orphan');
  assert.ok(orphan);
  assert.equal(orphan.reachable, false);

  const refs = new Map(result.graph.modules.get('src/app.js').importRefs.map((ref) => [ref.specifier, ref]));
  assert.deepEqual(
    {
      resolution: refs.get('./missing.js').resolution,
      reason: refs.get('./missing.js').unresolvedReason,
    },
    { resolution: 'unresolved', reason: 'not_found' },
  );
  assert.equal(refs.get('./missing-lazy.js').resolution, 'unresolved');
  assert.equal(refs.get('external-package').resolution, 'external');
});

test('analyzeProject gives same-line duplicate functions unique IDs while preserving noncolliding legacy IDs', async () => {
  const rootDir = await writeTempProject({
    'src/app.js': [
      'export function outer() { function duplicate() { return left(); } function duplicate() { return right(); } return duplicate; }',
      'function left() {}',
      'function right() {}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.js' });
  const functions = result.functionDependencyMap.functions;
  const outer = functions.find((node) => node.name === 'outer');
  const duplicateNodes = functions.filter((node) => node.name === 'duplicate');
  const duplicateIds = new Set(duplicateNodes.map((node) => node.id));
  const duplicateEdges = result.functionDependencyMap.edges
    .filter((edge) => edge.sourceFunction === 'duplicate')
    .sort((a, b) => a.targetFunction.localeCompare(b.targetFunction));

  assert.ok(outer, 'expected the noncolliding outer declaration');
  assert.equal(outer.id, legacyFunctionId('src/app.js', 'outer', 'function', 1, 1));
  assert.equal(duplicateNodes.length, 2);
  assert.equal(duplicateIds.size, 2);
  assert.deepEqual(duplicateEdges.map((edge) => edge.targetFunction), ['left', 'right']);
  assert.ok(duplicateEdges.every((edge) => duplicateIds.has(edge.sourceId)));
  assert.equal(new Set(duplicateEdges.map((edge) => edge.sourceId)).size, 2);
});

test('analyzeProject keeps nested scope identity stable when comments change', async () => {
  const plainRoot = await writeTempProject({
    'src/app.js': [
      'export function outer(ready) {',
      '  if (ready) {',
      '    function nested() { return ready; }',
      '    return nested();',
      '  }',
      '}',
    ].join('\n'),
  });
  const commentedRoot = await writeTempProject({
    'src/app.js': [
      'export function outer(ready) {',
      `  if (/* ${'x'.repeat(220)} */ ready) {`,
      '    function nested() { return ready; }',
      '    return nested();',
      '  }',
      '}',
    ].join('\n'),
  });

  const plain = await analyzeProject({ rootDir: plainRoot, entry: 'src/app.js' });
  const commented = await analyzeProject({ rootDir: commentedRoot, entry: 'src/app.js' });
  const plainNested = plain.functionDependencyMap.functions.find((node) => node.name === 'nested');
  const commentedNested = commented.functionDependencyMap.functions.find((node) => node.name === 'nested');

  assert.ok(plainNested);
  assert.ok(commentedNested);
  assert.equal(commentedNested.scopePath, plainNested.scopePath);
  assert.ok(!commentedNested.scopePath.includes('*/'));
});

test('analyzeProject nests functions declared in bare lexical blocks under an anonymous scope', async () => {
  const rootDir = await writeTempProject({
    'src/app.js': [
      '{',
      '  function insideBlock() { return blockHelper(); }',
      '}',
      'function blockHelper() { return 1; }',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.js' });
  const insideBlock = result.functionDependencyMap.functions.find((node) => node.name === 'insideBlock');

  assert.ok(insideBlock);
  assert.equal(insideBlock.standalone, false);
  assert.match(insideBlock.scopePath, /anonymous-block/);
});

test('analyzeProject records CommonJS syntax as unsupported browser evidence', async () => {
  const rootDir = await writeTempProject({
    'src/app.js': [
      'exports.pub = function internal() {',
      '  return privateHelper();',
      '};',
      'function privateHelper() {',
      '  return 1;',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.js' });
  const internal = result.functionDependencyMap.functions.find((node) => node.name === 'internal');

  assert.ok(internal);
  assert.equal(internal.exported, false);
  assert.deepEqual(internal.exportedNames, []);
  assert.equal(internal.standalone, false);
  assert.deepEqual(result.commonJsSyntax.map((item) => item.kind), ['commonjs-export']);
  assert.deepEqual(result.findings.map((item) => item.ruleId), ['IRONG_UNSUPPORTED_COMMONJS']);
});

test('analyzeProject resolves same-module references to the lexically visible declaration', async () => {
  const rootDir = await writeTempProject({
    'src/app.js': [
      'function helper() { return "outer"; }',
      'export function caller() {',
      '  function helper() { return "inner"; }',
      '  return helper();',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.js' });
  const helperEdges = result.functionDependencyMap.edges.filter((edge) => (
    edge.sourceFunction === 'caller'
    && edge.targetFunction === 'helper'
    && edge.scope === 'same-module'
  ));

  assert.equal(helperEdges.length, 1);
  assert.equal(helperEdges[0].targetStartLine, 3);
});

test('analyzeProject resolves imported aliases to the exact exported declaration', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { exportedThing as Alias } from './feature.js';",
      '',
      'export function App() {',
      '  return <main>{Alias()}</main>;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'function wrapper() {',
      '  function exportedThing() { return "nested"; }',
      '  return exportedThing;',
      '}',
      'export function exportedThing() {',
      '  return "public";',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const importedEdge = result.functionDependencyMap.edges.find((edge) => (
    edge.sourceFunction === 'App'
    && edge.targetFunction === 'exportedThing'
    && edge.scope === 'imported'
  ));

  assert.ok(importedEdge);
  assert.equal(importedEdge.targetStartLine, 5);
  assert.equal(importedEdge.import.localName, 'Alias');
});

test('analyzeProject adds deterministic function placement evidence', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { useMemo } from 'react';",
      "import { projectHelper } from './project.js';",
      "import { missingThing } from './missing.js';",
      '',
      'export function App() {',
      '  return useMemo(() => projectHelper() + localHelper() + missingThing(), []);',
      '}',
      '',
      'function localHelper() {',
      '  return nestedHelper();',
      '}',
      '',
      'function nestedHelper() {',
      '  return 1;',
      '}',
    ].join('\n'),
    'src/project.js': [
      'export function projectHelper() {',
      '  return 2;',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const app = result.functionDependencyMap.functions.find((node) => node.name === 'App');

  assert.ok(app);
  assert.match(app.stableId, /^fn_[a-f0-9]{16}$/);
  assert.equal(app.placement.assessment.assessment, 'public-entry-surface');
  assert.equal(app.placement.evidence.sameFileCalleeCount, 1);
  assert.equal(app.placement.evidence.projectLocalCalleeCount, 1);
  assert.equal(app.placement.evidence.packageCalleeCount, 1);
  assert.equal(app.placement.evidence.unresolvedCalleeCount, 1);
  assert.equal(app.placement.evidence.transitiveInternalHelperCount, 2);
  assert.deepEqual(app.placement.groups.callees.package.map((item) => item.specifier), ['react']);
  assert.deepEqual(app.placement.groups.callees.unresolved.map((item) => item.specifier), ['./missing.js']);
  assert.deepEqual(
    app.placement.groups.transitiveInternalHelpers.map((item) => `${item.depth}:${item.function.name}`),
    ['1:localHelper', '2:nestedHelper'],
  );
});

test('analyzeProject resolves import-map package prefix aliases with longest-prefix expansion', async () => {
  const rootDir = await writeTempProject({
    'index.html': [
      '<script type="importmap">',
      JSON.stringify({
        imports: {
          'lib/': './src/lib/',
          'lib/special/': './src/special/',
        },
      }),
      '</script>',
    ].join('\n'),
    'src/app.js': [
      "import { helper } from 'lib/helper.js';",
      "import { pick } from 'lib/special/pick.js';",
      'export function App() {',
      '  return helper() + pick();',
      '}',
    ].join('\n'),
    'src/lib/helper.js': [
      'export function helper() {',
      "  return 'helper';",
      '}',
    ].join('\n'),
    'src/lib/special/pick.js': [
      'export function pick() {',
      "  return 'wrong prefix';",
      '}',
    ].join('\n'),
    'src/special/pick.js': [
      'export function pick() {',
      "  return 'longest prefix';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.js' });
  const refs = new Map(result.graph.modules.get('src/app.js').importRefs.map((ref) => [ref.specifier, ref]));

  assert.equal(refs.get('lib/helper.js').localRel, 'src/lib/helper.js');
  assert.equal(refs.get('lib/special/pick.js').localRel, 'src/special/pick.js');
  assert.equal(refs.get('lib/special/pick.js').resolution, 'local');
});

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

async function writeTempProject(files) {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-analyze-fixture-'));
  await Promise.all(Object.entries(files).map(async ([relativePath, contents]) => {
    const filePath = path.join(rootDir, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents, 'utf8');
  }));
  return rootDir;
}

test('analyzeProject emits privacy-safe implementation fingerprints for function nodes', async () => {
  const movedAndRenamedRoot = await writeTempProject({
    'src/new.js': [
      'export function renamedApi(value) {',
      "  return value + ':stable';",
      '}',
    ].join('\n'),
  });
  const originalRoot = await writeTempProject({
    'src/old.js': [
      'export function api(value) {',
      "  return value + ':stable';",
      '}',
    ].join('\r\n'),
  });
  const changedImplementationRoot = await writeTempProject({
    'src/new.js': [
      'export function renamedApi(value) {',
      "  return value + ':changed';",
      '}',
    ].join('\n'),
  });

  const original = await analyzeProject({ rootDir: originalRoot, entry: 'src/old.js' });
  const movedAndRenamed = await analyzeProject({ rootDir: movedAndRenamedRoot, entry: 'src/new.js' });
  const changedImplementation = await analyzeProject({ rootDir: changedImplementationRoot, entry: 'src/new.js' });
  const originalNode = original.functionDependencyMap.functions.find((node) => node.name === 'api');
  const renamedNode = movedAndRenamed.functionDependencyMap.functions.find((node) => node.name === 'renamedApi');
  const changedNode = changedImplementation.functionDependencyMap.functions.find((node) => node.name === 'renamedApi');

  assert.ok(originalNode);
  assert.ok(renamedNode);
  assert.ok(changedNode);
  assert.match(originalNode.implementationFingerprint, /^impl_[a-f0-9]{16}$/);
  assert.equal(originalNode.implementationFingerprint, renamedNode.implementationFingerprint);
  assert.notEqual(originalNode.implementationFingerprint, changedNode.implementationFingerprint);
  assert.equal(originalNode.implementationFingerprint.includes('api'), false);
  assert.equal(originalNode.implementationFingerprint.includes('stable'), false);
});

test('analyzeProject resolves local modules, import-map aliases, and externals', async () => {
  const result = await analyzeProject({ rootDir: fixtureRoot, entry: 'src/app.jsx' });

  assert.equal(result.entryRel, 'src/app.jsx');
  assert.equal(result.summary.moduleCount, 5);
  assert.equal(result.summary.externalCount, 0);
  assert.equal(result.summary.remoteImportCount, 1);
  assert.ok(result.treeText.includes('src/components/App.jsx'));
  assert.ok(result.treeText.includes('src/panes/Inspector.jsx'));
  assert.equal(result.summary.jsxFileCount, 3);
  assert.ok(result.mermaid.includes('classDiagram'));
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'shared/theme.js',
    'src/app.jsx',
    'src/components/App.jsx',
    'src/lib/util.js',
    'src/panes/Inspector.jsx',
  ]);
  assert.deepEqual(result.jsxScripts.map(({ path: scriptPath, lineCount }) => ({ path: scriptPath, lineCount })), [
    { path: 'src/app.jsx', lineCount: 9 },
    { path: 'src/components/App.jsx', lineCount: 3 },
    { path: 'src/panes/Inspector.jsx', lineCount: 3 },
  ]);
  assert.equal(result.jsxTreeText, [
    '.',
    '`-- src',
    '    |-- app.jsx (9 lines)',
    '    |-- components',
    '    |   `-- App.jsx (3 lines)',
    '    `-- panes',
    '        `-- Inspector.jsx (3 lines)',
  ].join('\n'));
  assert.ok(!result.jsxTreeText.includes('shared/theme.js'));
  assert.ok(!result.jsxTreeText.includes('[external]'));
  assert.deepEqual(result.remoteImports, [{
    sourceModulePath: 'src/app.jsx',
    specifier: 'https://cdn.example.com/widget.js',
    loadKind: 'dynamic',
  }]);
});

const browserLikeRoot = path.resolve('tests/fixtures/browser-like');

test('analyzeProject resolves browser app public assets and review-origin aliases', async () => {
  const result = await analyzeProject({ rootDir: browserLikeRoot, entry: 'app/app.jsx' });

  assert.equal(result.entryRel, 'app/app.jsx');
  assert.equal(result.summary.moduleCount, 3);
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'app/app.jsx',
    'public/app.js',
    'public/controller.js',
  ]);
});

const routeAliasRoot = path.resolve('tests/fixtures/route-alias');

test('analyzeProject maps URL-rooted imports through route aliases', async () => {
  const result = await analyzeProject({
    rootDir: routeAliasRoot,
    entry: 'src/web/portal/app.jsx',
    routeAliases: [{ from: '/portal/', to: 'src/web/portal/' }],
  });

  assert.equal(result.entryRel, 'src/web/portal/app.jsx');
  assert.equal(result.summary.moduleCount, 2);
  assert.equal(result.summary.externalCount, 0);
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/web/portal/app.jsx',
    'src/web/portal/components/linked-content-editor.jsx',
  ]);
  assert.ok(!result.treeText.includes('[external] /portal/components/linked-content-editor.jsx'));
  assert.ok(!result.mermaid.includes('+LinkedContentEditor'));
  assert.ok(result.mermaid.includes('PortalLinkedContentEditor()'));
});

test('analyzeProject treats HTML module scripts and import maps as browser entries', async () => {
  const rootDir = await writeTempProject({
    'index.html': [
      '<script type="importmap">',
      JSON.stringify({
        imports: {
          '@ui/': '/src/ui/',
          'remote-lib': 'https://cdn.example.com/lib.js',
        },
      }),
      '</script>',
      '<script type="module" src="/src/main.jsx"></script>',
      '<script type="module" src="./src/admin.js"></script>',
    ].join('\n'),
    'src/main.jsx': [
      "import { Button } from '@ui/Button.jsx';",
      "import './styles.css';",
      "const remote = await import('remote-lib');",
      'export function App() {',
      "  localStorage.setItem('remote', String(Boolean(remote)));",
      '  return <Button />;',
      '}',
    ].join('\n'),
    'src/admin.js': [
      "import { adminHelper } from './admin-helper.js';",
      'export function Admin() {',
      '  return adminHelper();',
      '}',
    ].join('\n'),
    'src/admin-helper.js': 'export function adminHelper() { return "admin"; }\n',
    'src/ui/Button.jsx': 'export function Button() { return <button />; }\n',
    'src/styles.css': 'body { color: black; }\n',
    'server/routes.js': 'export function apiRoute() { return "server"; }\n',
  });

  const result = await analyzeProject({ rootDir, entry: 'index.html' });

  assert.equal(result.entryRel, 'index.html');
  assert.equal(result.entryKind, 'html');
  assert.deepEqual(result.entryModules, ['src/admin.js', 'src/main.jsx']);
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/admin-helper.js',
    'src/admin.js',
    'src/main.jsx',
    'src/ui/Button.jsx',
  ]);
  assert.deepEqual(result.assets.map((item) => [item.kind, item.path]), [
    ['style', 'src/styles.css'],
  ]);
  assert.deepEqual(result.remoteImports.map((item) => item.specifier), ['remote-lib']);
  assert.ok(result.componentEdges.some((edge) => edge.sourceComponent === 'App' && edge.targetComponent === 'Button'));
  assert.ok(result.browserApis.some((item) => item.api === 'browser:localStorage'));
  assert.ok(!result.jsScripts.some((item) => item.path.startsWith('server/')));
});

test('analyzeProject records browser asset, worker, Node builtin, and unsupported source edges', async () => {
  const rootDir = await writeTempProject({
    'src/main.js': [
      "import fs from 'node:fs';",
      "import path from 'path';",
      "import './style.css';",
      "import data from './data.json' with { type: 'json' };",
      "import logo from './logo.svg';",
      "import wasmUrl from './math.wasm';",
      "import './readme.custom';",
      "import './typed.ts';",
      "const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });",
      'export function boot() {',
      '  return [fs, path, data, logo, wasmUrl, worker];',
      '}',
    ].join('\n'),
    'src/worker.js': 'export function workerTask() { return true; }\n',
    'src/style.css': 'body { color: black; }\n',
    'src/data.json': '{"ok":true}\n',
    'src/logo.svg': '<svg />\n',
    'src/math.wasm': 'wasm\n',
    'src/readme.custom': 'custom\n',
    'src/typed.ts': 'export const typed = true;\n',
  });

  const result = await analyzeProject({ rootDir, entry: 'src/main.js' });
  const mainModule = result.graph.modules.get('src/main.js');

  assert.deepEqual(mainModule.localDeps, ['src/worker.js']);
  assert.deepEqual(result.assets.map((item) => [item.kind, item.path]).sort(), [
    ['image', 'src/logo.svg'],
    ['json', 'src/data.json'],
    ['style', 'src/style.css'],
    ['unknown', 'src/readme.custom'],
    ['wasm', 'src/math.wasm'],
    ['worker', 'src/worker.js'],
  ]);
  assert.deepEqual(result.lazyBoundaries.map((item) => [item.kind, item.targetModulePath]), [
    ['worker', 'src/worker.js'],
  ]);
  assert.deepEqual(result.browserIncompatibleImports.map((item) => [item.specifier, item.nodeBuiltin]), [
    ['node:fs', 'fs'],
    ['path', 'path'],
  ]);
  assert.ok(result.unresolvedImports.some((item) => (
    item.specifier === './typed.ts' && item.unresolvedReason === 'unsupported_module_type:.ts'
  )));
  assert.deepEqual(new Set(result.findings.map((item) => item.ruleId)), new Set([
    'IRONG_FRONTEND_NODE_IMPORT',
    'IRONG_UNRESOLVED_IMPORT',
  ]));
});

test('analyzeProject keeps full-stack backend files out unless browser reachable', async () => {
  const rootDir = await writeTempProject({
    'index.html': '<script type="module" src="/src/main.js"></script>\n',
    'src/main.js': [
      "import { clientApi } from './client-api.js';",
      'export function boot() {',
      '  return clientApi();',
      '}',
    ].join('\n'),
    'src/client-api.js': [
      'export function clientApi() {',
      "  return fetch('/api');",
      '}',
    ].join('\n'),
    'src/unused-widget.js': 'export function UnusedWidget() { return null; }\n',
    'server/app.js': [
      "import express from 'express';",
      'export function serverApp() {',
      '  return express();',
      '}',
    ].join('\n'),
  });

  const defaultResult = await analyzeProject({ rootDir, entry: 'index.html' });
  const withUnreachable = await analyzeProject({ rootDir, entry: 'index.html', includeUnreachable: true });

  assert.deepEqual(defaultResult.jsScripts.map((item) => item.path), [
    'src/client-api.js',
    'src/main.js',
  ]);
  assert.deepEqual(withUnreachable.jsScripts.map((item) => item.path), [
    'src/client-api.js',
    'src/main.js',
    'src/unused-widget.js',
  ]);
  assert.ok(!withUnreachable.jsScripts.some((item) => item.path.startsWith('server/')));
});

test('analyzeProject uses sourceRoot only to bound unreachable discovery', async () => {
  const rootDir = await writeTempProject({
    'index.html': '<script type="module" src="/src/main.js"></script>\n',
    'src/main.js': 'export function boot() { return true; }\n',
    'src/unused.js': 'export function unused() { return true; }\n',
    'client/unused.js': 'export function otherClient() { return true; }\n',
    'server/app.js': 'export function serverApp() { return true; }\n',
  });

  const result = await analyzeProject({
    rootDir,
    entry: 'index.html',
    sourceRoot: 'src',
    includeUnreachable: true,
  });

  assert.equal(result.rootDir, rootDir);
  assert.equal(result.entryRel, 'index.html');
  assert.equal(result.graph.sourceRoot, 'src');
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/main.js',
    'src/unused.js',
  ]);
});

test('analyzeProject bounds unreachable discovery to front-end roots while keeping reachable imports', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { reachable } from './reachable.js';",
      "import { generatedViewerApp } from '../.cache/ironglancer/app.js';",
      '',
      'export function App() {',
      '  return reachable() + generatedViewerApp();',
      '}',
    ].join('\n'),
    'src/reachable.js': [
      'export function reachable() {',
      "  return 'source';",
      '}',
    ].join('\n'),
    'src/ordinary-orphan.js': [
      'export function ordinaryOrphan() {',
      "  return 'still discovered';",
      '}',
    ].join('\n'),
    '.storybook/preview.js': [
      'export function preview() {',
      "  return 'hidden but not transient';",
      '}',
    ].join('\n'),
    '.worktrees/parallel-checkout/src/generated.js': [
      'export function embeddedWorktreeModule() {',
      "  return 'excluded';",
      '}',
    ].join('\n'),
    '.codex-worktrees/session/src/generated.jsx': [
      'export function embeddedCodexWorktreeModule() {',
      "  return 'excluded';",
      '}',
    ].join('\n'),
    '.cache/ironglancer/app.js': [
      'export function generatedViewerApp() {',
      "  return 'reachable local cache module';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx', includeUnreachable: true });

  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    '.cache/ironglancer/app.js',
    'src/app.jsx',
    'src/ordinary-orphan.js',
    'src/reachable.js',
  ]);
  assert.equal(result.summary.moduleCount, 4);
  assert.equal(result.summary.reachableModuleCount, 3);
  assert.equal(result.summary.externalCount, 0);
  assert.ok(!result.jsScripts.some((item) => item.path.startsWith('.storybook/')));
  assert.ok(!result.jsScripts.some((item) => item.path.startsWith('.worktrees/')));
  assert.ok(!result.jsScripts.some((item) => item.path.startsWith('.codex-worktrees/')));

  const appModule = result.graph.modules.get('src/app.jsx');
  assert.deepEqual(appModule.localDeps, [
    '.cache/ironglancer/app.js',
    'src/reachable.js',
  ]);
});

const reactIgnoreRoot = path.resolve('tests/fixtures/react-ignore');

test('analyzeProject ignores React imports in diagrams while keeping other externals', async () => {
  const result = await analyzeProject({ rootDir: reactIgnoreRoot, entry: 'src/app.jsx' });

  assert.equal(result.entryRel, 'src/app.jsx');
  assert.equal(result.summary.moduleCount, 2);
  assert.equal(result.summary.externalCount, 1);
  const treeLines = result.treeText.split('\n').map((line) => line.trim());
  const mermaidLines = result.mermaid.split('\n').map((line) => line.trim());
  assert.ok(!treeLines.includes('- [external] react'));
  assert.ok(treeLines.includes('- [external] react-dom'));
  assert.ok(!mermaidLines.includes('+React'));
  assert.ok(mermaidLines.includes('+ReactDOM'));
  assert.ok(result.mermaid.includes('class Widget'));
});

test('analyzeProject resolves dynamic imports, React.lazy constants, and omits unreachable modules by default', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import React from 'react';",
      "const LAZY_WIDGET = './Widget.jsx';",
      "const PANEL = './Panel.jsx';",
      "const LazyWidget = React.lazy(() => import(LAZY_WIDGET));",
      "const { Panel } = await window.import(PANEL);",
      'export function App() {',
      '  return <><LazyWidget /><Panel /></>;',
      '}',
    ].join('\n'),
    'src/Widget.jsx': 'export default function Widget() { return <p />; }\n',
    'src/Panel.jsx': 'export function Panel() { return <section />; }\n',
    'src/Unused.jsx': 'export function Unused() { return <aside />; }\n',
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });

  assert.equal(result.entryRel, 'src/app.jsx');
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/Panel.jsx',
    'src/Widget.jsx',
    'src/app.jsx',
  ]);
  assert.deepEqual(
    result.lazyBoundaries.map((item) => [item.kind, item.specifier, item.targetModulePath]),
    [
      ['dynamic-import', './Panel.jsx', 'src/Panel.jsx'],
      ['dynamic-import', './Widget.jsx', 'src/Widget.jsx'],
      ['react-lazy', './Widget.jsx', 'src/Widget.jsx'],
    ],
  );
  assert.equal(result.componentEdges.filter((edge) => edge.resolved).length, 2);
  assert.ok(!result.jsScripts.some((item) => item.path === 'src/Unused.jsx'));
});

test('analyzeProject records same-module function edges for spread operand calls', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      'export function buildReviewExplorerFiles(snapshot) {',
      '  return [snapshot];',
      '}',
      '',
      'export function ReviewExplorer(snapshot) {',
      '  return [',
      '    ...buildReviewExplorerFiles(snapshot),',
      '  ];',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const edge = result.functionDependencyMap.edges.find((candidate) => (
    candidate.sourceFunction === 'ReviewExplorer'
    && candidate.targetFunction === 'buildReviewExplorerFiles'
  ));

  assert.ok(edge, 'expected spread operand call to create a same-module function edge');
  assert.equal(edge.scope, 'same-module');
  assert.equal(edge.relationKind, 'static-call');
  assert.deepEqual(edge.syntaxKinds, ['call']);
  assert.deepEqual(edge.usageLines, [7]);
  assert.deepEqual(edge.usages, [{ line: 7, syntax: 'call' }]);
  assert.equal(edge.referenceCount, 1);
});

test('analyzeProject resolves React.lazy import boundaries without broad call inference', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { lazy } from 'react';",
      "const CHILD_SPECIFIER = './browser-child.jsx';",
      '',
      'const BrowserChild = lazy(() => import(CHILD_SPECIFIER));',
      "const ignored = lazy(() => import('./' + computedName));",
      "function importOtherBrowserModule() { return null; }",
      "importOtherBrowserModule('./false-positive.jsx');",
      '',
      'export function App() {',
      '  return <BrowserChild />;',
      '}',
    ].join('\n'),
    'src/browser-child.jsx': [
      'export function BrowserChild() {',
      '  return null;',
      '}',
    ].join('\n'),
    'src/false-positive.jsx': [
      'export function FalsePositive() {',
      '  return null;',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const appModule = result.graph.modules.get('src/app.jsx');

  assert.deepEqual(appModule.localDeps, ['src/browser-child.jsx']);
  assert.equal(result.graph.modules.get('src/browser-child.jsx').reachable, true);
  assert.equal(result.graph.modules.has('src/false-positive.jsx'), false);
  assert.deepEqual(
    result.importEdges
      .filter((edge) => edge.sourcePath === 'src/app.jsx')
      .map(({ targetPath, loadKinds }) => ({ targetPath, loadKinds })),
    [
      { targetPath: 'src/browser-child.jsx', loadKinds: ['dynamic', 'lazy'] },
    ],
  );
  assert.deepEqual(new Set(result.lazyBoundaries.map((item) => item.targetModulePath)), new Set(['src/browser-child.jsx']));
});

const importEdgeMetadataRoot = path.resolve('tests/fixtures/import-edge-metadata');

test('analyzeProject exposes JSX import edge metadata', async () => {
  const result = await analyzeProject({
    rootDir: importEdgeMetadataRoot,
    entry: 'src/app.jsx',
  });

  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/app.jsx',
    'src/dynamic-child.jsx',
    'src/static-child.jsx',
  ]);
  assert.match(result.mermaid, /class app\["20 app\.jsx"\] \{/);
  assert.match(result.mermaid, /\+App\(\) \[lines: 12 \| refs: 0 \| importers: 0\]/);
  assert.match(result.mermaid, /class static_child\["11 static-child\.jsx"\] \{/);
  assert.match(result.mermaid, /\+StaticNamed\(\) \[lines: 3 \| refs: 1 \| importers: 1\]/);
  assert.ok(result.mermaid.includes('app --> static_child : import'));
  assert.ok(result.mermaid.includes('app --> dynamic_child : lazy'));
  assert.ok(!result.mermaid.includes(': imports'));

  assert.deepEqual(result.importEdges, [
    {
      source: 'app',
      target: 'dynamic_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/dynamic-child.jsx',
      targetLineCount: 3,
      loadKinds: ['dynamic'],
      imports: [
        {
          imported: 'DynamicExport',
          local: 'DynamicLocal',
          kind: 'named',
          inferred: false,
          lineCount: 3,
        },
      ],
    },
    {
      source: 'app',
      target: 'static_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/static-child.jsx',
      targetLineCount: 11,
      loadKinds: ['static'],
      imports: [
        {
          imported: 'default',
          local: 'StaticDefault',
          kind: 'default',
          inferred: false,
        },
        {
          imported: 'StaticNamed',
          local: 'StaticAlias',
          kind: 'named',
          inferred: false,
          lineCount: 3,
        },
        {
          imported: 'StaticSame',
          local: 'StaticSame',
          kind: 'named',
          inferred: false,
          lineCount: 3,
        },
      ],
    },
  ]);
});

test('analyzeProject renders Mermaid member metrics from declaration import metadata', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { FormatThing as FormatAlias } from './shared.js';",
      "import { Panel } from './panel.jsx';",
      "import { View } from './view.jsx';",
      '',
      'export function App() {',
      '  return <Panel value={FormatAlias()}>',
      '    <View />',
      '  </Panel>;',
      '}',
    ].join('\n'),
    'src/panel.jsx': [
      "import { App as AppReference } from './app.jsx';",
      "import { FormatThing } from './shared.js';",
      '',
      'export function Panel({ children }) {',
      '  return <section>{FormatThing()}{AppReference && children}</section>;',
      '}',
    ].join('\n'),
    'src/view.jsx': [
      "import { FormatThing as FormatView } from './shared.js';",
      '',
      'export function View() {',
      '  return <article>{FormatView()}</article>;',
      '}',
    ].join('\n'),
    'src/shared.js': [
      'export function FormatThing() {',
      "  return 'formatted';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });

  assert.match(result.mermaid, /\+FormatAlias \[lines: 3 \| refs: 3 \| importers: 3\]/);
  assert.match(result.mermaid, /\+App\(\) \[lines: 5 \| refs: 1 \| importers: 1\]/);
  assert.match(result.mermaid, /\+FormatThing \[lines: 3 \| refs: 3 \| importers: 3\]/);
  assert.match(result.mermaid, /\+Panel\(\) \[lines: 3 \| refs: 1 \| importers: 1\]/);
  assert.match(result.mermaid, /\+FormatView \[lines: 3 \| refs: 3 \| importers: 3\]/);
  assert.match(result.mermaid, /\+View\(\) \[lines: 3 \| refs: 1 \| importers: 1\]/);
});

test('analyzeProject distinguishes usage references from distinct importer files', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { FormatThing as FormatOne, FormatThing as FormatTwo } from './shared.js';",
      '',
      'export function App() {',
      '  return <output>{FormatOne()}{FormatTwo()}</output>;',
      '}',
    ].join('\n'),
    'src/shared.js': [
      'export function FormatThing() {',
      "  return 'formatted';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const formatOne = result.sourceCode.declarations.find((item) => item.name === 'FormatOne');

  assert.ok(formatOne, 'expected imported FormatOne declaration source');
  assert.equal(formatOne.declarationName, 'FormatThing');
  assert.equal(formatOne.referenceCount, 2);
  assert.equal(formatOne.importerFileCount, 1);
  assert.match(result.mermaid, /\+FormatOne \[lines: 3 \| refs: 2 \| importers: 1\]/);
});

test('analyzeProject counts function usages rather than import declarations as references', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { FormatThing as Format } from './shared.js';",
      '',
      'export function App() {',
      "  const example = 'Format()';",
      '  // Format() in documentation is not a code reference.',
      '  return <output>{Format()}{Format()}{Format}</output>;',
      '}',
    ].join('\n'),
    'src/shared.js': [
      'export function FormatThing() {',
      "  return 'formatted';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const format = result.sourceCode.declarations.find((item) => item.name === 'Format');

  assert.ok(format, 'expected imported Format source declaration');
  assert.equal(format.referenceCount, 3);
  assert.equal(format.importerFileCount, 1);
  assert.match(result.mermaid, /\+Format \[lines: 3 \| refs: 3 \| importers: 1\]/);
});

test('analyzeProject ignores require targets and reports unsupported CommonJS calls', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "const { RequiredChild: RequiredAlias } = require('./child.jsx');",
      "const shared = require('./shared.js');",
      "require('./register.js');",
      "const ignored = require('./' + computedName);",
      '',
      'export function App() {',
      '  return <RequiredAlias label={shared.FormatLabel()} />;',
      '}',
    ].join('\n'),
    'src/child.jsx': [
      'export function RequiredChild({ label }) {',
      '  return <span>{label}</span>;',
      '}',
    ].join('\n'),
    'src/shared.js': [
      'export function FormatLabel() {',
      "  return 'required';",
      '}',
    ].join('\n'),
    'src/register.js': [
      'export function register() {',
      '  return true;',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });

  assert.deepEqual(result.jsScripts.map((item) => item.path), ['src/app.jsx']);
  assert.ok(!result.treeText.includes("computedName"));
  assert.equal(result.importEdges.length, 0);
  assert.deepEqual(result.commonJsSyntax.map((item) => item.kind), [
    'require-call',
    'require-call',
    'require-call',
    'require-call',
  ]);
  assert.deepEqual(new Set(result.findings.map((item) => item.ruleId)), new Set(['IRONG_UNSUPPORTED_COMMONJS']));
});

test('analyzeProject maps named export aliases back to local declarations for import metrics', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { bar } from './feature.js';",
      '',
      'export function App() {',
      '  return <main>{bar()}</main>;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'function foo() {};',
      'export { foo as bar };',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const importedDeclaration = result.sourceCode.declarations.find((item) => item.declarationName === 'foo');

  assert.ok(importedDeclaration);
  assert.equal(importedDeclaration.name, 'bar');
  assert.equal(importedDeclaration.incomingReferenceCount, 1);
  assert.equal(importedDeclaration.importerFileCount, 1);
  assert.equal(importedDeclaration.referenceCount, 1);
  assert.match(result.mermaid, /\+bar \[lines: 1 \| refs: 1 \| importers: 1\]/);
});

test('analyzeProject does not resolve anonymous default imports through importer local names', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import unused from './feature.js';",
      '',
      'export function App() {',
      '  return <main />;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'function unused() {',
      "  return 'private';",
      '}',
      '',
      'export default function () {',
      "  return 'anonymous';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });

  assert.ok(!result.sourceCode.declarations.some((item) => (
    item.name === 'unused' && item.sourceOrigin === 'imported-script-member'
  )));
  assert.ok(!result.mermaid.includes('+unused [lines:'));
});

test('analyzeProject resolves default exports from mixed local export lists', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import Widget from './feature.js';",
      '',
      'export function App() {',
      '  return <main>{Widget()}</main>;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      "function other() { return 'other'; }",
      "function foo() { return 'foo'; }",
      'export { other, foo as default };',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const widgetDeclaration = result.sourceCode.declarations.find((item) => item.name === 'Widget');

  assert.ok(widgetDeclaration);
  assert.equal(widgetDeclaration.declarationName, 'foo');
  assert.equal(widgetDeclaration.incomingReferenceCount, 1);
  assert.equal(widgetDeclaration.importerFileCount, 1);
  assert.equal(widgetDeclaration.referenceCount, 1);
  assert.match(result.mermaid, /\+Widget \[lines: 1 \| refs: 1 \| importers: 1\]/);
});

test('analyzeProject rejects TS/TSX entries and resolves generic JS aliases only', async () => {
  const rootDir = await writeTempProject({
    'src/app.tsx': [
      'export function App() {',
      '  return <main />;',
      '}',
    ].join('\n'),
    'src/main.jsx': [
      "import { formatDisplay } from '@lib/format.js';",
      "import { Button } from '@ui';",
      '',
      'export function App() {',
      "  return <Button label={formatDisplay('ok')} />;",
      '}',
    ].join('\n'),
    'src/lib/format.js': [
      'export function formatDisplay(value) {',
      '  return value.trim();',
      '}',
    ].join('\n'),
    'src/ui/index.jsx': [
      'export function Button(props) {',
      '  return <button>{props.label}</button>;',
      '}',
    ].join('\n'),
  });

  await assert.rejects(
    () => analyzeProject({ rootDir, entry: 'src/app.tsx' }),
    /browser JavaScript module/,
  );

  const first = await analyzeProject({
    rootDir,
    entry: 'src/main.jsx',
    aliases: [
      '@lib/=src/lib/',
      '@ui=src/ui/index.jsx',
    ],
  });
  const second = await analyzeProject({
    rootDir,
    entry: 'src/main.jsx',
    aliases: [
      '@lib/=src/lib/',
      '@ui=src/ui/index.jsx',
    ],
  });
  const appModule = first.graph.modules.get('src/main.jsx');
  const edgeTargets = first.functionDependencyMap.edges
    .filter((edge) => edge.sourceFunction === 'App')
    .map((edge) => `${edge.targetModulePath}:${edge.targetFunction}`)
    .sort();

  assert.equal(first.metadata.analyzer.name, 'javascript-ast');
  assert.equal(first.metadata.backend.name, 'javascript-ast');
  assert.equal(first.summary.jsxFileCount, 2);
  assert.deepEqual(appModule.localDeps, ['src/lib/format.js', 'src/ui/index.jsx']);
  assert.deepEqual(edgeTargets, [
    'src/lib/format.js:formatDisplay',
    'src/ui/index.jsx:Button',
  ]);
  assert.deepEqual(
    first.functionDependencyMap.functions.map((node) => [node.stableId, node.modulePath, node.name]),
    second.functionDependencyMap.functions.map((node) => [node.stableId, node.modulePath, node.name]),
  );
  assert.deepEqual(
    first.functionDependencyMap.edges.map((edge) => [edge.sourceFunction, edge.targetModulePath, edge.targetFunction]),
    second.functionDependencyMap.edges.map((edge) => [edge.sourceFunction, edge.targetModulePath, edge.targetFunction]),
  );
});
