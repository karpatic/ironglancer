import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { generateStaticSite } from '../src/lib/generate-static-site.js';

const require = createRequire(import.meta.url);
const defaultDemoRoot = path.resolve('examples/bundless-react');
const defaultOutDir = path.resolve('docs');

export async function buildDemoSite({
  demoRoot = defaultDemoRoot,
  outDir = defaultOutDir,
} = {}) {
  const resolvedDemoRoot = path.resolve(demoRoot);
  const resolvedOutDir = path.resolve(outDir);
  const analysisOutDir = path.join(resolvedOutDir, 'analysis');
  const bundlessSource = require.resolve('bundlessdev/sucrase');
  const reactSource = path.join(
    path.dirname(require.resolve('react')),
    'umd/react.production.min.js',
  );
  const reactDomSource = path.join(
    path.dirname(require.resolve('react-dom')),
    'umd/react-dom.production.min.js',
  );

  await fs.rm(resolvedOutDir, { recursive: true, force: true });
  await fs.cp(resolvedDemoRoot, resolvedOutDir, { recursive: true });
  await fs.mkdir(path.join(resolvedOutDir, 'vendor'), { recursive: true });
  await Promise.all([
    fs.copyFile(
      bundlessSource,
      path.join(resolvedOutDir, 'vendor/bundless.sucrase.min.js'),
    ),
    fs.copyFile(
      reactSource,
      path.join(resolvedOutDir, 'vendor/react.production.min.js'),
    ),
    fs.copyFile(
      reactDomSource,
      path.join(resolvedOutDir, 'vendor/react-dom.production.min.js'),
    ),
  ]);

  const analysis = await generateStaticSite({
    rootDir: resolvedDemoRoot,
    entry: 'main.jsx',
    outDir: analysisOutDir,
    sourceMode: 'declarations',
  });

  return {
    demoRoot: resolvedDemoRoot,
    outDir: resolvedOutDir,
    analysis,
  };
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const result = await buildDemoSite();
  console.log(JSON.stringify({
    ok: true,
    demoRoot: result.demoRoot,
    outDir: result.outDir,
    entry: result.analysis.entryRel,
    analysisOutDir: result.analysis.outDir,
    summary: result.analysis.summary,
  }, null, 2));
}
