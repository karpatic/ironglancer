# IronGlancer

IronGlancer analyzes a folder's JavaScript / JSX module graph and emits a static site that only needs a plain file server.

What it does
- walks JS/JSX imports from an entry file
- resolves relative imports, root-relative imports, and import-map aliases
- emits a dependency tree, Mermaid class diagram source, and a browser viewer
- produces static output only: index.html, app.js, output.json, diagram.mmd, vendor/

Install
- npm install -g ironglancer

CLI
- ironglancer <folder> [--entry src/app.jsx] [--out ./ironglancer-site]

Examples
- ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site
- npx ironglancer ./my-app --entry src/main.js --out ./docs/ironglancer

Library usage
```js
import { analyzeProject, generateStaticSite } from 'ironglancer';

const analysis = await analyzeProject({ rootDir: './my-app', entry: 'src/app.jsx' });
const site = await generateStaticSite({ rootDir: './my-app', entry: 'src/app.jsx', outDir: './ironglancer-site' });
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
