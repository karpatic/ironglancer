import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

import { analyzeProject } from '../src/lib/analyze-project.js';

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

test('analyzeProject resolves local modules, import-map aliases, and externals', async () => {
  const result = await analyzeProject({ rootDir: fixtureRoot, entry: 'src/app.jsx' });

  assert.equal(result.entryRel, 'src/app.jsx');
  assert.equal(result.summary.moduleCount, 5);
  assert.equal(result.summary.externalCount, 1);
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
});

const creatorLikeRoot = path.resolve('tests/fixtures/creator-like');

test('analyzeProject resolves creator-style public assets and review-origin aliases', async () => {
  const result = await analyzeProject({ rootDir: creatorLikeRoot, entry: 'ceator/app.jsx' });

  assert.equal(result.entryRel, 'ceator/app.jsx');
  assert.equal(result.summary.moduleCount, 3);
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'ceator/app.jsx',
    'public/app.js',
    'public/controller.js',
  ]);
});

const routeAliasRoot = path.resolve('tests/fixtures/route-alias');

test('analyzeProject maps URL-rooted imports through route aliases', async () => {
  const result = await analyzeProject({
    rootDir: routeAliasRoot,
    entry: 'src/web/ceator/app.jsx',
    routeAliases: [{ from: '/creator/', to: 'src/web/ceator/' }],
  });

  assert.equal(result.entryRel, 'src/web/ceator/app.jsx');
  assert.equal(result.summary.moduleCount, 2);
  assert.equal(result.summary.externalCount, 0);
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/web/ceator/app.jsx',
    'src/web/ceator/components/creator-linked-content-editor.jsx',
  ]);
  assert.ok(!result.treeText.includes('[external] /creator/components/creator-linked-content-editor.jsx'));
  assert.ok(!result.mermaid.includes('+LinkedContentEditor'));
  assert.ok(result.mermaid.includes('CreatorLinkedContentEditor()'));
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

const lazyLoadedRoot = path.resolve('tests/fixtures/lazy-loaded-imports');

test('analyzeProject resolves lazy-loaded module specifier constants', async () => {
  const result = await analyzeProject({
    rootDir: lazyLoadedRoot,
    entry: 'src/app.jsx',
    routeAliases: [{ from: '/creator/', to: 'src/creator/' }],
  });

  assert.equal(result.entryRel, 'src/app.jsx');
  assert.equal(result.summary.moduleCount, 5);
  assert.equal(result.summary.reachableModuleCount, 4);
  assert.equal(result.summary.unreachableModuleCount, 1);
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/app.jsx',
    'src/creator/components/creator-lazy-widget.jsx',
    'src/creator/components/creator-panel.jsx',
    'src/creator/components/creator-startup-cache.js',
    'src/creator/components/unused-editor.jsx',
  ]);
  assert.ok(result.treeText.includes('src/creator/components/creator-panel.jsx'));
  assert.ok(result.treeText.includes('src/creator/components/creator-lazy-widget.jsx'));
  assert.ok(!result.treeText.includes('src/creator/components/unused-editor.jsx'));
  assert.ok(!result.jsxTreeText.includes('unused-editor.jsx'));
  assert.ok(result.mermaid.includes('app --> creator_lazy_widget : lazy'));
  assert.ok(result.mermaid.includes('app --> creator_panel : lazy'));
  assert.ok(!result.mermaid.includes('unused_editor'));
  assert.ok(!result.mermaid.includes(': imports'));
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
    'src/faculty-body-child.jsx',
    'src/faculty-editor-child.jsx',
    'src/static-child.jsx',
    'src/unused-child.jsx',
  ]);
  assert.match(result.mermaid, /class app\["28 app\.jsx"\] \{/);
  assert.match(result.mermaid, /\+App\(\) \[lines: 16 \| refs: 0 \| importers: 0\]/);
  assert.match(result.mermaid, /class static_child\["11 static-child\.jsx"\] \{/);
  assert.match(result.mermaid, /\+StaticNamed\(\) \[lines: 3 \| refs: 1 \| importers: 1\]/);
  assert.ok(result.mermaid.includes('app --> static_child : import'));
  assert.ok(result.mermaid.includes('app --> dynamic_child : lazy'));
  assert.ok(!result.mermaid.includes('unused_child'));
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
      target: 'faculty_body_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/faculty-body-child.jsx',
      targetLineCount: 3,
      loadKinds: ['lazy'],
      imports: [
        {
          imported: 'CreatorViewBody',
          local: 'CreatorViewBody',
          kind: 'named',
          inferred: true,
          lineCount: 3,
        },
      ],
    },
    {
      source: 'app',
      target: 'faculty_editor_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/faculty-editor-child.jsx',
      targetLineCount: 3,
      loadKinds: ['lazy'],
      imports: [
        {
          imported: 'CreatorQuizEntryEditor',
          local: 'CreatorQuizEntryEditor',
          kind: 'named',
          inferred: true,
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

test('analyzeProject resolves local require forms and preserves require edge metadata', async () => {
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
  const requireEdge = result.importEdges.find((edge) => edge.targetPath === 'src/child.jsx');

  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/app.jsx',
    'src/child.jsx',
    'src/register.js',
    'src/shared.js',
  ]);
  assert.ok(!result.treeText.includes("computedName"));
  assert.ok(requireEdge, 'expected a JSX import edge for the required child');
  assert.deepEqual(requireEdge.loadKinds, ['require']);
  assert.deepEqual(requireEdge.imports, [
    {
      imported: 'RequiredChild',
      local: 'RequiredAlias',
      kind: 'named',
      inferred: false,
      lineCount: 3,
    },
  ]);
});

test('analyzeProject classifies zero-reference dead function candidates with static evidence', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { usedTool } from './tools.js';",
      "import * as Shared from './shared.js';",
      "require('./register.js');",
      '',
      'export function App() {',
      '  return <main>{usedTool()}{Shared.usedShared()}</main>;',
      '}',
      '',
      'function entryHelper() {',
      "  return 'entry';",
      '}',
    ].join('\n'),
    'src/tools.js': [
      'export function usedTool() {',
      "  return 'used';",
      '}',
      '',
      'function abandonedTool() {',
      "  return 'dead';",
      '}',
      '',
      'function exportedUtility() {',
      "  return 'public';",
      '}',
      '',
      'export { exportedUtility };',
    ].join('\n'),
    'src/shared.js': [
      'export function usedShared() {',
      "  return 'namespace';",
      '}',
      '',
      'function namespaceOnly() {',
      "  return 'maybe';",
      '}',
    ].join('\n'),
    'src/register.js': [
      'function registerSideEffect() {',
      '  return true;',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));

  assert.ok(!candidatesByName.has('usedTool'));
  assert.equal(candidatesByName.get('abandonedTool').confidence, 'high-confidence');
  assert.equal(candidatesByName.get('abandonedTool').counts.directIdentifierReferences, 0);
  assert.equal(candidatesByName.get('abandonedTool').counts.directImportingFiles, 0);
  assert.equal(candidatesByName.get('abandonedTool').signals.declarationOnlyNameOccurrence, true);

  assert.equal(candidatesByName.get('App').confidence, 'manual-review');
  assert.equal(candidatesByName.get('App').signals.exported, true);
  assert.equal(candidatesByName.get('App').signals.entrypointModule, true);
  assert.equal(candidatesByName.get('App').signals.componentConvention, true);

  assert.equal(candidatesByName.get('exportedUtility').confidence, 'manual-review');
  assert.equal(candidatesByName.get('exportedUtility').counts.directIdentifierReferences, 0);
  assert.equal(candidatesByName.get('exportedUtility').counts.publicApiReferences, 1);
  assert.equal(candidatesByName.get('exportedUtility').signals.exported, true);

  assert.equal(candidatesByName.get('usedShared').confidence, 'manual-review');
  assert.equal(candidatesByName.get('usedShared').signals.namespaceModuleReference, true);
  assert.equal(candidatesByName.get('namespaceOnly').signals.namespaceModuleReference, true);

  assert.equal(candidatesByName.get('registerSideEffect').confidence, 'manual-review');
  assert.equal(candidatesByName.get('registerSideEffect').signals.moduleOnlyReference, true);
  assert.equal(candidatesByName.get('registerSideEffect').signals.commonJsModuleReference, true);

  assert.equal(result.summary.deadFunctionCandidateCount, result.deadFunctionCandidates.length);
  assert.equal(result.summary.deadFunctionHighConfidenceCount, 1);
  assert.equal(
    result.summary.deadFunctionManualReviewCount,
    result.deadFunctionCandidates.length - result.summary.deadFunctionHighConfidenceCount,
  );
  const abandonedSource = result.sourceCode.declarations.find((item) => item.name === 'abandonedTool');
  assert.ok(abandonedSource.candidateId);
  assert.equal(abandonedSource.sourceOrigin, 'dead-function-candidate');
});

test('analyzeProject finds dead candidates in orphan modules while resolving orphan imports', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      'export function App() {',
      '  return <main />;',
      '}',
    ].join('\n'),
    'src/orphan.jsx': [
      "import { orphanHelper } from './orphan-helper.js';",
      '',
      'export function OrphanEntry() {',
      '  return orphanHelper();',
      '}',
      '',
      'function orphanUnused() {',
      "  return 'unused';",
      '}',
    ].join('\n'),
    'src/orphan-helper.js': [
      'export function orphanHelper() {',
      '  return helperPrivate();',
      '}',
      '',
      'function helperPrivate() {',
      "  return 'helper';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));
  const orphanUnused = candidatesByName.get('orphanUnused');
  const orphanEntry = candidatesByName.get('OrphanEntry');

  assert.equal(result.summary.moduleCount, 3);
  assert.equal(result.summary.reachableModuleCount, 1);
  assert.equal(result.summary.unreachableModuleCount, 2);
  assert.deepEqual(
    result.jsScripts.map((item) => ({ path: item.path, reachable: item.reachable })),
    [
      { path: 'src/app.jsx', reachable: true },
      { path: 'src/orphan-helper.js', reachable: false },
      { path: 'src/orphan.jsx', reachable: false },
    ],
  );
  assert.ok(!result.treeText.includes('src/orphan.jsx'));
  assert.ok(!result.mermaid.includes('OrphanEntry'));

  assert.equal(orphanUnused.confidence, 'high-confidence');
  assert.equal(orphanUnused.reachable, false);
  assert.equal(orphanUnused.signals.reachableModule, false);
  assert.ok(orphanUnused.evidence.some((item) => item.label === 'Unreachable scope'));
  assert.equal(orphanEntry.confidence, 'manual-review');
  assert.equal(orphanEntry.reachable, false);
  assert.ok(!candidatesByName.has('orphanHelper'));
  assert.ok(!candidatesByName.has('helperPrivate'));
});

test('analyzeProject ignores self-recursive references inside a declaration but keeps outside callers', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { run } from './feature.js';",
      '',
      'export function App() {',
      '  return <main>{run()}</main>;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'export function run() {',
      '  return externallyCalled(2);',
      '}',
      '',
      'function selfOnly(count) {',
      '  if (count <= 0) return 0;',
      '  return selfOnly(count - 1);',
      '}',
      '',
      'function externallyCalled(count) {',
      '  if (count <= 0) return 1;',
      '  return externallyCalled(count - 1);',
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));
  const selfOnly = candidatesByName.get('selfOnly');

  assert.equal(selfOnly.confidence, 'high-confidence');
  assert.equal(selfOnly.counts.directIdentifierReferences, 0);
  assert.equal(selfOnly.counts.sameFileReferences, 0);
  assert.equal(selfOnly.counts.ownDeclarationReferences, 1);
  assert.equal(selfOnly.counts.nameOccurrences, 2);
  assert.equal(selfOnly.signals.declarationOnlyNameOccurrence, true);
  assert.ok(!candidatesByName.has('externallyCalled'));
});

test('analyzeProject keeps semicolonless export-list ranges from hiding later same-file uses', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import './feature.js';",
      '',
      'export function App() {',
      '  return null;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'function foo() {',
      "  return 'live';",
      '}',
      '',
      'export { foo }',
      'foo()',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));

  assert.ok(!candidatesByName.has('foo'));
});

test('analyzeProject excludes named function expression internal names from dead candidates', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { run } from './tasks.js';",
      '',
      'export function App() {',
      '  return <main>{run()}</main>;',
      '}',
    ].join('\n'),
    'src/tasks.js': [
      'export const run = function helper() {',
      "  return 'running';",
      '};',
      '',
      'setTimeout(function tick() {',
      "  return 'later';",
      '}, 1);',
      '',
      'function abandonedTask() {',
      "  return 'dead';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));

  assert.ok(!candidatesByName.has('helper'));
  assert.ok(!candidatesByName.has('tick'));
  assert.equal(candidatesByName.get('abandonedTask').confidence, 'high-confidence');
});

test('analyzeProject excludes named function expressions inside template interpolation from dead candidates', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { renderMessage } from './feature.js';",
      '',
      'export function App() {',
      '  return <main>{renderMessage()}</main>;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'export function renderMessage() {',
      '  return `${function helper() {}}`;',
      '}',
      '',
      'function abandonedTask() {',
      "  return 'dead';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));

  assert.ok(!candidatesByName.has('helper'));
  assert.equal(candidatesByName.get('abandonedTask').confidence, 'high-confidence');
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
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));
  const importedDeclaration = result.sourceCode.declarations.find((item) => item.declarationName === 'foo');

  assert.ok(!candidatesByName.has('foo'));
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
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));
  const unusedCandidate = candidatesByName.get('unused');

  assert.equal(unusedCandidate.confidence, 'high-confidence');
  assert.equal(unusedCandidate.counts.directImportingFiles, 0);
  assert.equal(unusedCandidate.counts.incomingImportReferences, 0);
  assert.ok(!result.sourceCode.declarations.some((item) => (
    item.name === 'unused' && item.sourceOrigin === 'imported-script-member'
  )));
  assert.ok(result.sourceCode.declarations.some((item) => (
    item.name === 'unused' && item.sourceOrigin === 'dead-function-candidate'
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
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));
  const widgetDeclaration = result.sourceCode.declarations.find((item) => item.name === 'Widget');

  assert.ok(!candidatesByName.has('foo'));
  assert.ok(widgetDeclaration);
  assert.equal(widgetDeclaration.declarationName, 'foo');
  assert.equal(widgetDeclaration.incomingReferenceCount, 1);
  assert.equal(widgetDeclaration.importerFileCount, 1);
  assert.equal(widgetDeclaration.referenceCount, 1);
  assert.match(result.mermaid, /\+Widget \[lines: 1 \| refs: 1 \| importers: 1\]/);
});

test('analyzeProject ignores property names when classifying direct identifier references', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { entry } from './feature.js';",
      '',
      'export function App() {',
      '  return <main>{entry()}</main>;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'export function entry() {',
      '  return liveFromCall();',
      '}',
      '',
      'function unused() {',
      "  return 'dead';",
      '}',
      '',
      'function liveFromCall() {',
      "  return 'call';",
      '}',
      '',
      'function liveFromValue() {',
      "  return 'value';",
      '}',
      '',
      'function liveFromShorthand() {',
      "  return 'shorthand';",
      '}',
      '',
      'function liveFromComputedMember() {',
      "  return 'computed';",
      '}',
      '',
      'const registry = {',
      '  unused: true,',
      '  liveFromShorthand,',
      '  value: liveFromValue,',
      '};',
      'registry.unused = true;',
      'registry?.unused;',
      'const valueReference = liveFromValue;',
      'const computedReference = registry[liveFromComputedMember];',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));
  const unusedCandidate = candidatesByName.get('unused');

  assert.equal(unusedCandidate.confidence, 'high-confidence');
  assert.equal(unusedCandidate.counts.directIdentifierReferences, 0);
  assert.equal(unusedCandidate.counts.nameOccurrences, 1);
  assert.equal(unusedCandidate.signals.declarationOnlyNameOccurrence, true);
  assert.ok(!candidatesByName.has('liveFromCall'));
  assert.ok(!candidatesByName.has('liveFromValue'));
  assert.ok(!candidatesByName.has('liveFromShorthand'));
  assert.ok(!candidatesByName.has('liveFromComputedMember'));
});

test('analyzeProject keeps ASI-separated function declarations as dead candidates without named expression noise', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { run } from './tasks.js';",
      '',
      'export function App() {',
      '  return <main>{run()}</main>;',
      '}',
    ].join('\n'),
    'src/tasks.js': [
      'void 0',
      'function afterExpression() {',
      "  return 'dead';",
      '}',
      '',
      'const enabled = true',
      'function afterVariable() {',
      '  return enabled;',
      '}',
      '',
      'function wrapper() {',
      '  void 0',
      '  function innerAfterExpression() {',
      "    return 'nested';",
      '  }',
      '  const innerEnabled = true',
      '  function innerAfterVariable() {',
      '    return innerEnabled;',
      '  }',
      '}',
      '',
      'export const run = function helper() {',
      "  return 'running';",
      '};',
      '',
      'setTimeout(function tick() {',
      "  return 'later';",
      '}, 1);',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));

  assert.equal(candidatesByName.get('afterExpression').confidence, 'high-confidence');
  assert.equal(candidatesByName.get('afterVariable').confidence, 'high-confidence');
  assert.equal(candidatesByName.get('innerAfterExpression').confidence, 'high-confidence');
  assert.equal(candidatesByName.get('innerAfterVariable').confidence, 'high-confidence');
  assert.ok(!candidatesByName.has('helper'));
  assert.ok(!candidatesByName.has('tick'));
});

test('analyzeProject keeps template interpolation references live while ignoring template text', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { renderMessage } from './feature.js';",
      '',
      'export function App() {',
      '  return <main>{renderMessage()}</main>;',
      '}',
    ].join('\n'),
    'src/feature.js': [
      'export function renderMessage() {',
      '  return `literalOnly appears only as text ${helper()}`;',
      '}',
      '',
      'function helper() {',
      "  return 'live';",
      '}',
      '',
      'function literalOnly() {',
      "  return 'dead';",
      '}',
    ].join('\n'),
  });

  const result = await analyzeProject({ rootDir, entry: 'src/app.jsx' });
  const candidatesByName = new Map(result.deadFunctionCandidates.map((candidate) => [candidate.name, candidate]));

  assert.ok(!candidatesByName.has('helper'));
  assert.equal(candidatesByName.get('literalOnly').confidence, 'high-confidence');
  assert.equal(candidatesByName.get('literalOnly').counts.directIdentifierReferences, 0);
});
