# IronGlancer

IronGlancer analyzes a folder's JavaScript / JSX module graph and emits a static site that only needs a plain file server.

What it does
- walks JS/JSX imports from an entry file
- resolves relative imports, root-relative imports, import-map aliases, and configurable URL route aliases
- emits a dependency tree, Mermaid class diagram source, and a browser viewer
- can stay running as a localhost-first read-only viewer and JSON API over the saved analysis
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

Library usage
```js
import { analyzeProject, generateStaticSite, startStaticAnalysisServer } from 'ironglancer';

const analysis = await analyzeProject({ rootDir: './my-app', entry: 'src/app.jsx' });
const site = await generateStaticSite({ rootDir: './my-app', entry: 'src/app.jsx', outDir: './ironglancer-site' });
const routed = await analyzeProject({
  rootDir: './my-app',
  entry: 'src/web/app.jsx',
  routeAliases: [{ from: '/creator/', to: 'src/web/creator/' }],
});
const service = await startStaticAnalysisServer({ outDir: site.outDir });
console.log(service.url, service.apiBaseUrl);
```

Read-only API
- serve mode loads generated `output.json`, `source-code.json`, `.ironglancer-api/source-modules.json`, and `.ironglancer-api/function-map.json` once at startup and does not reparse the project per request
- source endpoints only return bounded excerpts from modules saved in the analyzed run
- the built-in server does not serve `.ironglancer-api/` as static files
- symbol relation endpoints expose static import/export/reference relationships IronGlancer captures, not runtime call graphs or data lineage
- function dependency endpoints expose static identifier usage inside declared function spans; direct call, optional-call, tagged-template, and JSX element syntax are labeled when visible, while generic references remain `reference`
- JSON errors are shaped as `{ "ok": false, "error": { "status": 404, "code": "not_found", "message": "..." } }`

Routes
- `GET /api/v1` discovers routes and semantics
- `GET /api/v1/run` returns API/schema version, package version, build timestamp, root/entry, git commit when available, build id, source hash, and summary
- `GET /api/v1/modules?search=app&reachable=true&extension=.jsx&limit=25&offset=0`
- `GET /api/v1/modules/:id`
- `GET /api/v1/modules/:id/dependencies`
- `GET /api/v1/modules/:id/dependents`
- `GET /api/v1/modules/:id/functions`
- `GET /api/v1/modules/:id/source?startLine=1&endLine=40`
- `GET /api/v1/source?path=src/app.jsx&startLine=1&endLine=40`
- `GET /api/v1/symbols?search=helper&modulePath=src/app.jsx`
- `GET /api/v1/symbols/search?q=helper`
- `GET /api/v1/symbols/:id`
- `GET /api/v1/symbols/:id/references`
- `GET /api/v1/symbols/:id/callers`
- `GET /api/v1/functions?modulePath=src/app.jsx&component=true`
- `GET /api/v1/functions/search?q=RootApp`
- `GET /api/v1/functions/:id`
- `GET /api/v1/functions/:id/dependencies`
- `GET /api/v1/functions/:id/users`
- `GET /api/v1/query?modulePath=src/app.jsx&symbol=RootApp`

API examples
```sh
curl http://127.0.0.1:4173/api/v1/run
curl 'http://127.0.0.1:4173/api/v1/modules?reachable=true&extension=.jsx'
curl 'http://127.0.0.1:4173/api/v1/symbols/search?q=RootApp'
curl 'http://127.0.0.1:4173/api/v1/functions/search?q=RootApp'
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
