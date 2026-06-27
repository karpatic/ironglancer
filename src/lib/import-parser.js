import { normalizeString } from './utils.js';

function splitImportBindingParts(text) {
  return normalizeString(text)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeJsIdentifier(value) {
  const raw = normalizeString(value).trim();
  const match = raw.match(/[A-Za-z_$][A-Za-z0-9_$]*/);
  return match ? match[0] : '';
}

function parseNamedImportBindings(text, { destructured = false } = {}) {
  const names = [];
  for (const part of splitImportBindingParts(text)) {
    const cleaned = part
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/g, '')
      .trim();
    if (!cleaned) continue;
    const aliasMatch = destructured
      ? cleaned.match(/:\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*$/)
      : cleaned.match(/\bas\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*$/);
    const name = aliasMatch ? aliasMatch[1] : normalizeJsIdentifier(cleaned);
    if (name) names.push(name);
  }
  return names;
}

function parseStaticImportSymbols(clause) {
  const text = normalizeString(clause).trim();
  if (!text) return [];
  const names = [];
  const namedMatch = text.match(/\{([\s\S]*?)\}/);
  if (namedMatch) names.push(...parseNamedImportBindings(namedMatch[1]));
  const namespaceMatch = text.match(/\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
  if (namespaceMatch) names.push(namespaceMatch[1]);
  const defaultPart = text
    .replace(/\{[\s\S]*?\}/g, '')
    .replace(/\*\s+as\s+[A-Za-z_$][A-Za-z0-9_$]*/g, '')
    .split(',')
    .map((part) => normalizeJsIdentifier(part))
    .find(Boolean);
  if (defaultPart) names.push(defaultPart);
  return Array.from(new Set(names));
}

function parseDynamicImportSymbols(binding) {
  const text = normalizeString(binding).trim();
  if (!text) return [];
  const destructured = text.match(/^\{([\s\S]*?)\}$/);
  if (destructured) {
    return Array.from(new Set(parseNamedImportBindings(destructured[1], { destructured: true })));
  }
  const name = normalizeJsIdentifier(text);
  return name ? [name] : [];
}

function pushImportRef(refs, ref) {
  const specifier = normalizeString(ref?.specifier).trim();
  if (!specifier) return;
  refs.push({
    specifier,
    symbols: Array.from(new Set((Array.isArray(ref.symbols) ? ref.symbols : [])
      .map((symbol) => normalizeJsIdentifier(symbol))
      .filter(Boolean))),
    kind: normalizeString(ref.kind || 'import').trim() || 'import',
  });
}

export function extractImportRefs(source) {
  const imports = new Set();
  const text = normalizeString(source);
  const refs = [];
  const staticImportPattern = /\bimport\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  const sideEffectImportPattern = /\bimport\s+['"]([^'"]+)['"]/g;
  const exportFromPattern = /\bexport\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  const assignedWindowImportPattern = /\b(?:const|let|var)\s+(\{[\s\S]*?\}|[A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*await\s+window\.import\s*\(\s*(?:paneUrl\s*\(\s*)?['"]([^'"]+)['"]\s*\)?\s*\)/g;
  const dynamicImportPattern = /\b(?:import|window\.import)\s*\(\s*(?:paneUrl\s*\(\s*)?['"]([^'"]+)['"]\s*\)?\s*\)/g;

  const mark = (specifier) => {
    const value = normalizeString(specifier).trim();
    if (value) imports.add(value);
    return value;
  };

  let match;
  while ((match = staticImportPattern.exec(text))) {
    const specifier = mark(match[2]);
    pushImportRef(refs, { specifier, symbols: parseStaticImportSymbols(match[1]), kind: 'static' });
  }
  while ((match = sideEffectImportPattern.exec(text))) {
    const specifier = mark(match[1]);
    pushImportRef(refs, { specifier, symbols: [], kind: 'side-effect' });
  }
  while ((match = exportFromPattern.exec(text))) {
    const specifier = mark(match[1]);
    pushImportRef(refs, { specifier, symbols: [], kind: 'export' });
  }
  while ((match = assignedWindowImportPattern.exec(text))) {
    const specifier = mark(match[2]);
    pushImportRef(refs, { specifier, symbols: parseDynamicImportSymbols(match[1]), kind: 'dynamic' });
  }
  while ((match = dynamicImportPattern.exec(text))) {
    const specifier = mark(match[1]);
    pushImportRef(refs, { specifier, symbols: [], kind: 'dynamic' });
  }

  const seen = new Set();
  return refs.filter((ref) => {
    if (!imports.has(ref.specifier)) return false;
    const key = `${ref.kind}\u0000${ref.specifier}\u0000${ref.symbols.join('\u0001')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractComponents(source) {
  const text = normalizeString(source);
  const names = new Set();
  const functionPattern = /\bfunction\s+([A-Z][A-Za-z0-9_$]*)\s*\(/g;
  const constPattern = /\bconst\s+([A-Z][A-Za-z0-9_$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>/g;
  let match;
  while ((match = functionPattern.exec(text))) names.add(match[1]);
  while ((match = constPattern.exec(text))) names.add(match[1]);
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
