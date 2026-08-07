import path from 'node:path';

import { compareLocale, normalizeString } from '../utils.js';

export function isJsxModule(rel) {
  return /\.jsx$/i.test(rel);
}

export function moduleRecords(graph, { reachableOnly = false } = {}) {
  return Array.from(graph.modules.values())
    .filter((record) => !reachableOnly || record.reachable)
    .sort((a, b) => compareLocale(a.rel, b.rel));
}

export function jsxModuleRecords(graph, options = {}) {
  return moduleRecords(graph, options)
    .filter((record) => isJsxModule(record.rel))
    .sort((a, b) => compareLocale(a.rel, b.rel));
}

export function buildClassIds(records) {
  const baseCounts = new Map();
  const ids = new Map();
  for (const record of records) {
    const base = normalizeString(path.posix.basename(record.rel, path.posix.extname(record.rel)))
      .replace(/[^A-Za-z0-9_$]/g, '_') || 'Module';
    const count = (baseCounts.get(base) || 0) + 1;
    baseCounts.set(base, count);
    ids.set(record.rel, count === 1 ? base : `${base}_${count}`);
  }
  return ids;
}

export function uniqueRecords(records, keyFor) {
  const byKey = new Map();
  for (const record of records) {
    const key = keyFor(record);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, record);
  }
  return Array.from(byKey.values());
}
