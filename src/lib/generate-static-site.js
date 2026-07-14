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
          <a class="button" href="./output.json">Open JSON</a>
          <a class="button" href="./diagram.mmd">Open Mermaid</a>
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
          <div class="panel">
            <h2>Dependency tree</h2>
            <div class="body"><pre id="tree"></pre></div>
          </div>
          <div class="panel">
            <h2>Scripts</h2>
            <div class="body"><ul id="scripts"></ul></div>
          </div>
          <div class="panel">
            <h2>Mermaid source</h2>
            <div class="body"><pre id="mermaid"></pre></div>
          </div>
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
const treeEl = document.getElementById('tree');
const scriptsEl = document.getElementById('scripts');
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
let latestSvg = '';
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

function renderScripts(items) {
  scriptsEl.textContent = '';
  for (const item of items || []) {
    const li = document.createElement('li');
    li.textContent = item.path + '  lines=' + item.lineCount + '  maxLineLength=' + item.maxLineLength;
    scriptsEl.appendChild(li);
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

function prepareSvgForInteraction(svgMarkup) {
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
  subtitleEl.textContent = payload.entry + '  •  ' + payload.rootDir;
  buildMetaEl.textContent = formatBuildMeta(payload.meta);
  treeEl.textContent = payload.treeText;
  mermaidEl.textContent = payload.mermaid;
  renderScripts(payload.jsScripts);
  statsEl.append(
    statCard('modules', payload.summary.moduleCount),
    statCard('jsx classes', payload.summary.jsxClassCount),
    statCard('scripts', payload.summary.jsScriptCount),
    statCard('externals', payload.summary.externalCount),
  );
  const { svg } = await mermaid.render('ironglancer-diagram-' + Date.now(), payload.mermaid);
  prepareSvgForInteraction(svg);
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
    jsScripts: analysis.jsScripts,
    mermaid: analysis.mermaid,
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
