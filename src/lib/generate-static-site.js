import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

import { analyzeProject } from './analyze-project.js';

const require = createRequire(import.meta.url);

function viewerHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>IronGlancer</title>
    <style>
      :root { --bg:#f6f8fc; --panel:#fff; --text:#182132; --muted:#5f6880; --border:#d9dfeb; --accent:#1f6feb; }
      * { box-sizing:border-box; }
      body { margin:0; font-family:IBM Plex Sans,Segoe UI,sans-serif; background:var(--bg); color:var(--text); }
      .shell { max-width:1280px; margin:0 auto; padding:24px 16px 40px; }
      .header { display:flex; gap:16px; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; }
      .title { margin:0; font-size:1.7rem; }
      .subtitle { margin:4px 0 0; color:var(--muted); }
      .grid { display:grid; grid-template-columns:1fr; gap:16px; margin-top:16px; }
      @media (min-width: 1100px) { .grid { grid-template-columns: 1.1fr 0.9fr; } }
      .panel { background:var(--panel); border:1px solid var(--border); border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(35,55,110,.06); }
      .panel h2 { margin:0; padding:12px 14px; border-bottom:1px solid var(--border); font-size:0.98rem; }
      .panel .body { padding:14px; }
      pre { margin:0; white-space:pre-wrap; overflow:auto; font-size:.85rem; }
      ul { margin:0; padding-left:20px; }
      .stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:12px; }
      .stat { background:#fbfcff; border:1px solid var(--border); border-radius:12px; padding:12px; }
      .stat b { display:block; font-size:1.4rem; margin-bottom:4px; }
      .diagram { min-height:540px; overflow:auto; background:#fff; }
      .muted { color:var(--muted); }
      .actions { display:flex; gap:8px; flex-wrap:wrap; }
      button, a.button { border:1px solid #bfd1f2; background:#f7faff; color:#22407d; border-radius:8px; padding:8px 12px; cursor:pointer; text-decoration:none; font-weight:600; }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="header">
        <div>
          <h1 class="title">IronGlancer</h1>
          <p id="subtitle" class="subtitle">Loading project graph…</p>
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
          <div id="diagram" class="body diagram"></div>
        </div>
        <div>
          <div class="panel">
            <h2>Summary</h2>
            <div id="stats" class="body stats"></div>
          </div>
          <div class="panel" style="margin-top:16px;">
            <h2>Dependency tree</h2>
            <div class="body"><pre id="tree"></pre></div>
          </div>
          <div class="panel" style="margin-top:16px;">
            <h2>Scripts</h2>
            <div class="body"><ul id="scripts"></ul></div>
          </div>
          <div class="panel" style="margin-top:16px;">
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
const treeEl = document.getElementById('tree');
const scriptsEl = document.getElementById('scripts');
const mermaidEl = document.getElementById('mermaid');
const diagramEl = document.getElementById('diagram');
const statsEl = document.getElementById('stats');
const downloadBtn = document.getElementById('download-svg-btn');
let latestSvg = '';

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

async function main() {
  const response = await fetch('./output.json');
  if (!response.ok) throw new Error('Failed to load output.json');
  const payload = await response.json();
  subtitleEl.textContent = payload.entry + '  •  ' + payload.rootDir;
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
  latestSvg = svg;
  diagramEl.innerHTML = svg;
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

main().catch((error) => {
  subtitleEl.textContent = error?.message || String(error);
  subtitleEl.style.color = '#b42318';
});
`;
}

async function copyMermaidAsset(outDir) {
  const packageJsonPath = require.resolve('mermaid/package.json');
  const mermaidPath = path.join(path.dirname(packageJsonPath), 'dist', 'mermaid.esm.min.mjs');
  const vendorDir = path.join(outDir, 'vendor');
  await fs.mkdir(vendorDir, { recursive: true });
  await fs.copyFile(mermaidPath, path.join(vendorDir, 'mermaid.esm.min.mjs'));
}

export async function generateStaticSite({ rootDir, entry, outDir } = {}) {
  const resolvedOutDir = path.resolve(outDir || 'ironglancer-site');
  const analysis = await analyzeProject({ rootDir, entry });
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
  }, null, 2) + '\n', 'utf8');
  await copyMermaidAsset(resolvedOutDir);
  return { outDir: resolvedOutDir, ...analysis };
}
