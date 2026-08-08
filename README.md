# IronGlancer

Use IronGlancer to create static architecture evidence for browser-side JavaScript/JSX that a browser entry can reach. Start from an HTML entry or a `.js`, `.jsx`, or `.mjs` module. Review the result in a static viewer, JSON files, a local API, or a diff report.

IronGlancer examines the browser-facing part of an application. It does not examine the server behind the application.

- [Open the generated demo](https://karpatic.github.io/ironglancer/)
- [Migrate from 0.1](MIGRATION.md)
- [Release the package](RELEASING.md)

## Create your first report

IronGlancer requires Node.js 20 or later.

```sh
npm install -g ironglancer
ironglancer ./my-app --entry index.html --out ./ironglancer-site
```

The command creates a static viewer and immutable JSON artifacts in `./ironglancer-site`.

To generate and serve the report in one command, add `--serve`:

```sh
ironglancer ./my-app --entry index.html --out ./ironglancer-site --serve
```

The service uses `127.0.0.1:4173` by default. It serves the viewer, the read-only `/api/v1` API, and the `/bridge/v1` viewer bridge. Use `--port 0` to select an available port.

## Select the browser entry

Use an HTML entry to include module scripts and import maps:

```sh
ironglancer ./my-app --entry index.html --out ./ironglancer-site
```

Use a browser module entry when you do not need HTML discovery:

```sh
ironglancer ./my-app --entry src/main.jsx --alias @/=src/ --out ./docs/ironglancer
```

If you omit `--entry`, IronGlancer checks these paths in order:

1. `index.html`
2. `src/index.html`
3. `src/main.jsx`
4. `src/main.js`
5. `src/index.jsx`
6. `src/index.js`
7. `src/app.jsx`
8. `src/app.js`

IronGlancer follows these browser relationships:

- ESM imports and exports
- dynamic `import()` calls
- `React.lazy` boundaries
- module workers
- HTML import maps
- root-relative URLs
- configured import aliases

By default, the report contains only modules that the browser entry can reach. To add other front-end modules, use `--include-unreachable`. Bound this search with `--source-root`:

```sh
ironglancer ./my-app --entry src/app.jsx --include-unreachable --source-root src
```

IronGlancer infers a front-end source root if you do not set one. It does not inventory unrelated project folders.

## Review the evidence

The main viewer shows modules, components, lazy boundaries, assets, and findings. The report can also contain:

- JSX component-shaped declarations and render edges
- browser API references
- remote imports
- unresolved imports
- browser-incompatible Node builtin imports
- static function dependency evidence

Function relationships are an advanced static view. They are not a runtime call graph or data lineage.

## Know the analysis limits

IronGlancer has an explicit product boundary:

- It has no TypeScript or TSX analysis. Imports of `.ts`, `.tsx`, `.mts`, and `.cts` files become unsupported source-module findings.
- It does not build a CommonJS dependency graph. `.cjs`, `require()`, and `module.exports` are unsupported browser evidence or do not become dependency edges.
- It does not create a backend, Express, server-route, serverless, Node server, or whole-project inventory.
- It does not measure runtime data flow, route execution, performance, or calls.

Use IronGlancer only for static evidence from browser-reachable JavaScript/JSX.

## Set generation options

Use this command form:

```text
ironglancer <folder> [--entry index.html] [--out ./ironglancer-site] [--framework auto|vanilla|react]
```

Common options:

- `--entry <path>` selects an HTML, `.js`, `.jsx`, or `.mjs` browser entry.
- `--out <path>` sets the viewer output directory. The default is `ironglancer-site`.
- `--framework auto|vanilla|react` selects front-end adapters. The default is `auto`.
- `--alias specifier=path` maps an import specifier or prefix to a project path. Repeat this option for more aliases.
- Root-relative browser URLs resolve from the project root by default.
- `--source-root <path>` sets the project-relative root for optional unreachable discovery.
- `--include-unreachable` adds other `.js`, `.jsx`, and `.mjs` files from the configured or inferred front-end source root.
- `--exclude <path>` excludes a project-relative path or prefix. Repeat this option for more paths.
- `--module-limit <count>` limits analyzed modules during generation and on both sides of a Git-ref diff. The default is `500`.
- `--serve` generates one immutable report and starts the loopback service.
- `--host <host>` sets a loopback host. The default is `127.0.0.1`.
- `--port <port>` sets a port from `0` through `65535`. The default is `4173`.

`--route-alias route=path` is a deprecated compatibility option for old root-relative URL mappings. Use `--alias` for new configurations.

## Control saved source text

The default `--source-mode none` does not save source snippets or full module source.

Use one of these modes:

- `none` does not write `source-code.json` or `.ironglancer-api/source-modules.json`.
- `declarations` writes declaration snippets to `source-code.json`.
- `full` writes declaration snippets and full module source. It also writes `.ironglancer-api/source-modules.json`.

Use this command to save declaration snippets:

```sh
ironglancer ./my-app --entry index.html --source-mode declarations
```

Use `--include-source` as a shortcut for full source. For precise control, use `--source-mode none|declarations|full`.

`output.json` records source capability flags and counts. Diff JSON, HTML, and SARIF reports do not contain source text.

IronGlancer refuses unsafe output targets. These targets include the file-system root, the project root, the current directory, the home directory, and source ancestors. IronGlancer replaces an existing output directory only if the directory has its ownership marker.

## Compare architecture states

### Compare two Git refs

This command does not change the current checkout:

```sh
ironglancer diff ./my-app --base main --head HEAD --entry index.html --module-limit 500 --format html --sarif review.sarif
```

### Compare two saved snapshots

```sh
ironglancer diff --base ./before/output.json --head ./after-site --format json
```

A diff input can be a Git ref, an `output.json` file, or a generated-site directory that contains `output.json`. If a path resolves to a snapshot file or directory, IronGlancer uses the snapshot before it tries to resolve a Git ref.

Review controls:

- `--baseline accepted-diff.json` marks exact matching finding IDs as existing.
- `--suppressions ironglancer-suppressions.json` applies exact suppressions that have nonempty human reasons.
- `--fail-on error|warning|note` enables a CI gate. IronGlancer writes the reports before a triggered gate exits with status `2`.
- `--format json|html` selects the main report format. The default is `json`.
- `--sarif <path>` writes a SARIF 2.1.0 report in addition to the main report.

Semantic finding IDs use a rule-specific identity and an `identityVersion`. Source-line changes, messages, evidence counts, severity, and confidence do not change these IDs. Different rules, modules, functions, exports, and edge endpoints remain distinct.

Diff findings can show these changes:

- front-end incompatibilities
- unresolved or remote imports
- lazy boundaries
- component or module cycles
- reachability
- exports
- conservative function evidence

## Run the GitHub Action

The bundled GitHub Action uses the same diff implementation as the CLI.

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

Inputs:

- Required: `base` and `head`
- Project and analysis: `folder`, `entry`, `framework`, `source-root`, `aliases`, `alias`, `include-unreachable`, `exclude`, and `module-limit`
- Review: `baseline`, `suppressions`, `fail-on`, `format`, `report-path`, and `sarif-path`
- Deprecated compatibility inputs: `route-aliases` and `route-alias`

Outputs:

- `report-path`
- `sarif-path`
- `gate-triggered`
- `finding-count`
- `exit-code`

The Action writes requested reports before it returns a gate failure. Upload the SARIF report in a separate workflow step if you need it.

## Use the standalone viewer and local agent

### Standalone viewer

Generate the site and use any local HTTP file server:

```sh
ironglancer ./my-app --entry index.html --out ./ironglancer-site
```

Or start the IronGlancer service:

```sh
ironglancer ./my-app --entry index.html --out ./ironglancer-site --serve
```

The service gives the viewer, `/api/v1`, and `/bridge/v1` one immutable snapshot identity.

### Standalone agent

Save full source only if the source commands need it. Start the service on an available loopback port:

```sh
ironglancer ./my-app --entry index.html --out ./ironglancer-site --source-mode full --serve --port 0
```

The serve JSON contains `ready`, `viewerUrl`, `apiUrl`, `bridgeUrl`, and the immutable `snapshot.buildId`.

Use `ironglancer-agent` with the URL from that JSON:

```sh
ironglancer-agent --url http://127.0.0.1:4173 status
```

Search saved static evidence:

```sh
ironglancer-agent --url http://127.0.0.1:4173 search App --types module,function,symbol --limit 10
```

Collect folder cleanup evidence without semantic conclusions:

```sh
ironglancer-agent --url http://127.0.0.1:4173 cleanup-evidence src/features/cart --limit 25
```

Read or change the viewer presentation:

```sh
ironglancer-agent --url http://127.0.0.1:4173 viewer-state
ironglancer-agent --url http://127.0.0.1:4173 graph-view --primary-view function-graphs --layout radial --scope both --depth 2 --wait
ironglancer-agent --url http://127.0.0.1:4173 focus-function --stable-id fn_0123456789abcdef --wait
ironglancer-agent --url http://127.0.0.1:4173 open-source --module-path src/App.jsx --name App --wait
ironglancer-agent --url http://127.0.0.1:4173 clear-focus --wait
```

With `--wait`, the command returns the queued command, the viewer acknowledgement, and the latest viewer state. It exits with a nonzero status after a timeout, a viewer error, or a verification mismatch.

The agent transport is loopback HTTP JSON. The CLI rejects non-loopback URLs.

### Agent HTTP boundaries

The local service has two separate interfaces:

- `/api/v1` is read-only. It returns bounded static evidence from the saved snapshot.
- `/bridge/v1` changes viewer presentation only. It can set graph filters and layout, focus an item, open saved source, highlight an item, or clear focus.

The service has no endpoint for shell execution, arbitrary file reads, source changes, remote binding, or natural-language jobs. It does not make an authentication claim. Do not expose the service to an untrusted network.

The viewer, API, bridge, commands, and acknowledgements contain the same snapshot identity. Tools can use this identity to match viewer state to the analyzed build.

## Use the read-only API

Serve mode loads these generated artifacts one time at startup:

- `output.json`
- `source-code.json`, if available
- `.ironglancer-api/source-modules.json`, if available
- `.ironglancer-api/function-map.json`

Source endpoints return bounded excerpts only from source that the run saved. Module, component, asset, and import endpoints return static browser architecture evidence. Symbol and function endpoints return static import, export, and reference relationships. They do not return runtime calls or data lineage.

Import results use these resolution types: `local`, `asset`, `remote`, `browser-incompatible`, `external`, and `unresolved`.

Unknown query parameters return HTTP `400`. List endpoints use `limit` and `offset` for pagination.

Common routes:

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

Open `GET /api/v1` to discover all routes and their static-analysis semantics.

## Use the viewer bridge

`/bridge/v1` is a loopback, presentation-only channel. Tools can read viewer state, queue a viewer command, and acknowledge an applied command. Architecture queries stay under the read-only `/api/v1` API.

The generated page shows the Agent strip only when the bridge is connected and its snapshot identity matches the page.

## Add the Webpack plugin

Use the plugin when you want a new IronGlancer report after each successful Webpack build or rebuild.

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

// Read these values after a successful build.
console.log(ironGlancer.getState().serviceUrl);
console.log(ironGlancer.getState().apiUrl);
console.log(ironGlancer.getState().bridgeUrl);
```

A Webpack configuration can also load the plugin package with `require`:

```js
const IronGlancerWebpackPlugin = require('ironglancer/webpack');
```

The plugin has these behaviors:

- It calls the normal `generateStaticSite` path after a successful build.
- It does not use the Webpack module graph.
- It skips a failed Webpack compilation.
- It serializes and combines rebuild requests.
- It keeps the last successful report and service if analysis fails.
- It manages one loopback service for the viewer, `/api/v1`, and `/bridge/v1`.
- `enabled: false` disables the HTTP service only. Report generation still runs.

## Use the JavaScript library

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

These functions produce or read static evidence. They do not observe application runtime behavior.

## Develop IronGlancer

```sh
npm ci
npm test
npm run build:demo
npm run build:action
npm run check:action-bundle
npm run release:check
```

Read [RELEASING.md](RELEASING.md) before you publish a version.
