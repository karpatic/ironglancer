import { normalizeString } from '../utils.js';
import { mergeAliasMaps, normalizeImportAliasTarget } from './aliases.js';

function aliasesFromImportMap(importMap = {}) {
  const aliases = new Map();
  const imports = importMap && typeof importMap.imports === 'object' && !Array.isArray(importMap.imports)
    ? importMap.imports
    : {};
  for (const [key, value] of Object.entries(imports)) {
    const rawValue = normalizeImportAliasTarget(value);
    if (!rawValue) continue;
    aliases.set(key, rawValue);
  }
  return aliases;
}

function parseHtmlAttributes(rawAttributes) {
  const attrs = new Map();
  const pattern = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(normalizeString(rawAttributes)))) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

export function parseHtmlEntry(source) {
  const html = normalizeString(source);
  const importMaps = [];
  const moduleScriptSrcs = [];
  const importMapPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = importMapPattern.exec(html))) {
    const attrs = parseHtmlAttributes(match[1]);
    const type = normalizeString(attrs.get('type')).trim().toLowerCase();
    const src = normalizeString(attrs.get('src')).trim();
    if (type === 'importmap') {
      try {
        importMaps.push(JSON.parse(match[2]));
      } catch (error) {
        throw new Error(`Invalid HTML import map JSON: ${error.message}`);
      }
    } else if (type === 'module' && src) {
      moduleScriptSrcs.push(src);
    }
  }
  return {
    importAliases: mergeAliasMaps(...importMaps.map(aliasesFromImportMap)),
    moduleScriptSrcs,
  };
}
