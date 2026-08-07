import { after } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tempDirs = new Set();

after(async () => {
  const dirs = Array.from(tempDirs).reverse();
  tempDirs.clear();

  const failures = [];
  for (const dir of dirs) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(failures, `Failed to remove ${failures.length} test temp directory root(s).`);
  }
});

export async function makeTempDir(prefix) {
  if (typeof prefix !== 'string' || prefix.length === 0) {
    throw new TypeError('makeTempDir prefix must be a non-empty string.');
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.add(tempDir);
  return tempDir;
}
