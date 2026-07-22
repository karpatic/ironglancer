import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

import { analyzeProject } from './analyze-project.js';

const require = createRequire(import.meta.url);
const packageMeta = require('../../package.json');

function viewerHtml() {
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
    <script type="module" src="./app.js"></script>
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

let expandedEdge = null;

function collapseExpandedEdge() {
  if (!expandedEdge) return;
  const { customLabel, label, originalContent, originalDisplay, path } = expandedEdge;
  if (customLabel && typeof customLabel.remove === 'function') customLabel.remove();
  if (originalContent) originalContent.style.display = originalDisplay;
  if (label) label.classList.remove('is-expanded');
  if (path) path.classList.remove('is-selected');
  expandedEdge = null;
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
    if (isEdgePointerTarget(event.target)) return;

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
  const response = await fetch('./output.json');
  if (!response.ok) throw new Error('Failed to load output.json');
  const payload = await response.json();
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
  const generatedAt = new Date().toISOString();
  await fs.rm(resolvedOutDir, { recursive: true, force: true });
  await fs.mkdir(resolvedOutDir, { recursive: true });
  await fs.writeFile(path.join(resolvedOutDir, 'index.html'), viewerHtml(), 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'app.js'), viewerAppJs(), 'utf8');
  await fs.writeFile(path.join(resolvedOutDir, 'diagram.mmd'), analysis.mermaid + '\n', 'utf8');
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
    meta: {
      packageName: packageMeta.name,
      version: packageMeta.version,
      generatedAt,
    },
  }, null, 2) + '\n', 'utf8');
  await copyMermaidAsset(resolvedOutDir);
  return { outDir: resolvedOutDir, ...analysis };
}
