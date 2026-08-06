import path from 'node:path';

import { parse } from '@babel/parser';

import { compareLocale, normalizeString, toPosixPath } from './utils.js';

const BROWSER_SCRIPT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs']);
const BROWSER_GLOBALS = new Map([
  ['window', 'browser:window'],
  ['document', 'browser:document'],
  ['navigator', 'browser:navigator'],
  ['location', 'browser:location'],
  ['history', 'browser:history'],
  ['localStorage', 'browser:localStorage'],
  ['sessionStorage', 'browser:sessionStorage'],
  ['indexedDB', 'browser:indexedDB'],
  ['caches', 'browser:caches'],
  ['fetch', 'browser:fetch'],
  ['URL', 'browser:URL'],
  ['URLSearchParams', 'browser:URLSearchParams'],
  ['WebSocket', 'browser:WebSocket'],
  ['Worker', 'browser:Worker'],
  ['SharedWorker', 'browser:SharedWorker'],
  ['BroadcastChannel', 'browser:BroadcastChannel'],
  ['crypto', 'browser:crypto'],
  ['performance', 'browser:performance'],
  ['requestAnimationFrame', 'browser:animation-frame'],
  ['cancelAnimationFrame', 'browser:animation-frame'],
  ['addEventListener', 'browser:event-target'],
  ['removeEventListener', 'browser:event-target'],
  ['matchMedia', 'browser:media-query'],
]);
const IGNORED_TRAVERSE_KEYS = new Set([
  'comments',
  'end',
  'errors',
  'extra',
  'innerComments',
  'leadingComments',
  'loc',
  'start',
  'trailingComments',
  'tokens',
]);

export function isBrowserScriptPath(modulePath) {
  return BROWSER_SCRIPT_EXTENSIONS.has(path.posix.extname(toPosixPath(modulePath)).toLowerCase());
}

function parseSourceFile(filePath, sourceText) {
  try {
    return parse(sourceText, {
      sourceFilename: filePath,
      sourceType: 'module',
      errorRecovery: true,
      plugins: ['jsx', 'importAttributes'],
    });
  } catch (error) {
    throw new Error(`Unable to parse browser JavaScript/JSX module ${toPosixPath(filePath)}: ${error.message}`);
  }
}

function childNodes(node) {
  const children = [];
  if (!node || typeof node !== 'object') return children;
  for (const [key, value] of Object.entries(node)) {
    if (IGNORED_TRAVERSE_KEYS.has(key)) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item.type === 'string') children.push(item);
      }
    } else if (value && typeof value.type === 'string') {
      children.push(value);
    }
  }
  return children;
}

function traverseAst(root, enter) {
  const visit = (node, parent = null, grandparent = null) => {
    if (!node || typeof node.type !== 'string') return;
    enter(node, parent, grandparent);
    for (const child of childNodes(node)) visit(child, node, parent);
  };
  visit(root);
}

function lineNumberAtSourcePosition(sourceFile, position) {
  const loc = sourceFile.loc && Number.isInteger(position)
    ? sourceFile.loc
    : null;
  return loc?.start?.line || 1;
}

function columnNumberAtSourcePosition(sourceFile, position) {
  const loc = sourceFile.loc && Number.isInteger(position)
    ? sourceFile.loc
    : null;
  return Number.isInteger(loc?.start?.column) ? loc.start.column + 1 : 1;
}

function nodeStart(node) {
  return Number.isInteger(node?.start) ? node.start : 0;
}

function nodeInclusiveEnd(node) {
  return Number.isInteger(node?.end) ? Math.max(nodeStart(node), node.end - 1) : nodeStart(node);
}

function declarationSpan({
  name,
  kind,
  node,
  nameNode,
  startNode = node,
  endNode = node,
  declarationType,
}) {
  const startIndex = nodeStart(startNode);
  const endIndex = nodeInclusiveEnd(endNode);
  const startLine = startNode?.loc?.start?.line || 1;
  const endLine = endNode?.loc?.end?.line || startLine;
  const nameStartIndex = Number.isInteger(nameNode?.start) ? nameNode.start : null;
  const span = {
    name,
    kind,
    startLine,
    endLine,
    lineCount: endLine - startLine + 1,
  };
  Object.defineProperties(span, {
    startIndex: { value: startIndex },
    endIndex: { value: endIndex },
    nameStartIndex: { value: nameStartIndex },
    nameEndIndex: { value: Number.isInteger(nameStartIndex) ? nameStartIndex + name.length : null },
    declarationType: { value: declarationType },
  });
  return span;
}

function identifierName(node) {
  return node?.type === 'Identifier' ? node.name : '';
}

function variableStatementForDeclaration(parent, grandparent) {
  return grandparent?.type === 'ExportNamedDeclaration' || grandparent?.type === 'ExportDefaultDeclaration'
    ? grandparent
    : parent;
}

function functionDeclarationType(node) {
  if (node?.type === 'FunctionDeclaration') return 'function-declaration';
  if (node?.type === 'FunctionExpression') return 'function-expression-name';
  return 'arrow-variable';
}

function collectDeclarationSpans(sourceFile) {
  const spans = [];
  traverseAst(sourceFile.program, (node, parent, grandparent) => {
    if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.id && node.body) {
      const name = identifierName(node.id);
      if (name) {
        spans.push(declarationSpan({
          name,
          kind: 'function',
          node,
          nameNode: node.id,
          declarationType: functionDeclarationType(node),
        }));
      }
    }

    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init) {
      const initializer = node.init;
      if (initializer.type === 'ArrowFunctionExpression' || initializer.type === 'FunctionExpression') {
        const statement = variableStatementForDeclaration(parent, grandparent) || node;
        spans.push(declarationSpan({
          name: node.id.name,
          kind: initializer.type === 'ArrowFunctionExpression' ? 'arrow' : 'function',
          node,
          nameNode: node.id,
          startNode: statement,
          endNode: initializer,
          declarationType: initializer.type === 'ArrowFunctionExpression'
            ? 'arrow-variable'
            : 'function-expression-name',
        }));
      }
    }
  });
  return spans.sort((a, b) => compareLocale(a.name, b.name)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || compareLocale(a.kind, b.kind));
}

function stringLiteralText(node) {
  if (!node) return '';
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'DirectiveLiteral') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? node.quasis[0]?.value?.raw ?? '';
  }
  return '';
}

function collectStringConstants(sourceFile) {
  const constants = new Map();
  traverseAst(sourceFile.program, (node) => {
    if (
      node.type === 'VariableDeclarator'
      && node.id?.type === 'Identifier'
      && node.init
    ) {
      const value = stringLiteralText(node.init);
      if (value) constants.set(node.id.name, value);
    }
  });
  return constants;
}

function staticStringExpressionText(node, constants) {
  const literal = stringLiteralText(node);
  if (literal) return literal;
  if (node?.type === 'Identifier') return constants.get(node.name) || '';
  return '';
}

function bindingKind(imported) {
  return imported === 'default' ? 'default' : 'named';
}

function importDeclarationRef(node) {
  const specifier = stringLiteralText(node.source);
  if (!specifier) return null;
  const bindings = [];
  for (const imported of Array.isArray(node.specifiers) ? node.specifiers : []) {
    if (imported.type === 'ImportDefaultSpecifier') {
      bindings.push({
        imported: 'default',
        local: imported.local.name,
        kind: 'default',
        inferred: false,
      });
    } else if (imported.type === 'ImportNamespaceSpecifier') {
      bindings.push({
        imported: '*',
        local: imported.local.name,
        kind: 'namespace',
        inferred: false,
      });
    } else if (imported.type === 'ImportSpecifier') {
      const importedName = identifierName(imported.imported) || stringLiteralText(imported.imported);
      bindings.push({
        imported: importedName,
        local: imported.local.name,
        kind: bindingKind(importedName),
        inferred: false,
      });
    }
  }
  return {
    specifier,
    kind: bindings.length > 0 ? 'static' : 'side-effect',
    bindings,
  };
}

function exportDeclarationRef(node) {
  const specifier = stringLiteralText(node.source);
  if (!specifier) return null;
  const bindings = [];
  for (const exported of Array.isArray(node.specifiers) ? node.specifiers : []) {
    if (exported.type !== 'ExportSpecifier') continue;
    const imported = identifierName(exported.local) || stringLiteralText(exported.local);
    const local = identifierName(exported.exported) || stringLiteralText(exported.exported);
    if (imported && local) {
      bindings.push({
        imported,
        local,
        kind: 'named',
        inferred: false,
      });
    }
  }
  return { specifier, kind: 'export', bindings };
}

function normalizeBinding(binding = {}) {
  const kind = normalizeString(binding.kind || 'named').trim() || 'named';
  const imported = kind === 'namespace'
    ? '*'
    : kind === 'default'
      ? 'default'
      : normalizeString(binding.imported).trim();
  const local = normalizeString(binding.local).trim();
  if (!imported || !local) return null;
  return {
    imported,
    local,
    kind,
    inferred: Boolean(binding.inferred),
  };
}

function normalizeRef(ref = {}) {
  const specifier = normalizeString(ref?.specifier).trim();
  if (!specifier) return null;
  const bindings = (Array.isArray(ref.bindings) ? ref.bindings : [])
    .map(normalizeBinding)
    .filter(Boolean)
    .sort((a, b) => compareLocale(a.kind, b.kind)
      || compareLocale(a.imported, b.imported)
      || compareLocale(a.local, b.local));
  return {
    specifier,
    bindings,
    kind: normalizeString(ref.kind || 'static').trim() || 'static',
  };
}

function calleeName(node) {
  if (!node) return '';
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'ThisExpression') return 'this';
  if (node.type === 'Super') return 'super';
  if (node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') {
    if (node.computed) return '';
    const property = identifierName(node.property);
    const object = calleeName(node.object);
    return object && property ? `${object}.${property}` : property;
  }
  return '';
}

function importedSpecifierFromImportExpression(node, constants) {
  if (!node) return '';
  if (node.type === 'AwaitExpression') return importedSpecifierFromImportExpression(node.argument, constants);
  if (node.type === 'ImportExpression') return staticStringExpressionText(node.source, constants);
  if (node.type !== 'CallExpression' && node.type !== 'OptionalCallExpression') return '';
  const name = calleeName(node.callee);
  if (node.callee?.type !== 'Import' && name !== 'window.import') return '';
  return node.arguments[0] ? staticStringExpressionText(node.arguments[0], constants) : '';
}

function firstImportedSpecifierInExpression(node, constants) {
  const direct = importedSpecifierFromImportExpression(node, constants);
  if (direct) return direct;
  let found = '';
  const visit = (candidate) => {
    if (!candidate || found) return;
    const specifier = importedSpecifierFromImportExpression(candidate, constants);
    if (specifier) {
      found = specifier;
      return;
    }
    for (const child of childNodes(candidate)) visit(child);
  };
  visit(node);
  return found;
}

function importedSpecifierFromLazyInitializer(node, constants) {
  if (node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression') {
    if (node.body?.type === 'BlockStatement') {
      for (const statement of node.body.body || []) {
        if (statement.type === 'ReturnStatement') {
          const specifier = firstImportedSpecifierInExpression(statement.argument, constants);
          if (specifier) return specifier;
        }
      }
      return '';
    }
    return firstImportedSpecifierInExpression(node.body, constants);
  }
  return '';
}

function workerSpecifierFromExpression(node, constants) {
  if (!node || !['CallExpression', 'NewExpression'].includes(node.type)) return '';
  const name = calleeName(node.callee);
  if (name !== 'Worker' && name !== 'SharedWorker') return '';
  const first = node.arguments?.[0];
  if (!first) return '';
  const literal = staticStringExpressionText(first, constants);
  if (literal) return literal;
  if (
    first.type === 'NewExpression'
    && calleeName(first.callee) === 'URL'
    && first.arguments?.[0]
  ) {
    return staticStringExpressionText(first.arguments[0], constants);
  }
  return '';
}

function bindingNameFromNameNode(node) {
  return node?.type === 'Identifier' ? node.name : '';
}

function dynamicImportBindingsFromBindingName(node) {
  if (!node) return [];
  if (node.type === 'Identifier') {
    return [{
      imported: '*',
      local: node.name,
      kind: 'namespace',
      inferred: false,
    }];
  }
  if (node.type === 'ObjectPattern') {
    return node.properties
      .map((property) => {
        if (property.type !== 'ObjectProperty') return null;
        const imported = identifierName(property.key) || stringLiteralText(property.key);
        const local = bindingNameFromNameNode(property.value);
        if (!imported || !local) return null;
        return {
          imported,
          local,
          kind: imported === 'default' ? 'default' : 'named',
          inferred: false,
        };
      })
      .filter(Boolean);
  }
  return [];
}

function lazyComponentBindingFromBindingName(node) {
  if (!node || node.type !== 'Identifier') return [];
  return [{
    imported: 'default',
    local: node.name,
    kind: 'default',
    inferred: false,
  }];
}

function expressionFromMaybeAwait(node) {
  if (node?.type === 'AwaitExpression') return node.argument;
  return node;
}

function commonJsRefFromAssignment(node) {
  if (node?.type !== 'AssignmentExpression' || node.operator !== '=') return null;
  const leftName = calleeName(node.left);
  if (leftName !== 'module.exports' && !leftName.startsWith('exports.')) return null;
  return {
    kind: 'commonjs-export',
    specifier: '',
    line: node.loc?.start?.line || 1,
    column: Number.isInteger(node.loc?.start?.column) ? node.loc.start.column + 1 : 1,
  };
}

function collectImportRefs(sourceFile) {
  const refs = [];
  const commonJsRefs = [];
  const constants = collectStringConstants(sourceFile);

  traverseAst(sourceFile.program, (node) => {
    if (node.type === 'VariableDeclarator' && node.init) {
      const expression = expressionFromMaybeAwait(node.init);
      const specifier = importedSpecifierFromImportExpression(expression, constants);
      const bindings = specifier ? dynamicImportBindingsFromBindingName(node.id) : [];
      if (specifier && bindings.length > 0) refs.push({ specifier, kind: 'dynamic', bindings });

      const lazySpecifier = ['React.lazy', 'lazy'].includes(calleeName(expression?.callee))
        ? importedSpecifierFromLazyInitializer(expression.arguments?.[0], constants)
        : '';
      const lazyBindings = lazySpecifier ? lazyComponentBindingFromBindingName(node.id) : [];
      if (lazySpecifier && lazyBindings.length > 0) {
        refs.push({ specifier: lazySpecifier, kind: 'lazy', bindings: lazyBindings });
      }
    }

    const declarationRef = node.type === 'ImportDeclaration'
      ? importDeclarationRef(node)
      : (node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration')
        ? exportDeclarationRef(node)
        : null;
    const normalizedDeclarationRef = normalizeRef(declarationRef);
    if (normalizedDeclarationRef) refs.push(normalizedDeclarationRef);

    const dynamicSpecifier = importedSpecifierFromImportExpression(node, constants);
    if (dynamicSpecifier) refs.push({ specifier: dynamicSpecifier, kind: 'dynamic', bindings: [] });

    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      const callName = calleeName(node.callee);
      const lazySpecifier = ['React.lazy', 'lazy'].includes(callName)
        ? importedSpecifierFromLazyInitializer(node.arguments?.[0], constants)
        : '';
      if (lazySpecifier) refs.push({ specifier: lazySpecifier, kind: 'lazy', bindings: [] });

      const workerSpecifier = workerSpecifierFromExpression(node, constants);
      if (workerSpecifier) refs.push({ specifier: workerSpecifier, kind: 'worker', bindings: [] });

      if (callName === 'require') {
        commonJsRefs.push({
          kind: 'require-call',
          specifier: stringLiteralText(node.arguments?.[0]) || '',
          line: node.loc?.start?.line || 1,
          column: Number.isInteger(node.loc?.start?.column) ? node.loc.start.column + 1 : 1,
        });
      }
    }

    const commonJsRef = commonJsRefFromAssignment(node);
    if (commonJsRef) commonJsRefs.push(commonJsRef);
  });

  const seen = new Set();
  const normalizedRefs = refs
    .map(normalizeRef)
    .filter(Boolean);
  const refsWithBindings = new Set(normalizedRefs
    .filter((ref) => ref.bindings.length > 0)
    .map((ref) => `${ref.kind}\u0000${ref.specifier}`));
  const imports = normalizedRefs
    .filter((ref) => !(ref.bindings.length === 0 && refsWithBindings.has(`${ref.kind}\u0000${ref.specifier}`)))
    .filter((ref) => {
      const key = [ref.kind, ref.specifier, JSON.stringify(ref.bindings)].join('\u0000');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => compareLocale(a.kind, b.kind)
      || compareLocale(a.specifier, b.specifier)
      || compareLocale(JSON.stringify(a.bindings), JSON.stringify(b.bindings)));
  return { imports, commonJsRefs };
}

function jsxTagName(node) {
  if (!node) return '';
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') return `${jsxTagName(node.object)}.${jsxTagName(node.property)}`;
  if (node.type === 'JSXNamespacedName') return `${jsxTagName(node.namespace)}:${jsxTagName(node.name)}`;
  return '';
}

function isComponentName(name) {
  return /^[A-Z]/.test(normalizeString(name).split('.')[0] || '');
}

function jsxAttribute(attributes, name) {
  return (attributes || []).find((candidate) => (
    candidate.type === 'JSXAttribute' && candidate.name?.name === name
  )) || null;
}

function jsxAttributeValue(attributes, name) {
  const property = jsxAttribute(attributes, name);
  if (!property || !property.value) return '';
  if (property.value.type === 'StringLiteral') return property.value.value;
  if (
    property.value.type === 'JSXExpressionContainer'
    && property.value.expression
  ) {
    return stringLiteralText(property.value.expression);
  }
  return '';
}

function jsxAttributeExpression(attributes, name) {
  const property = jsxAttribute(attributes, name);
  if (!property || property.value?.type !== 'JSXExpressionContainer') return null;
  return property.value.expression || null;
}

function firstComponentNameInExpression(node) {
  if (!node) return '';
  if (node.type === 'Identifier' && isComponentName(node.name)) return node.name;
  if (node.type === 'JSXElement') return jsxTagName(node.openingElement?.name);
  if (node.type === 'JSXFragment') return 'Fragment';
  let found = '';
  for (const child of childNodes(node)) {
    if (!found) found = firstComponentNameInExpression(child);
  }
  return found;
}

function objectPropertyName(node) {
  return identifierName(node) || stringLiteralText(node);
}

function objectLiteralPropertyString(node, propertyName) {
  if (node?.type !== 'ObjectExpression') return '';
  const property = (node.properties || []).find((candidate) => (
    candidate.type === 'ObjectProperty'
    && objectPropertyName(candidate.key) === propertyName
  ));
  return property ? stringLiteralText(property.value) : '';
}

function objectLiteralPropertyComponent(node) {
  if (node?.type !== 'ObjectExpression') return '';
  const keys = new Set(['element', 'Component', 'component']);
  for (const property of node.properties || []) {
    if (property.type !== 'ObjectProperty' || !keys.has(objectPropertyName(property.key))) continue;
    return firstComponentNameInExpression(property.value);
  }
  return '';
}

function routeObjectsFromExpression(node) {
  if (!node || node.type !== 'ArrayExpression') return [];
  const routes = [];
  const visitRouteObject = (objectNode, parentPath = '') => {
    if (objectNode?.type !== 'ObjectExpression') return;
    const routePath = objectLiteralPropertyString(objectNode, 'path');
    const component = objectLiteralPropertyComponent(objectNode);
    const fullPath = routePath
      ? routePath.startsWith('/') || !parentPath
        ? routePath
        : `${parentPath.replace(/\/+$/g, '')}/${routePath.replace(/^\/+/g, '')}`
      : parentPath;
    if (fullPath || component) {
      routes.push({
        path: fullPath || '',
        component,
        adapter: 'react-router',
        sourceKind: 'createBrowserRouter',
        line: objectNode.loc?.start?.line || 1,
      });
    }
    const childrenProperty = (objectNode.properties || []).find((candidate) => (
      candidate.type === 'ObjectProperty'
      && objectPropertyName(candidate.key) === 'children'
      && candidate.value?.type === 'ArrayExpression'
    ));
    if (childrenProperty) {
      for (const child of childrenProperty.value.elements || []) visitRouteObject(child, fullPath);
    }
  };
  for (const element of node.elements || []) visitRouteObject(element);
  return routes;
}

function nearestDeclarationName(declarationSpans, index) {
  const candidates = declarationSpans
    .filter((span) => Number.isInteger(span.startIndex)
      && Number.isInteger(span.endIndex)
      && index >= span.startIndex
      && index <= span.endIndex)
    .sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex));
  return candidates[0]?.name || '';
}

function collectFrontEndFacts(sourceFile, declarationSpans) {
  const components = new Map();
  const componentRefs = [];
  const routes = [];
  const browserApis = new Map();

  for (const span of declarationSpans) {
    if (/^[A-Z]/.test(span.name) || /^use[A-Z0-9]/.test(span.name)) {
      components.set(span.name, {
        name: span.name,
        kind: /^[A-Z]/.test(span.name) ? 'component' : 'hook',
        modulePath: '',
        startLine: span.startLine,
        endLine: span.endLine,
      });
    }
  }

  const addBrowserApi = (name, node) => {
    const api = BROWSER_GLOBALS.get(name);
    if (!api) return;
    const line = lineNumberAtSourcePosition(node, nodeStart(node));
    const key = `${api}\u0000${line}`;
    if (!browserApis.has(key)) {
      browserApis.set(key, {
        api,
        name,
        line,
        column: columnNumberAtSourcePosition(node, nodeStart(node)),
      });
    }
  };

  traverseAst(sourceFile.program, (node) => {
    if (node.type === 'JSXOpeningElement') {
      const tag = jsxTagName(node.name);
      const line = node.loc?.start?.line || 1;
      const owner = nearestDeclarationName(declarationSpans, nodeStart(node));
      if (isComponentName(tag)) {
        componentRefs.push({
          owner,
          component: tag,
          line,
          sourceKind: 'jsx-element',
        });
      }
      if (tag === 'Route' || tag.endsWith('.Route')) {
        const routePath = jsxAttributeValue(node.attributes, 'path') || jsxAttributeValue(node.attributes, 'index');
        const elementExpression = jsxAttributeExpression(node.attributes, 'element')
          || jsxAttributeExpression(node.attributes, 'Component');
        routes.push({
          path: routePath === 'true' ? '' : routePath,
          component: firstComponentNameInExpression(elementExpression),
          adapter: 'react-router',
          sourceKind: 'jsx-route',
          line,
        });
      }
    }

    if (node.type === 'CallExpression' && calleeName(node.callee) === 'createBrowserRouter') {
      routes.push(...routeObjectsFromExpression(node.arguments?.[0]));
    }

    if (node.type === 'Identifier') addBrowserApi(node.name, node);
  });

  return {
    components: Array.from(components.values()).sort((a, b) => compareLocale(a.name, b.name)),
    componentRefs: componentRefs.sort((a, b) => compareLocale(a.owner, b.owner)
      || compareLocale(a.component, b.component)
      || a.line - b.line),
    routes: routes
      .filter((route) => route.path || route.component)
      .sort((a, b) => compareLocale(a.path, b.path)
        || compareLocale(a.component, b.component)
        || a.line - b.line),
    browserApis: Array.from(browserApis.values())
      .sort((a, b) => compareLocale(a.api, b.api) || a.line - b.line),
  };
}

export function createJavaScriptAstAnalysisContext() {
  const sourceFiles = new Map();
  const analyzer = {
    name: 'javascript-ast',
    parser: '@babel/parser',
    language: 'browser-jsx',
  };

  const sourceFileFor = (filePath, sourceText) => {
    const resolved = path.resolve(filePath);
    const cacheKey = `${resolved}\u0000${sourceText}`;
    if (!sourceFiles.has(cacheKey)) sourceFiles.set(cacheKey, parseSourceFile(resolved, sourceText));
    return sourceFiles.get(cacheKey);
  };

  return {
    analyzer,
    backend: analyzer,
    analyzeFile(filePath, sourceText) {
      if (!isBrowserScriptPath(filePath)) {
        throw new Error(`IronGlancer only analyzes browser JavaScript modules (.js, .jsx, .mjs): ${toPosixPath(filePath)}`);
      }
      const sourceFile = sourceFileFor(filePath, sourceText);
      const declarationSpans = collectDeclarationSpans(sourceFile);
      const { imports, commonJsRefs } = collectImportRefs(sourceFile);
      const facts = collectFrontEndFacts(sourceFile, declarationSpans);
      return {
        declarationSpans,
        importRefs: imports,
        commonJsRefs,
        typeOnlyRanges: [],
        ...facts,
      };
    },
  };
}
