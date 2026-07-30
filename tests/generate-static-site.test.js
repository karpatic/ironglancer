import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import vm from 'node:vm';

import { generateStaticSite } from '../src/lib/generate-static-site.js';

const fixtureRoot = path.resolve('tests/fixtures/sample-app');

class FakeElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.className = '';
    this.disabled = false;
    this.value = '';
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.scrollWidth = 1200;
    this.scrollHeight = 800;
    this.clientWidth = 800;
    this.clientHeight = 600;
    this.pointerCaptureCalls = [];
    this.open = false;
    this._textContent = '';
    this._innerHTML = '';
    this.classList = {
      add: (...names) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        for (const name of names) classes.add(name);
        this.className = Array.from(classes).join(' ');
        this.attributes.set('class', this.className);
      },
      remove: (...names) => {
        const removeNames = new Set(names);
        this.className = this.className
          .split(/\s+/)
          .filter((name) => name && !removeNames.has(name))
          .join(' ');
        this.attributes.set('class', this.className);
      },
      contains: (name) => this.className.split(/\s+/).includes(name),
    };
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  get textContent() {
    if (this.children.length > 0) {
      return this.children.map((child) => child.textContent).join('');
    }
    return this._textContent;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    if (this.id === 'diagram' && this._innerHTML.includes('<svg')) {
      const svg = this.ownerDocument.renderedSvgFactory
        ? this.ownerDocument.renderedSvgFactory(this.ownerDocument)
        : this.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = svg.viewBox || { baseVal: { width: 640, height: 320 } };
      this.appendChild(svg);
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }

  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  insertBefore(node, referenceNode) {
    node.parentNode = this;
    const index = this.children.indexOf(referenceNode);
    if (index === -1) {
      this.children.push(node);
      return node;
    }
    this.children.splice(index, 0, node);
    return node;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'class') this.className = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'disabled') this.disabled = true;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'class') this.className = '';
    if (name === 'id') this.id = '';
    if (name === 'disabled') this.disabled = false;
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatchEvent(event) {
    const eventObject = event || {};
    eventObject.target = eventObject.target || this;
    eventObject.currentTarget = this;
    if (typeof eventObject.preventDefault !== 'function') {
      eventObject.preventDefault = () => {
        eventObject.defaultPrevented = true;
      };
    }
    for (const listener of this.listeners.get(eventObject.type) || []) {
      listener(eventObject);
    }
    return !eventObject.defaultPrevented;
  }

  click() {
    if (this.disabled) return;
    for (const listener of this.listeners.get('click') || []) {
      listener({ type: 'click', target: this, preventDefault() {} });
    }
  }

  showModal() {
    this.open = true;
    this.setAttribute('open', '');
  }

  close() {
    this.open = false;
    this.removeAttribute('open');
  }

  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  select() {
    this.ownerDocument.selectedText = this.value;
  }

  setPointerCapture(pointerId) {
    this.pointerCaptureCalls.push(pointerId);
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight };
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.tagName.toLowerCase(), this.id);
    clone.ownerDocument = this.ownerDocument;
    clone.className = this.className;
    clone.disabled = this.disabled;
    clone.value = this.value;
    clone.scrollLeft = this.scrollLeft;
    clone.scrollTop = this.scrollTop;
    clone.scrollWidth = this.scrollWidth;
    clone.scrollHeight = this.scrollHeight;
    clone.clientWidth = this.clientWidth;
    clone.clientHeight = this.clientHeight;
    clone.open = this.open;
    clone._textContent = this._textContent;
    clone._innerHTML = this._innerHTML;
    clone.style = { ...this.style };
    clone.viewBox = this.viewBox;
    for (const [name, value] of this.attributes) clone.attributes.set(name, value);
    if (deep) {
      for (const child of this.children) clone.appendChild(child.cloneNode(true));
    }
    return clone;
  }

  matchesSelector(selector) {
    const attrMatches = Array.from(selector.matchAll(/\[([^\]=]+)(?:=(['"]?)(.*?)\2)?\]/g));
    const selectorWithoutAttrs = selector.replace(/\[[^\]]+\]/g, '');
    const [tagName, ...classNames] = selectorWithoutAttrs.split('.');
    if (tagName && this.tagName.toLowerCase() !== tagName.toLowerCase()) return false;
    for (const className of classNames) {
      if (!this.classList.contains(className)) return false;
    }
    for (const [, name, , expectedValue] of attrMatches) {
      const actualValue = this.getAttribute(name);
      if (actualValue == null) return false;
      if (expectedValue !== undefined && actualValue !== expectedValue) return false;
    }
    return true;
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (element) => {
      for (const child of element.children) {
        if (child.matchesSelector(selector)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

class FakeDocument {
  constructor(execCommand, renderedSvgFactory) {
    this.elements = new Map();
    this.renderedSvgFactory = renderedSvgFactory;
    this.selectedText = '';
    this.body = this.createElement('body');
    this.activeElement = null;
    this.execCommand = (command) => (execCommand ? execCommand(command, this) : false);
  }

  createElement(tagName) {
    const element = new FakeElement(tagName);
    element.ownerDocument = this;
    return element;
  }

  createElementNS(namespace, tagName) {
    return this.createElement(tagName);
  }

  getElementById(id) {
    if (!this.elements.has(id)) {
      const element = this.createElement('div');
      element.id = id;
      this.elements.set(id, element);
    }
    return this.elements.get(id);
  }
}

async function flushAsyncWork() {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  await Promise.resolve();
}

async function runGeneratedViewerApp({
  appJs,
  payload,
  sourcePayload,
  sourceResponseOk = true,
  sourceFetchReject = false,
  clipboardWriteText,
  execCommand,
  renderedSvgFactory,
  renderedSvgMarkup = '<svg viewBox="0 0 640 320"></svg>',
}) {
  const document = new FakeDocument(execCommand, renderedSvgFactory);
  const context = {
    Blob,
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL() {},
    },
    document,
    navigator: clipboardWriteText ? { clipboard: { writeText: clipboardWriteText } } : {},
    fetch: async (url) => {
      if (!String(url).includes('source-code.json')) {
        return {
          ok: true,
          json: async () => payload,
        };
      }
      if (sourceFetchReject) throw new Error('source-code.json unavailable');
      return {
        ok: sourceResponseOk,
        json: async () => sourcePayload,
      };
    },
    requestAnimationFrame: (callback) => {
      callback();
      return 1;
    },
    setTimeout: () => 1,
    clearTimeout() {},
    __mermaid: {
      initialize() {},
      render: async () => ({ svg: renderedSvgMarkup }),
    },
  };
  context.globalThis = context;

  const source = appJs.replace(
    "import mermaid from './vendor/mermaid.esm.min.mjs';\n",
    'const mermaid = globalThis.__mermaid;\n',
  );
  assert.notEqual(source, appJs, 'expected generated app to import Mermaid');
  vm.runInNewContext(source, context, { filename: 'generated-viewer-app.js' });

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await flushAsyncWork();
    if (document.getElementById('mermaid').textContent === payload.mermaid) return { context, document };
  }
  throw new Error('generated viewer app did not finish rendering test payload');
}

async function writeTempProject(files) {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-fixture-'));
  await Promise.all(Object.entries(files).map(async ([relativePath, contents]) => {
    const filePath = path.join(rootDir, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents, 'utf8');
  }));
  return rootDir;
}

function createFakeMermaidEdge(document, { source, target, labelText = 'import' }) {
  const dataId = `id_${source}_${target}_fake`;
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const edgeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const originalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');

  pathElement.setAttribute('class', 'relation');
  pathElement.setAttribute('data-id', dataId);
  edgeLabel.setAttribute('class', 'edgeLabel');
  labelGroup.setAttribute('class', 'label');
  labelGroup.setAttribute('data-id', dataId);
  originalLabel.textContent = labelText;

  labelGroup.appendChild(originalLabel);
  edgeLabel.appendChild(labelGroup);
  group.append(pathElement, edgeLabel);

  return { edgeLabel, group, labelGroup, originalLabel, pathElement };
}

function createFakeMermaidClass(document, {
  classId,
  memberText,
  memberTexts = [memberText],
  classGroupId = 'classId-' + classId + '-0',
  memberBox = { x: 24, y: 48, width: 180, height: 18 },
}) {
  const classGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const methodsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  const wrapper = document.createElement('div');
  const span = document.createElement('span');
  const members = [];

  classGroup.setAttribute('id', classGroupId);
  methodsGroup.setAttribute('class', 'methods-group text');
  labelGroup.setAttribute('class', 'label');
  foreignObject.setAttribute('x', String(memberBox.x));
  foreignObject.setAttribute('y', String(memberBox.y));
  foreignObject.setAttribute('width', String(memberBox.width));
  foreignObject.setAttribute('height', String(memberBox.height));
  foreignObject.getBBox = () => ({ ...memberBox });
  for (const text of memberTexts.filter((value) => typeof value === 'string')) {
    const member = document.createElement('p');
    member.textContent = text;
    members.push(member);
    span.appendChild(member);
  }

  wrapper.appendChild(span);
  foreignObject.appendChild(wrapper);
  labelGroup.appendChild(foreignObject);
  methodsGroup.appendChild(labelGroup);
  classGroup.appendChild(methodsGroup);
  return { classGroup, member: members[0] || null, members };
}

test('generateStaticSite writes a static viewer bundle', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-'));
  const result = await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });

  assert.equal(result.entryRel, 'src/app.jsx');
  const files = await fs.readdir(outDir);
  assert.ok(files.includes('index.html'));
  assert.ok(files.includes('app.js'));
  assert.ok(files.includes('output.json'));
  assert.ok(files.includes('source-code.json'));
  assert.ok(files.includes('vendor'));

  const html = await fs.readFile(path.join(outDir, 'index.html'), 'utf8');
  assert.match(html, /\.\/app\.js/);
  assert.match(html, /<details class="panel collapsible-panel" id="jsx-tree-panel">/);
  assert.match(html, /<details class="panel collapsible-panel" id="mermaid-source-panel">/);
  assert.match(html, /<div id="selected-import" class="body selected-import-details"/);
  assert.match(html, />Selected import</);
  assert.doesNotMatch(html, /id="jsx-line-counts-panel"/);
  assert.doesNotMatch(html, />JSX line counts</);
  assert.doesNotMatch(html, />Open JSON</);
  assert.doesNotMatch(html, />Open Mermaid</);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:\s|>|=)/);
  assert.match(html, /id="source-dialog-previous"[^>]*aria-label="Previous source item"[^>]*disabled>Previous<\/button>/);
  assert.match(html, /id="source-dialog-next"[^>]*aria-label="Next source item"[^>]*disabled>Next<\/button>/);

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  assert.match(appJs, /payload\.jsxTreeText/);
  assert.doesNotMatch(appJs, /jsxScriptsEl|renderJsxScripts|jsxScriptsFromPayload/);

  const output = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  assert.equal(output.entry, 'src/app.jsx');
  assert.equal(output.summary.moduleCount, 5);
  assert.equal(output.summary.jsxFileCount, 3);
  assert.deepEqual(output.jsxScripts.map(({ path: scriptPath, lineCount }) => ({ path: scriptPath, lineCount })), [
    { path: 'src/app.jsx', lineCount: 9 },
    { path: 'src/components/App.jsx', lineCount: 3 },
    { path: 'src/panes/Inspector.jsx', lineCount: 3 },
  ]);
  assert.ok(output.jsxTreeText.includes('`-- src'));
  assert.ok(output.jsxTreeText.includes('app.jsx (9 lines)'));
  assert.ok(!output.jsxTreeText.includes('src/lib/util.js'));
  assert.ok(!output.jsxTreeText.includes('[external]'));
  assert.deepEqual(output.importEdges, result.importEdges);

  const sourceOutput = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));
  assert.match(output.meta.buildId, /^[a-f0-9]{64}$/);
  assert.match(output.meta.sourceCodeHash, /^[a-f0-9]{64}$/);
  assert.equal(sourceOutput.meta.buildId, output.meta.buildId);
  assert.equal(sourceOutput.meta.sourceCodeHash, output.meta.sourceCodeHash);
  assert.equal(sourceOutput.meta.packageName, output.meta.packageName);
  assert.equal(sourceOutput.meta.version, output.meta.version);
  assert.equal(sourceOutput.meta.generatedAt, output.meta.generatedAt);
  const helperSource = sourceOutput.declarations.find((item) => item.name === 'helper');
  assert.equal(helperSource.moduleId, 'app');
  assert.equal(helperSource.modulePath, 'src/lib/util.js');
  assert.equal(helperSource.startLine, 1);
  assert.equal(helperSource.endLine, 3);
  assert.equal(helperSource.code, "export function helper() {\n  return 'helper';\n}");
  assert.ok(!sourceOutput.declarations.some((item) => item.name === 'theme'));
  assert.ok(!sourceOutput.declarations.some((item) => item.name === 'remoteLib'));

  const vendorFiles = await fs.readdir(path.join(outDir, 'vendor'));
  assert.ok(vendorFiles.some((name) => name.includes('mermaid')));
});

test('generateStaticSite refuses credential-looking source snippets without rejecting validation copy', async () => {
  const safeRootDir = await writeTempProject({
    'src/app.jsx': [
      'export function App() {',
      '  const validationRules = {',
      "    password: 'Must be at least eight characters',",
      "    token: 'Enter the token from your email',",
      '  };',
      '  return <pre>{validationRules.password}</pre>;',
      '}',
    ].join('\n'),
  });
  await assert.doesNotReject(generateStaticSite({
    rootDir: safeRootDir,
    entry: 'src/app.jsx',
    outDir: path.join(safeRootDir, 'site'),
  }));

  const cases = [
    {
      name: 'VITE_API_KEY',
      importName: 'VITE_API_KEY',
      source: "export const VITE_API_KEY = 'vite_pk_1234567890abcdefABCDEF';",
    },
    {
      name: 'AWS_SECRET_ACCESS_KEY',
      importName: 'AWS_SECRET_ACCESS_KEY',
      source: "export const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';",
    },
    {
      name: 'plain token',
      importName: 'token',
      source: "export const token = 'tok_1234567890abcdefABCDEF';",
    },
    {
      name: 'Stripe live key',
      importName: 'publishable',
      source: "export const publishable = '"
        + ['sk', 'live', '1234567890abcdefABCDEF123456'].join('_')
        + "';",
    },
  ];

  for (const credentialCase of cases) {
    const rootDir = await writeTempProject({
      'src/app.jsx': [
        'export function App() {',
        `  ${credentialCase.source.replace('export const ', 'const ')}`,
        `  return <pre>{${credentialCase.importName}}</pre>;`,
        '}',
      ].join('\n'),
    });

    await assert.rejects(
      generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir: path.join(rootDir, 'site') }),
      /credential-looking literal/,
      credentialCase.name,
    );
  }
});

test('generated viewer opens visible member source snippets from scoped source payload', async () => {
  const rootDir = path.resolve('tests/fixtures/import-edge-metadata');
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-source-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const files = await fs.readdir(outDir);
  assert.ok(files.includes('source-code.json'));

  const sourcePayload = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));
  const appSource = await fs.readFile(path.join(rootDir, 'src/app.jsx'), 'utf8');
  const appLines = appSource.split(/\r\n|\r|\n/).slice(12, 28).join('\n');
  assert.deepEqual(sourcePayload.declarations.map(({ moduleId, modulePath, name, startLine, endLine }) => ({
    moduleId,
    modulePath,
    name,
    startLine,
    endLine,
  })), [
    {
      moduleId: 'app',
      modulePath: 'src/app.jsx',
      name: 'App',
      startLine: 13,
      endLine: 28,
    },
    {
      moduleId: 'dynamic_child',
      modulePath: 'src/dynamic-child.jsx',
      name: 'DynamicExport',
      startLine: 1,
      endLine: 3,
    },
    {
      moduleId: 'faculty_body_child',
      modulePath: 'src/faculty-body-child.jsx',
      name: 'CreatorViewBody',
      startLine: 1,
      endLine: 3,
    },
    {
      moduleId: 'faculty_editor_child',
      modulePath: 'src/faculty-editor-child.jsx',
      name: 'CreatorQuizEntryEditor',
      startLine: 1,
      endLine: 3,
    },
    {
      moduleId: 'static_child',
      modulePath: 'src/static-child.jsx',
      name: 'StaticDefault',
      startLine: 1,
      endLine: 3,
    },
    {
      moduleId: 'static_child',
      modulePath: 'src/static-child.jsx',
      name: 'StaticNamed',
      startLine: 5,
      endLine: 7,
    },
    {
      moduleId: 'static_child',
      modulePath: 'src/static-child.jsx',
      name: 'StaticSame',
      startLine: 9,
      endLine: 11,
    },
  ]);
  assert.equal(sourcePayload.declarations.find((item) => item.name === 'App').code, appLines);
  assert.ok(!sourcePayload.declarations.some((item) => item.name === 'useCreatorModule'));
  assert.ok(!sourcePayload.declarations.some((item) => item.name === 'UnusedChild'));

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  assert.equal(sourcePayload.meta.buildId, payload.meta.buildId);
  assert.equal(sourcePayload.meta.sourceCodeHash, payload.meta.sourceCodeHash);
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    sourcePayload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      Object.assign(rendered, createFakeMermaidClass(fakeDocument, {
        classId: 'app',
        memberText: '+16 App()',
      }));
      svg.appendChild(rendered.classGroup);
      return svg;
    },
  });

  assert.equal(rendered.member.getAttribute('role'), 'button');
  assert.equal(rendered.member.getAttribute('tabindex'), '0');
  assert.equal(rendered.member.getAttribute('aria-label'), 'Show source for App in src/app.jsx');

  const viewport = document.getElementById('diagram-viewport');
  viewport.dispatchEvent({
    type: 'pointerdown',
    pointerId: 17,
    pointerType: 'mouse',
    clientX: 20,
    clientY: 30,
    target: rendered.member,
  });
  assert.deepEqual(viewport.pointerCaptureCalls, []);
  assert.equal(viewport.classList.contains('is-dragging'), false);

  rendered.member.dispatchEvent({ type: 'keydown', key: 'Enter' });
  const dialog = document.getElementById('source-dialog');
  assert.equal(dialog.open, true);
  assert.equal(document.getElementById('source-dialog-title').textContent, 'App');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/app.jsx:13-28');
  const codeEl = document.getElementById('source-dialog-code');
  assert.equal(codeEl.textContent, appLines);
  assert.equal(codeEl.innerHTML, '');
  assert.equal(document.getElementById('source-dialog-previous').disabled, true);
  assert.equal(document.getElementById('source-dialog-next').disabled, true);

  document.getElementById('source-dialog-close').click();
  assert.equal(dialog.open, false);

  rendered.member.click();
  assert.equal(dialog.open, true);
  dialog.dispatchEvent({ type: 'click' });
  assert.equal(dialog.open, false);

  rendered.member.dispatchEvent({ type: 'keydown', key: ' ' });
  assert.equal(dialog.open, true);
  dialog.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(dialog.open, false);
});

test('generated viewer navigates imported script member source within its rendered sibling group', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { AlphaScript } from './shared.js';",
      "import { MissingScript } from './shared.js';",
      "import { OmegaScript } from './shared.js';",
      '',
      'export function View() {',
      '  return <div>{AlphaScript()}{MissingScript}{OmegaScript()}</div>;',
      '}',
    ].join('\n'),
    'src/shared.js': [
      'export function AlphaScript() {',
      "  return 'alpha';",
      '}',
      '',
      'export function OmegaScript() {',
      "  return 'omega';",
      '}',
    ].join('\n'),
  });
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-import-nav-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const sourcePayload = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));
  assert.deepEqual(sourcePayload.declarations.map(({
    name,
    sourceOrigin,
    sourceGroup,
    sourceOrder,
    sourceDisplayName,
  }) => ({
    name,
    sourceOrigin,
    sourceGroup,
    sourceOrder,
    sourceDisplayName,
  })), [
    {
      name: 'AlphaScript',
      sourceOrigin: 'imported-script-member',
      sourceGroup: 'app:imported-script-members',
      sourceOrder: 0,
      sourceDisplayName: '3 AlphaScript',
    },
    {
      name: 'OmegaScript',
      sourceOrigin: 'imported-script-member',
      sourceGroup: 'app:imported-script-members',
      sourceOrder: 1,
      sourceDisplayName: '3 OmegaScript',
    },
    {
      name: 'View',
      sourceOrigin: 'current-file-declaration',
      sourceGroup: 'app:current-file-declarations',
      sourceOrder: 0,
      sourceDisplayName: '3 View()',
    },
  ]);
  assert.ok(!sourcePayload.declarations.some((item) => item.name === 'MissingScript'));
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    sourcePayload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      Object.assign(rendered, createFakeMermaidClass(fakeDocument, {
        classId: 'app',
        memberTexts: [
          '+3 AlphaScript',
          '+MissingScript',
          '+3 OmegaScript',
          '+3 View()',
        ],
      }));
      svg.appendChild(rendered.classGroup);
      return svg;
    },
  });

  const dialog = document.getElementById('source-dialog');
  const previousBtn = document.getElementById('source-dialog-previous');
  const nextBtn = document.getElementById('source-dialog-next');
  rendered.members[0].click();
  assert.equal(dialog.open, true);
  assert.equal(document.getElementById('source-dialog-title').textContent, 'AlphaScript');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/shared.js:1-3');
  assert.equal(previousBtn.disabled, true);
  assert.equal(nextBtn.disabled, false);

  nextBtn.click();
  assert.equal(dialog.open, true);
  assert.equal(document.getElementById('source-dialog-title').textContent, 'OmegaScript');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/shared.js:5-7');
  assert.equal(
    document.getElementById('source-dialog-code').textContent,
    "export function OmegaScript() {\n  return 'omega';\n}",
  );
  assert.equal(previousBtn.disabled, false);
  assert.equal(nextBtn.disabled, true);

  previousBtn.click();
  assert.equal(document.getElementById('source-dialog-title').textContent, 'AlphaScript');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/shared.js:1-3');
});

test('generated viewer navigates current-file source without crossing into imported members', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { AlphaScript } from './shared.js';",
      '',
      'export function AlphaView() {',
      "  return AlphaScript('alpha');",
      '}',
      '',
      'export function OmegaView() {',
      "  return AlphaScript('omega');",
      '}',
    ].join('\n'),
    'src/shared.js': [
      'export function AlphaScript(value) {',
      '  return value;',
      '}',
    ].join('\n'),
  });
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-current-nav-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const sourcePayload = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));
  assert.deepEqual(sourcePayload.declarations.map(({
    name,
    sourceOrigin,
    sourceGroup,
    sourceOrder,
    sourceDisplayName,
  }) => ({
    name,
    sourceOrigin,
    sourceGroup,
    sourceOrder,
    sourceDisplayName,
  })), [
    {
      name: 'AlphaScript',
      sourceOrigin: 'imported-script-member',
      sourceGroup: 'app:imported-script-members',
      sourceOrder: 0,
      sourceDisplayName: '3 AlphaScript',
    },
    {
      name: 'AlphaView',
      sourceOrigin: 'current-file-declaration',
      sourceGroup: 'app:current-file-declarations',
      sourceOrder: 0,
      sourceDisplayName: '3 AlphaView()',
    },
    {
      name: 'OmegaView',
      sourceOrigin: 'current-file-declaration',
      sourceGroup: 'app:current-file-declarations',
      sourceOrder: 1,
      sourceDisplayName: '3 OmegaView()',
    },
  ]);
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    sourcePayload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      Object.assign(rendered, createFakeMermaidClass(fakeDocument, {
        classId: 'app',
        memberTexts: [
          '+3 AlphaScript',
          '+3 AlphaView()',
          '+3 OmegaView()',
        ],
      }));
      svg.appendChild(rendered.classGroup);
      return svg;
    },
  });

  const dialog = document.getElementById('source-dialog');
  const previousBtn = document.getElementById('source-dialog-previous');
  const nextBtn = document.getElementById('source-dialog-next');
  rendered.members[1].click();
  assert.equal(dialog.open, true);
  assert.equal(document.getElementById('source-dialog-title').textContent, 'AlphaView');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/app.jsx:3-5');
  assert.equal(previousBtn.disabled, true);
  assert.equal(nextBtn.disabled, false);

  nextBtn.click();
  assert.equal(dialog.open, true);
  assert.equal(document.getElementById('source-dialog-title').textContent, 'OmegaView');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/app.jsx:7-9');
  assert.equal(previousBtn.disabled, false);
  assert.equal(nextBtn.disabled, true);

  previousBtn.click();
  assert.equal(document.getElementById('source-dialog-title').textContent, 'AlphaView');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/app.jsx:3-5');
});

test('generated viewer supports source dialog keyboard navigation and restores trigger focus', async () => {
  const rootDir = await writeTempProject({
    'src/app.jsx': [
      "import { AlphaScript } from './shared.js';",
      "import { OmegaScript } from './shared.js';",
      '',
      'export function View() {',
      '  return <div>{AlphaScript()}{OmegaScript()}</div>;',
      '}',
    ].join('\n'),
    'src/shared.js': [
      'export function AlphaScript() {',
      "  return 'alpha';",
      '}',
      '',
      'export function OmegaScript() {',
      "  return 'omega';",
      '}',
    ].join('\n'),
  });
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-dialog-a11y-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const sourcePayload = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    sourcePayload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      Object.assign(rendered, createFakeMermaidClass(fakeDocument, {
        classId: 'app',
        memberTexts: [
          '+3 AlphaScript',
          '+3 OmegaScript',
          '+3 View()',
        ],
      }));
      svg.appendChild(rendered.classGroup);
      return svg;
    },
  });

  const dialog = document.getElementById('source-dialog');
  const closeBtn = document.getElementById('source-dialog-close');
  rendered.members[0].click();
  assert.equal(dialog.open, true);
  assert.equal(document.activeElement, closeBtn);

  dialog.dispatchEvent({ type: 'keydown', key: 'ArrowRight' });
  assert.equal(dialog.open, true);
  assert.equal(document.getElementById('source-dialog-title').textContent, 'OmegaScript');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/shared.js:5-7');

  dialog.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' });
  assert.equal(document.getElementById('source-dialog-title').textContent, 'AlphaScript');
  assert.equal(document.getElementById('source-dialog-path').textContent, 'src/shared.js:1-3');

  dialog.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, rendered.members[0]);

  rendered.members[1].click();
  assert.equal(dialog.open, true);
  closeBtn.click();
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, rendered.members[1]);
});

test('generated viewer resolves source members from Mermaid class id variants', async () => {
  const rootDir = path.resolve('tests/fixtures/import-edge-metadata');
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-source-id-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const sourcePayload = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    sourcePayload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      Object.assign(rendered, createFakeMermaidClass(fakeDocument, {
        classId: 'app',
        classGroupId: 'classId-app',
        memberText: '+16 App()',
      }));
      svg.appendChild(rendered.classGroup);
      return svg;
    },
  });

  assert.equal(rendered.member.getAttribute('role'), 'button');
  rendered.member.click();
  assert.equal(document.getElementById('source-dialog').open, true);
});

test('generated viewer adds non-scaling source member hit targets without duplicate semantics', async () => {
  const rootDir = path.resolve('tests/fixtures/import-edge-metadata');
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-source-hit-target-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const sourcePayload = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    sourcePayload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      Object.assign(rendered, createFakeMermaidClass(fakeDocument, {
        classId: 'app',
        memberText: '+16 App()',
        memberBox: { x: 96, y: 144, width: 124, height: 18 },
      }));
      svg.appendChild(rendered.classGroup);
      return svg;
    },
  });

  assert.equal(rendered.member.getAttribute('role'), 'button');
  assert.equal(rendered.member.getAttribute('tabindex'), '0');
  assert.equal(rendered.member.getAttribute('aria-label'), 'Show source for App in src/app.jsx');

  const hitTarget = rendered.classGroup.querySelector('path.source-member-hit-target');
  assert.ok(hitTarget, 'expected generated viewer to add a source member hit target');
  assert.equal(hitTarget.getAttribute('vector-effect'), 'non-scaling-stroke');
  assert.equal(hitTarget.getAttribute('aria-hidden'), 'true');
  assert.equal(hitTarget.getAttribute('focusable'), 'false');
  assert.equal(hitTarget.getAttribute('role'), null);
  assert.equal(hitTarget.getAttribute('tabindex'), null);
  assert.equal(hitTarget.getAttribute('aria-label'), null);
  assert.match(hitTarget.getAttribute('d'), /^M96 153H220$/);

  const viewport = document.getElementById('diagram-viewport');
  viewport.dispatchEvent({
    type: 'pointerdown',
    pointerId: 23,
    pointerType: 'mouse',
    clientX: 100,
    clientY: 152,
    target: hitTarget,
  });
  assert.deepEqual(viewport.pointerCaptureCalls, []);
  assert.equal(viewport.classList.contains('is-dragging'), false);

  hitTarget.click();
  assert.equal(document.getElementById('source-dialog').open, true);
});

test('generated viewer disables source popups for mismatched or unavailable source payloads', async () => {
  const rootDir = path.resolve('tests/fixtures/import-edge-metadata');
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-source-identity-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const sourcePayload = JSON.parse(await fs.readFile(path.join(outDir, 'source-code.json'), 'utf8'));

  async function renderSourceMember(sourceOptions) {
    const rendered = {};
    const harness = await runGeneratedViewerApp({
      appJs,
      payload,
      sourcePayload,
      ...sourceOptions,
      renderedSvgFactory: (fakeDocument) => {
        const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.viewBox = { baseVal: { width: 640, height: 320 } };
        Object.assign(rendered, createFakeMermaidClass(fakeDocument, {
          classId: 'app',
          memberText: '+16 App()',
        }));
        svg.appendChild(rendered.classGroup);
        return svg;
      },
    });
    return { ...harness, rendered };
  }

  const matching = await renderSourceMember({});
  assert.equal(matching.rendered.member.getAttribute('role'), 'button');
  matching.rendered.member.click();
  assert.equal(matching.document.getElementById('source-dialog').open, true);

  const mismatchedSourcePayload = {
    ...sourcePayload,
    meta: {
      ...sourcePayload.meta,
      buildId: '0'.repeat(64),
    },
  };
  const mismatched = await renderSourceMember({ sourcePayload: mismatchedSourcePayload });
  assert.equal(mismatched.document.getElementById('mermaid').textContent, payload.mermaid);
  assert.equal(mismatched.rendered.member.getAttribute('role'), null);
  assert.equal(mismatched.rendered.member.getAttribute('tabindex'), null);
  assert.equal(mismatched.rendered.member.getAttribute('aria-label'), null);
  mismatched.rendered.member.click();
  assert.equal(mismatched.document.getElementById('source-dialog').open, false);

  const missing = await renderSourceMember({ sourceResponseOk: false });
  assert.equal(missing.document.getElementById('mermaid').textContent, payload.mermaid);
  assert.equal(missing.rendered.member.getAttribute('role'), null);
  missing.rendered.member.dispatchEvent({ type: 'keydown', key: 'Enter' });
  assert.equal(missing.document.getElementById('source-dialog').open, false);

  const unavailable = await renderSourceMember({ sourceFetchReject: true });
  assert.equal(unavailable.document.getElementById('mermaid').textContent, payload.mermaid);
  assert.equal(unavailable.rendered.member.getAttribute('role'), null);
});

test('generated viewer copy controls copy raw output values and report success', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-copy-'));
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });

  const html = await fs.readFile(path.join(outDir, 'index.html'), 'utf8');
  assert.match(html, />Copy JSX tree</);
  assert.match(html, />Copy Mermaid source</);
  assert.match(html, /id="copy-jsx-tree-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="copy-mermaid-source-status"[^>]*role="status"[^>]*aria-live="polite"/);

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const copiedTexts = [];
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    clipboardWriteText: async (text) => {
      copiedTexts.push(text);
    },
  });

  document.getElementById('copy-jsx-tree-btn').click();
  await flushAsyncWork();
  assert.equal(copiedTexts.at(-1), payload.jsxTreeText);
  assert.match(copiedTexts.at(-1), /app\.jsx \(9 lines\)/);
  assert.doesNotMatch(copiedTexts.at(-1), /Copy JSX tree|JSX hierarchy|Copied/);
  assert.equal(document.getElementById('copy-jsx-tree-status').textContent, 'Copied JSX tree.');

  document.getElementById('copy-mermaid-source-btn').click();
  await flushAsyncWork();
  assert.equal(copiedTexts.at(-1), payload.mermaid);
  assert.doesNotMatch(copiedTexts.at(-1), /Copy Mermaid source|Mermaid source|Copied/);
  assert.equal(document.getElementById('copy-mermaid-source-status').textContent, 'Copied Mermaid source.');
});

test('generated viewer copy controls fall back and report copy failure', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-copy-fallback-'));
  await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8'));
  const fallbackTexts = [];
  const fallbackHarness = await runGeneratedViewerApp({
    appJs,
    payload,
    execCommand: (command, document) => {
      assert.equal(command, 'copy');
      fallbackTexts.push(document.selectedText);
      return true;
    },
  });

  fallbackHarness.document.getElementById('copy-mermaid-source-btn').click();
  await flushAsyncWork();
  assert.equal(fallbackTexts.at(-1), payload.mermaid);
  assert.equal(
    fallbackHarness.document.getElementById('copy-mermaid-source-status').textContent,
    'Copied Mermaid source.',
  );

  const failureHarness = await runGeneratedViewerApp({
    appJs,
    payload,
    execCommand: () => false,
  });
  failureHarness.document.getElementById('copy-jsx-tree-btn').click();
  await flushAsyncWork();
  const statusEl = failureHarness.document.getElementById('copy-jsx-tree-status');
  assert.equal(statusEl.textContent, 'Could not copy JSX tree.');
  assert.match(statusEl.className, /is-error/);
});

test('generated viewer activates edge hit targets and formats counted inline labels', async () => {
  const rootDir = path.resolve('tests/fixtures/import-edge-metadata');
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-edge-imports-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = {
    ...JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8')),
    importEdges: [
      {
        source: 'app',
        target: 'static_child',
        sourcePath: 'src/app.jsx',
        targetPath: 'src/static-child.jsx',
        targetLineCount: 11,
        loadKinds: ['static'],
        imports: [
          {
            imported: 'default',
            local: 'StaticDefault',
            kind: 'default',
            inferred: false,
          },
          {
            imported: 'StaticNamed',
            local: 'StaticAlias',
            kind: 'named',
            inferred: false,
            lineCount: 3,
          },
          {
            imported: 'StaticSame',
            local: 'StaticSame',
            kind: 'named',
            inferred: false,
            lineCount: 3,
          },
        ],
      },
      {
        source: 'app',
        target: 'dynamic_child',
        sourcePath: 'src/app.jsx',
        targetPath: 'src/dynamic-child.jsx',
        targetLineCount: 3,
        loadKinds: ['dynamic'],
        imports: [
          {
            imported: 'DynamicExport',
            local: 'DynamicLocal',
            kind: 'named',
            inferred: false,
            lineCount: 3,
          },
        ],
      },
    ],
  };
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      rendered.static = createFakeMermaidEdge(fakeDocument, {
        source: 'app',
        target: 'static_child',
        labelText: 'import',
      });
      rendered.lazy = createFakeMermaidEdge(fakeDocument, {
        source: 'app',
        target: 'dynamic_child',
        labelText: 'lazy',
      });
      svg.append(rendered.static.group, rendered.lazy.group);
      return svg;
    },
  });

  assert.equal(rendered.static.originalLabel.textContent, 'import');
  assert.equal(rendered.lazy.originalLabel.textContent, 'lazy');
  assert.equal(rendered.static.originalLabel.style.display || '', '');
  assert.equal(rendered.lazy.originalLabel.style.display || '', '');

  const hitPath = rendered.static.group.querySelector('path.edge-hit-target');
  assert.ok(hitPath, 'expected generated viewer to add a cloned edge hit target');
  hitPath.click();

  const customLabel = rendered.static.labelGroup.querySelector('g.edge-import-label');
  assert.ok(customLabel, 'expected clicking the edge hit target to add a custom SVG label');
  assert.equal(rendered.static.originalLabel.style.display, 'none');
  assert.match(rendered.static.pathElement.className, /is-selected/);
  assert.match(rendered.static.edgeLabel.className, /is-expanded/);

  assert.deepEqual(
    customLabel.querySelectorAll('tspan').map((line) => line.textContent),
    ['11 static-child.jsx', '3 StaticNamed as StaticAlias()', '3 StaticSame()'],
  );
  assert.equal(rendered.static.pathElement.getAttribute('role'), 'button');
  assert.equal(rendered.static.pathElement.getAttribute('aria-label'), 'Show imports for src/static-child.jsx');
  assert.equal(hitPath.getAttribute('vector-effect'), 'non-scaling-stroke');
  assert.equal(hitPath.getAttribute('aria-hidden'), 'true');
  assert.equal(hitPath.getAttribute('focusable'), 'false');
  assert.equal(hitPath.getAttribute('aria-label'), null);
  assert.equal(hitPath.getAttribute('role'), null);
  assert.equal(hitPath.getAttribute('tabindex'), null);
  assert.equal(
    document.getElementById('diagram').querySelectorAll('path.edge-hit-target').length,
    2,
  );

  const selectedImport = document.getElementById('selected-import');
  assert.match(selectedImport.textContent, /app -> static_child/);
  assert.match(selectedImport.textContent, /Sourcesrc\/app\.jsx/);
  assert.match(selectedImport.textContent, /Targetsrc\/static-child\.jsx/);
  assert.match(selectedImport.textContent, /Loadstatic/);
  assert.match(selectedImport.textContent, /Direct Imports11 static-child\.jsx3 StaticNamed as StaticAlias\(\)3 StaticSame\(\)/);
});

test('generated viewer keeps edge pointerdown from starting viewport drag', async () => {
  const rootDir = path.resolve('tests/fixtures/import-edge-metadata');
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-edge-pointer-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = {
    ...JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8')),
    importEdges: [
      {
        source: 'app',
        target: 'static_child',
        sourcePath: 'src/app.jsx',
        targetPath: 'src/static-child.jsx',
        targetLineCount: 11,
        loadKinds: ['static'],
        imports: [],
      },
    ],
  };
  const rendered = {};
  const { document } = await runGeneratedViewerApp({
    appJs,
    payload,
    renderedSvgFactory: (fakeDocument) => {
      const svg = fakeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.viewBox = { baseVal: { width: 640, height: 320 } };
      Object.assign(rendered, createFakeMermaidEdge(fakeDocument, {
        source: 'app',
        target: 'static_child',
        labelText: 'import',
      }));
      svg.appendChild(rendered.group);
      return svg;
    },
  });

  const viewport = document.getElementById('diagram-viewport');
  const hitPath = rendered.group.querySelector('path.edge-hit-target');
  const pointerDown = (target, pointerId) => ({
    type: 'pointerdown',
    pointerId,
    pointerType: 'mouse',
    clientX: 20 + pointerId,
    clientY: 30 + pointerId,
    target,
  });

  for (const [index, target] of [rendered.pathElement, hitPath, rendered.edgeLabel].entries()) {
    viewport.dispatchEvent(pointerDown(target, index + 1));
    assert.deepEqual(viewport.pointerCaptureCalls, []);
    assert.equal(viewport.classList.contains('is-dragging'), false);
  }

  viewport.dispatchEvent(pointerDown(viewport, 99));
  assert.deepEqual(viewport.pointerCaptureCalls, [99]);
  assert.equal(viewport.classList.contains('is-dragging'), true);
});
