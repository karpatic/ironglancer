import test from 'node:test';
import assert from 'node:assert/strict';

import { extractComponents, extractDeclarationSpans } from '../src/lib/import-parser.js';

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

test('extractComponents keeps returning sorted component names', () => {
  const source = [
    'const Beta = () => null;',
    'function Alpha() { return null; }',
    'function helper() { return null; }',
  ].join('\n');

  assert.deepEqual(extractComponents(source), ['Alpha', 'Beta']);
});
