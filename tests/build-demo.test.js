import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildDemoSite } from '../scripts/build-demo.mjs';

const demoRoot = path.resolve('examples/bundless-react');

test('buildDemoSite publishes a Bundless React app with its IronGlancer analysis', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-bundless-demo-'));

  const result = await buildDemoSite({ outDir });
  const [html, source, bundless, analysisHtml, outputText] = await Promise.all([
    fs.readFile(path.join(outDir, 'index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'main.jsx'), 'utf8'),
    fs.readFile(path.join(outDir, 'vendor/bundless.sucrase.min.js'), 'utf8'),
    fs.readFile(path.join(outDir, 'analysis/index.html'), 'utf8'),
    fs.readFile(path.join(outDir, 'analysis/output.json'), 'utf8'),
  ]);
  const output = JSON.parse(outputText);

  assert.match(html, /src="\.\/main\.jsx" type="text\/jsx"/);
  assert.match(html, /src="\.\/vendor\/bundless\.sucrase\.min\.js" type="module"/);
  assert.match(source, /window\.import\(['"]\.\/App\.jsx['"]\)/);
  assert.doesNotMatch(source, /from ['"]\.\/App\.jsx['"]/);
  assert.ok(bundless.length > 10_000);
  assert.match(analysisHtml, /<title>IronGlancer<\/title>/);
  assert.equal(output.entry, 'main.jsx');
  assert.deepEqual(output.importEdges[0].loadKinds, ['dynamic']);
  assert.deepEqual(
    output.jsxScripts.map((script) => script.path),
    [
      'App.jsx',
      'Counter.jsx',
      'FeatureList.jsx',
      'main.jsx',
    ],
  );
  assert.equal(result.demoRoot, demoRoot);
  assert.equal(result.analysis.outDir, path.join(outDir, 'analysis'));
});
