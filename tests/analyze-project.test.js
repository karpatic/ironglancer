import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { analyzeProject } from '../src/lib/analyze-project.js';

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

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
  assert.equal(result.summary.moduleCount, 4);
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'src/app.jsx',
    'src/creator/components/creator-lazy-widget.jsx',
    'src/creator/components/creator-panel.jsx',
    'src/creator/components/creator-startup-cache.js',
  ]);
  assert.ok(result.treeText.includes('src/creator/components/creator-panel.jsx'));
  assert.ok(result.treeText.includes('src/creator/components/creator-lazy-widget.jsx'));
  assert.ok(!result.treeText.includes('src/creator/components/unused-editor.jsx'));
  assert.ok(result.mermaid.includes('app --> creator_lazy_widget : imports'));
  assert.ok(result.mermaid.includes('app --> creator_panel : imports'));
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
  ]);

  assert.deepEqual(result.importEdges, [
    {
      source: 'app',
      target: 'dynamic_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/dynamic-child.jsx',
      loadKinds: ['dynamic'],
      imports: [
        {
          imported: 'DynamicExport',
          local: 'DynamicLocal',
          kind: 'named',
          inferred: false,
        },
      ],
    },
    {
      source: 'app',
      target: 'faculty_body_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/faculty-body-child.jsx',
      loadKinds: ['lazy'],
      imports: [
        {
          imported: 'CreatorViewBody',
          local: 'CreatorViewBody',
          kind: 'named',
          inferred: true,
        },
      ],
    },
    {
      source: 'app',
      target: 'faculty_editor_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/faculty-editor-child.jsx',
      loadKinds: ['lazy'],
      imports: [
        {
          imported: 'CreatorQuizEntryEditor',
          local: 'CreatorQuizEntryEditor',
          kind: 'named',
          inferred: true,
        },
      ],
    },
    {
      source: 'app',
      target: 'static_child',
      sourcePath: 'src/app.jsx',
      targetPath: 'src/static-child.jsx',
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
        },
        {
          imported: 'StaticSame',
          local: 'StaticSame',
          kind: 'named',
          inferred: false,
        },
      ],
    },
  ]);
});
