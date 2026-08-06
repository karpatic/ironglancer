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
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231d4ed8'/%3E%3Cpath d='M18 16h28v8H36v24h-8V24H18z' fill='white'/%3E%3C/svg%3E">
    <title>IronGlancer</title>
    <style>
      :root {
        --bg:#f4f6f8;
        --panel:#ffffff;
        --text:#172033;
        --muted:#667085;
        --soft:#eef2f6;
        --border:#d7dee8;
        --accent:#1d4ed8;
        --accent-strong:#173a8a;
        --good:#087f5b;
        --warn:#b45309;
        --danger:#b42318;
        --code:#0f172a;
      }
      * { box-sizing:border-box; }
      body {
        margin:0;
        color:var(--text);
        background:var(--bg);
        font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      button, a { font:inherit; }
      button, a.button {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        min-height:34px;
        border:1px solid #b9c9e8;
        border-radius:8px;
        background:#f8fbff;
        color:#1f3f7a;
        cursor:pointer;
        font-weight:700;
        line-height:1;
        padding:7px 10px;
        text-decoration:none;
      }
      button:hover, a.button:hover { background:#edf5ff; }
      button:focus-visible, a.button:focus-visible {
        outline:3px solid rgba(29,78,216,.22);
        outline-offset:2px;
      }
      button:disabled { cursor:not-allowed; opacity:.55; }
      .shell {
        width:min(100% - 28px, 1480px);
        margin:0 auto;
        padding:18px 0 36px;
      }
      .header {
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:16px;
        margin-bottom:14px;
      }
      .title { margin:0; font-size:1.55rem; letter-spacing:0; }
      .subtitle, .meta-line {
        margin:4px 0 0;
        color:var(--muted);
        font-size:.92rem;
        overflow-wrap:anywhere;
      }
      .panel {
        min-width:0;
        border:1px solid var(--border);
        border-radius:8px;
        background:var(--panel);
        box-shadow:0 12px 28px rgba(31,45,68,.06);
        overflow:hidden;
      }
      .panel-header {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        min-height:46px;
        padding:10px 12px;
        border-bottom:1px solid var(--border);
      }
      .panel-header h2, .panel summary h2 {
        margin:0;
        font-size:.96rem;
        letter-spacing:0;
      }
      .panel-body { padding:12px; }
      .viewer-grid {
        display:grid;
        gap:14px;
      }
      .visualization-panel-body {
        display:grid;
        gap:12px;
      }
      .visualization-switch-row {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        justify-content:space-between;
        gap:10px;
      }
      .visualization-view {
        display:grid;
        gap:10px;
      }
      .visualization-view[hidden] { display:none; }
      .lower-grid {
        display:grid;
        gap:14px;
        align-items:start;
      }
      @media (min-width: 1100px) {
        .lower-grid { grid-template-columns:minmax(320px,.82fr) minmax(0,1.18fr); }
      }
      .network-toolbar, .toolbar-group, .legend, .chip-row {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:7px;
      }
      .network-toolbar { justify-content:space-between; }
      .network-primary-controls {
        align-items:center;
        gap:10px;
      }
      .control-set {
        display:inline-flex;
        align-items:center;
        gap:5px;
      }
      .control-label {
        color:#475467;
        font-size:.76rem;
        font-weight:850;
      }
      .segmented-control {
        display:inline-flex;
        align-items:center;
        gap:2px;
        min-height:34px;
        border:1px solid #c7d4e7;
        border-radius:8px;
        background:#eef3f9;
        padding:2px;
      }
      .segmented-control button {
        min-height:28px;
        border:0;
        border-radius:6px;
        background:transparent;
        color:#475467;
        font-size:.78rem;
        font-weight:850;
        padding:6px 9px;
      }
      .segmented-control button:hover { background:#f8fbff; }
      .segmented-control button[aria-disabled="true"] { cursor:not-allowed; }
      .segmented-control button.is-active {
        background:#ffffff;
        color:#173a8a;
        box-shadow:0 1px 3px rgba(31,45,68,.14);
      }
      .status-line {
        min-height:1.25em;
        color:var(--muted);
        font-size:.84rem;
      }
      .network-help {
        color:var(--muted);
        font-size:.82rem;
      }
      .network-viewport {
        position:relative;
        min-height:620px;
        max-height:78vh;
        overflow:auto;
        overscroll-behavior:contain;
        border:1px solid var(--border);
        border-radius:8px;
        background:
          linear-gradient(90deg, rgba(18,32,54,.045) 1px, transparent 1px) 0 0 / 28px 28px,
          linear-gradient(rgba(18,32,54,.045) 1px, transparent 1px) 0 0 / 28px 28px,
          #fbfcff;
        cursor:grab;
        touch-action:none;
      }
      .network-viewport.is-dragging { cursor:grabbing; }
      .network-svg {
        display:block;
        min-width:100%;
        min-height:100%;
      }
      .file-lane { fill:#ffffff; stroke:#dfe5ef; stroke-width:1; }
      .file-lane-label { fill:#64748b; font-size:12px; font-weight:800; }
      .network-edge {
        fill:none;
        stroke:#9aa8bb;
        stroke-width:1.6;
        opacity:.62;
      }
      .network-edge.is-file-call {
        stroke-width:var(--edge-width, 2.1);
      }
      .network-edge.is-membership {
        stroke:#9aa8bb;
        stroke-width:1.1;
        stroke-dasharray:3 5;
        opacity:.34;
      }
      .network-edge:hover {
        stroke:var(--accent);
        opacity:1;
      }
      .network-edge-hit {
        fill:none;
        stroke:transparent;
        stroke-width:14;
        pointer-events:stroke;
        cursor:pointer;
      }
      .network-edge:focus-visible {
        outline:0;
        stroke:var(--accent);
        stroke-width:3;
      }
      .network-node { cursor:pointer; transition:opacity .14s ease; }
      .network-node circle {
        stroke:#ffffff;
        stroke-width:2.5;
        filter:drop-shadow(0 4px 8px rgba(15,23,42,.14));
      }
      .network-node rect {
        stroke:rgba(17,24,39,.22);
        stroke-width:2.5;
        filter:drop-shadow(0 5px 10px rgba(15,23,42,.16));
      }
      .network-node text {
        fill:#1f2937;
        font-size:12px;
        font-weight:800;
        paint-order:stroke;
        stroke:#fbfcff;
        stroke-width:3px;
        stroke-linejoin:round;
        pointer-events:none;
      }
      .network-node.file-network-node text {
        fill:#ffffff;
        font-size:11px;
        stroke:none;
      }
      .network-node.file-network-node .file-node-metric {
        font-size:10px;
        font-weight:750;
        opacity:.9;
      }
      .network-svg.has-selection .network-node,
      .network-svg.has-selection .network-edge { opacity:1; }
      .network-svg.has-selection .network-node.is-selected,
      .network-svg.has-selection .network-node.is-caller,
      .network-svg.has-selection .network-node.is-callee,
      .network-svg.has-selection .network-node.is-child,
      .network-svg.has-selection .network-node.is-parent,
      .network-svg.has-selection .network-edge.is-incoming,
      .network-svg.has-selection .network-edge.is-outgoing,
      .network-svg.has-selection .network-edge.is-child { opacity:1; }
      .network-node.is-selected circle,
      .network-node.is-selected rect {
        stroke:#111827;
        stroke-width:4;
      }
      .network-node.is-caller circle,
      .network-node.is-caller rect {
        stroke:var(--good);
        stroke-width:4;
      }
      .network-node.is-callee circle,
      .network-node.is-callee rect {
        stroke:var(--warn);
        stroke-width:3.5;
      }
      .network-node.is-child circle {
        stroke:#111827;
        stroke-width:3;
      }
      .network-node.is-parent rect {
        stroke:#111827;
        stroke-width:3.5;
      }
      .network-edge.is-incoming {
        stroke:var(--good);
        stroke-width:3.2;
        opacity:1;
      }
      .network-edge.is-outgoing {
        stroke:var(--warn);
        stroke-width:2.8;
        opacity:1;
      }
      .network-svg.has-filter .network-node:not(.is-filter-match):not(.is-selected),
      .network-svg.has-filter .network-edge:not(.is-filter-match) { opacity:.14; }
      .network-svg.has-filter .network-node.is-filter-match,
      .network-svg.has-filter .network-edge.is-filter-match { opacity:1; }
      .legend { align-items:center; }
      .legend-item {
        display:inline-flex;
        align-items:center;
        gap:5px;
        max-width:220px;
        color:#475467;
        font-size:.78rem;
        font-weight:700;
      }
      .legend-swatch {
        width:10px;
        height:10px;
        border-radius:50%;
        border:1px solid rgba(17,24,39,.18);
        flex:0 0 auto;
      }
      .legend-item span:last-child {
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .summary-grid {
        display:grid;
        grid-template-columns:repeat(auto-fit, minmax(128px, 1fr));
        gap:8px;
      }
      .stat {
        min-width:0;
        border:1px solid var(--border);
        border-radius:8px;
        background:#fbfcff;
        padding:9px;
      }
      .stat strong { display:block; font-size:1.28rem; line-height:1.05; }
      .stat span { color:var(--muted); font-size:.78rem; font-weight:700; }
      .selected-function {
        display:grid;
        gap:10px;
      }
      .function-title {
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
      }
      .function-title h3 {
        margin:0;
        font-size:1.05rem;
        overflow-wrap:anywhere;
      }
      .function-path {
        margin:3px 0 0;
        color:var(--muted);
        font-size:.82rem;
        overflow-wrap:anywhere;
      }
      .takeaway {
        margin:0;
        color:#344054;
        font-size:.9rem;
        line-height:1.42;
      }
      .chip {
        display:inline-flex;
        align-items:center;
        gap:5px;
        min-height:26px;
        max-width:100%;
        border:1px solid #d6dee9;
        border-radius:999px;
        background:#ffffff;
        color:#344054;
        font-size:.78rem;
        font-weight:800;
        line-height:1;
        padding:5px 8px;
      }
      button.chip { cursor:pointer; }
      button.chip.is-active {
        border-color:#8fb1f4;
        background:#eaf2ff;
        color:#173a8a;
      }
      .chip-count {
        display:inline-grid;
        place-items:center;
        min-width:18px;
        height:18px;
        border-radius:999px;
        background:#eef2f6;
        color:#344054;
        font-size:.72rem;
      }
      .relationship-list {
        display:grid;
        gap:7px;
      }
      .connection-summary {
        display:grid;
        gap:8px;
      }
      .connection-metrics {
        display:flex;
        flex-wrap:wrap;
        gap:7px;
      }
      .connection-metric {
        display:inline-flex;
        align-items:center;
        gap:6px;
        min-height:30px;
        border:1px solid #d6dee9;
        border-radius:8px;
        background:#fbfcff;
        color:#344054;
        padding:6px 8px;
        font-size:.78rem;
        font-weight:800;
      }
      .connection-metric strong {
        color:#111827;
        font-size:.95rem;
        line-height:1;
      }
      .connection-metric.is-incoming { border-color:#b9e2d1; background:#f1fbf7; }
      .connection-metric.is-outgoing { border-color:#f1d2a8; background:#fff8ed; }
      .related-node-strip {
        display:flex;
        flex-wrap:wrap;
        gap:7px;
      }
      .related-node {
        display:inline-flex;
        align-items:center;
        gap:7px;
        min-width:0;
        max-width:100%;
        border:1px solid #d6dee9;
        border-radius:8px;
        background:#ffffff;
        color:#344054;
        padding:6px 8px;
        text-align:left;
      }
      button.related-node { cursor:pointer; }
      button.related-node:hover,
      button.related-node:focus-visible {
        border-color:var(--accent);
        box-shadow:0 0 0 3px rgba(29,78,216,.14);
        outline:0;
      }
      .related-node-swatch {
        width:10px;
        height:10px;
        border-radius:50%;
        border:1px solid rgba(17,24,39,.18);
        flex:0 0 auto;
      }
      .related-node-label {
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        font-size:.8rem;
        font-weight:850;
      }
      .related-node-meta {
        color:var(--muted);
        font-size:.72rem;
        font-weight:800;
      }
      .connections-disclosure {
        border:1px solid var(--border);
        border-radius:8px;
        background:#fbfcff;
      }
      .connections-disclosure[hidden] { display:none; }
      .connections-disclosure summary {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        min-height:38px;
        cursor:pointer;
        list-style:none;
        padding:8px 10px;
        color:#344054;
        font-size:.84rem;
        font-weight:850;
      }
      .connections-disclosure summary::-webkit-details-marker { display:none; }
      .connections-disclosure summary::after {
        content:"+";
        display:inline-grid;
        place-items:center;
        width:22px;
        height:22px;
        border:1px solid #c5d2e6;
        border-radius:7px;
        color:#344054;
        font-weight:900;
      }
      .connections-disclosure[open] summary {
        border-bottom:1px solid var(--border);
      }
      .connections-disclosure[open] summary::after { content:"-"; }
      .connections-disclosure .relationship-list {
        padding:10px;
      }
      .relationship-group {
        display:grid;
        gap:7px;
      }
      .relationship-group h4 {
        margin:0;
        color:#667085;
        font-size:.76rem;
        text-transform:uppercase;
      }
      .relationship-item {
        display:grid;
        gap:4px;
        width:100%;
        min-width:0;
        border:1px solid #d9e1ec;
        border-radius:8px;
        background:#fbfcff;
        color:inherit;
        padding:8px;
        text-align:left;
      }
      button.relationship-item { cursor:pointer; }
      button.relationship-item:hover,
      button.relationship-item:focus-visible {
        border-color:var(--accent);
        box-shadow:0 0 0 3px rgba(29,78,216,.14);
        outline:0;
      }
      .relationship-name {
        min-width:0;
        font-size:.88rem;
        font-weight:850;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .relationship-meta {
        min-width:0;
        color:var(--muted);
        font-size:.77rem;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .empty-note {
        margin:0;
        color:var(--muted);
        font-size:.88rem;
      }
      details.panel summary {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        min-height:46px;
        border-bottom:1px solid var(--border);
        cursor:pointer;
        list-style:none;
        padding:10px 12px;
      }
      details.panel:not([open]) summary { border-bottom:0; }
      details.panel summary::-webkit-details-marker { display:none; }
      details.panel summary::after {
        content:"+";
        display:inline-grid;
        place-items:center;
        width:22px;
        height:22px;
        border:1px solid #c5d2e6;
        border-radius:7px;
        color:#344054;
        font-weight:900;
      }
      details.panel[open] summary::after { content:"-"; }
      .module-diagram-body {
        display:grid;
        gap:10px;
      }
      .module-diagram-viewport {
        min-height:620px;
        max-height:78vh;
        overflow:auto;
        overscroll-behavior:contain;
        border:1px solid var(--border);
        border-radius:8px;
        background:
          linear-gradient(90deg, rgba(18,32,54,.04) 1px, transparent 1px) 0 0 / 26px 26px,
          linear-gradient(rgba(18,32,54,.04) 1px, transparent 1px) 0 0 / 26px 26px,
          #ffffff;
        cursor:grab;
        touch-action:none;
      }
      .module-diagram-viewport.is-dragging { cursor:grabbing; }
      .module-diagram-canvas {
        min-width:100%;
        min-height:100%;
        padding:14px;
      }
      .module-diagram-canvas svg {
        display:block;
        max-width:none;
        height:auto;
        overflow:visible;
      }
      .module-diagram-canvas path.relation,
      .module-diagram-canvas path[data-edge="true"],
      .module-diagram-canvas g.edgeLabel {
        cursor:pointer;
      }
      .module-diagram-canvas .edge-hit-target {
        fill:none !important;
        stroke:transparent !important;
        stroke-width:16px !important;
        vector-effect:non-scaling-stroke;
        pointer-events:stroke;
      }
      .module-diagram-canvas path.relation.is-selected,
      .module-diagram-canvas path[data-edge="true"].is-selected {
        stroke:var(--accent) !important;
        stroke-width:3px !important;
      }
      .module-diagram-canvas .edge-import-label { pointer-events:none; }
      .module-diagram-canvas g.edgeLabel.is-expanded .edge-import-label rect {
        fill:#eef5ff;
        stroke:#8fb1f4;
        stroke-width:1.5;
      }
      .module-diagram-canvas g.edgeLabel.is-expanded .edge-import-label text {
        fill:#173a8a;
        font-size:13px;
        font-weight:800;
      }
      .module-diagram-canvas .source-member-trigger {
        cursor:pointer;
        fill:var(--accent);
        color:var(--accent);
        font-weight:800;
        pointer-events:auto;
      }
      .module-diagram-canvas .source-member-trigger.is-agent-highlighted {
        fill:var(--danger);
        color:var(--danger);
        text-decoration:underline;
      }
      .module-diagram-canvas .source-member-metrics {
        display:inline-flex;
        gap:3px;
        margin-left:5px;
        vertical-align:middle;
        pointer-events:none;
      }
      .module-diagram-canvas .source-member-metric {
        display:inline-block;
        border:1px solid #bfd1f2;
        border-radius:999px;
        background:#eef5ff;
        color:#17366f;
        font-size:.75em;
        font-weight:800;
        line-height:1.15;
        padding:1px 4px;
      }
      .module-diagram-canvas .source-member-hit-target {
        fill:none !important;
        stroke:transparent !important;
        stroke-linecap:round;
        stroke-width:24px !important;
        vector-effect:non-scaling-stroke;
        pointer-events:stroke;
        cursor:pointer;
      }
      .selected-import-details {
        display:grid;
        gap:9px;
        border-top:1px solid var(--border);
        padding-top:10px;
      }
      .selected-import-details h3,
      .selected-import-details h4,
      .selected-import-details p {
        margin:0;
      }
      .selected-import-details h3 {
        font-size:.95rem;
        overflow-wrap:anywhere;
      }
      .selected-import-details h4 {
        color:var(--muted);
        font-size:.75rem;
        text-transform:uppercase;
      }
      .selected-import-rows {
        display:grid;
        gap:6px;
      }
      .selected-import-row {
        display:grid;
        gap:2px;
      }
      .selected-import-row span {
        color:var(--muted);
        font-size:.72rem;
        font-weight:800;
        text-transform:uppercase;
      }
      .selected-import-row code {
        overflow-wrap:anywhere;
      }
      .selected-import-list {
        display:grid;
        gap:6px;
        margin:0;
        padding:0;
        list-style:none;
      }
      .selected-import-list li {
        border:1px solid #d9e1ec;
        border-radius:8px;
        background:#fbfcff;
        padding:7px 9px;
        overflow-wrap:anywhere;
      }
      pre {
        margin:0;
        max-width:100%;
        overflow:auto;
        white-space:pre-wrap;
        font-size:.84rem;
        line-height:1.45;
      }
      .text-panel-body {
        display:grid;
        gap:10px;
      }
      .text-toolbar {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        justify-content:space-between;
        gap:8px;
      }
      .copy-status {
        min-height:1.2em;
        color:var(--muted);
        font-size:.84rem;
      }
      .copy-status.is-success { color:var(--good); }
      .copy-status.is-error { color:var(--danger); }
      .source-dialog {
        position:fixed;
        inset:0;
        z-index:1000;
        width:min(1120px, calc(100vw - 28px));
        max-height:min(90vh, 900px);
        border:1px solid var(--border);
        border-radius:10px;
        color:var(--text);
        padding:0;
        box-shadow:0 24px 78px rgba(15,23,42,.28);
      }
      .source-dialog::backdrop { background:rgba(15,23,42,.44); }
      .source-dialog-body {
        display:grid;
        gap:10px;
        max-height:inherit;
        overflow:auto;
        padding:12px;
      }
      .source-dialog-header {
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
      }
      .source-dialog h2 {
        margin:0;
        font-size:1.08rem;
        overflow-wrap:anywhere;
      }
      .source-dialog-actions {
        display:flex;
        flex-wrap:wrap;
        justify-content:flex-end;
        gap:7px;
        flex:0 0 auto;
      }
      .dialog-insight {
        display:grid;
        gap:8px;
        border:1px solid var(--border);
        border-radius:8px;
        background:#fbfcff;
        padding:9px;
      }
      .neighborhood {
        height:190px;
        border:1px solid var(--border);
        border-radius:8px;
        background:#ffffff;
        overflow:hidden;
      }
      .neighborhood svg {
        display:block;
        width:100%;
        height:100%;
      }
      .neighborhood-node { cursor:pointer; }
      .neighborhood-node circle,
      .neighborhood-node rect {
        stroke:#ffffff;
        stroke-width:2;
      }
      .neighborhood-node.is-center circle {
        stroke:#111827;
        stroke-width:3.2;
      }
      .neighborhood-node text {
        fill:#1f2937;
        font-size:10px;
        font-weight:800;
        paint-order:stroke;
        stroke:#ffffff;
        stroke-width:3px;
        pointer-events:none;
      }
      .neighborhood-node.is-center text { font-size:11px; }
      .neighborhood-edge {
        fill:none;
        stroke:#98a6ba;
        stroke-width:1.7;
      }
      .neighborhood-edge.is-incoming { stroke:var(--good); stroke-width:2.5; }
      .neighborhood-edge.is-outgoing { stroke:var(--warn); stroke-width:2.3; }
      .source-code-block {
        max-height:46vh;
        border:1px solid #24324a;
        border-radius:8px;
        background:var(--code);
        color:#f8fafc;
        padding:12px;
        white-space:pre;
      }
      .error-text { color:var(--danger); }
      @media (max-width: 760px) {
        .shell { width:min(100% - 18px, 1480px); padding-top:10px; }
        .header, .function-title, .network-toolbar, .visualization-switch-row { align-items:flex-start; flex-direction:column; }
        .network-viewport, .module-diagram-viewport { min-height:500px; }
        .source-dialog-actions { justify-content:flex-start; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="header">
        <div>
          <h1 class="title">IronGlancer</h1>
          <p id="subtitle" class="subtitle">Loading visualizations...</p>
          <p id="build-meta" class="meta-line">Checking build metadata...</p>
        </div>
      </header>

      <main class="viewer-grid">
        <section class="panel" aria-labelledby="visualization-title">
          <div class="panel-header">
            <h2 id="visualization-title">Overview</h2>
            <span id="network-status" class="status-line" aria-live="polite"></span>
          </div>
          <div class="panel-body visualization-panel-body">
            <div class="visualization-switch-row">
              <div id="primary-view-switch" class="segmented-control" role="group" aria-label="Primary visualization view"></div>
            </div>

            <section id="function-graphs-view" class="visualization-view" aria-label="Functions advanced graph" hidden>
              <div class="network-toolbar">
                <div class="toolbar-group network-primary-controls">
                  <div class="control-set">
                    <span class="control-label">Layout</span>
                    <div id="network-layout-switch" class="segmented-control" role="group" aria-label="Function graph layout"></div>
                  </div>
                  <div class="control-set">
                    <span class="control-label">Nodes</span>
                    <div id="network-node-switch" class="segmented-control" role="group" aria-label="Function graph node levels"></div>
                  </div>
                  <div class="control-set">
                    <span class="control-label">Scope</span>
                    <div id="network-scope-switch" class="segmented-control" role="group" aria-label="Function graph scope"></div>
                  </div>
                  <div class="control-set">
                    <span class="control-label">Depth</span>
                    <div id="network-depth-switch" class="segmented-control" role="group" aria-label="Function graph depth"></div>
                  </div>
                  <div class="toolbar-group" aria-label="Function graph view controls">
                    <button id="network-zoom-out-btn" type="button" aria-label="Zoom out">-</button>
                    <button id="network-zoom-in-btn" type="button" aria-label="Zoom in">+</button>
                    <button id="network-fit-btn" type="button">Fit</button>
                    <button id="network-reset-view-btn" type="button">100%</button>
                    <button id="network-reset-selection-btn" type="button" disabled>Reset</button>
                  </div>
                </div>
                <div class="toolbar-group">
                  <span id="network-zoom-status" class="status-line">Zoom 100%</span>
                </div>
              </div>
              <div id="file-legend" class="legend" aria-label="File color legend"></div>
              <div id="function-network-help" class="network-help">Drag to pan. Use the zoom buttons, pinch, or Ctrl/Cmd + wheel to zoom. Select a function in the graph to highlight its saved structural relationships.</div>
              <div id="function-network-viewport" class="network-viewport">
                <svg id="function-network-svg" class="network-svg" role="img" aria-label="Function graph"></svg>
              </div>
            </section>

            <section id="jsx-map-view" class="visualization-view" aria-label="Components and module composition map">
              <div class="module-diagram-body">
                <div class="network-toolbar">
                  <div class="toolbar-group" aria-label="JSX map view controls">
                    <button id="module-diagram-zoom-out-btn" type="button" aria-label="Zoom out">-</button>
                    <button id="module-diagram-zoom-in-btn" type="button" aria-label="Zoom in">+</button>
                    <button id="module-diagram-fit-btn" type="button">Fit</button>
                    <button id="module-diagram-reset-view-btn" type="button">100%</button>
                    <button id="download-svg-btn" type="button" disabled>Download</button>
                  </div>
                  <div class="toolbar-group">
                    <span id="module-diagram-zoom-status" class="status-line">Zoom 100%</span>
                  </div>
                </div>
                <div class="network-help">Drag to pan. Use the zoom buttons, pinch, or Ctrl/Cmd + wheel to zoom. Select an import edge for details or a member name for source.</div>
                <div id="module-diagram-viewport" class="module-diagram-viewport">
                  <div id="module-diagram" class="module-diagram-canvas"></div>
                </div>
                <section id="selected-import" class="selected-import-details" aria-live="polite">
                  <p class="empty-note">No import edge selected.</p>
                </section>
              </div>
            </section>
          </div>
        </section>

        <div class="lower-grid">
          <section class="panel" aria-labelledby="selected-title">
            <div class="panel-header">
              <h2 id="selected-title">Functions (advanced)</h2>
            </div>
            <div id="selected-function" class="panel-body selected-function" aria-live="polite"></div>
          </section>

          <section class="panel" aria-labelledby="summary-title">
            <div class="panel-header">
              <h2 id="summary-title">Overview</h2>
            </div>
            <div id="stats" class="panel-body summary-grid"></div>
          </section>
        </div>

        <details class="panel">
          <summary><h2>Components</h2></summary>
          <div class="panel-body text-panel-body">
            <pre id="components-list"></pre>
          </div>
        </details>

        <details class="panel">
          <summary><h2>Modules</h2></summary>
          <div class="panel-body text-panel-body">
            <div class="text-toolbar">
              <button id="copy-jsx-tree-btn" type="button" aria-describedby="copy-jsx-tree-status" disabled>Copy module tree</button>
              <span id="copy-jsx-tree-status" class="copy-status" role="status" aria-live="polite"></span>
            </div>
            <pre id="jsx-tree"></pre>
          </div>
        </details>

        <details class="panel" open>
          <summary><h2>Routes</h2></summary>
          <div class="panel-body text-panel-body">
            <pre id="routes-list"></pre>
          </div>
        </details>

        <details class="panel">
          <summary><h2>Lazy Boundaries</h2></summary>
          <div class="panel-body text-panel-body">
            <pre id="lazy-boundaries-list"></pre>
          </div>
        </details>

        <details class="panel">
          <summary><h2>Assets</h2></summary>
          <div class="panel-body text-panel-body">
            <pre id="assets-list"></pre>
          </div>
        </details>

        <details class="panel" open>
          <summary><h2>Findings</h2></summary>
          <div class="panel-body text-panel-body">
            <pre id="findings-list"></pre>
          </div>
        </details>

        <details class="panel">
          <summary><h2>Source</h2></summary>
          <div class="panel-body text-panel-body">
            <div class="text-toolbar">
              <button id="copy-tree-btn" type="button" aria-describedby="copy-tree-status" disabled>Copy dependency tree</button>
              <span id="copy-tree-status" class="copy-status" role="status" aria-live="polite"></span>
            </div>
            <pre id="tree"></pre>
          </div>
        </details>

        <details class="panel">
          <summary><h2>Mermaid Source</h2></summary>
          <div class="panel-body text-panel-body">
            <div class="text-toolbar">
              <button id="copy-mermaid-source-btn" type="button" aria-describedby="copy-mermaid-source-status" disabled>Copy Mermaid source</button>
              <span id="copy-mermaid-source-status" class="copy-status" role="status" aria-live="polite"></span>
            </div>
            <pre id="mermaid"></pre>
          </div>
        </details>
      </main>
    </div>

    <dialog id="source-dialog" class="source-dialog" aria-labelledby="source-dialog-title">
      <div class="source-dialog-body">
        <div class="source-dialog-header">
          <div>
            <h2 id="source-dialog-title">Source</h2>
            <p id="source-dialog-path" class="function-path"></p>
          </div>
          <div class="source-dialog-actions" aria-label="Source navigation">
            <button id="source-dialog-previous" type="button" aria-label="Previous source item" disabled>Previous</button>
            <button id="source-dialog-next" type="button" aria-label="Next source item" disabled>Next</button>
            <button id="source-dialog-close" type="button">Close</button>
          </div>
        </div>
        <section class="dialog-insight" aria-label="Source insight">
          <div id="source-dialog-insight" class="connection-summary"></div>
          <div id="source-dialog-neighborhood" class="neighborhood" aria-label="Nearby functions"></div>
        </section>
        <pre class="source-code-block"><code id="source-dialog-code"></code></pre>
        <details id="source-dialog-connections" class="connections-disclosure">
          <summary id="source-dialog-connections-summary">All connections</summary>
          <div id="source-dialog-relationships" class="relationship-list"></div>
        </details>
      </div>
    </dialog>

    <script type="module" src="${escapedAppScriptSrc}"></script>
  </body>
</html>
`;
}
