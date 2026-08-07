import { identifierReferenceLocations, maskIgnorableSyntax } from '../import-parser.js';
import { compareLocale, normalizeString } from '../utils.js';
import { isIgnoredExternalLabel, PLATFORM_IMPORT_SPECIFIERS } from '../resolution/module-resolver.js';
import { BROWSER_PLATFORM_IDENTIFIERS, BROWSER_PLATFORM_NAMESPACES } from './browser-api-analysis.js';
import { buildClassIds, isJsxModule, jsxModuleRecords, moduleRecords } from './module-records.js';
import { compactStableId, encodedStaticId } from './stable-id.js';
import { sourceLines } from './source-metrics.js';

const lexicalBlockRangeCache = new WeakMap();
const loopScopeRangeCache = new WeakMap();
const stringConstantValueCache = new WeakMap();
const identifierReferenceLocationCache = new WeakMap();
const visibleLocalBindingLocationCache = new WeakMap();
const FUNCTION_DEPENDENCY_LIMITATIONS = [
  'Static function dependencies are based on identifier references inside saved declaration spans; IronGlancer does not execute code or prove runtime control flow.',
  'Usage syntax is labeled as call, optional-call, tagged-template, jsx-element, or reference from nearby source syntax; reference entries are not claimed to be definite runtime calls.',
  'Imported targets are limited to browser ESM imports, dynamic imports, React.lazy boundaries, and module worker entries with statically resolvable bindings.',
  'Same-module targets are limited to named function declarations and named arrow-function variable declarations discovered in the same file; dynamic property dispatch, aliasing through arbitrary values, and unresolved re-exports are outside this map.',
  'Placement review is deterministic static affinity evidence; it is a review aid, not a runtime ownership proof or definitive dead-code detector.',
];

function declarationSpansByName(record) {
  const spans = new Map();
  for (const span of declarationSpans(record)) {
    if (!spans.has(span.name)) spans.set(span.name, span);
  }
  return spans;
}

function declarationSpans(record) {
  return Array.isArray(record?.declarationSpans) ? record.declarationSpans : [];
}

function declarationSpansNamed(record, name) {
  const declarationName = normalizeIdentifier(name);
  if (!declarationName) return [];
  return declarationSpans(record)
    .filter((span) => span?.name === declarationName)
    .sort((a, b) => a.startIndex - b.startIndex
      || a.endIndex - b.endIndex
      || compareLocale(a.kind, b.kind));
}

function declarationSpanAtNameStart(record, name, nameStartIndex) {
  const declarationName = normalizeIdentifier(name);
  return declarationSpans(record).find((span) => (
    span?.name === declarationName
    && span.nameStartIndex === nameStartIndex
  )) || null;
}

export function componentSpans(record) {
  return Array.from(declarationSpansByName(record))
    .filter(([name]) => /^[A-Z]/.test(name));
}

export function declarationLineCount(record, name) {
  const span = declarationSpansByName(record).get(normalizeString(name).trim());
  return Number.isInteger(span?.lineCount) && span.lineCount > 0 ? span.lineCount : null;
}

function escapeRegExp(value) {
  return normalizeString(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeIdentifier(value) {
  const raw = normalizeString(value).trim().replace(/^(?:type|typeof)\s+/, '');
  const match = raw.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  return match ? match[0] : '';
}

function identifierListParts(text) {
  return normalizeString(text)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseNamedExportSpecifier(part) {
  const cleaned = normalizeString(part)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/g, '')
    .trim()
    .replace(/^(?:type|typeof)\s+/, '');
  if (!cleaned) return null;
  const aliasMatch = cleaned.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/);
  if (aliasMatch) return { local: aliasMatch[1], exported: aliasMatch[2] };
  const local = normalizeIdentifier(cleaned);
  return local ? { local, exported: local } : null;
}

function findNextNonWhitespaceIndex(text, start) {
  let index = start;
  while (index < text.length && /\s/.test(text[index])) index += 1;
  return index;
}

function findMatchingBrace(text, startIndex) {
  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === '{') {
      depth += 1;
    } else if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function findMatchingDelimiter(text, startIndex, openChar, closeChar) {
  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === openChar) {
      depth += 1;
    } else if (text[index] === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitTopLevel(text, separator = ',') {
  const parts = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push({ text: text.slice(start, index), startIndex: start });
      start = index + 1;
    }
  }
  parts.push({ text: text.slice(start), startIndex: start });
  return parts;
}

function topLevelCharacterIndex(text, target) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === target && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return -1;
}

function wordAt(text, start, word) {
  if (text.slice(start, start + word.length) !== word) return false;
  const before = text[start - 1] || '';
  const after = text[start + word.length] || '';
  return !/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after);
}

function namedExportListFromClauseStart(text, closeBraceIndex) {
  const fromIndex = findNextNonWhitespaceIndex(text, closeBraceIndex + 1);
  if (!wordAt(text, fromIndex, 'from')) return -1;
  const specifierIndex = findNextNonWhitespaceIndex(text, fromIndex + 'from'.length);
  return text[specifierIndex] === '"' || text[specifierIndex] === "'" ? fromIndex : -1;
}

function namedExportListEntries(masked) {
  const entries = [];
  const exportListPattern = /\bexport\s*\{/g;
  let match;
  while ((match = exportListPattern.exec(masked))) {
    const openBraceIndex = masked.indexOf('{', match.index);
    const closeBraceIndex = findMatchingBrace(masked, openBraceIndex);
    if (closeBraceIndex === -1) {
      exportListPattern.lastIndex = match.index + match[0].length;
      continue;
    }
    const fromIndex = namedExportListFromClauseStart(masked, closeBraceIndex);
    if (fromIndex === -1) {
      const semicolonIndex = findNextNonWhitespaceIndex(masked, closeBraceIndex + 1);
      entries.push({
        specifiersText: masked.slice(openBraceIndex + 1, closeBraceIndex),
        startIndex: match.index,
        endIndex: masked[semicolonIndex] === ';' ? semicolonIndex + 1 : closeBraceIndex + 1,
      });
    }
    exportListPattern.lastIndex = closeBraceIndex + 1;
  }
  return entries;
}

function declarationTargetFromSpan(declarationName, span) {
  const name = normalizeIdentifier(declarationName);
  return name && span ? { declarationName: name, span } : null;
}

function defaultExportDeclarationTarget(record) {
  const source = normalizeString(record?.source);
  if (!source) return null;
  const masked = maskIgnorableSyntax(source);
  const directMatch = masked.match(/\bexport\s+default\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
  if (directMatch) {
    const nameStartIndex = directMatch.index + directMatch[0].lastIndexOf(directMatch[1]);
    const span = declarationSpanAtNameStart(record, directMatch[1], nameStartIndex);
    const target = declarationTargetFromSpan(directMatch[1], span);
    if (target) return target;
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (specifier?.exported !== 'default') continue;
      const span = visibleDeclarationSpanForName(record, specifier.local, {
        index: entry.startIndex,
        endIndex: entry.endIndex,
      }) || declarationSpansNamed(record, specifier.local)[0];
      const target = declarationTargetFromSpan(specifier.local, span);
      if (target) return target;
    }
  }
  const identifierMatch = masked.match(/\bexport\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/);
  if (identifierMatch) {
    const span = visibleDeclarationSpanForName(record, identifierMatch[1], {
      index: identifierMatch.index,
      endIndex: identifierMatch.index + identifierMatch[0].length,
    }) || declarationSpansNamed(record, identifierMatch[1])[0];
    const target = declarationTargetFromSpan(identifierMatch[1], span);
    if (target) return target;
  }
  return null;
}

export function defaultExportDeclarationName(record) {
  const target = defaultExportDeclarationTarget(record);
  if (target) return target.declarationName;
  return '';
}

function addPublicApiSignal(info, { kind, exportedName, startIndex, endIndex }) {
  const signalKind = normalizeString(kind).trim();
  const name = normalizeString(exportedName).trim();
  if (signalKind && !info.exportKinds.includes(signalKind)) info.exportKinds.push(signalKind);
  if (name && !info.exportedNames.includes(name)) info.exportedNames.push(name);
  if (Number.isInteger(startIndex) && Number.isInteger(endIndex) && endIndex > startIndex) {
    info.ranges.push({ startIndex, endIndex });
  }
}

function declarationPublicApiInfo(record, declarationName) {
  const name = normalizeIdentifier(declarationName);
  const source = normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const info = {
    exported: false,
    exportedNames: [],
    exportKinds: [],
    ranges: [],
  };
  if (!name || !source) return info;

  const escaped = escapeRegExp(name);
  const directFunctionExportPattern = new RegExp(`\\bexport\\s+(default\\s+)?(?:async\\s+)?function\\s*\\*?\\s+${escaped}\\s*\\(`, 'g');
  const directArrowExportPattern = new RegExp(`\\bexport\\s+(?:const|let|var)\\s+${escaped}\\s*=`, 'g');
  const defaultIdentifierExportPattern = new RegExp(`\\bexport\\s+default\\s+${escaped}\\b`, 'g');

  let match;
  while ((match = directFunctionExportPattern.exec(masked))) {
    info.exported = true;
    const kind = match[1] ? 'default-export' : 'named-export';
    addPublicApiSignal(info, {
      kind,
      exportedName: match[1] ? 'default' : name,
      startIndex: match.index,
      endIndex: directFunctionExportPattern.lastIndex,
    });
  }
  while ((match = directArrowExportPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'named-export',
      exportedName: name,
      startIndex: match.index,
      endIndex: directArrowExportPattern.lastIndex,
    });
  }
  while ((match = defaultIdentifierExportPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'default-export',
      exportedName: 'default',
      startIndex: match.index,
      endIndex: defaultIdentifierExportPattern.lastIndex,
    });
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (!specifier || specifier.local !== name) continue;
      info.exported = true;
      addPublicApiSignal(info, {
        kind: specifier.exported === 'default' ? 'default-export' : 'named-export',
        exportedName: specifier.exported,
        startIndex: entry.startIndex,
        endIndex: entry.endIndex,
      });
    }
  }
  info.exportKinds.sort(compareLocale);
  info.exportedNames.sort(compareLocale);
  return info;
}

function isDeclarationNameLocation(span, location) {
  return Number.isInteger(span?.nameStartIndex)
    && Number.isInteger(span?.nameEndIndex)
    && location?.index === span.nameStartIndex
    && location?.endIndex === span.nameEndIndex;
}

function locationInRanges(location, ranges) {
  return ranges.some((range) => (
    Number.isInteger(range?.startIndex)
    && Number.isInteger(range?.endIndex)
    && location.index >= range.startIndex
    && location.endIndex <= range.endIndex
  ));
}

function declarationSpanExclusiveEnd(span) {
  return Number.isInteger(span?.endIndex) ? span.endIndex + 1 : null;
}

function locationInsideDeclarationSpan(span, location) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex)
    && Number.isInteger(spanEnd)
    && Number.isInteger(span?.nameEndIndex)
    && location?.index > span.nameEndIndex
    && location.index >= span.startIndex
    && location.endIndex <= spanEnd;
}

function locationWithinDeclarationBounds(span, location) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex)
    && Number.isInteger(spanEnd)
    && Number.isInteger(location?.index)
    && Number.isInteger(location?.endIndex)
    && location.index >= span.startIndex
    && location.endIndex <= spanEnd;
}

function declarationSpanLength(span) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex) && Number.isInteger(spanEnd)
    ? spanEnd - span.startIndex
    : Number.MAX_SAFE_INTEGER;
}

function innermostDeclarationSpanForLocation(record, location) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((span) => locationInsideDeclarationSpan(span, location))
    .sort((a, b) => declarationSpanLength(a) - declarationSpanLength(b)
      || b.startIndex - a.startIndex
      || compareLocale(a.name, b.name))[0] || null;
}

function parentDeclarationSpanForSpan(record, childSpan) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((span) => span !== childSpan && locationWithinDeclarationBounds(span, {
      index: childSpan.startIndex,
      endIndex: declarationSpanExclusiveEnd(childSpan),
    }))
    .sort((a, b) => declarationSpanLength(a) - declarationSpanLength(b)
      || b.startIndex - a.startIndex
      || compareLocale(a.name, b.name))[0] || null;
}

function locationOwnedByDeclaration(record, span, location) {
  return innermostDeclarationSpanForLocation(record, location) === span;
}

function isAnyDeclarationNameLocation(record, location) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .some((span) => isDeclarationNameLocation(span, location));
}

function declarationIdentifierMetrics(record, span, publicApiInfo) {
  const locations = cachedIdentifierReferenceLocations(record, span?.name);
  const declarationLocations = locations.filter((location) => isDeclarationNameLocation(span, location));
  const nonDeclarationLocations = locations.filter((location) => !isDeclarationNameLocation(span, location));
  const publicApiLocations = nonDeclarationLocations
    .filter((location) => locationInRanges(location, publicApiInfo.ranges));
  const publicApiIndexes = new Set(publicApiLocations.map((location) => `${location.index}:${location.endIndex}`));
  const ownDeclarationLocations = nonDeclarationLocations
    .filter((location) => locationInsideDeclarationSpan(span, location));
  const ownDeclarationIndexes = new Set(ownDeclarationLocations.map((location) => `${location.index}:${location.endIndex}`));
  const sameFileLocations = nonDeclarationLocations
    .filter((location) => {
      const key = `${location.index}:${location.endIndex}`;
      return !publicApiIndexes.has(key) && !ownDeclarationIndexes.has(key);
    });

  return {
    identifierOccurrenceCount: locations.length,
    declarationNameOccurrenceCount: declarationLocations.length,
    ownDeclarationReferenceCount: ownDeclarationLocations.length,
    declarationOnlyNameOccurrence: locations.length === declarationLocations.length + ownDeclarationLocations.length,
    sameFileReferenceCount: sameFileLocations.length,
    publicApiReferenceCount: publicApiLocations.length,
  };
}

function topLevelWordIndex(text, word) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index <= text.length - word.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) continue;
    if (text.slice(index, index + word.length) !== word) continue;
    const before = text[index - 1] || '';
    const after = text[index + word.length] || '';
    if (!/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after)) return index;
  }
  return -1;
}

function topLevelBindingPatternText(text) {
  const cutIndexes = [
    topLevelCharacterIndex(text, '='),
    topLevelWordIndex(text, 'of'),
    topLevelWordIndex(text, 'in'),
  ].filter((index) => index >= 0);
  const endIndex = cutIndexes.length > 0 ? Math.min(...cutIndexes) : text.length;
  return text.slice(0, endIndex).replace(/^\s*\.\.\./, '');
}

function bindingIdentifierLocations(pattern, absoluteStart, identifier) {
  const bindingPattern = topLevelBindingPatternText(normalizeString(pattern));
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  const escaped = escapeRegExp(name);
  const namePattern = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
  const locations = [];
  let match;
  while ((match = namePattern.exec(bindingPattern))) {
    const nextIndex = findNextNonWhitespaceIndex(bindingPattern, match.index + match[0].length);
    if (bindingPattern[nextIndex] === ':') continue;
    locations.push({
      name,
      index: absoluteStart + match.index,
      endIndex: absoluteStart + match.index + match[0].length,
    });
  }
  return locations;
}

function findTopLevelArrowIndex(text, start, end) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < end - 1; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    if (
      char === '='
      && text[index + 1] === '>'
      && parenDepth === 0
      && bracketDepth === 0
      && braceDepth === 0
    ) {
      return index;
    }
  }
  return -1;
}

function declarationParameterRange(record, span) {
  const masked = maskIgnorableSyntax(record?.source);
  if (span?.kind === 'function') {
    const parametersStart = masked.indexOf('(', span.nameEndIndex);
    if (parametersStart === -1) return null;
    const parametersEnd = findMatchingDelimiter(masked, parametersStart, '(', ')');
    return parametersEnd === -1 ? null : {
      startIndex: parametersStart + 1,
      endIndex: parametersEnd,
    };
  }
  if (span?.kind !== 'arrow') return null;
  const spanEnd = declarationSpanExclusiveEnd(span);
  const equalsIndex = masked.indexOf('=', span.nameEndIndex);
  if (equalsIndex === -1 || equalsIndex >= spanEnd) return null;
  const arrowIndex = findTopLevelArrowIndex(masked, equalsIndex + 1, spanEnd);
  if (arrowIndex === -1) return null;
  let parametersStart = findNextNonWhitespaceIndex(masked, equalsIndex + 1);
  if (wordAt(masked, parametersStart, 'async')) {
    parametersStart = findNextNonWhitespaceIndex(masked, parametersStart + 'async'.length);
  }
  if (masked[parametersStart] === '(') {
    const parametersEnd = findMatchingDelimiter(masked, parametersStart, '(', ')');
    if (parametersEnd !== -1 && parametersEnd <= arrowIndex) {
      return {
        startIndex: parametersStart + 1,
        endIndex: parametersEnd,
      };
    }
  }
  return {
    startIndex: parametersStart,
    endIndex: arrowIndex,
  };
}

function parameterBindingLocations(record, span, identifier) {
  const range = declarationParameterRange(record, span);
  if (!range) return [];
  const masked = maskIgnorableSyntax(record?.source);
  const parameters = masked.slice(range.startIndex, range.endIndex);
  const locations = [];
  for (const part of splitTopLevel(parameters)) {
    locations.push(...bindingIdentifierLocations(
      part.text,
      range.startIndex + part.startIndex,
      identifier,
    ).map((location) => ({ ...location, kind: 'parameter' })));
  }
  return locations;
}

function findStatementEnd(masked, start, limit) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < limit; index += 1) {
    const char = masked[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index + 1;
  }
  return limit;
}

function wordBeforeIndex(masked, index) {
  const endIndex = previousNonWhitespaceIndex(masked, index);
  if (endIndex === -1 || !/[A-Za-z_$]/.test(masked[endIndex])) return '';
  let startIndex = endIndex;
  while (startIndex > 0 && /[A-Za-z0-9_$]/.test(masked[startIndex - 1])) startIndex -= 1;
  return masked.slice(startIndex, endIndex + 1);
}

function shouldTreatBraceAsLexicalBlock(masked, openIndex) {
  const previousIndex = previousNonWhitespaceIndex(masked, openIndex);
  if (previousIndex === -1) return true;
  if (')>;{'.includes(masked[previousIndex])) return true;
  return ['do', 'else', 'finally', 'try'].includes(wordBeforeIndex(masked, openIndex));
}

function lexicalBlockRanges(record) {
  if (!record || typeof record !== 'object') return [];
  if (lexicalBlockRangeCache.has(record)) return lexicalBlockRangeCache.get(record);
  const masked = maskIgnorableSyntax(record?.source);
  const ranges = [];
  const seen = new Set();
  const add = (startIndex, endIndex) => {
    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || endIndex <= startIndex) return;
    const key = `${startIndex}:${endIndex}`;
    if (seen.has(key)) return;
    seen.add(key);
    ranges.push({ startIndex, endIndex });
  };

  for (let index = 0; index < masked.length; index += 1) {
    if (masked[index] !== '{' || !shouldTreatBraceAsLexicalBlock(masked, index)) continue;
    const closeIndex = findMatchingBrace(masked, index);
    if (closeIndex !== -1) add(index, closeIndex + 1);
  }

  ranges.sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex)
    || b.startIndex - a.startIndex);
  lexicalBlockRangeCache.set(record, ranges);
  return ranges;
}

function canEndStatementAtIndex(text, index) {
  const char = text[index];
  if (/[A-Za-z0-9_$]/.test(char) || ')]}"\'`'.includes(char)) return true;
  return (char === '+' || char === '-') && text[index - 1] === char;
}

function statementContinuationStarts(text, index) {
  const char = text[index];
  if (!char) return false;
  return '`([{.,?:+-*/%&|^<>=!~'.includes(char);
}

function hasLineTerminatorBetween(text, start, end) {
  for (let index = start; index < end; index += 1) {
    if (text[index] === '\n' || text[index] === '\r') return true;
  }
  return false;
}

function identifierEndIndex(text, start) {
  if (!/[A-Za-z_$]/.test(text[start] || '')) return start;
  let index = start + 1;
  while (index < text.length && /[A-Za-z0-9_$]/.test(text[index])) index += 1;
  return index;
}

function templateLiteralEndIndex(text, start, limit) {
  let index = start + 1;
  let expressionDepth = 0;
  while (index < limit) {
    const char = text[index];
    if (char === '`' && expressionDepth === 0) return index + 1;
    if (char === '$' && text[index + 1] === '{' && expressionDepth === 0) {
      expressionDepth = 1;
      index += 2;
      continue;
    }
    if (expressionDepth > 0) {
      if (char === '`') {
        index = templateLiteralEndIndex(text, index, limit);
        continue;
      }
      if (char === '{') expressionDepth += 1;
      else if (char === '}') expressionDepth -= 1;
    }
    index += 1;
  }
  return limit;
}

function expressionStatementEndIndex(masked, start, limit) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let lastNonWhitespace = start;
  for (let index = start; index < limit; index += 1) {
    const char = masked[index];
    if (!/\s/.test(char)) lastNonWhitespace = index;
    if (char === '`') {
      index = templateLiteralEndIndex(masked, index, limit) - 1;
      lastNonWhitespace = Math.max(lastNonWhitespace, index);
    } else if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') {
      if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) return Math.max(start, lastNonWhitespace);
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index + 1;
    } else if (
      (char === '\n' || char === '\r')
      && parenDepth === 0
      && bracketDepth === 0
      && braceDepth === 0
      && lastNonWhitespace >= start
      && canEndStatementAtIndex(masked, lastNonWhitespace)
    ) {
      const nextIndex = findNextNonWhitespaceIndex(masked, index + 1);
      if (!statementContinuationStarts(masked, nextIndex)) return lastNonWhitespace + 1;
    }
  }
  return Math.min(limit, lastNonWhitespace + 1);
}

function conditionEndAfterKeyword(masked, keywordEnd, limit) {
  const conditionStart = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (conditionStart >= limit || masked[conditionStart] !== '(') return -1;
  return findMatchingDelimiter(masked, conditionStart, '(', ')');
}

function bracedBlockEndIndex(masked, blockStart, limit) {
  const start = findNextNonWhitespaceIndex(masked, blockStart);
  if (start >= limit || masked[start] !== '{') return -1;
  const end = findMatchingBrace(masked, start);
  return end === -1 ? -1 : end + 1;
}

function controlStatementWithConditionEnd(masked, keywordEnd, limit) {
  const conditionEnd = conditionEndAfterKeyword(masked, keywordEnd, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, keywordEnd, limit);
  return singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, conditionEnd + 1), limit);
}

function ifStatementEndIndex(masked, start, limit) {
  const conditionEnd = conditionEndAfterKeyword(masked, start + 'if'.length, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, start, limit);
  let end = singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, conditionEnd + 1), limit);
  const elseIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, elseIndex, 'else')) {
    end = singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, elseIndex + 'else'.length), limit);
  }
  return end;
}

function tryStatementEndIndex(masked, start, limit) {
  let end = bracedBlockEndIndex(masked, start + 'try'.length, limit);
  if (end === -1) return expressionStatementEndIndex(masked, start, limit);
  let nextIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, nextIndex, 'catch')) {
    const conditionEnd = conditionEndAfterKeyword(masked, nextIndex + 'catch'.length, limit);
    const catchBlockStart = conditionEnd === -1
      ? findNextNonWhitespaceIndex(masked, nextIndex + 'catch'.length)
      : findNextNonWhitespaceIndex(masked, conditionEnd + 1);
    const catchEnd = bracedBlockEndIndex(masked, catchBlockStart, limit);
    if (catchEnd !== -1) end = catchEnd;
  }
  nextIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, nextIndex, 'finally')) {
    const finallyEnd = bracedBlockEndIndex(masked, nextIndex + 'finally'.length, limit);
    if (finallyEnd !== -1) end = finallyEnd;
  }
  return end;
}

function doStatementEndIndex(masked, start, limit) {
  const bodyStart = findNextNonWhitespaceIndex(masked, start + 'do'.length);
  const bodyEnd = singleStatementEndIndex(masked, bodyStart, limit);
  const whileIndex = findNextNonWhitespaceIndex(masked, bodyEnd);
  if (!wordAt(masked, whileIndex, 'while')) return bodyEnd;
  const conditionEnd = conditionEndAfterKeyword(masked, whileIndex + 'while'.length, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, whileIndex, limit);
  const semicolonIndex = findNextNonWhitespaceIndex(masked, conditionEnd + 1);
  return masked[semicolonIndex] === ';' ? semicolonIndex + 1 : conditionEnd + 1;
}

function restrictedExpressionStatementEndIndex(masked, start, keyword, limit) {
  const keywordEnd = start + keyword.length;
  const nextIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (hasLineTerminatorBetween(masked, keywordEnd, nextIndex)) return keywordEnd;
  const semicolonIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (masked[semicolonIndex] === ';') return semicolonIndex + 1;
  return expressionStatementEndIndex(masked, start, limit);
}

function restrictedJumpStatementEndIndex(masked, start, keyword, limit) {
  const keywordEnd = start + keyword.length;
  const nextIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (hasLineTerminatorBetween(masked, keywordEnd, nextIndex)) return keywordEnd;
  if (masked[nextIndex] === ';') return nextIndex + 1;
  const labelEnd = identifierEndIndex(masked, nextIndex);
  if (labelEnd > nextIndex) {
    const afterLabel = findNextNonWhitespaceIndex(masked, labelEnd);
    return masked[afterLabel] === ';' ? afterLabel + 1 : labelEnd;
  }
  return keywordEnd;
}

function loopHeaderBoundsAt(masked, forIndex, limit) {
  if (!wordAt(masked, forIndex, 'for')) return null;
  let headerStart = findNextNonWhitespaceIndex(masked, forIndex + 'for'.length);
  if (wordAt(masked, headerStart, 'await')) {
    headerStart = findNextNonWhitespaceIndex(masked, headerStart + 'await'.length);
  }
  if (headerStart >= limit || masked[headerStart] !== '(') return null;
  const headerEnd = findMatchingDelimiter(masked, headerStart, '(', ')');
  if (headerEnd === -1) return null;
  return {
    headerStartIndex: headerStart,
    headerEndIndex: headerEnd + 1,
    bodyStartIndex: findNextNonWhitespaceIndex(masked, headerEnd + 1),
  };
}

function loopBodyEndIndex(masked, bodyStart, limit) {
  if (bodyStart >= limit) return limit;
  if (masked[bodyStart] === '{') {
    const closeIndex = findMatchingBrace(masked, bodyStart);
    return closeIndex === -1 ? limit : closeIndex + 1;
  }
  if (masked[bodyStart] === ';') return bodyStart + 1;
  return singleStatementEndIndex(masked, bodyStart, limit);
}

function loopEndIndexAt(masked, forIndex, limit) {
  const bounds = loopHeaderBoundsAt(masked, forIndex, limit);
  if (!bounds) return expressionStatementEndIndex(masked, forIndex, limit);
  return loopBodyEndIndex(masked, bounds.bodyStartIndex, limit);
}

function singleStatementEndIndex(masked, start, limit) {
  const statementStart = findNextNonWhitespaceIndex(masked, start);
  if (statementStart >= limit) return limit;
  if (masked[statementStart] === '{') {
    const closeIndex = findMatchingBrace(masked, statementStart);
    return closeIndex === -1 ? limit : closeIndex + 1;
  }
  if (masked[statementStart] === ';') return statementStart + 1;
  if (wordAt(masked, statementStart, 'if')) return ifStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'for')) return loopEndIndexAt(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'while')) {
    return controlStatementWithConditionEnd(masked, statementStart + 'while'.length, limit);
  }
  if (wordAt(masked, statementStart, 'with')) {
    return controlStatementWithConditionEnd(masked, statementStart + 'with'.length, limit);
  }
  if (wordAt(masked, statementStart, 'switch')) {
    const conditionEnd = conditionEndAfterKeyword(masked, statementStart + 'switch'.length, limit);
    const blockEnd = conditionEnd === -1
      ? -1
      : bracedBlockEndIndex(masked, conditionEnd + 1, limit);
    return blockEnd === -1 ? expressionStatementEndIndex(masked, statementStart, limit) : blockEnd;
  }
  if (wordAt(masked, statementStart, 'try')) return tryStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'do')) return doStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'return')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'return', limit);
  }
  if (wordAt(masked, statementStart, 'throw')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'throw', limit);
  }
  if (wordAt(masked, statementStart, 'yield')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'yield', limit);
  }
  if (wordAt(masked, statementStart, 'break')) {
    return restrictedJumpStatementEndIndex(masked, statementStart, 'break', limit);
  }
  if (wordAt(masked, statementStart, 'continue')) {
    return restrictedJumpStatementEndIndex(masked, statementStart, 'continue', limit);
  }
  return expressionStatementEndIndex(masked, statementStart, limit);
}

function loopScopeRanges(record) {
  if (!record || typeof record !== 'object') return [];
  if (loopScopeRangeCache.has(record)) return loopScopeRangeCache.get(record);
  const masked = maskIgnorableSyntax(record?.source);
  const ranges = [];
  const forPattern = /\bfor\b/g;
  let match;
  while ((match = forPattern.exec(masked))) {
    const bounds = loopHeaderBoundsAt(masked, match.index, masked.length);
    if (!bounds) continue;
    const endIndex = loopBodyEndIndex(masked, bounds.bodyStartIndex, masked.length);
    ranges.push({
      startIndex: match.index,
      headerStartIndex: bounds.headerStartIndex,
      headerEndIndex: bounds.headerEndIndex,
      endIndex,
    });
  }
  ranges.sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex)
    || b.startIndex - a.startIndex);
  loopScopeRangeCache.set(record, ranges);
  return ranges;
}

function nearestLexicalBlockForLocation(record, location, ownerSpan) {
  const ownerEnd = declarationSpanExclusiveEnd(ownerSpan);
  return lexicalBlockRanges(record).find((range) => (
    location.index >= range.startIndex
    && location.endIndex <= range.endIndex
    && (!ownerSpan || (
      range.startIndex >= ownerSpan.startIndex
      && range.endIndex <= ownerEnd
    ))
  )) || null;
}

function loopHeaderRangeForLocation(record, location, ownerSpan) {
  const ownerEnd = declarationSpanExclusiveEnd(ownerSpan);
  return loopScopeRanges(record).find((range) => (
    location.index > range.headerStartIndex
    && location.endIndex <= range.headerEndIndex
    && (!ownerSpan || (
      range.startIndex >= ownerSpan.startIndex
      && range.endIndex <= ownerEnd
    ))
  )) || null;
}

function loopHeaderScopeForLocation(record, location, ownerSpan) {
  return loopHeaderRangeForLocation(record, location, ownerSpan);
}

function spanScope(span) {
  return {
    scopeStart: span?.startIndex,
    scopeEnd: declarationSpanExclusiveEnd(span),
  };
}

function blockScopedBindingScope(record, ownerSpan, location) {
  const loopScope = loopHeaderScopeForLocation(record, location, ownerSpan);
  if (loopScope) {
    return {
      scopeStart: loopScope.startIndex,
      scopeEnd: loopScope.endIndex,
    };
  }
  const block = nearestLexicalBlockForLocation(record, location, ownerSpan);
  return block ? {
    scopeStart: block.startIndex,
    scopeEnd: block.endIndex,
  } : spanScope(ownerSpan);
}

function functionScopedBindingScope(ownerSpan) {
  return spanScope(ownerSpan);
}

function loopHeaderDeclarationEnd(masked, declarationStart, headerEndIndex) {
  const limit = Math.max(declarationStart, headerEndIndex - 1);
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = declarationStart; index < limit; index += 1) {
    const char = masked[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return limit;
}

function variableStatementEndIndex(masked, declarationStart, limit) {
  return expressionStatementEndIndex(masked, declarationStart, limit);
}

function variableBindingLocations(record, span, identifier) {
  const masked = maskIgnorableSyntax(record?.source);
  const spanEnd = declarationSpanExclusiveEnd(span);
  const declarationPattern = /\b(const|let|var)\s+/g;
  const locations = [];
  let match;
  while ((match = declarationPattern.exec(masked))) {
    const keywordLocation = { index: match.index, endIndex: declarationPattern.lastIndex };
    if (!locationOwnedByDeclaration(record, span, keywordLocation)) continue;
    const declarationStart = declarationPattern.lastIndex;
    const loopHeader = loopHeaderRangeForLocation(record, keywordLocation, span);
    const statementEnd = loopHeader
      ? loopHeaderDeclarationEnd(masked, declarationStart, loopHeader.headerEndIndex)
      : variableStatementEndIndex(masked, match.index, spanEnd);
    const declarationText = masked.slice(declarationStart, statementEnd);
    for (const part of splitTopLevel(declarationText)) {
      const declaratorStart = declarationStart + part.startIndex;
      const declaratorEnd = declaratorStart + part.text.length;
      locations.push(...bindingIdentifierLocations(
        part.text,
        declaratorStart,
        identifier,
      ).filter((location) => locationOwnedByDeclaration(record, span, location))
        .map((location) => ({
          ...location,
          kind: 'variable',
          declarationKind: match[1],
          ...(match[1] === 'var'
            ? functionScopedBindingScope(span)
            : blockScopedBindingScope(record, span, location)),
          statementStart: match.index,
          statementEnd,
          declaratorStart,
          declaratorEnd,
        })));
    }
  }
  return locations;
}

function functionBindingLocations(record, span, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((candidate) => candidate !== span
      && candidate.kind === 'function'
      && candidate.name === name
      && candidate.declarationType === 'function-declaration'
      && parentDeclarationSpanForSpan(record, candidate) === span)
    .map((candidate) => ({
      name,
      index: candidate.nameStartIndex,
      endIndex: candidate.nameEndIndex,
      kind: 'function',
      ...blockScopedBindingScope(record, span, {
        index: candidate.nameStartIndex,
        endIndex: candidate.nameEndIndex,
      }),
    }));
}

function classBindingLocations(record, span, identifier) {
  const masked = maskIgnorableSyntax(record?.source);
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  const classPattern = /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;
  const locations = [];
  let match;
  while ((match = classPattern.exec(masked))) {
    if (match[1] !== name) continue;
    const index = match.index + match[0].lastIndexOf(match[1]);
    const location = { name, index, endIndex: index + match[1].length };
    if (locationOwnedByDeclaration(record, span, location)) {
      locations.push({
        ...location,
        kind: 'class',
        ...blockScopedBindingScope(record, span, location),
      });
    }
  }
  return locations;
}

function localBindingLocations(record, span, identifier) {
  return [
    ...parameterBindingLocations(record, span, identifier)
      .map((location) => ({ ...location, ...functionScopedBindingScope(span) })),
    ...variableBindingLocations(record, span, identifier),
    ...functionBindingLocations(record, span, identifier),
    ...classBindingLocations(record, span, identifier),
  ].sort((a, b) => a.index - b.index || a.endIndex - b.endIndex);
}

function declarationScopeChain(record, span) {
  const chain = [];
  let current = span;
  while (current) {
    chain.push(current);
    current = parentDeclarationSpanForSpan(record, current);
  }
  return chain;
}

function visibleLocalBindingLocations(record, span, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  if (record && typeof record === 'object') {
    if (!visibleLocalBindingLocationCache.has(record)) {
      visibleLocalBindingLocationCache.set(record, new Map());
    }
    const recordCache = visibleLocalBindingLocationCache.get(record);
    const key = [
      span?.startIndex,
      declarationSpanExclusiveEnd(span),
      name,
    ].join('\u0000');
    if (recordCache.has(key)) return recordCache.get(key);
    const bindings = visibleLocalBindingLocationsUncached(record, span, name);
    recordCache.set(key, bindings);
    return bindings;
  }
  return visibleLocalBindingLocationsUncached(record, span, name);
}

function visibleLocalBindingLocationsUncached(record, span, identifier) {
  const bindings = [];
  const seen = new Set();
  for (const scopeSpan of declarationScopeChain(record, span)) {
    for (const binding of localBindingLocations(record, scopeSpan, identifier)) {
      const key = `${binding.kind}:${binding.index}:${binding.endIndex}:${binding.scopeStart}:${binding.scopeEnd}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bindings.push(binding);
    }
  }
  return bindings.sort((a, b) => (a.scopeEnd - a.scopeStart) - (b.scopeEnd - b.scopeStart)
    || b.scopeStart - a.scopeStart
    || a.index - b.index);
}

function moduleBindingScope(record) {
  return {
    scopeStart: 0,
    scopeEnd: normalizeString(record?.source).length,
  };
}

function normalizedBindingScope(record, scope) {
  return Number.isInteger(scope?.scopeStart)
    && Number.isInteger(scope?.scopeEnd)
    && scope.scopeEnd >= scope.scopeStart
    ? scope
    : moduleBindingScope(record);
}

function functionExpressionNameScope(span) {
  return {
    scopeStart: span?.nameStartIndex,
    scopeEnd: declarationSpanExclusiveEnd(span),
  };
}

function declarationBindingScope(record, span) {
  const declarationType = normalizeString(span?.declarationType).trim();
  if (declarationType === 'function-expression-name') {
    return normalizedBindingScope(record, functionExpressionNameScope(span));
  }
  const ownerSpan = parentDeclarationSpanForSpan(record, span);
  return normalizedBindingScope(record, blockScopedBindingScope(record, ownerSpan, {
    index: span?.nameStartIndex,
    endIndex: span?.nameEndIndex,
  }));
}

function locationInBindingScope(scope, location) {
  return Number.isInteger(scope?.scopeStart)
    && Number.isInteger(scope?.scopeEnd)
    && Number.isInteger(location?.index)
    && Number.isInteger(location?.endIndex)
    && location.index >= scope.scopeStart
    && location.endIndex <= scope.scopeEnd;
}

function visibleDeclarationSpanForName(record, name, location) {
  const candidates = declarationSpansNamed(record, name)
    .map((span) => ({ span, scope: declarationBindingScope(record, span) }))
    .filter(({ scope }) => locationInBindingScope(scope, location))
    .sort((a, b) => (a.scope.scopeEnd - a.scope.scopeStart) - (b.scope.scopeEnd - b.scope.scopeStart)
      || b.scope.scopeStart - a.scope.scopeStart
      || b.span.startIndex - a.span.startIndex
      || compareLocale(a.span.kind, b.span.kind));
  return candidates[0]?.span || null;
}

function sameLocation(a, b) {
  return a?.index === b?.index && a?.endIndex === b?.endIndex;
}

function cachedIdentifierReferenceLocations(record, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  if (!record || typeof record !== 'object') return identifierReferenceLocations(record?.source, name);
  if (!identifierReferenceLocationCache.has(record)) {
    identifierReferenceLocationCache.set(record, new Map());
  }
  const recordCache = identifierReferenceLocationCache.get(record);
  if (!recordCache.has(name)) {
    recordCache.set(name, identifierReferenceLocations(record.source, name));
  }
  return recordCache.get(name);
}

function locationInTypeOnlyRange(record, location) {
  const ranges = Array.isArray(record?.typeOnlyRanges) ? record.typeOnlyRanges : [];
  return ranges.some((range) => (
    Number.isInteger(range?.startIndex)
    && Number.isInteger(range?.endIndex)
    && Number.isInteger(location?.index)
    && Number.isInteger(location?.endIndex)
    && location.index >= range.startIndex
    && location.endIndex <= range.endIndex
  ));
}

function lineStartIndexesForSource(source) {
  const text = normalizeString(source);
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function sourceColumnAtIndex(source, index) {
  if (!Number.isInteger(index) || index < 0) return null;
  const text = normalizeString(source);
  const lineStart = text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  return index - lineStart + 1;
}

function lineNumberAtSourceIndex(source, index) {
  if (!Number.isInteger(index) || index < 0) return null;
  const starts = lineStartIndexesForSource(source);
  let low = 0;
  let high = starts.length - 1;
  let found = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (starts[mid] <= index) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found + 1;
}

function unescapeStringLiteralValue(value) {
  return normalizeString(value).replace(/\\(['"\\])/g, '$1');
}

function stringLiteralExpressionValue(expression) {
  const match = normalizeString(expression).trim().match(/^(['"])((?:\\.|(?!\1)[\s\S])*?)\1$/);
  return match ? unescapeStringLiteralValue(match[2]) : '';
}

function stringConstantValues(record) {
  if (!record || typeof record !== 'object') return new Map();
  if (stringConstantValueCache.has(record)) return stringConstantValueCache.get(record);
  const source = normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const constants = new Map();
  const pattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(['"])((?:\\.|(?!\2)[\s\S])*?)\2/g;
  let match;
  while ((match = pattern.exec(source))) {
    if (!/\S/.test(masked[match.index] || '')) continue;
    constants.set(match[1], unescapeStringLiteralValue(match[3]));
  }
  stringConstantValueCache.set(record, constants);
  return constants;
}

function specifierExpressionMatchesRef(record, expression, specifier) {
  const text = normalizeString(expression).trim();
  if (!text) return false;
  const literalValue = stringLiteralExpressionValue(text);
  if (literalValue) return literalValue === specifier;
  const identifierMatch = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  return Boolean(identifierMatch) && stringConstantValues(record).get(text) === specifier;
}

function declarationSpecifierMatchesRef(record, declaration, specifier) {
  const specifierExpression = `(['"](?:\\\\.|[^'"])*['"]|[A-Za-z_$][A-Za-z0-9_$]*)`;
  const callPattern = new RegExp(`\\b(?:import|window\\.import)\\s*\\(\\s*${specifierExpression}\\s*\\)`, 'g');
  let match;
  while ((match = callPattern.exec(declaration))) {
    if (specifierExpressionMatchesRef(record, match[1], specifier)) return true;
  }
  return false;
}

function localBindingDeclarationSource(record, localBinding) {
  const source = normalizeString(record?.source);
  const start = Number.isInteger(localBinding?.declaratorStart)
    ? localBinding.declaratorStart
    : localBinding?.statementStart;
  const end = Number.isInteger(localBinding?.declaratorEnd)
    ? localBinding.declaratorEnd
    : localBinding?.statementEnd;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) return '';
  return source.slice(start, end);
}

function localBindingIsImportDeclaration(record, localBinding, binding, ref) {
  if (
    localBinding?.kind !== 'variable'
    || normalizeIdentifier(binding?.local) !== normalizeIdentifier(localBinding.name)
  ) {
    return false;
  }
  const declaration = localBindingDeclarationSource(record, localBinding);
  const maskedDeclaration = maskIgnorableSyntax(declaration);
  const refKind = normalizeString(ref?.kind).trim();
  if (refKind === 'dynamic') {
    const loaderPattern = /\b(?:import|window\.import)\s*\(/;
    const specifier = normalizeString(ref?.specifier).trim();
    return Boolean(specifier)
      && loaderPattern.test(maskedDeclaration)
      && declarationSpecifierMatchesRef(record, declaration, specifier);
  }
  if (refKind === 'lazy' && binding?.inferred) {
    const imported = escapeRegExp(normalizeIdentifier(binding.imported));
    return imported ? new RegExp(`\\.\\s*${imported}\\b`).test(declaration) : false;
  }
  return false;
}

function isShadowedReferenceLocation(record, span, identifier, location, {
  binding,
  ref,
  ignoredBindingLocations = [],
} = {}) {
  for (const localBinding of visibleLocalBindingLocations(record, span, identifier)) {
    if (ignoredBindingLocations.some((ignored) => sameLocation(localBinding, ignored))) continue;
    if (sameLocation(localBinding, location)) return true;
    if (
      Number.isInteger(localBinding.scopeStart)
      && Number.isInteger(localBinding.scopeEnd)
      && location.index >= localBinding.scopeStart
      && location.endIndex <= localBinding.scopeEnd
    ) {
      return !localBindingIsImportDeclaration(record, localBinding, binding, ref);
    }
  }
  return false;
}

function declarationSnippet(record, span) {
  const lines = sourceLines(record?.source);
  if (
    !span
    || !Number.isInteger(span.startLine)
    || !Number.isInteger(span.endLine)
    || span.startLine < 1
    || span.endLine < span.startLine
    || span.endLine > lines.length
  ) {
    return '';
  }
  return lines.slice(span.startLine - 1, span.endLine).join('\n');
}

function sourceDeclarationEntry({
  moduleId,
  visibleName,
  record,
  span,
  declarationName = visibleName,
  sourceOrigin,
  metrics = emptyDeclarationImportMetrics(),
  relationships = emptyDeclarationRelationships(),
  functionNode = null,
}) {
  const code = declarationSnippet(record, span);
  if (!moduleId || !visibleName || !record?.rel || !code) return null;
  return {
    moduleId,
    modulePath: record.rel,
    name: visibleName,
    declarationName,
    kind: span.kind,
    startLine: span.startLine,
    endLine: span.endLine,
    code,
    sourceOrigin,
    referenceCount: metrics.referenceCount,
    sameFileReferenceCount: metrics.sameFileReferenceCount,
    incomingReferenceCount: metrics.incomingReferenceCount,
    directIdentifierReferenceCount: metrics.directIdentifierReferenceCount,
    importerFileCount: metrics.importerFileCount,
    importedFunctionUses: Array.isArray(relationships.importedFunctionUses)
      ? relationships.importedFunctionUses
      : [],
    importedBy: Array.isArray(relationships.importedBy) ? relationships.importedBy : [],
    ...(functionNode ? {
      functionId: functionNode.id,
      functionStableId: functionNode.stableId || null,
      functionScopePath: functionNode.scopePath || '',
      placement: functionNode.placement || null,
    } : {}),
  };
}

function emptyDeclarationRelationships() {
  return {
    importedFunctionUses: [],
    importedBy: [],
  };
}

export function emptyDeclarationImportMetrics() {
  return {
    referenceCount: 0,
    directIdentifierReferenceCount: 0,
    sameFileReferenceCount: 0,
    ownDeclarationReferenceCount: 0,
    sameFileNameOccurrenceCount: 0,
    incomingReferenceCount: 0,
    identifierOccurrenceCount: 0,
    declarationNameOccurrenceCount: 0,
    declarationOnlyNameOccurrence: false,
    publicApiReferenceCount: 0,
    importerFileCount: 0,
    incomingImports: [],
    publicApi: {
      exported: false,
      exportedNames: [],
      exportKinds: [],
    },
  };
}

function declarationImportMetricKey(modulePath, declarationName) {
  const rel = normalizeString(modulePath).trim();
  const name = normalizeString(declarationName).trim();
  return rel && name ? `${rel}\u0000${name}` : '';
}

function namedExportDeclarationTargetMap(record) {
  const source = normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const exports = new Map();
  const add = (exportedName, localName, span) => {
    const exported = normalizeIdentifier(exportedName);
    const local = normalizeIdentifier(localName);
    if (exported && local && span && !exports.has(exported)) {
      exports.set(exported, { declarationName: local, span });
    }
  };
  const addVisible = (exportedName, localName, location) => {
    const span = visibleDeclarationSpanForName(record, localName, location)
      || declarationSpansNamed(record, localName)[0];
    add(exportedName, localName, span);
  };

  const directFunctionExportPattern = /\bexport\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
  const directArrowExportPattern = /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  let match;
  while ((match = directFunctionExportPattern.exec(masked))) {
    const nameStartIndex = match.index + match[0].lastIndexOf(match[1]);
    add(match[1], match[1], declarationSpanAtNameStart(record, match[1], nameStartIndex));
  }
  while ((match = directArrowExportPattern.exec(masked))) {
    const nameStartIndex = match.index + match[0].lastIndexOf(match[1]);
    add(match[1], match[1], declarationSpanAtNameStart(record, match[1], nameStartIndex));
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (specifier) {
        addVisible(specifier.exported, specifier.local, {
          index: entry.startIndex,
          endIndex: entry.endIndex,
        });
      }
    }
  }
  return exports;
}

function namedExportDeclarationMap(record) {
  return new Map(Array.from(namedExportDeclarationTargetMap(record), ([exportedName, target]) => [
    exportedName,
    target.declarationName,
  ]));
}

function namedExportDeclarationTarget(record, exportedName) {
  const imported = normalizeIdentifier(exportedName);
  if (!imported) return null;
  const exportedDeclarations = namedExportDeclarationTargetMap(record);
  return exportedDeclarations.get(imported) || null;
}

function namedExportDeclarationName(record, exportedName) {
  const imported = normalizeIdentifier(exportedName);
  if (!imported) return '';
  const exportedDeclarations = namedExportDeclarationMap(record);
  if (exportedDeclarations.has(imported)) return exportedDeclarations.get(imported);
  return '';
}

function importBindingDeclarationName(targetRecord, binding) {
  const kind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (kind === 'named') {
    const imported = normalizeIdentifier(binding?.imported);
    return namedExportDeclarationName(targetRecord, imported);
  }
  if (kind === 'default') return defaultExportDeclarationName(targetRecord);
  return '';
}

export function importBindingDeclarationTarget(targetRecord, binding) {
  const kind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (kind === 'named') {
    const imported = normalizeIdentifier(binding?.imported);
    return namedExportDeclarationTarget(targetRecord, imported);
  }
  if (kind === 'default') return defaultExportDeclarationTarget(targetRecord);
  return null;
}

function importBindingIsTypeOnly(binding = {}) {
  return Boolean(binding?.typeOnly);
}

export function importRefIsTypeOnly(ref = {}) {
  const bindings = Array.isArray(ref.bindings) ? ref.bindings : [];
  return Boolean(ref.typeOnly) || (bindings.length > 0 && bindings.every(importBindingIsTypeOnly));
}

export function declarationImportMetricsFor(metrics, record, declarationName) {
  const key = declarationImportMetricKey(record?.rel, declarationName);
  return key && metrics instanceof Map
    ? (metrics.get(key) || emptyDeclarationImportMetrics())
    : emptyDeclarationImportMetrics();
}

export function declarationRelationshipsFor(relationships, record, declarationName) {
  const key = declarationImportMetricKey(record?.rel, declarationName);
  return key && relationships instanceof Map
    ? (relationships.get(key) || emptyDeclarationRelationships())
    : emptyDeclarationRelationships();
}

function previousNonWhitespaceIndex(text, start) {
  for (let index = start - 1; index >= 0; index -= 1) {
    if (!/\s/.test(text[index])) return index;
  }
  return -1;
}

function isJsxOpeningIdentifierReference(source, location) {
  const text = normalizeString(source);
  const previousIndex = previousNonWhitespaceIndex(text, location?.index);
  if (text[previousIndex] !== '<') return false;
  if (/\s/.test(text[location.endIndex] || '')) return true;
  const nextIndex = findNextNonWhitespaceIndex(text, location.endIndex);
  return ['/', '>'].includes(text[nextIndex]) || /\s/.test(text[nextIndex] || '');
}

function isDirectCallableIdentifierReference(source, location) {
  const text = normalizeString(source);
  const nextIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  return text[nextIndex] === '(' || isJsxOpeningIdentifierReference(text, location);
}

function isOptionalCallIdentifierReference(source, location) {
  const text = normalizeString(source);
  const questionIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  if (text[questionIndex] !== '?' || text[questionIndex + 1] !== '.') return false;
  return text[findNextNonWhitespaceIndex(text, questionIndex + 2)] === '(';
}

function isTaggedTemplateIdentifierReference(source, location) {
  const text = normalizeString(source);
  return text[findNextNonWhitespaceIndex(text, location?.endIndex)] === '`';
}

function isJsxOpeningMemberReference(source, location) {
  const text = normalizeString(source);
  let dotIndex = previousNonWhitespaceIndex(text, location?.index);
  if (text[dotIndex] !== '.') return false;

  while (dotIndex !== -1) {
    let index = previousNonWhitespaceIndex(text, dotIndex);
    if (!/[A-Za-z0-9_$]/.test(text[index] || '')) return false;
    while (index > 0 && /[A-Za-z0-9_$]/.test(text[index - 1])) index -= 1;
    const previousIndex = previousNonWhitespaceIndex(text, index);
    if (text[previousIndex] === '<') return true;
    if (text[previousIndex] !== '.') return false;
    dotIndex = previousIndex;
  }
  return false;
}

function usageSyntaxForLocation(source, location) {
  const text = normalizeString(source);
  if (isJsxOpeningIdentifierReference(text, location) || isJsxOpeningMemberReference(text, location)) {
    return 'jsx-element';
  }
  if (isOptionalCallIdentifierReference(text, location)) return 'optional-call';
  if (isTaggedTemplateIdentifierReference(text, location)) return 'tagged-template';
  const nextIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  return text[nextIndex] === '(' ? 'call' : 'reference';
}

function compactReferenceUsages(record, referenceLocations) {
  const seen = new Set();
  return (Array.isArray(referenceLocations) ? referenceLocations : [])
    .map((location) => ({
      line: Number.isInteger(location?.line)
        ? location.line
        : lineNumberAtSourceIndex(record?.source, location?.index),
      syntax: usageSyntaxForLocation(record?.source, location),
    }))
    .filter((usage) => Number.isInteger(usage.line) && usage.line > 0 && usage.syntax)
    .filter((usage) => {
      const key = `${usage.line}\u0000${usage.syntax}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
}

function usageLinesForUsages(usages) {
  return Array.from(new Set((Array.isArray(usages) ? usages : [])
    .map((usage) => usage.line)
    .filter((line) => Number.isInteger(line) && line > 0)))
    .sort((a, b) => a - b);
}

function syntaxKindsForUsages(usages) {
  return Array.from(new Set((Array.isArray(usages) ? usages : [])
    .map((usage) => normalizeString(usage.syntax).trim())
    .filter(Boolean)))
    .sort(compareLocale);
}

function relationKindForSyntaxKinds(syntaxKinds) {
  const kinds = Array.isArray(syntaxKinds) ? syntaxKinds : [];
  if (kinds.length !== 1) return 'mixed-static-usage';
  if (kinds[0] === 'jsx-element') return 'static-jsx-element';
  if (kinds[0] === 'reference') return 'static-reference';
  return 'static-call';
}

function namespaceReferenceMaskedSource(source) {
  return maskIgnorableSyntax(source)
    .replace(/<\/\s*[A-Za-z_$][A-Za-z0-9_$]*(?:\s*\.\s*[A-Za-z_$][A-Za-z0-9_$]*)*/g, (closingTag) => (
      ' '.repeat(closingTag.length)
    ));
}

function isNamespaceBaseReference(masked, location) {
  const previousIndex = previousNonWhitespaceIndex(masked, location.index);
  if (previousIndex === -1) return true;
  return masked[previousIndex] !== '.' && masked[previousIndex] !== '#';
}

function namespaceMemberAfter(masked, endIndex) {
  let operatorIndex = findNextNonWhitespaceIndex(masked, endIndex);
  if (masked[operatorIndex] === '?') {
    if (masked[operatorIndex + 1] !== '.') return null;
    operatorIndex += 2;
  } else if (masked[operatorIndex] === '.') {
    operatorIndex += 1;
  } else {
    return null;
  }
  const memberStart = findNextNonWhitespaceIndex(masked, operatorIndex);
  const match = masked.slice(memberStart).match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
  if (!match) return null;
  return {
    name: match[1],
    index: memberStart,
    endIndex: memberStart + match[1].length,
  };
}

function declarationReferenceLocations(record, span, identifier, {
  directCallableOnly = false,
  binding,
  ref,
  ignoredBindingLocations = [],
} = {}) {
  const locations = cachedIdentifierReferenceLocations(record, identifier)
    .filter((location) => !isAnyDeclarationNameLocation(record, location))
    .filter((location) => !locationInTypeOnlyRange(record, location))
    .filter((location) => locationOwnedByDeclaration(record, span, location))
    .filter((location) => !isShadowedReferenceLocation(record, span, identifier, location, {
      binding,
      ref,
      ignoredBindingLocations,
    }));
  return directCallableOnly
    ? locations.filter((location) => isDirectCallableIdentifierReference(record?.source, location))
    : locations;
}

function namespaceMemberReferenceLocations(record, span, namespaceName, { binding, ref } = {}) {
  const namespace = normalizeIdentifier(namespaceName);
  if (!namespace) return new Map();
  const masked = namespaceReferenceMaskedSource(record?.source);
  const escaped = escapeRegExp(namespace);
  const pattern = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
  const locationsByMember = new Map();
  let match;
  while ((match = pattern.exec(masked))) {
    const namespaceLocation = {
      index: match.index,
      endIndex: match.index + namespace.length,
    };
    if (!isNamespaceBaseReference(masked, namespaceLocation)) continue;
    const member = namespaceMemberAfter(masked, namespaceLocation.endIndex);
    const memberName = normalizeIdentifier(member?.name);
    if (!memberName) continue;
    const memberLocation = {
      index: member.index,
      endIndex: member.endIndex,
    };
    if (span && !locationOwnedByDeclaration(record, span, namespaceLocation)) continue;
    if (span && isShadowedReferenceLocation(record, span, namespace, namespaceLocation, { binding, ref })) continue;
    if (!locationsByMember.has(memberName)) locationsByMember.set(memberName, []);
    locationsByMember.get(memberName).push(memberLocation);
  }
  return locationsByMember;
}

function importBindingRelationshipTarget(targetRecord, binding) {
  if (importBindingIsTypeOnly(binding)) return null;
  const bindingKind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') return null;

  const target = importBindingDeclarationTarget(targetRecord, binding);
  return target?.span ? {
    declarationName: target.declarationName,
    span: target.span,
    importedName: bindingKind === 'default' ? 'default' : binding.imported,
    directCallableOnly: false,
  } : null;
}

function reExportNamedBindings(record, importedName) {
  const name = normalizeIdentifier(importedName);
  if (!name) return [];
  return (Array.isArray(record?.importRefs) ? record.importRefs : [])
    .filter((ref) => ref.kind === 'export' && ref.localRel && !importRefIsTypeOnly(ref))
    .flatMap((ref) => (Array.isArray(ref.bindings) ? ref.bindings : [])
      .filter((binding) => !importBindingIsTypeOnly(binding))
      .filter((binding) => normalizeIdentifier(binding.local) === name || normalizeIdentifier(binding.imported) === name)
      .map((binding) => ({
        ref,
        importedName: normalizeIdentifier(binding.imported) || name,
      })));
}

function importBindingRelationshipTargets(graph, targetRecord, binding, seen = new Set()) {
  const direct = importBindingRelationshipTarget(targetRecord, binding);
  if (direct) return [{ targetRecord, target: direct }];

  const bindingKind = normalizeString(binding?.kind || 'named').trim() || 'named';
  const importedName = bindingKind === 'default' ? 'default' : normalizeIdentifier(binding?.imported);
  if (!graph || bindingKind !== 'named' || !targetRecord?.rel || !importedName) return [];
  const seenKey = `${targetRecord.rel}\u0000${importedName}`;
  if (seen.has(seenKey)) return [];
  seen.add(seenKey);

  const targets = [];
  for (const reExport of reExportNamedBindings(targetRecord, importedName)) {
    const reExportTarget = graph.modules.get(reExport.ref.localRel);
    if (!reExportTarget) continue;
    targets.push(...importBindingRelationshipTargets(
      graph,
      reExportTarget,
      {
        ...binding,
        imported: reExport.importedName,
        kind: 'named',
        typeOnly: false,
      },
      seen,
    ));
  }
  return targets;
}

function namespaceImportRelationshipTarget(targetRecord, binding, memberName) {
  if (importBindingIsTypeOnly(binding)) return null;
  const importedName = normalizeIdentifier(memberName);
  const target = namedExportDeclarationTarget(targetRecord, importedName);
  const namespaceName = normalizeIdentifier(binding?.local);
  return target?.span ? {
    declarationName: target.declarationName,
    span: target.span,
    importedName,
    localName: namespaceName ? `${namespaceName}.${importedName}` : importedName,
    directCallableOnly: false,
  } : null;
}

function bindingReferenceGroups({
  graph,
  importerRecord,
  importerSpan,
  targetRecord,
  binding,
  ref,
}) {
  if (importRefIsTypeOnly(ref) || importBindingIsTypeOnly(binding)) return [];
  const bindingKind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') {
    return Array.from(namespaceMemberReferenceLocations(
      importerRecord,
      importerSpan,
      binding.local,
      { binding, ref },
    ), ([memberName, referenceLocations]) => ({
      targetRecord,
      target: namespaceImportRelationshipTarget(targetRecord, binding, memberName),
      referenceLocations,
    })).filter((group) => group.target && group.referenceLocations.length > 0);
  }

  const targets = importBindingRelationshipTargets(graph, targetRecord, binding);
  if (targets.length === 0) return [];
  const referenceLocations = declarationReferenceLocations(
    importerRecord,
    importerSpan,
    binding.local,
    {
      directCallableOnly: targets.some((target) => Boolean(target.target?.directCallableOnly)),
      binding,
      ref,
    },
  );
  return referenceLocations.length > 0
    ? targets.map((target) => ({ ...target, referenceLocations }))
    : [];
}

function compactUseRelationship({
  importerRecord,
  targetRecord,
  target,
  binding,
  ref,
  referenceLocations,
}) {
  const localName = normalizeString(target.localName || binding?.local).trim();
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    name: localName || target.declarationName,
    declarationName: target.declarationName,
    importedName: normalizeString(target.importedName).trim(),
    localName,
    bindingKind: normalizeString(binding?.kind || 'named').trim() || 'named',
    loadKind: normalizeString(ref?.kind).trim() || 'import',
    specifier: normalizeString(ref?.specifier).trim(),
    modulePath: targetRecord.rel,
    startLine: target.span.startLine,
    endLine: target.span.endLine,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compactImportedByRelationship({
  importerRecord,
  importerName,
  importerSpan,
  target,
  binding,
  ref,
  referenceLocations,
}) {
  const localName = normalizeString(target?.localName || binding?.local).trim();
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    name: importerName,
    declarationName: importerName,
    localName,
    importedName: normalizeString(target?.importedName || binding?.imported).trim(),
    bindingKind: normalizeString(binding?.kind || 'named').trim() || 'named',
    loadKind: normalizeString(ref?.kind).trim() || 'import',
    specifier: normalizeString(ref?.specifier).trim(),
    modulePath: importerRecord.rel,
    startLine: importerSpan.startLine,
    endLine: importerSpan.endLine,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compareDeclarationRelationship(a, b) {
  return compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || compareLocale(a.name, b.name)
    || compareLocale(a.localName, b.localName)
    || compareLocale(a.importedName, b.importedName);
}

function addDeclarationRelationship(bucket, listName, seen, seenKey, relationship) {
  if (seen.has(seenKey)) return;
  seen.add(seenKey);
  bucket[listName].push(relationship);
}

export function buildDeclarationRelationships(graph) {
  const relationships = new Map();
  const seenUses = new Set();
  const seenImportedBy = new Set();
  const ensure = (record, declarationName) => {
    const key = declarationImportMetricKey(record?.rel, declarationName);
    if (!key) return null;
    if (!relationships.has(key)) relationships.set(key, emptyDeclarationRelationships());
    return relationships.get(key);
  };

  for (const importerRecord of graph.modules.values()) {
    const importerSpans = Array.from(declarationSpansByName(importerRecord));
    if (importerSpans.length === 0) continue;
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;

        for (const [importerName, importerSpan] of importerSpans) {
          for (const { targetRecord: resolvedTargetRecord, target, referenceLocations } of bindingReferenceGroups({
            graph,
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const relationshipTargetRecord = resolvedTargetRecord || targetRecord;
            const targetKey = declarationImportMetricKey(relationshipTargetRecord.rel, target.declarationName);
            if (!targetKey) continue;

            const importerKey = declarationImportMetricKey(importerRecord.rel, importerName);
            const useBucket = ensure(importerRecord, importerName);
            const importedByBucket = ensure(relationshipTargetRecord, target.declarationName);
            if (!importerKey || !useBucket || !importedByBucket) continue;

            const relationshipKey = [
              importerKey,
              targetKey,
              target.localName || binding.local,
              target.importedName || binding.imported,
              binding.kind,
              ref.kind,
              ref.specifier,
            ].join('\u0000');
            const referenceCount = referenceLocations.length;
            addDeclarationRelationship(
              useBucket,
              'importedFunctionUses',
              seenUses,
              relationshipKey,
              compactUseRelationship({
                importerRecord,
                targetRecord: relationshipTargetRecord,
                target,
                binding,
                ref,
                referenceLocations,
              }),
            );
            addDeclarationRelationship(
              importedByBucket,
              'importedBy',
              seenImportedBy,
              relationshipKey,
              compactImportedByRelationship({
                importerRecord,
                importerName,
                importerSpan,
                target,
                binding,
                ref,
                referenceLocations,
              }),
            );
          }
        }
      }
    }
  }

  for (const bucket of relationships.values()) {
    bucket.importedFunctionUses.sort(compareDeclarationRelationship);
    bucket.importedBy.sort(compareDeclarationRelationship);
  }
  return relationships;
}

export function buildDeclarationImportMetrics(graph) {
  const buckets = new Map();
  for (const record of graph.modules.values()) {
    for (const [declarationName, span] of declarationSpansByName(record)) {
      const key = declarationImportMetricKey(record.rel, declarationName);
      if (!key) continue;
      const publicApi = declarationPublicApiInfo(record, declarationName);
      const identifierMetrics = declarationIdentifierMetrics(record, span, publicApi);
      buckets.set(key, {
        ...identifierMetrics,
        incomingReferenceCount: 0,
        importerFiles: new Set(),
        incomingImports: [],
        publicApi: {
          exported: publicApi.exported,
          exportedNames: publicApi.exportedNames,
          exportKinds: publicApi.exportKinds,
        },
      });
    }
  }
  for (const importerRecord of graph.modules.values()) {
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        const importGroups = new Map();
        for (const [, importerSpan] of declarationSpansByName(importerRecord)) {
          for (const { targetRecord: resolvedTargetRecord, target, referenceLocations } of bindingReferenceGroups({
            graph,
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const relationshipTargetRecord = resolvedTargetRecord || targetRecord;
            const groupKey = declarationImportMetricKey(relationshipTargetRecord.rel, target.declarationName);
            if (!groupKey) continue;
            if (!importGroups.has(groupKey)) {
              importGroups.set(groupKey, { target, targetRecord: relationshipTargetRecord, referenceCount: 0 });
            }
            importGroups.get(groupKey).referenceCount += referenceLocations.length;
          }
        }
        for (const [key, { target, targetRecord: relationshipTargetRecord, referenceCount }] of importGroups) {
          if (!buckets.has(key)) {
            buckets.set(key, {
              identifierOccurrenceCount: 0,
              declarationNameOccurrenceCount: 0,
              declarationOnlyNameOccurrence: false,
              sameFileReferenceCount: 0,
              ownDeclarationReferenceCount: 0,
              publicApiReferenceCount: 0,
              incomingReferenceCount: 0,
              importerFiles: new Set(),
              incomingImports: [],
              publicApi: {
                exported: false,
                exportedNames: [],
                exportKinds: [],
              },
            });
          }
          const bucket = buckets.get(key);
          bucket.incomingReferenceCount += referenceCount;
          if (importerRecord.rel !== relationshipTargetRecord.rel) {
            bucket.importerFiles.add(importerRecord.rel);
            bucket.incomingImports.push({
              importerPath: importerRecord.rel,
              specifier: ref.specifier,
              loadKind: normalizeString(ref.kind).trim() || 'import',
              imported: target.importedName || binding.imported,
              local: target.localName || binding.local,
              bindingKind: binding.kind,
              inferred: Boolean(binding.inferred),
              referenceCount,
            });
          }
        }
      }
    }
  }

  return new Map(Array.from(buckets, ([key, bucket]) => [key, {
    referenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    directIdentifierReferenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    sameFileReferenceCount: bucket.sameFileReferenceCount,
    ownDeclarationReferenceCount: bucket.ownDeclarationReferenceCount,
    sameFileNameOccurrenceCount: Math.max(
      0,
      bucket.identifierOccurrenceCount - bucket.declarationNameOccurrenceCount - bucket.ownDeclarationReferenceCount,
    ),
    incomingReferenceCount: bucket.incomingReferenceCount,
    identifierOccurrenceCount: bucket.identifierOccurrenceCount,
    declarationNameOccurrenceCount: bucket.declarationNameOccurrenceCount,
    declarationOnlyNameOccurrence: bucket.declarationOnlyNameOccurrence,
    publicApiReferenceCount: bucket.publicApiReferenceCount,
    importerFileCount: bucket.importerFiles.size,
    incomingImports: bucket.incomingImports.sort((a, b) => compareLocale(a.importerPath, b.importerPath)
      || compareLocale(a.loadKind, b.loadKind)
      || compareLocale(a.imported, b.imported)
      || compareLocale(a.local, b.local)),
    publicApi: bucket.publicApi,
  }]));
}

function importedScriptVariableName(ref) {
  const bindings = Array.isArray(ref?.bindings) ? ref.bindings : [];
  const binding = bindings.find((candidate) => candidate.kind === 'named')
    || bindings.find((candidate) => candidate.kind === 'namespace')
    || bindings.find((candidate) => candidate.kind === 'default');
  return normalizeString(binding?.local).trim();
}

function namespaceMemberNamesForRecord(record, binding, ref) {
  const names = new Set();
  for (const [, span] of declarationSpansByName(record)) {
    for (const memberName of namespaceMemberReferenceLocations(record, span, binding.local, { binding, ref }).keys()) {
      names.add(memberName);
    }
  }
  return Array.from(names).sort(compareLocale);
}

function importedScriptCandidatesForJsx(record, graph, declarationImportMetrics) {
  const candidates = [];
  for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
    if (ref?.localRel && isJsxModule(ref.localRel)) continue;
    if (isIgnoredExternalLabel(ref?.specifier)) continue;
    const name = importedScriptVariableName(ref);
    if (name === 'React') continue;
    if (!name) continue;
    const targetRecord = ref.localRel ? graph.modules.get(ref.localRel) : null;
    const binding = (Array.isArray(ref.bindings) ? ref.bindings : [])
      .find((candidate) => candidate.local === name);
    if (targetRecord && binding?.kind === 'namespace') {
      for (const memberName of namespaceMemberNamesForRecord(record, binding, ref)) {
        const target = namedExportDeclarationTarget(targetRecord, memberName);
        const declarationName = target?.declarationName || '';
        const visibleName = `${name}.${memberName}`;
        candidates.push({
          name: visibleName,
          targetRecord,
          binding,
          declarationName,
          span: target?.span || null,
          lineCount: target?.span?.lineCount || declarationLineCount(targetRecord, declarationName),
          metrics: declarationImportMetricsFor(declarationImportMetrics, targetRecord, declarationName),
        });
      }
      continue;
    }
    const target = importBindingDeclarationTarget(targetRecord, binding);
    const resolvedDeclarationName = target?.declarationName || '';
    const declarationName = resolvedDeclarationName || (targetRecord ? '' : name);
    candidates.push({
      name,
      targetRecord,
      binding,
      declarationName,
      span: target?.span || null,
      lineCount: target?.span?.lineCount || declarationLineCount(targetRecord, declarationName),
      metrics: declarationImportMetricsFor(declarationImportMetrics, targetRecord, declarationName),
    });
  }
  return candidates.sort((a, b) => compareLocale(a.name, b.name));
}

export function importedScriptMembersForJsx(record, graph, declarationImportMetrics) {
  const members = new Map();
  for (const candidate of importedScriptCandidatesForJsx(record, graph, declarationImportMetrics)) {
    const { name, lineCount, metrics } = candidate;
    const existing = members.get(name);
    if (!existing || (!existing.lineCount && lineCount)) {
      members.set(name, { name, lineCount, metrics });
    }
  }
  return Array.from(members.values()).sort((a, b) => compareLocale(a.name, b.name));
}

function functionNodeForDeclaration(functionNodesByDeclarationKey, record, span, declarationName) {
  const key = [
    normalizeString(record?.rel).trim(),
    normalizeString(declarationName || span?.name).trim(),
    normalizeString(span?.kind).trim(),
    span?.startLine,
    span?.endLine,
  ].join('\u0000');
  return functionNodesByDeclarationKey.get(key) || null;
}

function functionNodesByDeclarationKey(functionDependencyMap = {}) {
  const nodes = new Map();
  for (const node of Array.isArray(functionDependencyMap.functions) ? functionDependencyMap.functions : []) {
    const key = [
      normalizeString(node.modulePath).trim(),
      normalizeString(node.declarationName || node.name).trim(),
      normalizeString(node.kind).trim(),
      node.startLine,
      node.endLine,
    ].join('\u0000');
    if (key && !nodes.has(key)) nodes.set(key, node);
  }
  return nodes;
}

function importedScriptSourceDeclarationsForJsx(
  record,
  graph,
  moduleId,
  declarationImportMetrics,
  declarationRelationships,
  functionNodes,
) {
  const declarations = new Map();
  for (const candidate of importedScriptCandidatesForJsx(record, graph, declarationImportMetrics)) {
    const { name, targetRecord, binding, declarationName, metrics } = candidate;
    if (!targetRecord) continue;

    const span = candidate.span || declarationSpansByName(targetRecord).get(declarationName);
    const entry = sourceDeclarationEntry({
      moduleId,
      visibleName: name,
      record: targetRecord,
      span,
      declarationName,
      sourceOrigin: 'imported-script-member',
      metrics,
      relationships: declarationRelationshipsFor(declarationRelationships, targetRecord, declarationName),
      functionNode: functionNodeForDeclaration(functionNodes, targetRecord, span, declarationName),
    });
    if (entry && !declarations.has(entry.name)) declarations.set(entry.name, entry);
  }
  return Array.from(declarations.values())
    .sort((a, b) => compareLocale(a.name, b.name));
}

function functionStableIdForNode(node = {}) {
  return compactStableId('fn', [
    node.modulePath,
    node.scopePath,
    node.name,
    node.kind,
  ]);
}

function withCollisionSafeStableIds(items, stableIdForItem) {
  const counts = new Map();
  return items.map((item) => {
    const baseId = stableIdForItem(item);
    const ordinal = (counts.get(baseId) || 0) + 1;
    counts.set(baseId, ordinal);
    return { ...item, stableId: ordinal === 1 ? baseId : `${baseId}_${ordinal}` };
  });
}

function legacyFunctionSpanKey(record, span) {
  return [
    normalizeString(record?.rel).trim(),
    normalizeString(span?.name).trim(),
    normalizeString(span?.kind).trim(),
    span?.startLine,
    span?.endLine,
  ].join('\u0000');
}

function functionSpanKey(record, span) {
  return [
    legacyFunctionSpanKey(record, span),
    span?.startIndex,
    span?.endIndex,
    span?.nameStartIndex,
  ].join('\u0000');
}

function functionIdentityKeysForSpans(record, spans) {
  const groups = new Map();
  for (const span of spans) {
    const legacyKey = legacyFunctionSpanKey(record, span);
    if (!groups.has(legacyKey)) groups.set(legacyKey, []);
    groups.get(legacyKey).push(span);
  }

  const identities = new Map();
  for (const [legacyKey, group] of groups) {
    const ordered = [...group].sort((a, b) => a.startIndex - b.startIndex
      || a.nameStartIndex - b.nameStartIndex
      || a.endIndex - b.endIndex);
    if (ordered.length === 1) {
      identities.set(ordered[0], legacyKey);
      continue;
    }
    ordered.forEach((span, index) => {
      identities.set(span, `${legacyKey}\u0000${index + 1}`);
    });
  }
  return identities;
}

function functionIdForSpan(record, span, identityKey = legacyFunctionSpanKey(record, span)) {
  return encodedStaticId(`function\u0000${identityKey}`);
}

function normalizedImplementationSourceForSpan(record, span) {
  const source = normalizeString(record?.source);
  const endIndex = declarationSpanExclusiveEnd(span);
  if (!Number.isInteger(span?.startIndex) || !Number.isInteger(endIndex) || endIndex <= span.startIndex) {
    return '';
  }
  const declarationSource = source.slice(span.startIndex, endIndex);
  const nameStart = Number.isInteger(span.nameStartIndex) ? span.nameStartIndex - span.startIndex : -1;
  const nameEnd = Number.isInteger(span.nameEndIndex) ? span.nameEndIndex - span.startIndex : -1;
  const nameMasked = nameStart >= 0 && nameEnd > nameStart && nameEnd <= declarationSource.length
    ? `${declarationSource.slice(0, nameStart)}__IRONG_DECLARATION_NAME__${declarationSource.slice(nameEnd)}`
    : declarationSource;
  return nameMasked.replace(/\r\n?/g, '\n');
}

function implementationFingerprintForSpan(record, span) {
  const implementationSource = normalizedImplementationSourceForSpan(record, span);
  return compactStableId('impl', [implementationSource]);
}

function functionDependencyEdgeId({ sourceNode, targetNode, scope, importInfo }) {
  return encodedStaticId([
    'function-edge',
    sourceNode?.id,
    targetNode?.id,
    scope,
    importInfo?.specifier || '',
    importInfo?.loadKind || '',
    importInfo?.bindingKind || '',
    importInfo?.importedName || '',
    importInfo?.localName || '',
  ].join('\u0000'));
}

function compareFunctionNode(a, b) {
  return compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || (a.declarationColumn || 0) - (b.declarationColumn || 0)
    || compareLocale(a.name, b.name)
    || compareLocale(a.kind, b.kind)
    || compareLocale(a.id, b.id);
}

function compareFunctionEdge(a, b) {
  return compareLocale(a.sourceModulePath, b.sourceModulePath)
    || a.sourceStartLine - b.sourceStartLine
    || compareLocale(a.targetModulePath, b.targetModulePath)
    || a.targetStartLine - b.targetStartLine
    || compareLocale(a.scope, b.scope)
    || compareLocale(a.targetFunction, b.targetFunction)
    || compareLocale(a.import?.localName || '', b.import?.localName || '');
}

function functionNodeForSpan(record, span, { nested = false, scopePath = '', identityKey = null } = {}) {
  const name = normalizeString(span?.name).trim();
  const declarationType = normalizeString(span?.declarationType).trim()
    || (span?.kind === 'arrow' ? 'arrow-variable' : 'function-declaration');
  const detectedPublicApi = declarationPublicApiInfo(record, name);
  const publicApi = nested || declarationType === 'function-expression-name'
    ? { exported: false, exportedNames: [], exportKinds: [] }
    : detectedPublicApi;
  return {
    id: functionIdForSpan(record, span, identityKey || legacyFunctionSpanKey(record, span)),
    modulePath: record.rel,
    name,
    declarationName: name,
    kind: normalizeString(span?.kind).trim() || 'function',
    component: /^[A-Z]/.test(name),
    reachable: Boolean(record.reachable),
    exported: Boolean(publicApi.exported),
    exportedNames: publicApi.exportedNames,
    exportKinds: publicApi.exportKinds,
    declarationType,
    standalone: !nested && declarationType !== 'function-expression-name',
    implementationFingerprint: implementationFingerprintForSpan(record, span),
    scopePath,
    declarationLine: lineNumberAtSourceIndex(record.source, span.nameStartIndex),
    declarationColumn: sourceColumnAtIndex(record.source, span.nameStartIndex),
    startLine: span.startLine,
    endLine: span.endLine,
    lineCount: span.lineCount,
  };
}

function normalizeScopeSegment(segment) {
  return normalizeString(maskIgnorableSyntax(segment))
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+([,;:{}[\]])/g, '$1')
    .replace(/([({[\]])\s+/g, '$1')
    .trim();
}

function scopeSegmentForRange(record, range) {
  const source = maskIgnorableSyntax(normalizeString(record?.source));
  const boundary = Math.max(
    source.lastIndexOf('\n', range.startIndex - 1),
    source.lastIndexOf(';', range.startIndex - 1),
    source.lastIndexOf('}', range.startIndex - 1),
  );
  const segment = normalizeScopeSegment(source.slice(boundary + 1, range.startIndex));
  if (segment) return segment;
  return 'anonymous-block';
}

function functionNodeDescriptors(graph) {
  const descriptors = [];
  const bySpanKey = new Map();
  const byModulePath = new Map();

  for (const record of moduleRecords(graph)) {
    const spans = (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
      .filter((span) => ['function', 'arrow'].includes(span?.kind))
      .sort((a, b) => a.startLine - b.startLine
        || a.endLine - b.endLine
        || compareLocale(a.name, b.name)
        || compareLocale(a.kind, b.kind));
    const blockRanges = lexicalBlockRanges(record);
    const identityKeys = functionIdentityKeysForSpans(record, spans);
    const scopePathFor = (span) => blockRanges
      .filter((range) => range.startIndex < span.nameStartIndex && range.endIndex >= span.nameEndIndex)
      .sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex)
      .map((range) => scopeSegmentForRange(record, range))
      .join('/');
    for (const span of spans) {
      const scopePath = scopePathFor(span);
      const nested = Boolean(scopePath);
      const node = functionNodeForSpan(record, span, {
        nested,
        scopePath,
        identityKey: identityKeys.get(span),
      });
      const descriptor = { node, record, span };
      descriptors.push(descriptor);
      bySpanKey.set(functionSpanKey(record, span), descriptor);
      if (!byModulePath.has(record.rel)) byModulePath.set(record.rel, []);
      byModulePath.get(record.rel).push(descriptor);
    }
  }

  descriptors.sort((a, b) => compareFunctionNode(a.node, b.node));
  for (const list of byModulePath.values()) {
    list.sort((a, b) => compareFunctionNode(a.node, b.node));
  }
  return { descriptors, bySpanKey, byModulePath };
}

function sameModuleReferenceLocations(record, callerSpan, targetSpan) {
  return declarationReferenceLocations(record, callerSpan, targetSpan?.name, {
    ignoredBindingLocations: [{
      index: targetSpan?.nameStartIndex,
      endIndex: targetSpan?.nameEndIndex,
    }],
  }).filter((location) => visibleDeclarationSpanForName(record, targetSpan?.name, location) === targetSpan);
}

function declarationSearchText(record, span) {
  const source = normalizeString(record?.source);
  const endIndex = declarationSpanExclusiveEnd(span);
  if (!Number.isInteger(span?.nameEndIndex) || !Number.isInteger(endIndex) || endIndex <= span.nameEndIndex) {
    return '';
  }
  return source.slice(span.nameEndIndex, endIndex);
}

function functionImportInfo(target, binding, ref) {
  const localName = normalizeString(target?.localName || binding?.local).trim();
  return {
    specifier: normalizeString(ref?.specifier).trim(),
    loadKind: normalizeString(ref?.kind).trim() || 'import',
    bindingKind: normalizeString(binding?.kind || 'named').trim() || 'named',
    importedName: normalizeString(target?.importedName || binding?.imported).trim(),
    localName,
    inferred: Boolean(binding?.inferred),
  };
}

function createFunctionDependencyEdge({
  sourceDescriptor,
  targetDescriptor,
  scope,
  referenceLocations,
  importInfo = null,
}) {
  const usages = compactReferenceUsages(sourceDescriptor.record, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  const sourceNode = sourceDescriptor.node;
  const targetNode = targetDescriptor.node;
  return {
    id: functionDependencyEdgeId({ sourceNode, targetNode, scope, importInfo }),
    scope,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    sourceId: sourceNode.id,
    sourceModulePath: sourceNode.modulePath,
    sourceFunction: sourceNode.name,
    sourceKind: sourceNode.kind,
    sourceStartLine: sourceNode.startLine,
    sourceEndLine: sourceNode.endLine,
    targetId: targetNode.id,
    targetModulePath: targetNode.modulePath,
    targetFunction: targetNode.name,
    targetKind: targetNode.kind,
    targetStartLine: targetNode.startLine,
    targetEndLine: targetNode.endLine,
    ...(importInfo ? { import: importInfo } : {}),
  };
}

function mergeFunctionDependencyEdge(edgeMap, edge) {
  if (!edgeMap.has(edge.id)) {
    edgeMap.set(edge.id, edge);
    return;
  }

  const existing = edgeMap.get(edge.id);
  existing.referenceCount += edge.referenceCount;
  const usages = [...existing.usages, ...edge.usages]
    .filter((usage, index, all) => (
      all.findIndex((candidate) => (
        candidate.line === usage.line && candidate.syntax === usage.syntax
      )) === index
    ))
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
  existing.usages = usages;
  existing.usageLines = usageLinesForUsages(usages);
  existing.syntaxKinds = syntaxKindsForUsages(usages);
  existing.relationKind = relationKindForSyntaxKinds(existing.syntaxKinds);
}

function buildSameModuleFunctionEdges({ byModulePath }) {
  const edgeMap = new Map();
  for (const descriptors of byModulePath.values()) {
    for (const callerDescriptor of descriptors) {
      const searchText = declarationSearchText(callerDescriptor.record, callerDescriptor.span);
      for (const targetDescriptor of descriptors) {
        if (callerDescriptor.node.id === targetDescriptor.node.id) continue;
        if (!searchText.includes(targetDescriptor.node.name)) continue;
        const referenceLocations = sameModuleReferenceLocations(
          callerDescriptor.record,
          callerDescriptor.span,
          targetDescriptor.span,
        );
        if (referenceLocations.length === 0) continue;
        mergeFunctionDependencyEdge(edgeMap, createFunctionDependencyEdge({
          sourceDescriptor: callerDescriptor,
          targetDescriptor,
          scope: 'same-module',
          referenceLocations,
        }));
      }
    }
  }
  return edgeMap;
}

function buildImportedFunctionEdges(graph, { bySpanKey }) {
  const edgeMap = new Map();
  for (const importerRecord of graph.modules.values()) {
    const importerSpans = declarationSpans(importerRecord)
      .filter((span) => ['function', 'arrow'].includes(span?.kind));
    if (importerSpans.length === 0) continue;
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        for (const importerSpan of importerSpans) {
          const sourceDescriptor = bySpanKey.get(functionSpanKey(importerRecord, importerSpan));
          if (!sourceDescriptor) continue;
          for (const { targetRecord: resolvedTargetRecord, target, referenceLocations } of bindingReferenceGroups({
            graph,
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const relationshipTargetRecord = resolvedTargetRecord || targetRecord;
            const targetDescriptor = bySpanKey.get(functionSpanKey(relationshipTargetRecord, target.span));
            if (!targetDescriptor || referenceLocations.length === 0) continue;
            mergeFunctionDependencyEdge(edgeMap, createFunctionDependencyEdge({
              sourceDescriptor,
              targetDescriptor,
              scope: 'imported',
              referenceLocations,
              importInfo: functionImportInfo(target, binding, ref),
            }));
          }
        }
      }
    }
  }
  return edgeMap;
}

function externalSpecifierCategory(specifier) {
  const raw = normalizeString(specifier).trim();
  const withoutNodePrefix = raw.startsWith('node:') ? raw.slice('node:'.length) : raw;
  return raw.startsWith('node:') || PLATFORM_IMPORT_SPECIFIERS.has(withoutNodePrefix)
    ? 'platform'
    : 'package';
}

function placementExternalReferenceCategory(ref = {}) {
  const resolution = normalizeString(ref.resolution).trim();
  if (resolution === 'unresolved') return 'unresolved';
  return externalSpecifierCategory(ref.specifier);
}

function compactExternalReferenceEvidence({
  importerRecord,
  sourceDescriptor,
  ref,
  binding,
  localName,
  importedName,
  referenceLocations,
}) {
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    category: placementExternalReferenceCategory(ref),
    resolution: normalizeString(ref.resolution).trim() || 'external',
    unresolvedReason: normalizeString(ref.unresolvedReason).trim() || null,
    specifier: normalizeString(ref.specifier).trim(),
    loadKind: normalizeString(ref.kind).trim() || 'import',
    bindingKind: normalizeString(binding?.kind || 'named').trim() || 'named',
    importedName: normalizeString(importedName || binding?.imported).trim(),
    localName: normalizeString(localName || binding?.local).trim(),
    modulePath: sourceDescriptor.node.modulePath,
    functionId: sourceDescriptor.node.id,
    functionStableId: sourceDescriptor.node.stableId || null,
    functionName: sourceDescriptor.node.name,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compactBrowserPlatformReferenceEvidence({
  importerRecord,
  sourceDescriptor,
  specifier,
  importedName,
  localName,
  referenceLocations,
}) {
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    category: 'platform',
    resolution: 'platform',
    unresolvedReason: null,
    specifier,
    loadKind: 'browser-global',
    bindingKind: 'browser-global',
    importedName,
    localName,
    modulePath: sourceDescriptor.node.modulePath,
    functionId: sourceDescriptor.node.id,
    functionStableId: sourceDescriptor.node.stableId || null,
    functionName: sourceDescriptor.node.name,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compareExternalReferenceEvidence(a, b) {
  return compareLocale(a.category, b.category)
    || compareLocale(a.specifier, b.specifier)
    || compareLocale(a.localName, b.localName)
    || compareLocale(a.importedName, b.importedName)
    || compareLocale(a.bindingKind, b.bindingKind);
}

function mergeExternalReferenceEvidence(bucket, evidence) {
  const key = [
    evidence.category,
    evidence.resolution,
    evidence.specifier,
    evidence.loadKind,
    evidence.bindingKind,
    evidence.importedName,
    evidence.localName,
  ].join('\u0000');
  if (!bucket.has(key)) {
    bucket.set(key, evidence);
    return;
  }
  const existing = bucket.get(key);
  existing.referenceCount += evidence.referenceCount;
  const usages = [...existing.usages, ...evidence.usages]
    .filter((usage, index, all) => (
      all.findIndex((candidate) => (
        candidate.line === usage.line && candidate.syntax === usage.syntax
      )) === index
    ))
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
  existing.usages = usages;
  existing.usageLines = usageLinesForUsages(usages);
  existing.syntaxKinds = syntaxKindsForUsages(usages);
  existing.relationKind = relationKindForSyntaxKinds(existing.syntaxKinds);
}

function externalBindingReferenceGroups({ importerRecord, importerSpan, binding, ref }) {
  const bindingKind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') {
    return Array.from(namespaceMemberReferenceLocations(
      importerRecord,
      importerSpan,
      binding.local,
      { binding, ref },
    ), ([memberName, referenceLocations]) => ({
      localName: `${binding.local}.${memberName}`,
      importedName: memberName,
      referenceLocations,
    })).filter((group) => group.referenceLocations.length > 0);
  }

  const localName = normalizeIdentifier(binding?.local);
  if (!localName) return [];
  const referenceLocations = declarationReferenceLocations(
    importerRecord,
    importerSpan,
    localName,
    { binding, ref },
  );
  return referenceLocations.length > 0
    ? [{
      localName,
      importedName: normalizeString(binding?.imported).trim(),
      referenceLocations,
    }]
    : [];
}

function isMemberPropertyReference(record, location) {
  const masked = maskIgnorableSyntax(record?.source);
  return masked[previousNonWhitespaceIndex(masked, location?.index)] === '.';
}

function browserPlatformReferenceGroups({ importerRecord, importerSpan }) {
  const groups = [];
  for (const [namespaceName, specifier] of BROWSER_PLATFORM_NAMESPACES) {
    for (const [memberName, referenceLocations] of namespaceMemberReferenceLocations(
      importerRecord,
      importerSpan,
      namespaceName,
    )) {
      if (referenceLocations.length === 0) continue;
      groups.push({
        specifier,
        importedName: memberName,
        localName: `${namespaceName}.${memberName}`,
        referenceLocations,
      });
    }
  }

  for (const [identifier, specifier] of BROWSER_PLATFORM_IDENTIFIERS) {
    const referenceLocations = declarationReferenceLocations(importerRecord, importerSpan, identifier)
      .filter((location) => !isMemberPropertyReference(importerRecord, location));
    if (referenceLocations.length === 0) continue;
    groups.push({
      specifier,
      importedName: identifier,
      localName: identifier,
      referenceLocations,
    });
  }
  return groups;
}

function buildExternalFunctionReferenceEvidence(graph, { bySpanKey }) {
  const evidenceByFunctionId = new Map();
  for (const importerRecord of graph.modules.values()) {
    const importerSpans = declarationSpans(importerRecord)
      .filter((span) => ['function', 'arrow'].includes(span?.kind));
    if (importerSpans.length === 0) continue;

    for (const importerSpan of importerSpans) {
      const sourceDescriptor = bySpanKey.get(functionSpanKey(importerRecord, importerSpan));
      if (!sourceDescriptor) continue;
      for (const group of browserPlatformReferenceGroups({ importerRecord, importerSpan })) {
        if (!evidenceByFunctionId.has(sourceDescriptor.node.id)) {
          evidenceByFunctionId.set(sourceDescriptor.node.id, new Map());
        }
        mergeExternalReferenceEvidence(
          evidenceByFunctionId.get(sourceDescriptor.node.id),
          compactBrowserPlatformReferenceEvidence({
            importerRecord,
            sourceDescriptor,
            specifier: group.specifier,
            importedName: group.importedName,
            localName: group.localName,
            referenceLocations: group.referenceLocations,
          }),
        );
      }
    }

    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const resolution = normalizeString(ref?.resolution).trim();
      if (resolution !== 'external' && resolution !== 'unresolved') continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        for (const importerSpan of importerSpans) {
          const sourceDescriptor = bySpanKey.get(functionSpanKey(importerRecord, importerSpan));
          if (!sourceDescriptor) continue;
          for (const group of externalBindingReferenceGroups({ importerRecord, importerSpan, binding, ref })) {
            if (!evidenceByFunctionId.has(sourceDescriptor.node.id)) {
              evidenceByFunctionId.set(sourceDescriptor.node.id, new Map());
            }
            mergeExternalReferenceEvidence(
              evidenceByFunctionId.get(sourceDescriptor.node.id),
              compactExternalReferenceEvidence({
                importerRecord,
                sourceDescriptor,
                ref,
                binding,
                localName: group.localName,
                importedName: group.importedName,
                referenceLocations: group.referenceLocations,
              }),
            );
          }
        }
      }
    }
  }

  return new Map(Array.from(evidenceByFunctionId, ([functionId, bucket]) => [
    functionId,
    Array.from(bucket.values()).sort(compareExternalReferenceEvidence),
  ]));
}

function compactPlacementFunctionNode(node = {}) {
  return {
    id: node.id,
    stableId: node.stableId || null,
    modulePath: node.modulePath,
    name: node.name,
    kind: node.kind,
    component: Boolean(node.component),
    exported: Boolean(node.exported),
    startLine: node.startLine,
    endLine: node.endLine,
    lineCount: node.lineCount,
  };
}

function compactPlacementEdge(edge = {}, functionById = new Map()) {
  const target = functionById.get(edge.targetId);
  const source = functionById.get(edge.sourceId);
  return {
    id: edge.id,
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    usageLines: edge.usageLines,
    referenceCount: edge.referenceCount,
    source: source ? compactPlacementFunctionNode(source) : null,
    target: target ? compactPlacementFunctionNode(target) : null,
    ...(edge.import ? { import: edge.import } : {}),
  };
}

function categoryCount(evidence, category) {
  return evidence.filter((item) => item.category === category).length;
}

function hasCallableSyntax(edges, references) {
  return [...edges, ...references]
    .some((item) => (Array.isArray(item.syntaxKinds) ? item.syntaxKinds : [])
      .some((kind) => kind !== 'reference'));
}

function transitiveInternalHelpersFor(node, sameFileEdgesBySourceId, functionById) {
  const results = [];
  const visited = new Set([node.id]);
  const queue = [{ id: node.id, depth: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of sameFileEdgesBySourceId.get(current.id) || []) {
      const target = functionById.get(edge.targetId);
      if (!target || visited.has(target.id)) continue;
      visited.add(target.id);
      if (target.modulePath === node.modulePath && !target.exported) {
        results.push({ depth: current.depth + 1, node: target, edge });
        queue.push({ id: target.id, depth: current.depth + 1 });
      }
    }
  }
  return results.sort((a, b) => a.depth - b.depth || compareFunctionNode(a.node, b.node));
}

function placementAssessment({ node, evidence, sameFileDependencies, projectLocalDependencies, sameFileUsers, projectLocalUsers }) {
  const sameFileEvidence = sameFileDependencies.length + sameFileUsers.length;
  const projectLocalEvidence = projectLocalDependencies.length + projectLocalUsers.length;
  const packageEvidence = categoryCount(evidence, 'package');
  const platformEvidence = categoryCount(evidence, 'platform');
  const unresolvedEvidence = categoryCount(evidence, 'unresolved');
  const allEdges = [
    ...sameFileDependencies,
    ...projectLocalDependencies,
    ...sameFileUsers,
    ...projectLocalUsers,
  ];
  const hasCallableEvidence = hasCallableSyntax(allEdges, evidence);
  const rationale = [];
  let assessment = 'static-isolated';
  let summary = 'No saved direct caller, callee, or import-binding reference evidence was found for this function.';

  if (node.exported || node.component) {
    assessment = 'public-entry-surface';
    summary = 'This function is exported or component-shaped, so placement should consider the module public surface as well as local helpers.';
    rationale.push(node.exported ? 'exported declaration' : 'component-shaped declaration');
  } else if (projectLocalEvidence > sameFileEvidence && projectLocalEvidence > 0) {
    assessment = 'review-for-extraction';
    summary = 'Cross-file static evidence outweighs same-file affinity; this function is a candidate for placement review.';
  } else if (sameFileEvidence > 0 && projectLocalEvidence > 0) {
    assessment = 'mixed-affinity';
    summary = 'Both same-file and project-local static evidence point at this function; review nearby callers and imported relationships together.';
  } else if (sameFileEvidence > 0) {
    assessment = 'keep-near-current-file';
    summary = 'Same-file static caller/callee evidence dominates, suggesting this function currently belongs near its surrounding file context.';
  } else if (projectLocalEvidence > 0) {
    assessment = 'review-for-extraction';
    summary = 'Only cross-file caller/callee evidence was found, so the current file placement deserves review.';
  } else if (packageEvidence + platformEvidence > 0) {
    assessment = 'external-adapter';
    summary = 'The function mostly shows package/platform import-binding use; placement depends on whether it is adapting those APIs for this file.';
  }

  if (sameFileEvidence > 0) rationale.push(`${sameFileEvidence} same-file caller/callee edge${sameFileEvidence === 1 ? '' : 's'}`);
  if (projectLocalEvidence > 0) rationale.push(`${projectLocalEvidence} project-local cross-file edge${projectLocalEvidence === 1 ? '' : 's'}`);
  if (packageEvidence > 0) rationale.push(`${packageEvidence} package binding reference${packageEvidence === 1 ? '' : 's'}`);
  if (platformEvidence > 0) rationale.push(`${platformEvidence} platform binding reference${platformEvidence === 1 ? '' : 's'}`);
  if (unresolvedEvidence > 0) rationale.push(`${unresolvedEvidence} unresolved import-binding reference${unresolvedEvidence === 1 ? '' : 's'}`);
  if (rationale.length === 0) rationale.push('no direct static affinity evidence');

  const resolvedEvidence = projectLocalEvidence + sameFileEvidence + packageEvidence + platformEvidence;
  const confidence = unresolvedEvidence > 0 || !hasCallableEvidence
    ? 'low'
    : resolvedEvidence >= 3 ? 'high' : 'medium';

  return {
    assessment,
    confidence,
    summary,
    rationale,
  };
}

function buildFunctionPlacementReview({ functions, edges, externalReferencesByFunctionId }) {
  const functionById = new Map(functions.map((node) => [node.id, node]));
  const dependenciesByFunctionId = new Map();
  const usersByFunctionId = new Map();
  const sameFileEdgesBySourceId = new Map();
  for (const edge of edges) {
    if (!dependenciesByFunctionId.has(edge.sourceId)) dependenciesByFunctionId.set(edge.sourceId, []);
    if (!usersByFunctionId.has(edge.targetId)) usersByFunctionId.set(edge.targetId, []);
    dependenciesByFunctionId.get(edge.sourceId).push(edge);
    usersByFunctionId.get(edge.targetId).push(edge);
    if (edge.scope === 'same-module') {
      if (!sameFileEdgesBySourceId.has(edge.sourceId)) sameFileEdgesBySourceId.set(edge.sourceId, []);
      sameFileEdgesBySourceId.get(edge.sourceId).push(edge);
    }
  }

  for (const node of functions) {
    const dependencies = dependenciesByFunctionId.get(node.id) || [];
    const users = usersByFunctionId.get(node.id) || [];
    const sameFileDependencies = dependencies.filter((edge) => edge.scope === 'same-module');
    const projectLocalDependencies = dependencies.filter((edge) => edge.scope === 'imported');
    const sameFileUsers = users.filter((edge) => edge.scope === 'same-module');
    const projectLocalUsers = users.filter((edge) => edge.scope === 'imported');
    const externalReferences = externalReferencesByFunctionId.get(node.id) || [];
    const directInternalHelpers = sameFileDependencies
      .map((edge) => functionById.get(edge.targetId))
      .filter((target) => target && target.modulePath === node.modulePath && !target.exported)
      .sort(compareFunctionNode);
    const transitiveInternalHelpers = transitiveInternalHelpersFor(node, sameFileEdgesBySourceId, functionById);
    const evidence = {
      sameFileCalleeCount: sameFileDependencies.length,
      projectLocalCalleeCount: projectLocalDependencies.length,
      packageCalleeCount: categoryCount(externalReferences, 'package'),
      platformCalleeCount: categoryCount(externalReferences, 'platform'),
      unresolvedCalleeCount: categoryCount(externalReferences, 'unresolved'),
      sameFileCallerCount: sameFileUsers.length,
      projectLocalCallerCount: projectLocalUsers.length,
      internalHelperCount: directInternalHelpers.length,
      transitiveInternalHelperCount: transitiveInternalHelpers.length,
      transitiveInternalHelperLineCount: transitiveInternalHelpers
        .reduce((total, item) => total + (item.node.lineCount || 0), 0),
    };
    node.placement = {
      assessment: placementAssessment({
        node,
        evidence: externalReferences,
        sameFileDependencies,
        projectLocalDependencies,
        sameFileUsers,
        projectLocalUsers,
      }),
      evidence,
      groups: {
        callees: {
          sameFile: sameFileDependencies.map((edge) => compactPlacementEdge(edge, functionById)),
          projectLocal: projectLocalDependencies.map((edge) => compactPlacementEdge(edge, functionById)),
          package: externalReferences.filter((item) => item.category === 'package'),
          platform: externalReferences.filter((item) => item.category === 'platform'),
          unresolved: externalReferences.filter((item) => item.category === 'unresolved'),
        },
        callers: {
          sameFile: sameFileUsers.map((edge) => compactPlacementEdge(edge, functionById)),
          projectLocal: projectLocalUsers.map((edge) => compactPlacementEdge(edge, functionById)),
        },
        internalHelpers: directInternalHelpers.map(compactPlacementFunctionNode),
        transitiveInternalHelpers: transitiveInternalHelpers.map((item) => ({
          depth: item.depth,
          function: compactPlacementFunctionNode(item.node),
          via: compactPlacementEdge(item.edge, functionById),
        })),
      },
    };
  }
}

export function buildFunctionDependencyMap(graph) {
  const descriptorIndex = functionNodeDescriptors(graph);
  const functions = withCollisionSafeStableIds(
    descriptorIndex.descriptors
      .map((descriptor) => descriptor.node)
      .sort(compareFunctionNode),
    functionStableIdForNode,
  );
  const nodeById = new Map(functions.map((node) => [node.id, node]));
  for (const descriptor of descriptorIndex.descriptors) {
    const stableNode = nodeById.get(descriptor.node.id);
    if (stableNode) descriptor.node = stableNode;
  }
  const sameModuleEdges = buildSameModuleFunctionEdges(descriptorIndex);
  const importedEdges = buildImportedFunctionEdges(graph, descriptorIndex);
  const edges = [
    ...sameModuleEdges.values(),
    ...importedEdges.values(),
  ].sort(compareFunctionEdge);
  const externalReferencesByFunctionId = buildExternalFunctionReferenceEvidence(graph, descriptorIndex);
  buildFunctionPlacementReview({ functions, edges, externalReferencesByFunctionId });
  return {
    limitations: FUNCTION_DEPENDENCY_LIMITATIONS,
    functions,
    edges,
  };
}

function declarationSpanForFunctionNode(record, functionNode = {}) {
  return declarationSpans(record)
    .find((span) => (
      ['function', 'arrow'].includes(span?.kind)
      && span.kind === functionNode.kind
      && span.name === functionNode.declarationName
      && span.startLine === functionNode.startLine
      && span.endLine === functionNode.endLine
    )) || null;
}

function functionNodeModuleId(functionNode = {}) {
  return compactStableId('mod', [functionNode.modulePath]);
}

function sourceDeclarationEntryForFunctionNode({
  graph,
  functionNode,
  declarationImportMetrics,
  declarationRelationships,
}) {
  const record = graph.modules.get(functionNode?.modulePath);
  const span = declarationSpanForFunctionNode(record, functionNode);
  if (!record || !span) return null;
  return sourceDeclarationEntry({
    moduleId: functionNodeModuleId(functionNode),
    visibleName: functionNode.name,
    record,
    span,
    declarationName: functionNode.declarationName || functionNode.name,
    sourceOrigin: 'saved-function',
    metrics: declarationImportMetricsFor(declarationImportMetrics, record, functionNode.declarationName || functionNode.name),
    relationships: declarationRelationshipsFor(
      declarationRelationships,
      record,
      functionNode.declarationName || functionNode.name,
    ),
    functionNode,
  });
}

export function buildSourceCode(graph, declarationImportMetrics, declarationRelationships, functionDependencyMap) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly: true });
  const classIds = buildClassIds(jsxModules);
  const functionNodes = functionNodesByDeclarationKey(functionDependencyMap);
  const modules = moduleRecords(graph)
    .map((record) => ({
      path: record.rel,
      lineCount: record.stats.lineCount,
      maxLineLength: record.stats.maxLineLength,
      code: record.source,
    }));
  const declarations = [];
  const seen = new Set();

  const pushEntry = (entry) => {
    const key = entry && [
      entry.moduleId,
      entry.sourceOrigin,
      entry.functionId || entry.name,
      entry.startLine,
      entry.endLine,
    ].join('\u0000');
    if (!entry || seen.has(key)) return;
    seen.add(key);
    declarations.push(entry);
  };

  for (const record of jsxModules) {
    const moduleId = classIds.get(record.rel);
    for (const entry of importedScriptSourceDeclarationsForJsx(
      record,
      graph,
      moduleId,
      declarationImportMetrics,
      declarationRelationships,
      functionNodes,
    )) {
      pushEntry(entry);
    }
    for (const [component, span] of componentSpans(record)) {
      pushEntry(sourceDeclarationEntry({
        moduleId,
        visibleName: component,
        record,
        span,
        sourceOrigin: 'current-file-declaration',
        metrics: declarationImportMetricsFor(declarationImportMetrics, record, component),
        relationships: declarationRelationshipsFor(declarationRelationships, record, component),
        functionNode: functionNodeForDeclaration(functionNodes, record, span, component),
      }));
    }
  }

  const representedFunctionIds = new Set(declarations
    .map((entry) => normalizeString(entry.functionId).trim())
    .filter(Boolean));
  for (const functionNode of Array.isArray(functionDependencyMap?.functions) ? functionDependencyMap.functions : []) {
    if (representedFunctionIds.has(functionNode.id)) continue;
    const entry = sourceDeclarationEntryForFunctionNode({
      graph,
      functionNode,
      declarationImportMetrics,
      declarationRelationships,
    });
    if (!entry) continue;
    pushEntry(entry);
    if (entry.functionId) representedFunctionIds.add(entry.functionId);
  }

  return { modules, declarations };
}
