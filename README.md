# IronGlancer

IronGlancer is a front-end architecture analyzer for browser-side JavaScript/JSX apps. The "Iron" in the name is the front-end play: it glances at the browser-facing surface of an app, not the server behind it.

What it does
- starts from a browser entry: an HTML file with module scripts, or a `.js`, `.jsx`, or `.mjs` module
- follows browser-reachable ESM imports/exports, dynamic `import()`, `React.lazy`, module workers, import maps, root-relative URLs, and configured import aliases
- records modules, JSX component-shaped declarations, JSX render edges, lazy boundaries, browser API references, remote imports, assets, unresolved imports, and browser-incompatible Node builtin imports
- emits a static viewer plus immutable JSON artifacts for local review, CI, and local agent tools
- keeps function dependency evidence as an advanced static view, not as a runtime call graph

What it does not do
- no TypeScript or TSX analysis; `.ts`, `.tsx`, `.mts`, and `.cts` imports are unsupported source-module findings, not analyzed modules
- no CommonJS dependency graph; `.cjs`, `require()`, and `module.exports` are unsupported browser evidence or ignored as dependencies
- no backend, Express, server route, serverless, Node backend, or generic whole-project inventory model
- no runtime dataflow, route execution, performance, or call-graph claims

Install
- `npm install -g ironglancer`

CLI
- `ironglancer <folder> [--entry index.html] [--out ./ironglancer-site] [--framework auto|vanilla|react]`
- `--entry <path>` may be HTML or a `.js`/`.jsx`/`.mjs` browser module
- default fallback entries are `src/main.jsx`, `src/main.js`, `src/index.jsx`, `src/index.js`, `src/app.jsx`, and `src/app.js`, with `index.html` checked first
- repeat `--alias specifier=path` for import-map-like aliases; root-relative browser URLs are resolved from `/` by default
- `--source-root <path>` bounds optional unreachable discovery to a project-relative front-end source root
- `--include-unreachable` includes extra `.js`/`.jsx`/`.mjs` files from the configured/inferred front-end source root; default output is browser-reachable modules only
- `--include-source` is the explicit full-source shortcut; `--source-mode none|declarations|full` offers finer source artifact control
- `--module-limit <count>` bounds generation and both sides of git-ref diffs; the default is 500
- `--serve` generates once, then serves the immutable viewer plus `/api/v1` and `/bridge/v1` on `127.0.0.1:4173` by default
- `--route-alias` remains as a deprecated compatibility alias for older root-relative URL mappings; prefer `--alias`

Examples
- `ironglancer ./my-app --entry index.html --out ./ironglancer-site`
- `ironglancer ./my-app --entry src/main.jsx --alias @/=src/ --out ./docs/ironglancer`
- `ironglancer ./my-app --entry src/app.jsx --include-unreachable --source-root src`
- `ironglancer ./my-app --entry index.html --serve --host 127.0.0.1 --port 0`

Webpack plugin
- import it with ESM: `import { IronGlancerWebpackPlugin } from 'ironglancer/webpack';`
- require it with CommonJS: `const IronGlancerWebpackPlugin = require('ironglancer/webpack');`
- after each successful Webpack build or rebuild, the plugin reruns normal `generateStaticSite` with the configured IronGlancer inputs
- failed Webpack compilations are skipped, rebuild-triggered analyses are serialized/coalesced, and the previous successful report/service remains active if analysis fails
- the plugin keeps one managed localhost HTTP service for the existing viewer, read-only `/api/v1`, and viewer bridge `/bridge/v1`
- `enabled: false` disables the HTTP service only; generation still runs
- the plugin does not consume Webpack's module graph

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IronGlancerWebpackPlugin } from 'ironglancer/webpack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ironGlancer = new IronGlancerWebpackPlugin({
  rootDir: __dirname,
  entry: 'src/main.jsx',
  outDir: '.ironglancer',
  framework: 'react',
  aliases: ['@/=src/'],
  sourceMode: 'declarations',
  includeUnreachable: true,
  host: '127.0.0.1',
  port: 4173,
  enabled: true,
});

export default {
  // ...
  plugins: [ironGlancer],
};

// Surrounding tooling can inspect these after a successful build:
console.log(ironGlancer.getState().serviceUrl);
console.log(ironGlancer.getState().apiUrl);
console.log(ironGlancer.getState().bridgeUrl);
```

Source privacy
- default `--source-mode none` writes no source snippets and no full module source
- `declarations` writes declaration snippets to `source-code.json`
- `full` writes declaration snippets and full module source to `.ironglancer-api/source-modules.json`
- `output.json` includes privacy capability flags and counts; diff JSON, HTML, and SARIF remain source-free
- generated output refuses destructive targets such as the filesystem root, project root, current working directory, home directory, and source ancestors; replacement also requires an IronGlancer ownership marker

Architecture diffs
- compare git refs without mutating the checkout:
  `ironglancer diff ./my-app --base main --head HEAD --entry index.html --module-limit 500 --format html --sarif review.sarif`
- compare saved snapshots:
  `ironglancer diff --base ./before/output.json --head ./after-site --format json`
- inputs can be git refs, an `output.json` file, or a generated-site directory containing `output.json`
- `--baseline accepted-diff.json` marks exact matching finding IDs as existing
- `--suppressions ironglancer-suppressions.json` accepts exact finding suppressions with nonempty human reasons
- `--fail-on error|warning|note` is opt-in CI gating; reports are written before a triggered gate exits 2
- Semantic finding IDs use explicit per-rule identities with `identityVersion`; IDs avoid churn from source line movement, messages, evidence counts, severity, and confidence
- diff findings include front-end incompatibility, unresolved imports, remote imports, lazy-boundary changes, component cycles, module cycles, reachability changes, export changes, and conservative function evidence

GitHub Action
- bundled Action: `uses: karpatic/ironglancer@<ref>`
- inputs: `folder`, `base`, `head`, `entry`, `framework`, `source-root`, `aliases`, `alias`, `include-unreachable`, `exclude`, `module-limit`, `baseline`, `suppressions`, `fail-on`, `format`, `report-path`, and `sarif-path`
- deprecated compatibility inputs: `route-aliases`, `route-alias`
- outputs: `report-path`, `sarif-path`, `gate-triggered`, `finding-count`, and `exit-code`

```yaml
- uses: karpatic/ironglancer@v0.2.5
  with:
    folder: .
    base: ${{ github.event.pull_request.base.sha }}
    head: ${{ github.sha }}
    entry: index.html
    aliases: |
      @/=src/
    module-limit: 500
    report-path: architecture-diff.json
    sarif-path: architecture-diff.sarif
```

Standalone viewer
- generate the static viewer: `ironglancer ./my-app --entry index.html --out ./ironglancer-site`
- serve it with any local file server, or use IronGlancer's server for the viewer, `/api/v1`, and `/bridge/v1`: `ironglancer ./my-app --entry index.html --out ./ironglancer-site --serve`
- the main view leads with modules/components/lazy boundaries/assets/findings; functions are available as an advanced static-evidence view

Standalone agent
- start the loopback service: `ironglancer ./my-app --entry index.html --out ./ironglancer-site --source-mode full --serve --port 0`
- the serve JSON includes `ready`, `viewerUrl`, `apiUrl`, `bridgeUrl`, and the immutable `snapshot.buildId`
- use the agent CLI against the already-running service:
  `ironglancer-agent --url http://127.0.0.1:4173 status`
- search saved evidence:
  `ironglancer-agent --url http://127.0.0.1:4173 search App --types module,function,symbol --limit 10`
- aggregate folder cleanup evidence without semantic conclusions:
  `ironglancer-agent --url http://127.0.0.1:4173 cleanup-evidence src/features/cart --limit 25`
- read viewer state:
  `ironglancer-agent --url http://127.0.0.1:4173 viewer-state`
- drive the live viewer presentation:
  `ironglancer-agent --url http://127.0.0.1:4173 graph-view --primary-view function-graphs --layout radial --scope both --depth 2 --wait`
- focus, open, highlight, or clear presentation state:
  `ironglancer-agent --url http://127.0.0.1:4173 focus-function --stable-id fn_0123456789abcdef --wait`
  `ironglancer-agent --url http://127.0.0.1:4173 open-source --module-path src/App.jsx --name App --wait`
  `ironglancer-agent --url http://127.0.0.1:4173 clear-focus --wait`
- `--wait` returns the queued command, viewer acknowledgement, and latest viewer state; it exits nonzero on timeout, viewer error, or verification mismatch
- service URLs are loopback-only. The CLI rejects non-loopback URLs.

Agent HTTP boundaries
- transport is loopback HTTP JSON, not a remote protocol or job runner
- `/api/v1` is read-only and serves bounded static evidence from the generated snapshot
- `/bridge/v1` is presentation-only: graph filters, layout, focus, opening saved source, highlight, and clearing focus
- there is no shell execution endpoint, arbitrary file read endpoint, source mutation endpoint, remote bind, natural-language job execution, or authentication claim
- viewer, API, bridge, commands, and acknowledgements expose the same immutable snapshot identity so automation can correlate applied UI state with the analyzed build

Library usage
```js
import { analyzeProject, compareSnapshots, generateStaticSite, startStaticAnalysisServer } from 'ironglancer';

const analysis = await analyzeProject({
  rootDir: './my-app',
  entry: 'index.html',
  aliases: ['@/=src/'],
});
const site = await generateStaticSite({
  rootDir: './my-app',
  entry: 'src/main.jsx',
  outDir: './ironglancer-site',
  sourceMode: 'none',
});
const withUnreachable = await analyzeProject({
  rootDir: './my-app',
  entry: 'index.html',
  sourceRoot: 'src',
  includeUnreachable: true,
});
const service = await startStaticAnalysisServer({ outDir: site.outDir });
const diff = compareSnapshots(beforeOutputJson, afterOutputJson, { baseLabel: 'main', headLabel: 'HEAD' });
console.log(analysis.summary, withUnreachable.summary, service.url, diff.findings.length);
```

Read-only API
- serve mode loads generated `output.json`, `source-code.json`, `.ironglancer-api/source-modules.json`, and `.ironglancer-api/function-map.json` once at startup
- source endpoints only return bounded excerpts from modules saved in the run
- module/component/asset/import endpoints expose static browser architecture evidence
- symbol/function endpoints expose advanced static import/export/reference relationships, not runtime calls or data lineage
- import triage distinguishes `local`, `asset`, `remote`, `browser-incompatible`, `external`, and `unresolved`
- unknown query parameters return HTTP 400; list pagination uses `limit` and `offset`

Viewer bridge
- `/bridge/v1` is a localhost, presentation-only channel for viewer state and commands
- agents and surrounding tooling can read viewer state, queue viewer commands, and acknowledge applied commands while keeping architecture queries under read-only `/api/v1`
- the bridge is part of the same IronGlancer HTTP service as the viewer and API
- the generated page shows a restrained Agent strip only when the bridge is connected and the snapshot identity matches

Routes
- `GET /api/v1`
- `GET /api/v1/run`
- `GET /api/v1/modules?reachable=true&extension=.jsx`
- `GET /api/v1/components?modulePath=src/main.jsx`
- `GET /api/v1/component-edges`
- `GET /api/v1/routes`
- `GET /api/v1/lazy-boundaries`
- `GET /api/v1/assets`
- `GET /api/v1/imports?resolution=browser-incompatible`
- `GET /api/v1/imports?resolution=unresolved&dynamic=true`
- `GET /api/v1/functions?modulePath=src/app.jsx&component=true`
- `GET /api/v1/search?q=App&match=exact&types=function,occurrence`

Development
- `npm ci`
- `npm test`
- `npm run build:demo`
- `npm run build:action`
- `npm run check:action-bundle`
- `npm run release:check`
- Release process notes live in `RELEASING.md`
