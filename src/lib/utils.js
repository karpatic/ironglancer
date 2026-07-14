import fs from 'node:fs/promises';
import path from 'node:path';

export function normalizeString(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

export function toPosixPath(value) {
  return normalizeString(value).replace(/\\/g, '/');
}

export async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export function isWithinPath(rootDir, targetPath) {
  const relative = path.relative(rootDir, targetPath);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export function extensionCandidates(relativePath) {
  const normalized = toPosixPath(relativePath).replace(/^\/+/, '');
  if (!normalized) return [];
  const ext = path.posix.extname(normalized).toLowerCase();
  if (ext) return [normalized];
  return [
    normalized,
    `${normalized}.js`,
    `${normalized}.jsx`,
    `${normalized}.mjs`,
    path.posix.join(normalized, 'index.js'),
    path.posix.join(normalized, 'index.jsx'),
    path.posix.join(normalized, 'index.mjs'),
  ];
}

export function compareLocale(a, b) {
  return String(a).localeCompare(String(b));
}
