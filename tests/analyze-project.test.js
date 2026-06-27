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
  assert.ok(result.mermaid.includes('classDiagram'));
  assert.deepEqual(result.jsScripts.map((item) => item.path), [
    'shared/theme.js',
    'src/app.jsx',
    'src/components/App.jsx',
    'src/lib/util.js',
    'src/panes/Inspector.jsx',
  ]);
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
