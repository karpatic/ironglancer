import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

import { analyzeProject } from './analyze-project.js';

const require = createRequire(import.meta.url);
const packageMeta = require('../../package.json');

const CREDENTIAL_VALUE_PATTERNS = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk_live_[A-Za-z0-9]{16,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const CREDENTIAL_ASSIGNMENT_PATTERN = /(?:^|[^\w$])([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g;

function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map((item) => stableJson(item)).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => (
      JSON.stringify(key) + ':' + stableJson(value[key])
    )).join(',') + '}';
  }
  return JSON.stringify(value);
}

function contentHash(value) {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex');
}

function textContentHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function escapeHtmlAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function normalizeCredentialIdentifier(identifier) {
  return String(identifier || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function isSensitiveCredentialName(identifier) {
  const normalized = normalizeCredentialIdentifier(identifier);
  const parts = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const joined = parts.join('_');
  return [
    'api_key',
    'access_key',
    'access_token',
    'auth_token',
    'id_token',
    'refresh_token',
    'client_secret',
    'private_key',
    'secret_access_key',
    'secret_key',
  ].some((phrase) => joined.includes(phrase))
    || parts.includes('credential')
    || parts.includes('credentials')
    || parts.includes('passwd')
    || parts.includes('password')
    || parts.includes('secret')
    || parts.includes('token');
}

function looksLikeCredentialValue(value) {
  const text = String(value || '').trim();
  if (CREDENTIAL_VALUE_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (text.length < 16) return false;
  if (/\s/.test(text)) return false;
  if (!/^[A-Za-z0-9_./+=:-]+$/.test(text)) return false;

  const characterClassCount = [
    /[a-z]/.test(text),
    /[A-Z]/.test(text),
    /\d/.test(text),
    /[_./+=:-]/.test(text),
  ].filter(Boolean).length;
  return characterClassCount >= 2;
}

function hasCredentialLiteral(code) {
  if (CREDENTIAL_VALUE_PATTERNS.some((pattern) => pattern.test(code))) return true;

  let match;
  CREDENTIAL_ASSIGNMENT_PATTERN.lastIndex = 0;
  while ((match = CREDENTIAL_ASSIGNMENT_PATTERN.exec(code))) {
    if (isSensitiveCredentialName(match[1]) && looksLikeCredentialValue(match[3])) return true;
  }
  return false;
}

function assertNoCredentialLiterals(sourceCode = {}) {
  for (const declaration of Array.isArray(sourceCode.declarations) ? sourceCode.declarations : []) {
    const code = typeof declaration.code === 'string' ? declaration.code : '';
    if (!code) continue;
    if (!hasCredentialLiteral(code)) continue;
    const sourcePath = declaration.modulePath || 'unknown source';
    const startLine = declaration.startLine || '?';
    const endLine = declaration.endLine || '?';
    throw new Error(
      `Refusing to write source-code.json: credential-looking literal in ${sourcePath}:${startLine}-${endLine}.`,
    );
  }
}

function viewerHtml({ appScriptSrc = './app.js' } = {}) {
  const escapedAppScriptSrc = escapeHtmlAttribute(appScriptSrc);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231f6feb'/%3E%3Cpath d='M18 16h28v8H36v24h-8V24H18z' fill='white'/%3E%3C/svg%3E">
    <title>IronGlancer</title>
    <style>
      :root { --bg:#f6f8fc; --panel:#fff; --text:#182132; --muted:#5f6880; --border:#d9dfeb; --accent:#1f6feb; }
      * { box-sizing:border-box; }
      body { margin:0; font-family:IBM Plex Sans,Segoe UI,sans-serif; background:var(--bg); color:var(--text); }
      .shell { max-width:1280px; margin:0 auto; padding:24px 16px 40px; }
      .header { display:flex; gap:16px; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; }
      .title { margin:0; font-size:1.7rem; }
      .subtitle { margin:4px 0 0; color:var(--muted); }
      .meta-line { margin:8px 0 0; color:var(--muted); font-size:.88rem; }
      .grid { display:grid; gap:16px; margin-top:16px; }
      .details-grid { display:grid; gap:16px; }
      @media (min-width: 1100px) { .details-grid { grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); align-items:start; } }
      .grid > *, .details-grid > * { min-width:0; }
      .panel { background:var(--panel); border:1px solid var(--border); border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(35,55,110,.06); }
      .panel h2 { margin:0; padding:12px 14px; border-bottom:1px solid var(--border); font-size:0.98rem; }
      .panel .body { padding:14px; }
      .collapsible-panel summary {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        padding:12px 14px;
        border-bottom:1px solid var(--border);
        cursor:pointer;
        list-style:none;
      }
      .collapsible-panel:not([open]) summary { border-bottom:0; }
      .collapsible-panel summary::-webkit-details-marker { display:none; }
      .collapsible-panel summary h2 { padding:0; border-bottom:0; }
      .collapsible-panel summary::after {
        content:'+';
        display:inline-grid;
        place-items:center;
        width:22px;
        height:22px;
        border:1px solid #bfd1f2;
        border-radius:6px;
        color:#22407d;
        background:#f7faff;
        font-weight:700;
        flex:0 0 auto;
      }
      .collapsible-panel[open] summary::after { content:'-'; }
      pre { margin:0; white-space:pre-wrap; overflow:auto; font-size:.85rem; }
      ul { margin:0; padding-left:20px; }
      .stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:12px; }
      .stat { background:#fbfcff; border:1px solid var(--border); border-radius:12px; padding:12px; }
      .stat b { display:block; font-size:1.4rem; margin-bottom:4px; }
      .muted { color:var(--muted); }
      .actions, .diagram-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
      button, a.button {
        border:1px solid #bfd1f2;
        background:#f7faff;
        color:#22407d;
        border-radius:8px;
        padding:8px 12px;
        cursor:pointer;
        text-decoration:none;
        font-weight:600;
      }
      button:hover, a.button:hover { background:#eef5ff; }
      .diagram-panel-body { display:grid; gap:12px; }
      .text-panel-body { display:grid; gap:10px; }
      .text-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:space-between; }
      .copy-status { min-height:1.2em; font-size:.85rem; color:var(--muted); }
      .copy-status.is-success { color:#16703d; }
      .copy-status.is-error { color:#b42318; }
      button:disabled { cursor:not-allowed; opacity:.6; }
      .diagram-toolbar { justify-content:space-between; }
      .diagram-toolbar-group { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
      .diagram-status { font-size:.85rem; color:var(--muted); }
      .diagram-help { font-size:.82rem; color:var(--muted); }
      .diagram-viewport {
        min-height:540px;
        max-height:75vh;
        overflow:auto;
        overscroll-behavior:contain;
        border:1px solid var(--border);
        border-radius:12px;
        background:
          linear-gradient(90deg, rgba(31,111,235,.03) 1px, transparent 1px) 0 0 / 24px 24px,
          linear-gradient(rgba(31,111,235,.03) 1px, transparent 1px) 0 0 / 24px 24px,
          #fff;
        cursor:grab;
        touch-action:none;
      }
      .diagram-viewport.is-dragging { cursor:grabbing; }
      .diagram-canvas {
        min-width:100%;
        min-height:100%;
        padding:16px;
      }
      .diagram-canvas svg {
        display:block;
        max-width:none;
        height:auto;
        overflow:visible;
      }
      .diagram-canvas path.relation, .diagram-canvas path[data-edge="true"], .diagram-canvas g.edgeLabel { cursor:pointer; }
      .diagram-canvas .source-member-trigger { cursor:pointer; color:var(--accent); fill:var(--accent); font-weight:700; pointer-events:auto; }
      .diagram-canvas .source-member-metrics {
        display:inline-flex;
        gap:3px;
        margin-left:5px;
        vertical-align:middle;
        pointer-events:none;
      }
      .diagram-canvas .source-member-metric {
        display:inline-block;
        padding:1px 4px;
        border:1px solid #bfd1f2;
        border-radius:999px;
        background:#eef5ff;
        color:#17366f;
        font-size:.75em;
        font-weight:700;
        line-height:1.15;
      }
      .diagram-canvas .source-member-hit-target {
        fill:none !important;
        stroke:transparent !important;
        stroke-linecap:round;
        stroke-width:24px !important;
        vector-effect:non-scaling-stroke;
        pointer-events:stroke;
        cursor:pointer;
      }
      .diagram-canvas .edge-hit-target {
        fill:none !important;
        stroke:transparent !important;
        stroke-width:16px !important;
        vector-effect:non-scaling-stroke;
        pointer-events:stroke;
      }
      .diagram-canvas path.relation.is-selected, .diagram-canvas path[data-edge="true"].is-selected { stroke:var(--accent) !important; stroke-width:3px !important; }
      .diagram-canvas .edge-import-label { pointer-events:none; }
      .diagram-canvas g.edgeLabel.is-expanded .edge-import-label rect { fill:#eef5ff; stroke:#8eb5f4; stroke-width:1.5; }
      .diagram-canvas g.edgeLabel.is-expanded .edge-import-label text { fill:#17366f; font-weight:700; font-size:13px; }
      .selected-import-details { display:grid; gap:12px; }
      .selected-import-details h3, .selected-import-details h4, .selected-import-details p { margin:0; }
      .selected-import-details h3 { overflow-wrap:anywhere; font-size:1rem; }
      .selected-import-details h4 { color:var(--muted); font-size:.75rem; text-transform:uppercase; }
      .selected-import-rows { display:grid; gap:8px; }
      .selected-import-row { display:grid; gap:3px; }
      .selected-import-row span { color:var(--muted); font-size:.72rem; font-weight:700; text-transform:uppercase; }
      .selected-import-row code { overflow-wrap:anywhere; }
      .selected-import-list { display:grid; gap:6px; margin:0; padding:0; list-style:none; }
      .selected-import-list li { border:1px solid var(--border); border-radius:8px; background:#fbfcff; padding:8px 10px; overflow-wrap:anywhere; }
      .source-dialog {
        width:min(900px, calc(100vw - 32px));
        max-height:min(82vh, 760px);
        border:1px solid var(--border);
        border-radius:12px;
        padding:0;
        color:var(--text);
        box-shadow:0 24px 80px rgba(24,33,50,.25);
      }
      .source-dialog::backdrop { background:rgba(24,33,50,.38); }
      .source-dialog-body { display:grid; gap:12px; padding:16px; }
      .source-dialog-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
      .source-dialog-title-group { min-width:0; }
      .source-dialog-actions { display:flex; gap:8px; flex:0 0 auto; flex-wrap:wrap; justify-content:flex-end; }
      .source-dialog h2 { margin:0; font-size:1.05rem; overflow-wrap:anywhere; }
      .source-dialog-path { margin:4px 0 0; color:var(--muted); font-size:.86rem; overflow-wrap:anywhere; }
      .source-dialog pre {
        max-height:58vh;
        padding:12px;
        border:1px solid #26344f;
        border-radius:8px;
        background:#111827;
        color:#f8fafc;
        white-space:pre;
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="header">
        <div>
          <h1 class="title">IronGlancer</h1>
          <p id="subtitle" class="subtitle">Loading project graph…</p>
          <p id="build-meta" class="meta-line">Checking build metadata…</p>
        </div>
        <div class="actions">
          <button id="download-svg-btn" type="button">Download SVG</button>
        </div>
      </div>
      <div class="grid">
        <div class="panel">
          <h2>Diagram</h2>
          <div class="body diagram-panel-body">
            <div class="diagram-toolbar">
              <div class="diagram-toolbar-group">
                <button id="zoom-out-btn" type="button">−</button>
                <button id="zoom-in-btn" type="button">+</button>
                <button id="fit-btn" type="button">Fit</button>
                <button id="reset-view-btn" type="button">100%</button>
              </div>
              <div class="diagram-toolbar-group">
                <span id="zoom-status" class="diagram-status">Zoom 100%</span>
              </div>
            </div>
            <div class="diagram-help">Drag to pan. Mouse wheel or trackpad scroll moves around. Pinch or Ctrl/⌘ + wheel zooms.</div>
            <div id="diagram-viewport" class="diagram-viewport">
              <div id="diagram" class="diagram-canvas"></div>
            </div>
          </div>
        </div>
        <div class="details-grid">
          <div class="panel">
            <h2>Selected import</h2>
            <div id="selected-import" class="body selected-import-details" aria-live="polite">
              <p class="muted">No edge selected.</p>
            </div>
          </div>
          <div class="panel">
            <h2>Summary</h2>
            <div id="stats" class="body stats"></div>
          </div>
          <details class="panel collapsible-panel" id="jsx-tree-panel">
            <summary><h2>JSX hierarchy</h2></summary>
            <div class="body text-panel-body">
              <div class="text-toolbar">
                <button id="copy-jsx-tree-btn" type="button" aria-describedby="copy-jsx-tree-status" disabled>Copy JSX tree</button>
                <span id="copy-jsx-tree-status" class="copy-status" role="status" aria-live="polite"></span>
              </div>
              <pre id="jsx-tree"></pre>
            </div>
          </details>
          <details class="panel collapsible-panel" id="dependency-tree-panel">
            <summary><h2>Dependency tree</h2></summary>
            <div class="body"><pre id="tree"></pre></div>
          </details>
          <details class="panel collapsible-panel" id="mermaid-source-panel">
            <summary><h2>Mermaid source</h2></summary>
            <div class="body text-panel-body">
              <div class="text-toolbar">
                <button id="copy-mermaid-source-btn" type="button" aria-describedby="copy-mermaid-source-status" disabled>Copy Mermaid source</button>
                <span id="copy-mermaid-source-status" class="copy-status" role="status" aria-live="polite"></span>
              </div>
              <pre id="mermaid"></pre>
            </div>
          </details>
        </div>
      </div>
    </div>
    <dialog id="source-dialog" class="source-dialog" aria-labelledby="source-dialog-title">
      <div class="source-dialog-body">
        <div class="source-dialog-header">
          <div class="source-dialog-title-group">
            <h2 id="source-dialog-title">Source</h2>
            <p id="source-dialog-path" class="source-dialog-path"></p>
          </div>
          <div class="source-dialog-actions" aria-label="Source navigation">
            <button id="source-dialog-previous" type="button" aria-label="Previous source item" disabled>Previous</button>
            <button id="source-dialog-next" type="button" aria-label="Next source item" disabled>Next</button>
            <button id="source-dialog-close" type="button">Close</button>
          </div>
        </div>
        <pre><code id="source-dialog-code"></code></pre>
      </div>
    </dialog>
    <script type="module" src="${escapedAppScriptSrc}"></script>
  </body>
</html>
`;
}

function viewerAppJs() {
  return `import mermaid from './vendor/mermaid.esm.min.mjs';

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default', flowchart: { htmlLabels: false } });

const subtitleEl = document.getElementById('subtitle');
const buildMetaEl = document.getElementById('build-meta');
const jsxTreeEl = document.getElementById('jsx-tree');
const treeEl = document.getElementById('tree');
const mermaidEl = document.getElementById('mermaid');
const diagramEl = document.getElementById('diagram');
const viewportEl = document.getElementById('diagram-viewport');
const statsEl = document.getElementById('stats');
const selectedImportEl = document.getElementById('selected-import');
const downloadBtn = document.getElementById('download-svg-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const fitBtn = document.getElementById('fit-btn');
const resetViewBtn = document.getElementById('reset-view-btn');
const zoomStatusEl = document.getElementById('zoom-status');
const copyJsxTreeBtn = document.getElementById('copy-jsx-tree-btn');
const copyMermaidSourceBtn = document.getElementById('copy-mermaid-source-btn');
const copyJsxTreeStatusEl = document.getElementById('copy-jsx-tree-status');
const copyMermaidSourceStatusEl = document.getElementById('copy-mermaid-source-status');
const sourceDialogEl = document.getElementById('source-dialog');
const sourceDialogTitleEl = document.getElementById('source-dialog-title');
const sourceDialogPathEl = document.getElementById('source-dialog-path');
const sourceDialogCodeEl = document.getElementById('source-dialog-code');
const sourceDialogPreviousBtn = document.getElementById('source-dialog-previous');
const sourceDialogNextBtn = document.getElementById('source-dialog-next');
const sourceDialogCloseBtn = document.getElementById('source-dialog-close');
let latestSvg = '';
let rawJsxTreeText = '';
let rawMermaidSourceText = '';
let activeSvg = null;
let baseWidth = 0;
let baseHeight = 0;
let zoom = 1;
let minZoom = 0.2;
let maxZoom = 4;
let dragState = null;
let pinchState = null;
const activePointers = new Map();
let sourceDeclarationLookup = { byDisplay: new Map(), byName: new Map(), groups: new Map() };
let sourceDialogState = { declaration: null, group: [], index: -1 };
let sourceDialogRestoreFocusEl = null;
const svgNamespace = 'http://www.w3.org/2000/svg';
let sourceMemberTargetCounter = 0;
let sourceMemberTargets = new Map();

function statCard(label, value) {
  const div = document.createElement('div');
  div.className = 'stat';
  const strong = document.createElement('b');
  strong.textContent = String(value);
  const span = document.createElement('span');
  span.className = 'muted';
  span.textContent = label;
  div.append(strong, span);
  return div;
}

function setCopyStatus(statusEl, message, state) {
  statusEl.textContent = message;
  statusEl.classList.remove('is-success', 'is-error');
  if (state) statusEl.classList.add('is-' + state);
}

function copyTextWithTextarea(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.left = '-1000px';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let didCopy = false;
  try {
    if (typeof document.execCommand === 'function') didCopy = document.execCommand('copy');
  } finally {
    textarea.remove();
  }

  if (!didCopy) throw new Error('Copy command was unavailable');
}

async function writeClipboardText(text) {
  const clipboard = typeof navigator === 'object' ? navigator.clipboard : null;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return;
    } catch (error) {
      // Fall back for browsers that expose Clipboard API but reject this call.
    }
  }

  copyTextWithTextarea(text);
}

async function copyRawText(text, label, statusEl) {
  try {
    await writeClipboardText(text);
    setCopyStatus(statusEl, 'Copied ' + label + '.', 'success');
  } catch (error) {
    setCopyStatus(statusEl, 'Could not copy ' + label + '.', 'error');
  }
}

function clampZoom(value) {
  return Math.min(maxZoom, Math.max(minZoom, value));
}

function updateZoomStatus() {
  zoomStatusEl.textContent = 'Zoom ' + Math.round(zoom * 100) + '%';
}

function centerViewport() {
  viewportEl.scrollLeft = Math.max(0, (viewportEl.scrollWidth - viewportEl.clientWidth) / 2);
  viewportEl.scrollTop = Math.max(0, (viewportEl.scrollHeight - viewportEl.clientHeight) / 2);
}

function setSvgSizeForZoom() {
  if (!activeSvg || !baseWidth || !baseHeight) return;
  activeSvg.style.width = (baseWidth * zoom) + 'px';
  activeSvg.style.height = (baseHeight * zoom) + 'px';
  updateZoomStatus();
}

function applyZoom(nextZoom, anchorClientX = null, anchorClientY = null) {
  if (!activeSvg || !baseWidth || !baseHeight) return;
  const clamped = clampZoom(nextZoom);
  if (clamped === zoom) return;

  const rect = viewportEl.getBoundingClientRect();
  const anchorX = anchorClientX == null ? rect.left + (viewportEl.clientWidth / 2) : anchorClientX;
  const anchorY = anchorClientY == null ? rect.top + (viewportEl.clientHeight / 2) : anchorClientY;
  const localX = anchorX - rect.left + viewportEl.scrollLeft;
  const localY = anchorY - rect.top + viewportEl.scrollTop;
  const currentZoom = Math.max(0.001, zoom);
  const ratioX = localX / currentZoom;
  const ratioY = localY / currentZoom;

  zoom = clamped;
  setSvgSizeForZoom();

  viewportEl.scrollLeft = Math.max(0, ratioX * zoom - (anchorX - rect.left));
  viewportEl.scrollTop = Math.max(0, ratioY * zoom - (anchorY - rect.top));
}

function fitToViewport() {
  if (!activeSvg || !baseWidth || !baseHeight) return;
  const availableWidth = Math.max(80, viewportEl.clientWidth - 32);
  const availableHeight = Math.max(80, viewportEl.clientHeight - 32);
  const fitZoom = Math.min(1, availableWidth / baseWidth, availableHeight / baseHeight);
  zoom = clampZoom(fitZoom);
  setSvgSizeForZoom();
  centerViewport();
}

function resetView() {
  zoom = 1;
  setSvgSizeForZoom();
  centerViewport();
}

function edgeTargetBasename(edge = {}) {
  const targetPath = typeof edge.targetPath === 'string' ? edge.targetPath : '';
  const target = targetPath || (typeof edge.target === 'string' ? edge.target : '');
  return target.split(/[\\/]/).filter(Boolean).at(-1) || target;
}

function prefixLineCount(label, lineCount) {
  return Number.isInteger(lineCount) && lineCount > 0 ? lineCount + ' ' + label : label;
}

function formatNamedImportBinding(binding = {}) {
  const imported = typeof binding.imported === 'string' ? binding.imported : '';
  const local = typeof binding.local === 'string' ? binding.local : '';
  if (!imported && !local) return '';
  const callable = (local || imported) + '()';
  const label = !imported || imported === local ? callable : imported + ' as ' + callable;
  return prefixLineCount(label, binding.lineCount);
}

function edgeImportLabels(edge = {}) {
  const labels = [];
  const targetLabel = edgeTargetBasename(edge);
  for (const binding of Array.isArray(edge.imports) ? edge.imports : []) {
    const kind = typeof binding?.kind === 'string' ? binding.kind : 'named';
    if (kind === 'named') {
      labels.push(formatNamedImportBinding(binding));
    } else if (targetLabel) {
      labels.push(prefixLineCount(targetLabel, edge.targetLineCount));
    }
  }
  if (labels.length === 0 && targetLabel) labels.push(prefixLineCount(targetLabel, edge.targetLineCount));
  return Array.from(new Set(labels)).filter(Boolean);
}

function edgeDataIdPrefix(source, target) {
  return 'id_' + source + '_' + target + '_';
}

function hasClass(element, className) {
  if (!element) return false;
  if (element.classList && typeof element.classList.contains === 'function') {
    return element.classList.contains(className);
  }
  return (' ' + (element.getAttribute('class') || '') + ' ').includes(' ' + className + ' ');
}

function sourceKey(moduleId, name) {
  return moduleId + '\\u0000' + name;
}

function sourceDisplayKey(moduleId, displayName) {
  return moduleId + '\\u0000display\\u0000' + displayName;
}

function sourceDisplayName(labelText) {
  return (typeof labelText === 'string' ? labelText : '')
    .replace(/\\s+/g, ' ')
    .trim()
    .replace(/^\\\\?[+#~-]\\s*/, '')
    .trim();
}

function sourceMetricsSuffixPattern() {
  return /\\s+\\[lines:\\s*\\d+\\s*\\|\\s*refs:\\s*\\d+\\s*\\|\\s*importers:\\s*\\d+\\]\\s*$/i;
}

function validSourceNavigation(declaration) {
  return typeof declaration?.sourceGroup === 'string'
    && declaration.sourceGroup.trim()
    && Number.isInteger(declaration.sourceOrder);
}

function sourceDeclarationLookupFromPayload(sourcePayload = {}) {
  const byDisplay = new Map();
  const byName = new Map();
  const groupBuckets = new Map();
  for (const declaration of Array.isArray(sourcePayload?.declarations) ? sourcePayload.declarations : []) {
    const moduleId = typeof declaration.moduleId === 'string' ? declaration.moduleId : '';
    const name = typeof declaration.name === 'string' ? declaration.name : '';
    const displayName = typeof declaration.sourceDisplayName === 'string' ? declaration.sourceDisplayName.trim() : '';
    if (moduleId && displayName) byDisplay.set(sourceDisplayKey(moduleId, displayName), declaration);
    if (moduleId && name && !byName.has(sourceKey(moduleId, name))) byName.set(sourceKey(moduleId, name), declaration);
    if (!validSourceNavigation(declaration)) continue;
    if (!groupBuckets.has(declaration.sourceGroup)) groupBuckets.set(declaration.sourceGroup, []);
    groupBuckets.get(declaration.sourceGroup).push(declaration);
  }
  const groups = new Map();
  for (const [sourceGroup, declarations] of groupBuckets) {
    groups.set(sourceGroup, declarations.sort((a, b) => a.sourceOrder - b.sourceOrder
      || String(a.name || '').localeCompare(String(b.name || ''))));
  }
  return { byDisplay, byName, groups };
}

function sourcePayloadMatchesOutput(payload = {}, sourcePayload = {}) {
  const outputMeta = payload && typeof payload.meta === 'object' ? payload.meta : {};
  const sourceMeta = sourcePayload && typeof sourcePayload.meta === 'object' ? sourcePayload.meta : {};
  return Boolean(
    outputMeta.buildId
    && outputMeta.sourceCodeHash
    && sourceMeta.buildId
    && sourceMeta.sourceCodeHash
    && outputMeta.buildId === sourceMeta.buildId
    && outputMeta.sourceCodeHash === sourceMeta.sourceCodeHash
  );
}

async function loadSourceDeclarationMap(payload) {
  try {
    const sourceResponse = await fetch('./source-code.json');
    if (!sourceResponse.ok) return { byDisplay: new Map(), byName: new Map(), groups: new Map() };
    const sourcePayload = await sourceResponse.json();
    if (!sourcePayloadMatchesOutput(payload, sourcePayload)) {
      return { byDisplay: new Map(), byName: new Map(), groups: new Map() };
    }
    return sourceDeclarationLookupFromPayload(sourcePayload);
  } catch (error) {
    return { byDisplay: new Map(), byName: new Map(), groups: new Map() };
  }
}

function sourceMemberName(label) {
  let text = (typeof label === 'string' ? label : '').replace(/\\s+/g, ' ').trim();
  text = text.replace(/^\\\\?[+#~-]\\s*/, '');
  text = text.replace(sourceMetricsSuffixPattern(), '');
  text = text.replace(/^\\d+\\s+/, '');
  const parametersIndex = text.indexOf('(');
  if (parametersIndex !== -1) text = text.slice(0, parametersIndex);
  return text.trim();
}

function addModuleIdCandidate(candidates, value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return;
  const classIdMatch = raw.match(/(?:^|-)classId-(.+?)(?:-\\d+)?$/);
  if (classIdMatch) {
    candidates.push(classIdMatch[1]);
    return;
  }
  const classVariantMatch = raw.match(/^(?:class|flowchart)-(.+?)(?:-\\d+)?$/);
  if (classVariantMatch) {
    candidates.push(classVariantMatch[1]);
    return;
  }
  candidates.push(raw);
}

function sourceModuleIdCandidatesFromElement(element) {
  const candidates = [];
  if (!element || typeof element.getAttribute !== 'function') return candidates;
  addModuleIdCandidate(candidates, element.getAttribute('data-id'));
  addModuleIdCandidate(candidates, element.getAttribute('data-node-id'));
  addModuleIdCandidate(candidates, element.getAttribute('data-class-id'));
  addModuleIdCandidate(candidates, element.getAttribute('id'));
  return Array.from(new Set(candidates));
}

function sourceDeclarationForLabel(label) {
  const name = sourceMemberName(label.textContent);
  const displayName = sourceDisplayName(label.textContent);
  if (!name && !displayName) return null;
  let current = label;
  let fallbackDeclaration = null;
  while (current && current !== activeSvg) {
    for (const moduleId of sourceModuleIdCandidatesFromElement(current)) {
      if (displayName) {
        const declaration = sourceDeclarationLookup.byDisplay.get(sourceDisplayKey(moduleId, displayName));
        if (declaration) return declaration;
      }
      if (name && !fallbackDeclaration) {
        fallbackDeclaration = sourceDeclarationLookup.byName.get(sourceKey(moduleId, name)) || null;
      }
    }
    current = current.parentNode;
  }
  return fallbackDeclaration;
}

function sourceDeclarationLineCount(declaration) {
  const startLine = Number(declaration?.startLine);
  const endLine = Number(declaration?.endLine);
  return Number.isInteger(startLine) && Number.isInteger(endLine) && endLine >= startLine
    ? endLine - startLine + 1
    : 0;
}

function sourceMetricCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : 0;
}

function sourceMemberBaseText(labelText, declaration) {
  const raw = typeof labelText === 'string' ? labelText : '';
  const prefixMatch = raw.match(/^\\s*(\\\\?[+#~-])\\s*/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const displayName = String(declaration?.sourceDisplayName || '').replace(sourceMetricsSuffixPattern(), '').trim()
    || sourceDisplayName(raw).replace(sourceMetricsSuffixPattern(), '').replace(/\\s+:\\s*$/, '').trim()
    || String(declaration?.name || '').trim();
  return prefix + displayName;
}

function appendSourceMemberMetrics(element, declaration) {
  const tagName = typeof element?.tagName === 'string' ? element.tagName.toLowerCase() : '';
  const isSvgText = tagName === 'text';
  const createInlineElement = (className) => {
    const node = isSvgText
      ? document.createElementNS(svgNamespace, 'tspan')
      : document.createElement('span');
    node.setAttribute('class', className);
    return node;
  };
  const baseText = sourceMemberBaseText(element.textContent, declaration);
  const metrics = [
    ['lines', 'Lines ' + sourceDeclarationLineCount(declaration)],
    ['refs', 'Refs ' + sourceMetricCount(declaration?.referenceCount)],
    ['importers', 'Files ' + sourceMetricCount(declaration?.importerFileCount)],
  ];
  const labelText = createInlineElement('source-member-label-text');
  labelText.textContent = baseText;
  const metricsGroup = createInlineElement('source-member-metrics');
  metricsGroup.setAttribute('aria-hidden', 'true');
  for (const [metric, text] of metrics) {
    const badge = createInlineElement('source-member-metric');
    badge.setAttribute('data-metric', metric);
    badge.textContent = text;
    metricsGroup.appendChild(badge);
  }

  element.textContent = '';
  element.append(labelText, metricsGroup);
}

function svgNumber(value) {
  if (!Number.isFinite(value)) return '0';
  return String(Number(value.toFixed(3)));
}

function validSourceHitBox(box) {
  return box
    && Number.isFinite(box.x)
    && Number.isFinite(box.y)
    && Number.isFinite(box.width)
    && Number.isFinite(box.height)
    && box.width > 0
    && box.height > 0;
}

function sourceHitBoxFromAttributes(element) {
  if (!element || typeof element.getAttribute !== 'function') return null;
  const box = {
    x: Number.parseFloat(element.getAttribute('x')),
    y: Number.parseFloat(element.getAttribute('y')),
    width: Number.parseFloat(element.getAttribute('width')),
    height: Number.parseFloat(element.getAttribute('height')),
  };
  return validSourceHitBox(box) ? box : null;
}

function sourceMemberRecordForElement(element) {
  let current = element;
  while (current && current !== viewportEl) {
    if (typeof current.getAttribute === 'function') {
      const targetId = current.getAttribute('data-source-member-target-id');
      if (targetId && sourceMemberTargets.has(targetId)) return sourceMemberTargets.get(targetId);
    }
    current = current.parentNode;
  }
  return null;
}

function sourceClientRectForRecord(record) {
  if (!record?.element || typeof record.element.getBoundingClientRect !== 'function') return null;
  const rawRect = record.element.getBoundingClientRect();
  if (!rawRect) return null;
  const left = Number(rawRect.left);
  const top = Number(rawRect.top);
  const width = Number.isFinite(rawRect.width) ? Number(rawRect.width) : Number(rawRect.right) - left;
  const height = Number.isFinite(rawRect.height) ? Number(rawRect.height) : Number(rawRect.bottom) - top;
  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
  if (width <= 0 || height <= 0) return null;
  return {
    left,
    top,
    right: Number.isFinite(rawRect.right) ? Number(rawRect.right) : left + width,
    bottom: Number.isFinite(rawRect.bottom) ? Number(rawRect.bottom) : top + height,
    width,
    height,
  };
}

function sourcePointInsideRecord(record, clientX, clientY) {
  const rect = sourceClientRectForRecord(record);
  if (!rect) return null;
  return clientX >= rect.left
    && clientX <= rect.right
    && clientY >= rect.top
    && clientY <= rect.bottom;
}

function sourceElementsFromPoint(clientX, clientY) {
  if (typeof document.elementsFromPoint !== 'function') return [];
  try {
    return Array.from(document.elementsFromPoint(clientX, clientY) || []);
  } catch (error) {
    return [];
  }
}

function sourceVisibleRecordFromPointStack(elements, clientX, clientY) {
  for (const element of elements) {
    if (hasClass(element, 'source-member-hit-target')) continue;
    const record = sourceMemberRecordForElement(element);
    if (!record) continue;
    const containsPoint = sourcePointInsideRecord(record, clientX, clientY);
    if (containsPoint !== false) return record;
  }
  return null;
}

function sourceCandidateRecordsFromPointStack(elements, fallbackRecord) {
  const records = [];
  const seen = new Set();
  const addRecord = (record) => {
    if (!record || seen.has(record.id)) return;
    seen.add(record.id);
    records.push(record);
  };
  for (const element of elements) addRecord(sourceMemberRecordForElement(element));
  addRecord(fallbackRecord);
  return records;
}

function sourceRecordDistanceFromPoint(record, clientX, clientY) {
  const rect = sourceClientRectForRecord(record);
  if (!rect) return { vertical: Number.POSITIVE_INFINITY, horizontal: Number.POSITIVE_INFINITY };
  const centerY = rect.top + (rect.height / 2);
  const vertical = Math.abs(clientY - centerY);
  const horizontal = clientX < rect.left
    ? rect.left - clientX
    : (clientX > rect.right ? clientX - rect.right : 0);
  return { vertical, horizontal };
}

function nearestSourceRecordForPoint(records, clientX, clientY) {
  return records
    .map((record) => ({
      record,
      distance: sourceRecordDistanceFromPoint(record, clientX, clientY),
    }))
    .sort((a, b) => a.distance.vertical - b.distance.vertical
      || a.distance.horizontal - b.distance.horizontal
      || a.record.order - b.record.order
      || String(a.record.declaration?.name || '').localeCompare(String(b.record.declaration?.name || '')))[0]?.record || null;
}

function sourceActivationRecordForEvent(event, fallbackRecord) {
  const targetRecord = sourceMemberRecordForElement(event?.currentTarget)
    || sourceMemberRecordForElement(event?.target)
    || fallbackRecord;
  const clientX = Number(event?.clientX);
  const clientY = Number(event?.clientY);
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return targetRecord;

  const pointElements = sourceElementsFromPoint(clientX, clientY);
  const visibleRecord = sourceVisibleRecordFromPointStack(pointElements, clientX, clientY);
  if (visibleRecord) return visibleRecord;

  const candidates = sourceCandidateRecordsFromPointStack(pointElements, targetRecord);
  return nearestSourceRecordForPoint(candidates, clientX, clientY) || targetRecord;
}

function sourceHitTargetReference(element) {
  let current = element;
  while (current && current !== activeSvg) {
    if (typeof current.getBBox === 'function') {
      try {
        const box = current.getBBox();
        if (validSourceHitBox(box)) return { element: current, box };
      } catch (error) {
        // Some rendered SVG/HTML hybrids expose getBBox but throw until layout settles.
      }
    }

    const attributeBox = sourceHitBoxFromAttributes(current);
    if (attributeBox) return { element: current, box: attributeBox };
    current = current.parentNode;
  }
  return null;
}

function addSourceHitTarget(record, activate) {
  const element = record.element;
  const reference = sourceHitTargetReference(element);
  const parent = reference?.element?.parentNode;
  if (!parent) return;

  const { x, y, width, height } = reference.box;
  const hitTarget = document.createElementNS(svgNamespace, 'path');
  hitTarget.classList.add('source-member-hit-target');
  hitTarget.setAttribute('data-source-member-target-id', record.id);
  hitTarget.setAttribute('d', 'M' + svgNumber(x) + ' ' + svgNumber(y + (height / 2)) + 'H' + svgNumber(x + width));
  hitTarget.setAttribute('aria-hidden', 'true');
  hitTarget.setAttribute('focusable', 'false');
  hitTarget.setAttribute('vector-effect', 'non-scaling-stroke');
  hitTarget.addEventListener('click', activate);
  record.hitTarget = hitTarget;
  parent.appendChild(hitTarget);
}

function sourceDialogNavigationForDeclaration(declaration) {
  const group = validSourceNavigation(declaration)
    ? (sourceDeclarationLookup.groups.get(declaration.sourceGroup) || [])
    : [];
  const index = group.indexOf(declaration);
  return { group, index };
}

function canNavigateSourceDialog(direction) {
  const nextIndex = sourceDialogState.index + direction;
  return sourceDialogState.group.length > 1
    && nextIndex >= 0
    && nextIndex < sourceDialogState.group.length;
}

function updateSourceDialogNavigationControls() {
  if (sourceDialogPreviousBtn) sourceDialogPreviousBtn.disabled = !canNavigateSourceDialog(-1);
  if (sourceDialogNextBtn) sourceDialogNextBtn.disabled = !canNavigateSourceDialog(1);
}

function renderSourceDialogDeclaration(declaration) {
  if (!sourceDialogEl || !declaration) return;
  sourceDialogTitleEl.textContent = declaration.name || declaration.declarationName || 'Source';
  sourceDialogPathEl.textContent = (declaration.modulePath || 'unknown source')
    + ':'
    + (declaration.startLine || '?')
    + '-'
    + (declaration.endLine || '?');
  sourceDialogCodeEl.textContent = typeof declaration.code === 'string' ? declaration.code : '';
  updateSourceDialogNavigationControls();
}

function showSourceDialog(declaration, restoreFocusEl) {
  if (!sourceDialogEl || !declaration) return;
  sourceDialogState = {
    declaration,
    ...sourceDialogNavigationForDeclaration(declaration),
  };
  sourceDialogRestoreFocusEl = restoreFocusEl || null;
  renderSourceDialogDeclaration(declaration);

  if (typeof sourceDialogEl.showModal === 'function') {
    if (!sourceDialogEl.open) sourceDialogEl.showModal();
  } else {
    sourceDialogEl.setAttribute('open', '');
  }
  if (sourceDialogCloseBtn && typeof sourceDialogCloseBtn.focus === 'function') sourceDialogCloseBtn.focus();
}

function navigateSourceDialog(direction) {
  if (!canNavigateSourceDialog(direction)) return;
  const nextIndex = sourceDialogState.index + direction;
  const declaration = sourceDialogState.group[nextIndex];
  sourceDialogState = {
    declaration,
    group: sourceDialogState.group,
    index: nextIndex,
  };
  renderSourceDialogDeclaration(declaration);
}

function closeSourceDialog() {
  if (!sourceDialogEl) return;
  const restoreFocusEl = sourceDialogRestoreFocusEl;
  sourceDialogRestoreFocusEl = null;
  sourceDialogState = { declaration: null, group: [], index: -1 };
  updateSourceDialogNavigationControls();
  if (sourceDialogEl.open && typeof sourceDialogEl.close === 'function') {
    sourceDialogEl.close();
  } else {
    sourceDialogEl.removeAttribute('open');
  }
  if (restoreFocusEl && typeof restoreFocusEl.focus === 'function') restoreFocusEl.focus();
}

function addSourceActivation(element, declaration) {
  const record = {
    id: String(++sourceMemberTargetCounter),
    order: sourceMemberTargetCounter,
    element,
    declaration,
    hitTarget: null,
  };
  sourceMemberTargets.set(record.id, record);

  element.classList.add('source-member-trigger');
  element.setAttribute('data-source-member-target-id', record.id);
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  element.setAttribute('focusable', 'true');
  element.setAttribute('aria-label', 'Show source for ' + declaration.name + ' in ' + declaration.modulePath);
  appendSourceMemberMetrics(element, declaration);

  const activate = (event) => {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const activationRecord = sourceActivationRecordForEvent(event, record) || record;
    showSourceDialog(activationRecord.declaration, activationRecord.element || element);
  };
  element.addEventListener('click', activate);
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(event);
  });
  addSourceHitTarget(record, activate);
}

function wireSourceMembers() {
  if (
    !activeSvg
    || typeof activeSvg.querySelectorAll !== 'function'
    || (sourceDeclarationLookup.byDisplay.size === 0 && sourceDeclarationLookup.byName.size === 0)
  ) return;
  sourceMemberTargetCounter = 0;
  sourceMemberTargets = new Map();
  const labels = [
    ...Array.from(activeSvg.querySelectorAll('text')),
    ...Array.from(activeSvg.querySelectorAll('p')),
  ];
  for (const label of labels) {
    const declaration = sourceDeclarationForLabel(label);
    if (!declaration) continue;
    addSourceActivation(label, declaration);
  }
}

function findEdgeLabelGroup(label, dataId) {
  const groups = Array.from(label.querySelectorAll('g.label[data-id]'));
  return groups.find((group) => group.getAttribute('data-id') === dataId) || groups[0] || null;
}

function findRenderedEdgeLabel(labels, dataId) {
  for (const label of labels) {
    const labelGroup = findEdgeLabelGroup(label, dataId);
    if (labelGroup && labelGroup.getAttribute('data-id') === dataId) return { label, labelGroup };
  }
  return { label: null, labelGroup: null };
}

function originalEdgeLabelContent(labelGroup) {
  return Array.from(labelGroup.children)
    .find((child) => !hasClass(child, 'edge-import-label')) || null;
}

function renderEmptySelectedImport() {
  selectedImportEl.textContent = '';
  const message = document.createElement('p');
  message.className = 'muted';
  message.textContent = 'No edge selected.';
  selectedImportEl.appendChild(message);
}

function appendSelectedImportRow(parent, label, value) {
  const row = document.createElement('div');
  row.className = 'selected-import-row';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  const valueEl = document.createElement('code');
  valueEl.textContent = value || 'none';
  row.append(labelEl, valueEl);
  parent.appendChild(row);
}

function renderSelectedImport(edge, labels) {
  selectedImportEl.textContent = '';
  const title = document.createElement('h3');
  title.textContent = (edge.source || 'unknown') + ' -> ' + (edge.target || 'unknown');
  const rows = document.createElement('div');
  rows.className = 'selected-import-rows';
  appendSelectedImportRow(rows, 'Source', edge.sourcePath || edge.source);
  appendSelectedImportRow(rows, 'Target', edge.targetPath || edge.target);
  appendSelectedImportRow(rows, 'Load', Array.isArray(edge.loadKinds) ? edge.loadKinds.join(', ') : 'unknown');
  const listTitle = document.createElement('h4');
  listTitle.textContent = 'Direct Imports';
  const list = document.createElement('ul');
  list.className = 'selected-import-list';
  for (const label of labels) {
    const item = document.createElement('li');
    item.textContent = label;
    list.appendChild(item);
  }
  selectedImportEl.append(title, rows, listTitle, list);
}

let expandedEdge = null;

function collapseExpandedEdge() {
  if (!expandedEdge) return;
  const { customLabel, label, originalContent, originalDisplay, path } = expandedEdge;
  if (customLabel && typeof customLabel.remove === 'function') customLabel.remove();
  if (originalContent) originalContent.style.display = originalDisplay;
  if (label) label.classList.remove('is-expanded');
  if (path) path.classList.remove('is-selected');
  expandedEdge = null;
  renderEmptySelectedImport();
}

function expandEdgeLabel(edge, path, label, labelGroup) {
  collapseExpandedEdge();
  const originalContent = labelGroup && originalEdgeLabelContent(labelGroup);
  if (!labelGroup || !originalContent) return;
  const labels = edgeImportLabels(edge);
  const lines = labels.length > 0 ? labels : [edge.targetPath || edge.target || 'module import'];
  const width = Math.min(460, Math.max(120, Math.ceil(Math.max(...lines.map((line) => line.length)) * 7.2) + 24));
  const height = 12 + (lines.length * 20);
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const customLabel = document.createElementNS(svgNamespace, 'g');
  const rect = document.createElementNS(svgNamespace, 'rect');
  const text = document.createElementNS(svgNamespace, 'text');

  customLabel.setAttribute('class', 'edge-import-label');
  rect.setAttribute('x', String(-width / 2));
  rect.setAttribute('y', String(-height / 2));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '7');
  text.setAttribute('x', '0');
  text.setAttribute('y', String((-height / 2) + 18));
  text.setAttribute('text-anchor', 'middle');
  lines.forEach((line, index) => {
    const tspan = document.createElementNS(svgNamespace, 'tspan');
    tspan.setAttribute('x', '0');
    if (index > 0) tspan.setAttribute('dy', '20');
    tspan.textContent = line;
    text.appendChild(tspan);
  });
  customLabel.append(rect, text);
  const originalDisplay = originalContent.style.display;
  originalContent.style.display = 'none';
  labelGroup.appendChild(customLabel);
  label.classList.add('is-expanded');
  path.classList.add('is-selected');
  expandedEdge = { customLabel, label, originalContent, originalDisplay, path };
  renderSelectedImport(edge, lines);
}

function addEdgeClickActivation(element, callback) {
  element.addEventListener('click', callback);
}

function addEdgeActivation(element, callback) {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  addEdgeClickActivation(element, callback);
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    callback(event);
  });
}

function isEdgePointerTarget(target) {
  let element = target;
  while (element && element !== viewportEl) {
    const tagName = typeof element.tagName === 'string' ? element.tagName.toLowerCase() : '';
    if (hasClass(element, 'edge-hit-target') || hasClass(element, 'edgeLabel')) return true;
    if (tagName === 'path' && (hasClass(element, 'relation') || element.getAttribute('data-edge') === 'true')) {
      return true;
    }
    element = element.parentNode;
  }
  return false;
}

function isSourcePointerTarget(target) {
  let element = target;
  while (element && element !== viewportEl) {
    if (hasClass(element, 'source-member-trigger') || hasClass(element, 'source-member-hit-target')) return true;
    element = element.parentNode;
  }
  return false;
}

function wireImportEdges(importEdges) {
  if (!activeSvg || typeof activeSvg.querySelectorAll !== 'function') return;
  const paths = Array.from(activeSvg.querySelectorAll('path[data-id]'))
    .filter((path) => hasClass(path, 'relation') || path.getAttribute('data-edge') === 'true');
  const labels = Array.from(activeSvg.querySelectorAll('g.edgeLabel'));
  const claimedPaths = new Set();

  for (const edge of Array.isArray(importEdges) ? importEdges : []) {
    const prefix = edgeDataIdPrefix(edge.source, edge.target);
    const path = paths.find((candidate) => {
      const dataId = candidate.getAttribute('data-id') || '';
      return !claimedPaths.has(candidate) && dataId.startsWith(prefix);
    });
    if (!path) continue;
    const dataId = path.getAttribute('data-id');
    const { label, labelGroup } = findRenderedEdgeLabel(labels, dataId);
    if (!label || !labelGroup) continue;
    claimedPaths.add(path);

    const activate = () => expandEdgeLabel(edge, path, label, labelGroup);
    const targetLabel = edge.targetPath || edge.target;
    path.setAttribute('aria-label', 'Show imports for ' + targetLabel);
    label.setAttribute('aria-label', 'Show imports for ' + targetLabel);
    addEdgeActivation(path, activate);
    addEdgeActivation(label, activate);

    const hitPath = path.cloneNode(false);
    hitPath.classList.add('edge-hit-target');
    hitPath.removeAttribute('id');
    hitPath.removeAttribute('data-id');
    hitPath.removeAttribute('aria-label');
    hitPath.removeAttribute('role');
    hitPath.removeAttribute('tabindex');
    hitPath.removeAttribute('marker-start');
    hitPath.removeAttribute('marker-mid');
    hitPath.removeAttribute('marker-end');
    hitPath.setAttribute('aria-hidden', 'true');
    hitPath.setAttribute('focusable', 'false');
    hitPath.setAttribute('vector-effect', 'non-scaling-stroke');
    addEdgeClickActivation(hitPath, activate);
    path.parentNode.insertBefore(hitPath, path);
  }
}

function distanceBetween(pointerA, pointerB) {
  return Math.hypot(pointerA.clientX - pointerB.clientX, pointerA.clientY - pointerB.clientY);
}

function midpointBetween(pointerA, pointerB) {
  return {
    clientX: (pointerA.clientX + pointerB.clientX) / 2,
    clientY: (pointerA.clientY + pointerB.clientY) / 2,
  };
}

function startPinchIfNeeded() {
  if (activePointers.size !== 2) {
    pinchState = null;
    return;
  }
  const [pointerA, pointerB] = Array.from(activePointers.values());
  pinchState = {
    startZoom: zoom,
    startDistance: distanceBetween(pointerA, pointerB),
    midpoint: midpointBetween(pointerA, pointerB),
  };
}

function bindInteraction() {
  viewportEl.addEventListener('wheel', (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0025);
    applyZoom(zoom * factor, event.clientX, event.clientY);
  }, { passive: false });

  viewportEl.addEventListener('pointerdown', (event) => {
    if (isEdgePointerTarget(event.target) || isSourcePointerTarget(event.target)) return;

    activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (activePointers.size === 1) {
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollLeft: viewportEl.scrollLeft,
        startScrollTop: viewportEl.scrollTop,
      };
      viewportEl.classList.add('is-dragging');
      viewportEl.setPointerCapture(event.pointerId);
    } else {
      dragState = null;
      viewportEl.classList.remove('is-dragging');
      startPinchIfNeeded();
    }
  });

  viewportEl.addEventListener('pointermove', (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (pinchState && activePointers.size === 2) {
      const [pointerA, pointerB] = Array.from(activePointers.values());
      const currentDistance = distanceBetween(pointerA, pointerB);
      const midpoint = midpointBetween(pointerA, pointerB);
      if (pinchState.startDistance > 0) {
        applyZoom((currentDistance / pinchState.startDistance) * pinchState.startZoom, midpoint.clientX, midpoint.clientY);
      }
      return;
    }

    if (!dragState || dragState.pointerId !== event.pointerId) return;
    viewportEl.scrollLeft = dragState.startScrollLeft - (event.clientX - dragState.startX);
    viewportEl.scrollTop = dragState.startScrollTop - (event.clientY - dragState.startY);
  });

  function clearPointer(event) {
    activePointers.delete(event.pointerId);
    if (dragState && dragState.pointerId === event.pointerId) {
      dragState = null;
      viewportEl.classList.remove('is-dragging');
    }
    if (activePointers.size < 2) pinchState = null;
    if (activePointers.size === 1) {
      const [remainingId, remainingPointer] = Array.from(activePointers.entries())[0];
      dragState = {
        pointerId: remainingId,
        startX: remainingPointer.clientX,
        startY: remainingPointer.clientY,
        startScrollLeft: viewportEl.scrollLeft,
        startScrollTop: viewportEl.scrollTop,
      };
      viewportEl.classList.add('is-dragging');
    }
  }

  viewportEl.addEventListener('pointerup', clearPointer);
  viewportEl.addEventListener('pointercancel', clearPointer);
  viewportEl.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && dragState && dragState.pointerId === event.pointerId && event.buttons === 0) {
      clearPointer(event);
    }
  });

  zoomInBtn.addEventListener('click', () => applyZoom(zoom * 1.2));
  zoomOutBtn.addEventListener('click', () => applyZoom(zoom / 1.2));
  fitBtn.addEventListener('click', fitToViewport);
  resetViewBtn.addEventListener('click', resetView);
  sourceDialogPreviousBtn.addEventListener('click', () => navigateSourceDialog(-1));
  sourceDialogNextBtn.addEventListener('click', () => navigateSourceDialog(1));
  sourceDialogCloseBtn.addEventListener('click', closeSourceDialog);
  sourceDialogEl.addEventListener('click', (event) => {
    if (event.target === sourceDialogEl) closeSourceDialog();
  });
  sourceDialogEl.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateSourceDialog(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateSourceDialog(1);
    } else if (event.key === 'Escape') {
      closeSourceDialog();
    }
  });
}

function prepareSvgForInteraction(svgMarkup, importEdges) {
  latestSvg = svgMarkup;
  diagramEl.innerHTML = svgMarkup;
  activeSvg = diagramEl.querySelector('svg');
  if (!activeSvg) return;

  const viewBox = activeSvg.viewBox && activeSvg.viewBox.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    baseWidth = viewBox.width;
    baseHeight = viewBox.height;
  } else {
    baseWidth = activeSvg.getBoundingClientRect().width || Number.parseFloat(activeSvg.getAttribute('width')) || 1200;
    baseHeight = activeSvg.getBoundingClientRect().height || Number.parseFloat(activeSvg.getAttribute('height')) || 800;
  }

  activeSvg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  activeSvg.style.maxWidth = 'none';
  activeSvg.style.width = baseWidth + 'px';
  activeSvg.style.height = baseHeight + 'px';
  zoom = 1;
  updateZoomStatus();
  wireImportEdges(importEdges);
  wireSourceMembers();
  requestAnimationFrame(() => fitToViewport());
}

function formatBuildMeta(metadata = {}) {
  const version = metadata.version || 'unknown';
  const generatedAtRaw = metadata.generatedAt || '';
  const generatedAt = generatedAtRaw ? new Date(generatedAtRaw) : null;
  const generatedLabel = generatedAt && !Number.isNaN(generatedAt.valueOf())
    ? generatedAt.toLocaleString()
    : (generatedAtRaw || 'unknown time');
  return 'Built ' + generatedLabel + '  •  v' + version;
}

async function main() {
  renderEmptySelectedImport();
  const response = await fetch('./output.json');
  if (!response.ok) throw new Error('Failed to load output.json');
  const payload = await response.json();
  sourceDeclarationLookup = await loadSourceDeclarationMap(payload);
  rawJsxTreeText = typeof payload.jsxTreeText === 'string' ? payload.jsxTreeText : '';
  rawMermaidSourceText = typeof payload.mermaid === 'string' ? payload.mermaid : '';
  subtitleEl.textContent = payload.entry + '  •  ' + payload.rootDir;
  buildMetaEl.textContent = formatBuildMeta(payload.meta);
  jsxTreeEl.textContent = rawJsxTreeText || 'No JSX files found.';
  treeEl.textContent = payload.treeText;
  mermaidEl.textContent = rawMermaidSourceText;
  copyJsxTreeBtn.disabled = false;
  copyMermaidSourceBtn.disabled = false;
  statsEl.append(
    statCard('modules', payload.summary.moduleCount),
    statCard('jsx files', payload.summary.jsxFileCount ?? payload.summary.jsxClassCount),
    statCard('scripts', payload.summary.jsScriptCount),
    statCard('externals', payload.summary.externalCount),
  );
  const { svg } = await mermaid.render('ironglancer-diagram-' + Date.now(), payload.mermaid);
  prepareSvgForInteraction(svg, payload.importEdges);
}

downloadBtn.addEventListener('click', () => {
  if (!latestSvg) return;
  const blob = new Blob([latestSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'ironglancer.svg';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
});

copyJsxTreeBtn.addEventListener('click', () => {
  copyRawText(rawJsxTreeText, 'JSX tree', copyJsxTreeStatusEl);
});

copyMermaidSourceBtn.addEventListener('click', () => {
  copyRawText(rawMermaidSourceText, 'Mermaid source', copyMermaidSourceStatusEl);
});

bindInteraction();
main().catch((error) => {
  subtitleEl.textContent = error?.message || String(error);
  subtitleEl.style.color = '#b42318';
  buildMetaEl.textContent = '';
});
`;
}

async function copyMermaidAsset(outDir) {
  const packageJsonPath = require.resolve('mermaid/package.json');
  const mermaidDistDir = path.join(path.dirname(packageJsonPath), 'dist');
  const vendorDir = path.join(outDir, 'vendor');
  await fs.mkdir(vendorDir, { recursive: true });
  await fs.copyFile(
    path.join(mermaidDistDir, 'mermaid.esm.min.mjs'),
    path.join(vendorDir, 'mermaid.esm.min.mjs'),
  );

  const mermaidChunksDir = path.join(mermaidDistDir, 'chunks');
  await fs.cp(
    mermaidChunksDir,
    path.join(vendorDir, 'chunks'),
    { recursive: true },
  );
}

export async function generateStaticSite({ rootDir, entry, outDir, routeAliases } = {}) {
  const resolvedOutDir = path.resolve(outDir || 'ironglancer-site');
  const analysis = await analyzeProject({ rootDir, entry, routeAliases });
  assertNoCredentialLiterals(analysis.sourceCode);
  const generatedAt = new Date().toISOString();
  const sourceCodePayload = { ...analysis.sourceCode };
  const sourceCodeHash = contentHash(sourceCodePayload);
  const appJs = viewerAppJs();
  const appScriptSrc = `./app.js?v=${textContentHash(appJs)}`;
  const buildId = contentHash({
    packageName: packageMeta.name,
    version: packageMeta.version,
    rootDir: analysis.rootDir,
    entry: analysis.entryRel,
    treeText: analysis.treeText,
    jsxTreeText: analysis.jsxTreeText,
    jsScripts: analysis.jsScripts,
    jsxScripts: analysis.jsxScripts,
    mermaid: analysis.mermaid,
    importEdges: analysis.importEdges,
    summary: analysis.summary,
    sourceCodeHash,
  });
  const meta = {
    packageName: packageMeta.name,
    version: packageMeta.version,
    generatedAt,
    buildId,
    sourceCodeHash,
  };
  await fs.rm(resolvedOutDir, { recursive: true, force: true });
  await fs.mkdir(resolvedOutDir, { recursive: true });
  await fs.writeFile(path.join(resolvedOutDir, 'index.html'), viewerHtml({ appScriptSrc }), 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'app.js'), appJs, 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'diagram.mmd'), analysis.mermaid + '\n', 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'source-code.json'), JSON.stringify({
    ...sourceCodePayload,
    meta,
  }, null, 2) + '\n', 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'output.json'), JSON.stringify({
    rootDir: analysis.rootDir,
    entry: analysis.entryRel,
    treeText: analysis.treeText,
    jsxTreeText: analysis.jsxTreeText,
    jsScripts: analysis.jsScripts,
    jsxScripts: analysis.jsxScripts,
    mermaid: analysis.mermaid,
    importEdges: analysis.importEdges,
    summary: analysis.summary,
    meta,
  }, null, 2) + '\n', 'utf8');
  await copyMermaidAsset(resolvedOutDir);
  return { outDir: resolvedOutDir, ...analysis };
}
