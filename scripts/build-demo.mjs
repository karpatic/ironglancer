import path from 'node:path';

import { generateStaticSite } from '../src/lib/generate-static-site.js';

const rootDir = path.resolve('tests/fixtures/sample-app');
const outDir = path.resolve('docs');

const result = await generateStaticSite({
  rootDir,
  entry: 'src/app.jsx',
  outDir,
});

console.log(JSON.stringify({
  ok: true,
  rootDir: result.rootDir,
  entry: result.entryRel,
  outDir: result.outDir,
  summary: result.summary,
}, null, 2));
