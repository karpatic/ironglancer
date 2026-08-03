function escapeHtmlAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

export function viewerHtml({ appScriptSrc = './app.js' } = {}) {
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
