# IronGlancer

IronGlancer analyzes a folder's JavaScript / JSX module graph and emits a static site that only needs a plain file server.

What it does
- walks JS/JSX imports from an entry file
- resolves relative imports, root-relative imports, import-map aliases, and configurable URL route aliases
- emits a dependency tree, Mermaid class diagram source, and a browser viewer
- produces static output only: index.html, app.js, output.json, diagram.mmd, vendor/

Install
- npm install -g ironglancer

CLI
- ironglancer <folder> [--entry src/app.jsx] [--out ./ironglancer-site] [--route-alias /app/=src/app/]
- repeat `--route-alias route=path` to map URL-rooted import prefixes onto source folders

Examples
- ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site
- npx ironglancer ./my-app --entry src/main.js --out ./docs/ironglancer
- ironglancer ./my-app --entry src/web/app.jsx --route-alias /creator/=src/web/creator/

Library usage
```js
import { analyzeProject, generateStaticSite } from 'ironglancer';

const analysis = await analyzeProject({ rootDir: './my-app', entry: 'src/app.jsx' });
const site = await generateStaticSite({ rootDir: './my-app', entry: 'src/app.jsx', outDir: './ironglancer-site' });
const routed = await analyzeProject({
  rootDir: './my-app',
  entry: 'src/web/app.jsx',
  routeAliases: [{ from: '/creator/', to: 'src/web/creator/' }],
});
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
- the Pages workflow builds a demo site into docs/ from tests/fixtures/sample-app
- intended public URL: https://karpatic.github.io/ironglancer/
