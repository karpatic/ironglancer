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

function normalizeImportSpecifierName(value) {
  return normalizeJsIdentifier(normalizeString(value).trim().replace(/^(?:type|typeof)\s+/, ''));
}

function importBindingKind(imported) {
  return imported === 'default' ? 'default' : 'named';
}

function parseNamedImportBindings(text, { destructured = false } = {}) {
  return parseNamedImportBindingMetadata(text, { destructured }).map((binding) => binding.local);
}

function parseNamedImportBindingMetadata(text, { destructured = false, inferred = false } = {}) {
  const names = [];
  for (const part of splitImportBindingParts(text)) {
    const cleaned = part
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/g, '')
      .trim();
    if (!cleaned) continue;
    const aliasMatch = destructured
      ? cleaned.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*$/)
      : cleaned.match(/^(?:(?:type|typeof)\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*$/);
    const imported = aliasMatch ? aliasMatch[1] : normalizeImportSpecifierName(cleaned);
    const local = aliasMatch ? aliasMatch[2] : imported;
    if (imported && local) {
      names.push({ imported, local, kind: importBindingKind(imported), inferred });
    }
  }
  return names;
}

function parseStaticImportSymbols(clause) {
  const text = normalizeString(clause).trim().replace(/^(?:type|typeof)\s+/, '');
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

function parseStaticImportBindings(clause) {
  const text = normalizeString(clause).trim().replace(/^(?:type|typeof)\s+/, '');
  if (!text) return [];
  const bindings = [];
  const defaultPart = text
    .replace(/\{[\s\S]*?\}/g, '')
    .replace(/\*\s+as\s+[A-Za-z_$][A-Za-z0-9_$]*/g, '')
    .split(',')
    .map((part) => normalizeJsIdentifier(part))
    .find(Boolean);
  if (defaultPart) {
    bindings.push({ imported: 'default', local: defaultPart, kind: 'default', inferred: false });
  }
  const namespaceMatch = text.match(/\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
  if (namespaceMatch) {
    bindings.push({ imported: '*', local: namespaceMatch[1], kind: 'namespace', inferred: false });
  }
  const namedMatch = text.match(/\{([\s\S]*?)\}/);
  if (namedMatch) bindings.push(...parseNamedImportBindingMetadata(namedMatch[1]));
  return bindings;
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

function parseDynamicImportBindings(binding) {
  const text = normalizeString(binding).trim();
  if (!text) return [];
  const destructured = text.match(/^\{([\s\S]*?)\}$/);
  if (destructured) return parseNamedImportBindingMetadata(destructured[1], { destructured: true });
  const name = normalizeJsIdentifier(text);
  return name ? [{ imported: '*', local: name, kind: 'namespace', inferred: false }] : [];
}

function unescapeStringLiteralValue(value) {
  return normalizeString(value).replace(/\\(['"\\])/g, '$1');
}

function collectStringConstants(source) {
  const text = normalizeString(source);
  const constants = new Map();
  const stringConstantPattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(['"])((?:\\.|(?!\2)[\s\S])*?)\2/g;
  let match;
  while ((match = stringConstantPattern.exec(text))) {
    constants.set(match[1], unescapeStringLiteralValue(match[3]));
  }
  return constants;
}

function resolveSpecifierExpression(expression, constants) {
  let text = normalizeString(expression).trim();
  if (!text) return '';
  const paneUrlMatch = text.match(/^paneUrl\s*\(\s*([\s\S]*?)\s*\)$/);
  if (paneUrlMatch) text = paneUrlMatch[1].trim();
  const literalMatch = text.match(/^(['"])((?:\\.|(?!\1)[\s\S])*?)\1$/);
  if (literalMatch) return unescapeStringLiteralValue(literalMatch[2]);
  const identifierMatch = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  if (identifierMatch) return constants.get(text) || '';
  return '';
}

function inferredNamedBinding(name, local = name) {
  const importedName = normalizeJsIdentifier(name);
  const localName = normalizeJsIdentifier(local);
  if (!importedName || !localName) return null;
  return {
    imported: importedName,
    local: localName,
    kind: 'named',
    inferred: true,
  };
}

function collectModulePropertyBindings(text, constants, specifierExpression) {
  const refs = [];
  const moduleCallPattern = new RegExp(`\\b(?:const|let|var)\\s+\\{([^}]*)\\}\\s*=\\s*\\b(?:use|load)[A-Za-z0-9_$]*Module(?:Once)?\\s*\\(\\s*(${specifierExpression})(?:\\s*,[^)]*)?\\s*\\)`, 'g');
  const moduleRefs = new Map();
  let match;
  while ((match = moduleCallPattern.exec(text))) {
    const moduleField = match[1].match(/(?:^|,)\s*module(?:\s*:\s*([A-Za-z_$][A-Za-z0-9_$]*))?\s*(?:,|$)/);
    if (!moduleField) continue;
    const moduleLocal = moduleField[1] || 'module';
    const specifier = resolveSpecifierExpression(match[2], constants);
    if (!specifier) continue;
    if (!moduleRefs.has(moduleLocal)) moduleRefs.set(moduleLocal, []);
    moduleRefs.get(moduleLocal).push({ specifier, index: match.index });
  }

  const propertyPattern = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([A-Za-z_$][A-Za-z0-9_$]*)\??\.([A-Za-z_$][A-Za-z0-9_$]*)\s*;?/g;
  while ((match = propertyPattern.exec(text))) {
    const candidates = (moduleRefs.get(match[2]) || [])
      .filter((candidate) => candidate.index < match.index);
    const candidate = candidates.at(-1);
    if (!candidate) continue;
    const binding = inferredNamedBinding(match[3], match[1]);
    if (binding) refs.push({
      specifier: candidate.specifier,
      symbols: [],
      bindings: [binding],
      kind: 'lazy',
    });
  }
  return refs;
}

function collectJsxExportNameBindings(text, constants) {
  const refs = [];
  const openingElementPattern = /<[A-Za-z][A-Za-z0-9_$.:-]*(?:\s+[^<>]*?)\/?>/g;
  const specifierAttrPattern = /\bspecifier\s*=\s*(?:\{\s*([^}]+?)\s*\}|(['"])((?:\\.|(?!\2)[\s\S])*?)\2)/;
  const exportNameAttrPattern = /\bexportName\s*=\s*(['"])((?:\\.|(?!\1)[\s\S])*?)\1/;
  let match;
  while ((match = openingElementPattern.exec(text))) {
    const tag = match[0];
    const specifierMatch = tag.match(specifierAttrPattern);
    const exportNameMatch = tag.match(exportNameAttrPattern);
    if (!specifierMatch || !exportNameMatch) continue;
    const specifier = specifierMatch[3]
      ? unescapeStringLiteralValue(specifierMatch[3])
      : resolveSpecifierExpression(specifierMatch[1], constants);
    const binding = inferredNamedBinding(unescapeStringLiteralValue(exportNameMatch[2]));
    if (specifier && binding) refs.push({ specifier, symbols: [], bindings: [binding], kind: 'lazy' });
  }
  return refs;
}

function normalizeImportBinding(binding) {
  const kind = normalizeString(binding?.kind || 'named').trim() || 'named';
  const imported = kind === 'namespace'
    ? '*'
    : kind === 'default'
      ? 'default'
      : normalizeJsIdentifier(binding?.imported);
  const local = normalizeJsIdentifier(binding?.local);
  if (!imported || !local) return null;
  return {
    imported,
    local,
    kind,
    inferred: Boolean(binding?.inferred),
  };
}

function pushImportRef(refs, ref) {
  const specifier = normalizeString(ref?.specifier).trim();
  if (!specifier) return;
  const bindings = (Array.isArray(ref.bindings) ? ref.bindings : [])
    .map((binding) => normalizeImportBinding(binding))
    .filter(Boolean);
  const seenBindings = new Set();
  refs.push({
    specifier,
    symbols: Array.from(new Set((Array.isArray(ref.symbols) ? ref.symbols : [])
      .map((symbol) => normalizeJsIdentifier(symbol))
      .filter(Boolean))),
    bindings: bindings.filter((binding) => {
      const key = `${binding.kind}\u0000${binding.imported}\u0000${binding.local}\u0000${binding.inferred}`;
      if (seenBindings.has(key)) return false;
      seenBindings.add(key);
      return true;
    }),
    kind: normalizeString(ref.kind || 'import').trim() || 'import',
  });
}

export function extractImportRefs(source) {
  const imports = new Set();
  const text = normalizeString(source);
  const constants = collectStringConstants(text);
  const refs = [];
  const specifierExpression = `(?:paneUrl\\s*\\(\\s*)?(?:['"](?:\\\\.|[^'"])*['"]|[A-Za-z_$][A-Za-z0-9_$]*)\\s*\\)?`;
  const staticImportPattern = /\bimport\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  const sideEffectImportPattern = /\bimport\s+['"]([^'"]+)['"]/g;
  const exportFromPattern = /\bexport\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  const assignedDynamicImportPattern = new RegExp(`\\b(?:const|let|var)\\s+(\\{[\\s\\S]*?\\}|[A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*await\\s+(?:import|window\\.import)\\s*\\(\\s*(${specifierExpression})\\s*\\)`, 'g');
  const dynamicImportPattern = new RegExp(`\\b(?:import|window\\.import)\\s*\\(\\s*(${specifierExpression})\\s*\\)`, 'g');
  const lazyModuleCallPattern = /\b(?:use|load)[A-Za-z0-9_$]*Module(?:Once)?\s*\(\s*([A-Za-z_$][A-Za-z0-9_$]*|['"](?:\\.|[^'"])*['"])/g;
  const jsxSpecifierPropPattern = /\bspecifier\s*=\s*(?:\{\s*([^}]+?)\s*\}|(['"])((?:\\.|(?!\2)[\s\S])*?)\2)/g;

  const mark = (specifier) => {
    const value = normalizeString(specifier).trim();
    if (value) imports.add(value);
    return value;
  };

  let match;
  while ((match = staticImportPattern.exec(text))) {
    const specifier = mark(match[2]);
    pushImportRef(refs, {
      specifier,
      symbols: parseStaticImportSymbols(match[1]),
      bindings: parseStaticImportBindings(match[1]),
      kind: 'static',
    });
  }
  while ((match = sideEffectImportPattern.exec(text))) {
    const specifier = mark(match[1]);
    pushImportRef(refs, { specifier, symbols: [], kind: 'side-effect' });
  }
  while ((match = exportFromPattern.exec(text))) {
    const specifier = mark(match[1]);
    pushImportRef(refs, { specifier, symbols: [], kind: 'export' });
  }
  while ((match = assignedDynamicImportPattern.exec(text))) {
    const specifier = mark(resolveSpecifierExpression(match[2], constants));
    pushImportRef(refs, {
      specifier,
      symbols: parseDynamicImportSymbols(match[1]),
      bindings: parseDynamicImportBindings(match[1]),
      kind: 'dynamic',
    });
  }
  while ((match = dynamicImportPattern.exec(text))) {
    const specifier = mark(resolveSpecifierExpression(match[1], constants));
    pushImportRef(refs, { specifier, symbols: [], kind: 'dynamic' });
  }
  while ((match = lazyModuleCallPattern.exec(text))) {
    const specifier = mark(resolveSpecifierExpression(match[1], constants));
    pushImportRef(refs, { specifier, symbols: [], kind: 'lazy' });
  }
  while ((match = jsxSpecifierPropPattern.exec(text))) {
    const specifier = match[3]
      ? mark(unescapeStringLiteralValue(match[3]))
      : mark(resolveSpecifierExpression(match[1], constants));
    pushImportRef(refs, { specifier, symbols: [], kind: 'lazy' });
  }
  for (const ref of collectModulePropertyBindings(text, constants, specifierExpression)) {
    mark(ref.specifier);
    pushImportRef(refs, ref);
  }
  for (const ref of collectJsxExportNameBindings(text, constants)) {
    mark(ref.specifier);
    pushImportRef(refs, ref);
  }

  const seen = new Set();
  return refs.filter((ref) => {
    if (!imports.has(ref.specifier)) return false;
    const bindingKey = ref.bindings
      .map((binding) => `${binding.kind}\u0002${binding.imported}\u0002${binding.local}\u0002${binding.inferred}`)
      .join('\u0001');
    const key = `${ref.kind}\u0000${ref.specifier}\u0000${ref.symbols.join('\u0001')}\u0000${bindingKey}`;
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
