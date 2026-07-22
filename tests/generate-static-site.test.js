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

  click() {
    for (const listener of this.listeners.get('click') || []) {
      listener({ type: 'click', preventDefault() {} });
    }
  }

  focus() {}

  select() {
    this.ownerDocument.selectedText = this.value;
  }

  setPointerCapture() {}

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
    fetch: async () => ({
      ok: true,
      json: async () => payload,
    }),
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

function createFakeMermaidEdge(document, { source, target }) {
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
  originalLabel.textContent = 'imports';

  labelGroup.appendChild(originalLabel);
  edgeLabel.appendChild(labelGroup);
  group.append(pathElement, edgeLabel);

  return { edgeLabel, group, labelGroup, originalLabel, pathElement };
}

test('generateStaticSite writes a static viewer bundle', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-'));
  const result = await generateStaticSite({ rootDir: fixtureRoot, entry: 'src/app.jsx', outDir });

  assert.equal(result.entryRel, 'src/app.jsx');
  const files = await fs.readdir(outDir);
  assert.ok(files.includes('index.html'));
  assert.ok(files.includes('app.js'));
  assert.ok(files.includes('output.json'));
  assert.ok(files.includes('vendor'));

  const html = await fs.readFile(path.join(outDir, 'index.html'), 'utf8');
  assert.match(html, /\.\/app\.js/);
  assert.match(html, /<details class="panel collapsible-panel" id="jsx-tree-panel">/);
  assert.match(html, /<details class="panel collapsible-panel" id="mermaid-source-panel">/);
  assert.doesNotMatch(html, /id="jsx-line-counts-panel"/);
  assert.doesNotMatch(html, />JSX line counts</);
  assert.doesNotMatch(html, />Open JSON</);
  assert.doesNotMatch(html, />Open Mermaid</);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:\s|>|=)/);

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

  const vendorFiles = await fs.readdir(path.join(outDir, 'vendor'));
  assert.ok(vendorFiles.some((name) => name.includes('mermaid')));
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

test('generated viewer activates edge hit targets and formats Creator/file labels', async () => {
  const rootDir = path.resolve('tests/fixtures/import-edge-metadata');
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ironglancer-static-edge-imports-'));
  await generateStaticSite({ rootDir, entry: 'src/app.jsx', outDir });

  const appJs = await fs.readFile(path.join(outDir, 'app.js'), 'utf8');
  const payload = {
    ...JSON.parse(await fs.readFile(path.join(outDir, 'output.json'), 'utf8')),
    importEdges: [
      {
        source: 'creator_course_view',
        target: 'creator_view_body',
        sourcePath: 'src/creator/creator-course-view.jsx',
        targetPath: 'src/creator/creator-view-body.jsx',
        loadKinds: ['static'],
        imports: [
          {
            imported: 'default',
            local: 'CreatorViewBody',
            kind: 'default',
            inferred: false,
          },
          {
            imported: 'CreatorViewBody',
            local: 'CreatorViewBody',
            kind: 'named',
            inferred: true,
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
      Object.assign(rendered, createFakeMermaidEdge(fakeDocument, {
        source: 'creator_course_view',
        target: 'creator_view_body',
      }));
      svg.appendChild(rendered.group);
      return svg;
    },
  });

  const hitPath = document.getElementById('diagram').querySelector('path.edge-hit-target');
  assert.ok(hitPath, 'expected generated viewer to add a cloned edge hit target');
  hitPath.click();

  const customLabel = rendered.labelGroup.querySelector('g.edge-import-label');
  assert.ok(customLabel, 'expected clicking the edge hit target to add a custom SVG label');
  assert.equal(rendered.originalLabel.style.display, 'none');
  assert.match(rendered.pathElement.className, /is-selected/);
  assert.match(rendered.edgeLabel.className, /is-expanded/);

  assert.deepEqual(
    customLabel.querySelectorAll('tspan').map((line) => line.textContent),
    ['creator-view-body.jsx', 'CreatorViewBody()'],
  );
  assert.equal(rendered.pathElement.getAttribute('role'), 'button');
  assert.equal(rendered.pathElement.getAttribute('aria-label'), 'Show imports for src/creator/creator-view-body.jsx');
  assert.equal(hitPath.getAttribute('aria-hidden'), 'true');
  assert.equal(hitPath.getAttribute('focusable'), 'false');
  assert.equal(hitPath.getAttribute('aria-label'), null);
  assert.equal(hitPath.getAttribute('role'), null);
  assert.equal(hitPath.getAttribute('tabindex'), null);
  assert.equal(
    document.getElementById('diagram').querySelectorAll('path.edge-hit-target').length,
    1,
  );
});
