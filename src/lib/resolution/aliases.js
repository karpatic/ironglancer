import path from 'node:path';

import { normalizeString, toPosixPath } from '../utils.js';

export function normalizeImportAliasTarget(value) {
  return toPosixPath(normalizeString(value).trim());
}

function parseAliasString(value) {
  const raw = normalizeString(value).trim();
  const separatorIndex = raw.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error(`Invalid alias "${raw}". Use specifier=path.`);
  }
  const from = raw.slice(0, separatorIndex).trim();
  const to = raw.slice(separatorIndex + 1).trim();
  if (!from || !to) throw new Error('Aliases must include both a specifier and target path.');
  return [from, normalizeImportAliasTarget(to)];
}

export function normalizeImportAliases(values = []) {
  const aliases = new Map();
  const entries = Array.isArray(values) ? values : [values].filter(Boolean);
  for (const entry of entries) {
    if (typeof entry === 'string') {
      const [from, to] = parseAliasString(entry);
      aliases.set(from, to);
    } else if (Array.isArray(entry)) {
      aliases.set(normalizeString(entry[0]).trim(), normalizeImportAliasTarget(entry[1]));
    } else if (entry && typeof entry === 'object') {
      aliases.set(normalizeString(entry.from ?? entry.alias ?? entry.specifier).trim(), normalizeImportAliasTarget(entry.to ?? entry.path));
    }
  }
  for (const [key, value] of aliases) {
    if (!key || !value) aliases.delete(key);
  }
  return aliases;
}

export function mergeAliasMaps(...maps) {
  const aliases = new Map();
  for (const map of maps) {
    for (const [key, value] of map instanceof Map ? map : []) {
      if (key && value) aliases.set(key, value);
    }
  }
  return aliases;
}

function parseRouteAliasString(value) {
  const raw = normalizeString(value).trim();
  const separatorIndex = raw.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error(`Invalid route alias "${raw}". Use route=path.`);
  }
  return {
    from: raw.slice(0, separatorIndex),
    to: raw.slice(separatorIndex + 1),
  };
}

function routeAliasEntries(routeAliases) {
  const entries = Array.isArray(routeAliases) ? routeAliases : [routeAliases].filter(Boolean);
  return entries.map((entry) => (typeof entry === 'string' ? parseRouteAliasString(entry) : entry));
}

function normalizeRouteAliasFrom(value) {
  const raw = toPosixPath(normalizeString(value).trim());
  if (!raw) return '';
  const rooted = raw.startsWith('/') ? raw : `/${raw}`;
  return rooted.replace(/\/+$/g, '') || '/';
}

export function normalizeRouteAliasTarget(value) {
  const raw = toPosixPath(normalizeString(value).trim());
  if (!raw) return '';
  const normalized = raw.replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/g, '');
  return normalized === '.' ? '' : normalized;
}

export function normalizeRouteAliases(routeAliases = []) {
  return routeAliasEntries(routeAliases)
    .map((entry, index) => {
      const from = normalizeRouteAliasFrom(Array.isArray(entry) ? entry[0] : entry?.from);
      const targetSource = Array.isArray(entry) ? entry[1] : entry?.to;
      const to = normalizeRouteAliasTarget(targetSource);
      if (!from || targetSource == null) {
        throw new Error('Route aliases must include a route and target path.');
      }
      return { from, to, index };
    })
    .sort((a, b) => b.from.length - a.from.length || a.index - b.index)
    .map(({ from, to }) => ({ from, to }));
}

export function expandImportAliasTarget(value) {
  return toPosixPath(normalizeString(value).trim())
    .replace('__REVIEW_ORIGIN__/', 'public/');
}

function joinImportAliasPrefixTarget(target, rest) {
  const normalizedTarget = toPosixPath(normalizeString(target).trim());
  const normalizedRest = toPosixPath(normalizeString(rest).trim());
  if (!normalizedRest) return normalizedTarget;
  return normalizedTarget.endsWith('/')
    ? `${normalizedTarget}${normalizedRest}`
    : path.posix.join(normalizedTarget, normalizedRest);
}

export function importAliasTargetForSpecifier(specifier, aliases) {
  const raw = normalizeString(specifier).trim();
  let best = null;
  for (const [key, value] of aliases instanceof Map ? aliases : []) {
    const alias = normalizeString(key).trim();
    if (!alias) continue;
    if (raw === alias) {
      const candidate = { key: alias, target: value, rest: '' };
      if (!best || candidate.key.length > best.key.length) best = candidate;
    } else if (alias.endsWith('/') && raw.startsWith(alias)) {
      const candidate = { key: alias, target: value, rest: raw.slice(alias.length) };
      if (!best || candidate.key.length > best.key.length) best = candidate;
    }
  }
  return best ? joinImportAliasPrefixTarget(best.target, best.rest) : '';
}
