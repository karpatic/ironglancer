import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const expectedVersion = '0.2.1';

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(rootDir, relativePath), 'utf8'));
}

async function readText(relativePath) {
  return fs.readFile(path.join(rootDir, relativePath), 'utf8');
}

async function exists(relativePath) {
  try {
    await fs.stat(path.join(rootDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const packageJson = await readJson('package.json');
const packageLock = await readJson('package-lock.json');

assert(packageJson.name === 'ironglancer', 'package.json name must remain ironglancer.');
assert(packageJson.version === expectedVersion, `package.json version must be ${expectedVersion}.`);
assert(packageLock.name === 'ironglancer', 'package-lock.json name must remain ironglancer.');
assert(packageLock.version === expectedVersion, `package-lock.json version must be ${expectedVersion}.`);
assert(packageLock.packages?.['']?.version === expectedVersion, `package-lock root package version must be ${expectedVersion}.`);
assert(packageJson.dependencies?.['@babel/parser'], '@babel/parser must be a runtime dependency.');
assert(!packageJson.dependencies?.typescript, 'typescript must not be a runtime dependency.');

const requiredFiles = [
  'README.md',
  'CHANGELOG.md',
  'MIGRATION.md',
  'action.yml',
  'dist/action/index.js',
  'dist/action/package.json',
];
for (const file of requiredFiles) {
  assert(await exists(file), `${file} is required for release readiness.`);
}

const actionYaml = await readText('action.yml');
assert(actionYaml.includes('main: dist/action/index.js'), 'action.yml must point at the committed dist/action bundle.');
assert(actionYaml.includes('module-limit:'), 'action.yml must expose module-limit.');
assert(actionYaml.includes('sarif-path:'), 'action.yml must expose sarif-path.');

const readme = await readText('README.md');
for (const phrase of [
  '--source-mode none|declarations|full',
  '--module-limit',
  'browser-side JavaScript/JSX',
  'no TypeScript or TSX analysis',
  'Semantic finding IDs',
  'GitHub Action',
  'MCP caveat',
]) {
  assert(readme.includes(phrase), `README.md must document ${phrase}.`);
}

const migration = await readText('MIGRATION.md');
assert(migration.includes('0.1 baseline migration'), 'MIGRATION.md must document the 0.1 baseline migration.');
assert(migration.includes('identityVersion'), 'MIGRATION.md must mention identityVersion.');

const files = await fs.readdir(rootDir);
const tarballs = files.filter((file) => /^ironglancer-\d+\.\d+\.\d+.*\.tgz$/.test(file));
assert(tarballs.length === 0, `Remove generated package tarball(s) before release: ${tarballs.join(', ')}`);

console.log('IronGlancer release integrity checks passed.');
