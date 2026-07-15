import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

import { generateStaticSite } from '../src/lib/generate-static-site.js';

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

test('generateStaticSite writes a static viewer bundle', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-'));
  const result = await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });

  assert.equal(result.entryRel, 'src/app.jsx');
  const files = await fs.readdir(outDir);
  assert.ok(files.includes('index.html'));
  assert.ok(files.includes('app.js'));
  assert.ok(files.includes('output.json'));
  assert.ok(files.includes('vendor'));

  const html = await fs.readFile(path.join(outDir, 'index.html'), 'utf8');
  assert.match(html, /\.\/app\.js/);
  assert.match(html, /<details class="panel collapsible-panel" id="jsx-tree-panel">/);
  assert.match(html, /<details class="panel collapsible-panel" id="mermaid-source-panel">/);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:\s|>|=)/);

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  assert.match(appJs, /payload\.jsxTreeText/);
  assert.match(appJs, /renderJsxScripts\(jsxScripts\)/);

  const output = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  assert.equal(output.entry, 'src/app.jsx');
  assert.equal(output.summary.moduleCount, 5);
  assert.equal(output.summary.jsxFileCount, 3);
  assert.deepEqual(output.jsxScripts.map(({ path: scriptPath, lineCount }) => ({ path: scriptPath, lineCount })), [
    { path: 'src/app.jsx', lineCount: 9 },
    { path: 'src/components/App.jsx', lineCount: 3 },
    { path: 'src/panes/Inspector.jsx', lineCount: 3 },
  ]);
  assert.ok(output.jsxTreeText.includes('`-- src'));
  assert.ok(output.jsxTreeText.includes('app.jsx (9 lines)'));
  assert.ok(!output.jsxTreeText.includes('src/lib/util.js'));
  assert.ok(!output.jsxTreeText.includes('[external]'));

  const vendorFiles = await fs.readdir(path.join(outDir, 'vendor'));
  assert.ok(vendorFiles.some((name) => name.includes('mermaid')));
});
