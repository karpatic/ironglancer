import { normalizeString } from '../utils.js';

export function sourceLines(source) {
  const normalized = normalizeString(source);
  if (!normalized) return [];
  const lines = normalized.split(/\r\n|\r|\n/);
  if (/[\r\n]$/.test(normalized)) lines.pop();
  return lines;
}

export function formatLineCount(lineCount) {
  return `${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`;
}

export function scriptStats(rel, source) {
  const lines = sourceLines(source);
  return {
    path: rel,
    lineCount: lines.length,
    maxLineLength: lines.reduce((max, line) => Math.max(max, line.length), 0),
  };
}
