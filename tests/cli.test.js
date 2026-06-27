import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const fixtureRoot = path.resolve('tests/fixtures/sample-app');

test('cli runs in one command on a folder', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-cli-'));
  await execFile('node', ['src/cli.mjs', fixtureRoot, '--entry', 'src/app.jsx', '--out', outDir], {
    cwd: path.resolve('.'),
  });

  const output = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  assert.equal(output.entry, 'src/app.jsx');
  assert.equal(output.summary.moduleCount, 5);
});
