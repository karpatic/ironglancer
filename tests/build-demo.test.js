import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { makeTempDir } from './helpers/temp-dir.js';
import { buildDemoSite } from '../scripts/build-demo.mjs';

const demoRoot = path.resolve('examples/bundless-react');

test('buildDemoSite publishes a Bundless React app with its IronGlancer analysis', async (t) => {
  const outDir = await makeTempDir('ironglancer-bundless-demo-');
  t.after(() => fs.rm(outDir, { recursive: true, force: true }));

  const result = await buildDemoSite({ outDir });
  const [html, source, bundless, react, reactDom, analysisHtml, outputText] = await Promise.all([
    fs.readFile(path.join(outDir, 'index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'main.jsx'), 'utf8'),
    fs.readFile(path.join(outDir, 'vendor/bundless.sucrase.min.js'), 'utf8'),
    fs.readFile(path.join(outDir, 'vendor/react.production.min.js'), 'utf8'),
    fs.readFile(path.join(outDir, 'vendor/react-dom.production.min.js'), 'utf8'),
    fs.readFile(path.join(outDir, 'analysis/index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'analysis/output.json'), 'utf8'),
  ]);
  const output = JSON.parse(outputText);

  assert.match(html, /src="\.\/main\.jsx" type="text\/jsx"/);
  assert.match(html, /src="\.\/vendor\/bundless\.sucrase\.min\.js" type="module"/);
  assert.match(html, /src="\.\/vendor\/react\.production\.min\.js"/);
  assert.match(html, /src="\.\/vendor\/react-dom\.production\.min\.js"/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(source, /window\.import\(['"]\.\/App\.jsx['"]\)/);
  assert.doesNotMatch(source, /from ['"]\.\/App\.jsx['"]/);
  assert.ok(bundless.length > 10_000);
  assert.ok(react.length > 10_000);
  assert.ok(reactDom.length > 100_000);
  assert.match(analysisHtml, /<title>IronGlancer<\/title>/);
  assert.equal(output.entry, 'main.jsx');
  assert.deepEqual(
    output.importEdges.map((edge) => `${edge.source}->${edge.target}`),
    ['App->BudgetSummary', 'App->PantryChecklist', 'App->RecommendationPanel', 'App->ShoppingList', 'main->App'],
  );
  assert.ok(output.importEdges.every((edge) => edge.loadKinds.includes('dynamic')));
  assert.deepEqual(
    output.jsxScripts.map((script) => script.path),
    [
      'App.jsx',
      'components/BudgetSummary.jsx',
      'components/PantryChecklist.jsx',
      'components/RecommendationPanel.jsx',
      'components/ShoppingList.jsx',
      'main.jsx',
    ],
  );
  assert.equal(result.demoRoot, demoRoot);
  assert.equal(result.analysis.outDir, path.join(outDir, 'analysis'));
});
