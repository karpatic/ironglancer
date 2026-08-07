import fs from 'node:fs/promises';
import path from 'node:path';

import { compareLocale } from '../utils.js';
import { uniqueRecords } from '../analysis/module-records.js';
import { parseHtmlEntry } from './import-maps.js';
import { resolveBrowserPathFromRoot, resolveImport } from './module-resolver.js';

export async function moduleEntriesForHtmlEntry({ rootDir, htmlEntry, routeAliases }) {
  const html = await fs.readFile(htmlEntry.filePath, 'utf8');
  const parsed = parseHtmlEntry(html);
  const entryDir = path.posix.dirname(htmlEntry.rel);
  const resolvedEntries = [];
  for (const src of parsed.moduleScriptSrcs) {
    const resolved = await resolveImport({
      rootDir,
      specifier: src,
      importerRel: htmlEntry.rel,
      aliases: parsed.importAliases,
      routeAliases,
    }) || await resolveBrowserPathFromRoot(rootDir, path.posix.normalize(path.posix.join(entryDir, src)));
    if (resolved?.kind === 'module') resolvedEntries.push(resolved);
  }
  if (resolvedEntries.length === 0) {
    throw new Error(`HTML entry ${htmlEntry.rel} does not contain a resolvable <script type="module" src="...">.`);
  }
  return {
    aliases: parsed.importAliases,
    entries: uniqueRecords(resolvedEntries, (item) => item.rel).sort((a, b) => compareLocale(a.rel, b.rel)),
  };
}
