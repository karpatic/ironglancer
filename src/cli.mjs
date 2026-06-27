#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { generateStaticSite } from './lib/generate-static-site.js';

const { values, positionals } = parseArgs({
  options: {
    entry: { type: 'string' },
    out: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log('Usage: ironglancer <folder> [--entry src/app.jsx] [--out ./ironglancer-site]');
  process.exit(0);
}

const rootDir = positionals[0] || '.';
const result = await generateStaticSite({
  rootDir,
  entry: values.entry,
  outDir: values.out,
});

console.log(JSON.stringify({
  ok: true,
  rootDir: result.rootDir,
  entry: result.entryRel,
  outDir: result.outDir,
  summary: result.summary,
}, null, 2));
