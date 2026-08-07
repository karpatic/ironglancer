import { compareLocale } from '../utils.js';
import { moduleRecords } from './module-records.js';

export const BROWSER_PLATFORM_NAMESPACES = new Map([
  ['window', 'browser:window'],
  ['document', 'browser:document'],
  ['navigator', 'browser:navigator'],
  ['localStorage', 'browser:localStorage'],
  ['sessionStorage', 'browser:sessionStorage'],
  ['Intl', 'browser:Intl'],
  ['URL', 'browser:URL'],
  ['Math', 'browser:Math'],
  ['console', 'browser:console'],
]);
export const BROWSER_PLATFORM_IDENTIFIERS = new Map([
  ['Date', 'browser:Date'],
  ['fetch', 'browser:fetch'],
  ['setTimeout', 'browser:timers'],
  ['clearTimeout', 'browser:timers'],
  ['setInterval', 'browser:timers'],
  ['clearInterval', 'browser:timers'],
  ['requestAnimationFrame', 'browser:animation-frame'],
]);

export function buildBrowserApis(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.browserApis) ? record.browserApis : [])
      .map((api) => ({
        ...api,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.api, b.api)
      || compareLocale(a.modulePath, b.modulePath)
      || a.line - b.line);
}
