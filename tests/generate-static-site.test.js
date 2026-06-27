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

  const output = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  assert.equal(output.entry, 'src/app.jsx');
  assert.equal(output.summary.moduleCount, 5);

  const vendorFiles = await fs.readdir(path.join(outDir, 'vendor'));
  assert.ok(vendorFiles.some((name) => name.includes('mermaid')));
});
