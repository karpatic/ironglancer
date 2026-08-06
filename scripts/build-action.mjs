import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const actionEntry = path.join(rootDir, 'src/action.mjs');
const distDir = path.join(rootDir, 'dist/action');
const check = process.argv.includes('--check');

async function buildTo(targetDir) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await execFile('node', [
    path.join(rootDir, 'node_modules/@vercel/ncc/dist/ncc/cli.js'),
    'build',
    actionEntry,
    '--out',
    targetDir,
    '--target',
    'es2020',
    '--no-cache',
    '--no-source-map-register',
  ], { cwd: rootDir });
  const esmBundlePath = path.join(targetDir, 'index.mjs');
  const jsBundlePath = path.join(targetDir, 'index.js');
  try {
    await fs.rename(esmBundlePath, jsBundlePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const bundleText = await fs.readFile(jsBundlePath, 'utf8');
  await fs.writeFile(jsBundlePath, bundleText.replace(/[ \t]+$/gm, '').replace(/\n+$/g, '\n'), 'utf8');
  await fs.writeFile(path.join(targetDir, 'package.json'), '{"type":"module"}\n', 'utf8');
}

async function fileTextOrNull(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function assertFresh(tempDir) {
  const files = ['index.js', 'package.json', 'sourcemap-register.js'];
  for (const file of files) {
    const expected = await fileTextOrNull(path.join(tempDir, file));
    const actual = await fileTextOrNull(path.join(distDir, file));
    if (expected !== actual) {
      throw new Error(`dist/action/${file} is stale. Run npm run build:action.`);
    }
  }
}

if (check) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-action-build-'));
  const tempDist = path.join(tempRoot, 'dist');
  try {
    await buildTo(tempDist);
    await assertFresh(tempDist);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
} else {
  await buildTo(distDir);
}
