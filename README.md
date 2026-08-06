# IronGlancer

IronGlancer analyzes a folder's JavaScript / JSX module graph and emits a static site that only needs a plain file server.

What it does
- walks JS/JSX imports from an entry file
- resolves relative imports, root-relative imports, import-map aliases, and configurable URL route aliases
- emits a dependency tree, Mermaid class diagram source, and a browser viewer
- can stay running as a localhost-first read-only viewer and JSON API over the saved analysis
- saves function placement/cohesion evidence for human and agent review without claiming runtime call-graph certainty
- produces static output only: index.html, app.js, output.json, source-code.json, diagram.mmd, vendor/, .ironglancer-api/

Install
- npm install -g ironglancer

CLI
- ironglancer <folder> [--entry src/app.jsx] [--out ./ironglancer-site] [--route-alias /app/=src/app/]
- repeat `--route-alias route=path` to map URL-rooted import prefixes onto source folders
- add `--serve` to generate once and serve the immutable viewer plus `/api/v1` JSON API
- serve mode binds `127.0.0.1:4173` by default; override with `--host` and `--port`

Examples
- ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site
- npx ironglancer ./my-app --entry src/main.js --out ./docs/ironglancer
- ironglancer ./my-app --entry src/web/app.jsx --route-alias /creator/=src/web/creator/
- ironglancer ./my-app/src/web/creator --entry app.jsx --route-alias /creator/=
- ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site --serve
- ironglancer ./my-app --serve --host 127.0.0.1 --port 0

Architecture diffs
- compare two architecture snapshots from git refs without changing the checkout:
  `ironglancer diff ./my-app --base main --head HEAD --entry src/app.jsx --format html --sarif review.sarif`
- run an opt-in review gate against an accepted prior diff and exact finding suppressions:
  `ironglancer diff ./my-app --base main --head HEAD --entry src/app.jsx --format html --sarif review.sarif --baseline accepted-diff.json --suppressions ironglancer-suppressions.json --fail-on warning`
- compare saved snapshots:
  `ironglancer diff --base ./before/output.json --head ./after-site --format json`
- inputs can be git refs resolvable in the project repo, an `output.json` file, or a generated-site directory containing `output.json`
- precedence is explicit: an existing `output.json` file or directory containing `output.json` wins; otherwise the input is resolved as a Git ref, so a plain directory named `main` does not shadow the `main` branch
- move and rename matching requires the analyzer's privacy-safe implementation fingerprint; older snapshots without that evidence remain conservative additions and removals
- `--format json` writes machine-readable JSON to stdout unless `--out` is supplied; `--format html` writes one self-contained static report and defaults to `architecture-diff.html` when `--out` is omitted
- `--sarif review.sarif` writes SARIF 2.1.0 findings alongside either JSON or HTML output
- `--baseline accepted-diff.json` reads a previous IronGlancer diff JSON report and marks exact matching finding IDs as existing
- `--suppressions ironglancer-suppressions.json` accepts only `{ "version": 1, "suppressions": [{ "findingId": "...", "reason": "..." }] }`; suppressions match exact finding IDs and unknown IDs are counted as unused
- `--fail-on error|warning|note` is opt-in CI gating; without it, `ironglancer diff` exits 0 even with findings, and with it a triggered gate exits 2 after reports are written
- gating considers only actionable findings: new findings that are not suppressed
- diff reports include schema/build/commit labels, module/function/edge deltas, structural findings, severity counts, static-analysis limitations, and `privacy.sourceMode = "none"`
- privacy guarantee: diff JSON, HTML, and SARIF intentionally exclude absolute `rootDir` values, baseline paths, suppression paths, and source excerpts
- caveat: findings are static structural review prompts, not runtime behavior claims; function edges are static identifier-use evidence
- current limitations: git-ref inputs are analyzed from archived committed contents, so uncommitted work is not included; function move/rename pairing is conservative and leaves ambiguous candidates as ordinary add/remove changes; fan findings use the documented threshold of at least 3 new edges and at least 2x the previous count

Standalone viewer
- generate the static viewer: `ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site`
- serve it with any local file server, or use IronGlancer's server: `ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site --serve`
- the viewer works without any agent; clicking a function/source member shows recognized interior calls, static callers, package/platform/unresolved binding evidence, child-helper counts, and a placement review

Standalone agent
- generate once: `ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site`
- run the packaged MCP server over that immutable saved analysis: `ironglancer-mcp --analysis-dir ./ironglancer-site`
- Hermes example: `hermes mcp add ironglancer --command ironglancer-mcp --args --analysis-dir /absolute/path/to/ironglancer-site`
- the MCP server does not need a browser or running viewer for analysis tools
- MCP tools: `ironglancer_run_summary`, `ironglancer_search_functions`, `ironglancer_get_function`, `ironglancer_function_neighborhood`, `ironglancer_investigate_function_placement`, `ironglancer_source_excerpt`, `ironglancer_viewer_state`, `ironglancer_viewer_command`

Connected Hermes + viewer
- start the localhost viewer/API/bridge: `ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site --serve --host 127.0.0.1 --port 4173`
- add Hermes with bridge access: `hermes mcp add ironglancer --command ironglancer-mcp --args --analysis-dir /absolute/path/to/ironglancer-site --bridge-url http://127.0.0.1:4173/bridge/v1`
- MCP analysis tools read saved data directly; `ironglancer_function_neighborhood` supports multi-hop `dependencies`, `users`, or `both` reasoning without a viewer
- viewer tools only read structured viewer state or queue presentation commands such as `focusFunction`, `openFunction`, `highlightFunction`, `scrollToFunction`, `clearHighlight`, and `setGraphView`
- `/bridge/v1` viewer state includes the primary view, graph layout, node visibility, scope, depth, and selected function/file when a viewer is connected
- `/bridge/v1` is localhost-first and unauthenticated by design; do not bind the server to an untrusted network if you use bridge commands

Library usage
```js
import { analyzeProject, compareSnapshots, generateStaticSite, startStaticAnalysisServer } from 'ironglancer';

const analysis = await analyzeProject({ rootDir: './my-app', entry: 'src/app.jsx' });
const site = await generateStaticSite({ rootDir: './my-app', entry: 'src/app.jsx', outDir: './ironglancer-site' });
const routed = await analyzeProject({
  rootDir: './my-app',
  entry: 'src/web/app.jsx',
  routeAliases: [{ from: '/creator/', to: 'src/web/creator/' }],
});
const service = await startStaticAnalysisServer({ outDir: site.outDir });
const diff = compareSnapshots(beforeOutputJson, afterOutputJson, { baseLabel: 'main', headLabel: 'HEAD' });
console.log(service.url, service.apiBaseUrl);
```

Read-only API
- serve mode loads generated `output.json`, `source-code.json`, `.ironglancer-api/source-modules.json`, and `.ironglancer-api/function-map.json` once at startup and does not reparse the project per request
- source endpoints only return bounded excerpts from modules saved in the analyzed run
- the built-in server does not serve `.ironglancer-api/` as static files
- symbol relation endpoints expose static import/export/reference relationships IronGlancer captures, not runtime call graphs or data lineage
- function dependency endpoints expose static identifier usage inside declared function spans; direct call, optional-call, tagged-template, and JSX element syntax are labeled when visible, while generic references remain `reference`
- function placement review distinguishes same-file, project-local, package, platform, and unresolved static evidence where IronGlancer can see lexical import-binding usage; it is a review aid, not runtime ownership proof or definitive dead-code detection
- unknown API query parameters return HTTP 400 instead of being silently ignored
- general list pagination uses `limit` and `offset`; explicit `limit` must be between 1 and 200, while `/modules/:id/functions` preserves its legacy all-functions result when both are omitted
- legacy Base64URL `id` values remain accepted; module, function, symbol, import, and function-edge records also expose compact deterministic `stableId` join keys
- compact function IDs use lexical scope rather than source lines; structurally indistinguishable duplicates or digest collisions receive unique ordinal suffixes whose assignment may change if those duplicates are reordered
- summary lists accept opt-in `fields=...` sparse projections; module/function details accept bounded `include=...` expansion controls, with HTTP 400 for unknown selectors
- `search` and `q` are case-insensitive substring filters on legacy list routes; exact filters include `name`, `userCount`, `dependencyCount`, and `referenceCount`
- `/api/v1/search` adds exact function-aware lexical occurrence search over masked saved source without claiming binding identity or runtime execution; recognized JSX child text is labeled `jsx-text`, and occurrence scans fail with HTTP 413 above 5,000,000 saved-source characters or 10,000 matches
- function triage supports `reachable`, `exported`, `standalone`, count filters, and deterministic sorting; import triage distinguishes local, external, unresolved, and dynamic static evidence
- shortest paths and blast radius use bounded deterministic breadth-first traversal over immutable saved indexes (`maxDepth <= 50`, at most 10,000 visited nodes)
- JSON errors are shaped as `{ "ok": false, "error": { "status": 404, "code": "not_found", "message": "..." } }`

Routes
- `GET /api/v1` discovers routes and semantics
- `GET /api/v1/schema` returns the schema catalog in the standard API envelope; `GET /api/v1/schema.json` returns raw `application/schema+json`
- `GET /api/v1/run` returns API/schema version, package version, build timestamp, root/entry, git commit when available, build id, source hash, and summary
- `GET /api/v1/modules?search=app&reachable=true&extension=.jsx&limit=25&offset=0`
- `GET /api/v1/modules/:id`
- `GET /api/v1/modules/:id/dependencies`
- `GET /api/v1/modules/:id/dependents`
- `GET /api/v1/modules/:id/functions?detail=summary&limit=25&offset=0`
- `GET /api/v1/modules/:id/shortest-path?targetId=<module-id>&maxDepth=10`
- `GET /api/v1/modules/:id/blast-radius?maxDepth=10&limit=200`
- `GET /api/v1/imports?resolution=unresolved&dynamic=true`
- `GET /api/v1/modules/:id/source?startLine=1&endLine=40`
- `GET /api/v1/source?path=src/app.jsx&startLine=1&endLine=40`
- `GET /api/v1/symbols?search=helper&modulePath=src/app.jsx`
- `GET /api/v1/symbols?name=helper&referenceCount=1`
- `GET /api/v1/symbols/search?q=helper`
- `GET /api/v1/symbols/:id`
- `GET /api/v1/symbols/:id/references`
- `GET /api/v1/symbols/:id/callers`
- `GET /api/v1/functions?modulePath=src/app.jsx&component=true`
- `GET /api/v1/functions?name=RootApp&dependencyCount=2&userCount=0`
- `GET /api/v1/functions/search?q=RootApp`
- `GET /api/v1/functions/:id`
- `GET /api/v1/functions/:id/dependencies`
- `GET /api/v1/functions/:id/users`
- `GET /api/v1/functions/:id/placement`
- `GET /api/v1/functions/:id/shortest-path?targetId=<function-id>&maxDepth=10`
- `GET /api/v1/functions/:id/blast-radius?maxDepth=10&limit=200`
- `GET /api/v1/search?q=RootApp&match=exact&types=function,occurrence`
- `GET /api/v1/query?modulePath=src/app.jsx&symbol=RootApp`

API examples
```sh
curl http://127.0.0.1:4173/api/v1/run
curl 'http://127.0.0.1:4173/api/v1/modules?reachable=true&extension=.jsx'
curl 'http://127.0.0.1:4173/api/v1/symbols/search?q=RootApp'
curl 'http://127.0.0.1:4173/api/v1/functions/search?q=RootApp'
curl 'http://127.0.0.1:4173/api/v1/functions?name=RootApp&dependencyCount=2'
curl 'http://127.0.0.1:4173/api/v1/functions/<function-id>/placement'
curl 'http://127.0.0.1:4173/api/v1/modules/<module-id>/functions?detail=summary&limit=25&offset=0'
```

Development
- npm ci
- npm test
- npm run build:demo

Publishing
- npm run publish:npm
- npm run publish:github
- npm run publish:all

GitHub Pages
- the Pages workflow publishes a simple React app whose JSX runs directly in the browser with Bundless
- the build runs IronGlancer against that exact app and embeds the generated viewer at `./analysis/`
- intended public URL: https://karpatic.github.io/ironglancer/
