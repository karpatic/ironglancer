import test from 'node:test';
import assert from 'node:assert/strict';

import { countIdentifierReferences, extractDeclarationSpans, extractImportRefs } from '../src/lib/import-parser.js';

test('extractImportRefs classifies dynamic, lazy, and require refs without dead duplicates', () => {
  const source = [
    "import DefaultThing, { NamedThing as namedAlias } from './static.js';",
    "import './side-effect.js';",
    "export { ReExport } from './re-export.js';",
    "const DYNAMIC_SPECIFIER = './dynamic.js';",
    "const WINDOW_SPECIFIER = './window.js';",
    "const LAZY_SPECIFIER = './lazy.js';",
    "const REQUIRE_SPECIFIER = './required.js';",
    'const { DynamicThing: DynamicAlias } = await import(DYNAMIC_SPECIFIER);',
    'const WindowModule = await window.import(WINDOW_SPECIFIER);',
    'loadCreatorModuleOnce(LAZY_SPECIFIER);',
    '<LazyBoundary specifier={LAZY_SPECIFIER} exportName="LazyExport" />;',
    'const { RequiredThing: RequiredAlias } = require(REQUIRE_SPECIFIER);',
    "const requiredNamespace = require('./namespace.cjs');",
    "require('./register.js');",
    "await import('./' + computedName);",
    'loadCreatorModuleOnce(computedSpecifier);',
    "// import Hidden from './commented.js';",
    'const text = "require(\'./string.js\')";',
  ].join('\n');

  assert.deepEqual(extractImportRefs(source), [
    {
      specifier: './static.js',
      bindings: [
        { imported: 'default', local: 'DefaultThing', kind: 'default', inferred: false },
        { imported: 'NamedThing', local: 'namedAlias', kind: 'named', inferred: false },
      ],
      kind: 'static',
    },
    { specifier: './side-effect.js', bindings: [], kind: 'side-effect' },
    { specifier: './re-export.js', bindings: [], kind: 'export' },
    {
      specifier: './dynamic.js',
      bindings: [
        { imported: 'DynamicThing', local: 'DynamicAlias', kind: 'named', inferred: false },
      ],
      kind: 'dynamic',
    },
    {
      specifier: './window.js',
      bindings: [
        { imported: '*', local: 'WindowModule', kind: 'namespace', inferred: false },
      ],
      kind: 'dynamic',
    },
    {
      specifier: './required.js',
      bindings: [
        { imported: 'RequiredThing', local: 'RequiredAlias', kind: 'named', inferred: false },
      ],
      kind: 'require',
    },
    {
      specifier: './namespace.cjs',
      bindings: [
        { imported: '*', local: 'requiredNamespace', kind: 'namespace', inferred: false },
      ],
      kind: 'require',
    },
    { specifier: './register.js', bindings: [], kind: 'require' },
    {
      specifier: './lazy.js',
      bindings: [
        { imported: 'LazyExport', local: 'LazyExport', kind: 'named', inferred: true },
      ],
      kind: 'lazy',
    },
  ]);
});

test('countIdentifierReferences preserves template interpolation code and ignores template text', () => {
  const source = [
    'const text = `helper appears as literal text',
    '  ${helper()}',
    '  ${nested(`${helperTwo()} helperTwo literal`)}',
    '`;',
  ].join('\n');

  assert.equal(countIdentifierReferences(source, 'helper'), 1);
  assert.equal(countIdentifierReferences(source, 'helperTwo'), 1);
});

test('extractDeclarationSpans measures one-line function and arrow declarations', () => {
  const source = [
    'export function OneLine() { return "{ not a block }"; }',
    'const InlineArrow = (value) => ({ value });',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'InlineArrow',
      kind: 'arrow',
      startLine: 2,
      endLine: 2,
      lineCount: 1,
    },
    {
      name: 'OneLine',
      kind: 'function',
      startLine: 1,
      endLine: 1,
      lineCount: 1,
    },
  ]);
});

test('extractDeclarationSpans measures multiline function bodies while ignoring comments and strings', () => {
  const source = [
    'export function MultiLine() {',
    '  const text = "}";',
    '  // } should not terminate the function',
    '  return text;',
    '}',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'MultiLine',
      kind: 'function',
      startLine: 1,
      endLine: 5,
      lineCount: 5,
    },
  ]);
});

test('extractDeclarationSpans measures function bodies while ignoring regex literal delimiters', () => {
  const source = [
    'export function RegexBrace(value, total) {',
    '  const closes = /}/.test(value);',
    '  const opens = /\\{/.test(value);',
    '  const either = /[/{}]/.test(value);',
    '  const ratio = total / value;',
    '  const comparison = total < /\\}/.source.length;',
    '  return closes || opens || either || ratio || comparison;',
    '}',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'RegexBrace',
      kind: 'function',
      startLine: 1,
      endLine: 8,
      lineCount: 8,
    },
  ]);
});

test('extractDeclarationSpans measures multiline JSX functions with adjacent closing tags', () => {
  const source = [
    'function ItemList({ items }) {',
    '  return <div>{items.map((item) => <span>{item.label}</span>)}</div>;',
    '}',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'ItemList',
      kind: 'function',
      startLine: 1,
      endLine: 3,
      lineCount: 3,
    },
  ]);
});

test('extractDeclarationSpans keeps one-line JSX arrows from absorbing later declarations', () => {
  const source = [
    'const InlineList = ({ items }) => <div>{items.map((item) => <span>{item.label}</span>)}</div>;',
    'const AfterList = () => null;',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'AfterList',
      kind: 'arrow',
      startLine: 2,
      endLine: 2,
      lineCount: 1,
    },
    {
      name: 'InlineList',
      kind: 'arrow',
      startLine: 1,
      endLine: 1,
      lineCount: 1,
    },
  ]);
});

test('extractDeclarationSpans measures JSX arrows with adjacent fragment closing tags', () => {
  const source = [
    'const FragmentList = ({ items }) => <>{items.map((item) => <>{item.label}</>)}</>;',
    'const AfterFragment = () => null;',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'AfterFragment',
      kind: 'arrow',
      startLine: 2,
      endLine: 2,
      lineCount: 1,
    },
    {
      name: 'FragmentList',
      kind: 'arrow',
      startLine: 1,
      endLine: 1,
      lineCount: 1,
    },
  ]);
});

test('extractDeclarationSpans measures function bodies after object default parameters', () => {
  const source = [
    'export function WithDefaultOptions(',
    '  options = {',
    '    nested: {',
    '      items: [1, 2, 3],',
    '    },',
    '  },',
    '  fallback = () => ({ ok: true })',
    ') {',
    '  return options;',
    '}',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'WithDefaultOptions',
      kind: 'function',
      startLine: 1,
      endLine: 10,
      lineCount: 10,
    },
  ]);
});

test('extractDeclarationSpans measures semicolonless literal arrow expression bodies', () => {
  const stringSource = "const Label = () => 'ok'";
  assert.deepEqual(extractDeclarationSpans(stringSource), [
    {
      name: 'Label',
      kind: 'arrow',
      startLine: 1,
      endLine: 1,
      lineCount: 1,
    },
  ]);

  const templateSource = [
    'const TemplateLabel = () => `ok {',
    '  ${value}',
    '  }`',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(templateSource), [
    {
      name: 'TemplateLabel',
      kind: 'arrow',
      startLine: 1,
      endLine: 3,
      lineCount: 3,
    },
  ]);
});

test('extractDeclarationSpans treats ASI-separated functions as declarations only in statement context', () => {
  const source = [
    'setup()',
    'function afterExpression() {',
    '  return true;',
    '}',
    '',
    'const value = 1',
    'function afterVariable() {',
    '  return value;',
    '}',
    '',
    'function outer() {',
    '  setup()',
    '  function innerAfterExpression() {',
    '    return true;',
    '  }',
    '  const innerValue = 1',
    '  function innerAfterVariable() {',
    '    return innerValue;',
    '  }',
    '}',
    '',
    'const assigned = function assignedHelper() {',
    '  return true;',
    '}',
    'setTimeout(function callbackHelper() {',
    '  return true;',
    '}, 1)',
  ].join('\n');

  const spansByName = new Map(extractDeclarationSpans(source).map((span) => [span.name, span]));

  assert.equal(spansByName.get('afterExpression').declarationType, 'function-declaration');
  assert.equal(spansByName.get('afterVariable').declarationType, 'function-declaration');
  assert.equal(spansByName.get('innerAfterExpression').declarationType, 'function-declaration');
  assert.equal(spansByName.get('innerAfterVariable').declarationType, 'function-declaration');
  assert.equal(spansByName.get('assignedHelper').declarationType, 'function-expression-name');
  assert.equal(spansByName.get('callbackHelper').declarationType, 'function-expression-name');
});

test('extractDeclarationSpans measures multiline arrow block bodies while ignoring templates', () => {
  const source = [
    'export const BlockArrow = () => {',
    '  const template = `}',
    '  still inside the template with { braces }',
    '`;',
    '  return template;',
    '};',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'BlockArrow',
      kind: 'arrow',
      startLine: 1,
      endLine: 6,
      lineCount: 6,
    },
  ]);
});

test('extractDeclarationSpans measures multiline arrow expression bodies', () => {
  const source = [
    'const MultilineExpression = (items) => (',
    '  items.map((item) => ({',
    '    id: item.id,',
    '  }))',
    ');',
  ].join('\n');

  assert.deepEqual(extractDeclarationSpans(source), [
    {
      name: 'MultilineExpression',
      kind: 'arrow',
      startLine: 1,
      endLine: 5,
      lineCount: 5,
    },
  ]);
});
