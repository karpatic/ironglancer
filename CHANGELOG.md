# Changelog

## 0.2.3 - 2026-08-07

- Restored generated demo component-member source navigation by emitting declaration snippets for the demo analysis.
- Reworked the source dialog so the compact local imports/uses neighborhood sits directly above the saved code with clear incoming and outgoing labels.

## 0.2.2 - 2026-08-07

- Fixed the Webpack plugin's documented default `.ironglancer` output path so a project-local child directory is not mistaken for a destructive source ancestor.
- Excluded generated project-local IronGlancer output from `includeUnreachable` discovery on repeated plugin runs while preserving user exclusions.
- Made the package publish workflow idempotent per registry by skipping npmjs or GitHub Packages publishes when the exact version already exists.

## 0.2.1 - 2026-08-07

- Replaced the unpublished 0.2.0 registry release with deterministic Webpack watch lifecycle verification: the real Webpack 5 watch test now forces an API-supported invalidation after the source write, waits for the changed compilation and matching IronGlancer analysis, and verifies the live viewer/API/bridge stay on one refreshed immutable build and listener.

## 0.2.0 - GitHub Release only

- Added pull-request CI for Node.js 20 and 22 with `npm ci`, tests, demo build, Action bundle freshness, release integrity checks, package dry run, and local Action dogfooding.
- Reoriented IronGlancer as a browser-side JavaScript/JSX front-end architecture analyzer: HTML/module entries are authoritative, default output is browser-reachable modules only, and `--include-unreachable` is bounded to configured or inferred front-end roots.
- Replaced the interrupted TypeScript compiler dependency with AST-first JavaScript/JSX parsing via `@babel/parser`; `.ts`, `.tsx`, `.mts`, `.cts`, `.cjs`, `require()`, and `module.exports` are unsupported browser evidence or ignored as dependencies.
- Added first-class front-end structure for components/hooks, JSX render edges, React lazy/dynamic import/worker boundaries, browser API references, remote imports, asset edges, unresolved imports, and Node builtin browser-incompatibility findings.
- Replaced location/evidence-derived finding IDs with per-rule semantic identities and `identityVersion` metadata so benign line/count/message drift does not churn review baselines.
- Added source privacy modes: `none` default, `declarations`, and `full`, with explicit viewer/API/MCP degradation when source text is unavailable.
- Exposed validated `--module-limit` for normal generation and both git-ref sides of architecture diffs, with effective limit/count metadata.
- Added a bundled GitHub Action wrapper around the same architecture diff path, JSON/HTML/SARIF report outputs, gate outputs, and report-before-failure behavior.
- Added a Webpack plugin export that reruns normal IronGlancer generation after successful builds/rebuilds and manages the existing localhost viewer, read-only `/api/v1`, and `/bridge/v1` service without consuming Webpack's graph or hosting MCP.
- Hardened generated output replacement with destructive-target refusal, IronGlancer ownership markers, temporary sibling generation, and safe replacement.
- Added release-readiness documentation and checks for the 0.2.0 package state.

External pilot validation is pending. Do not treat the 0.2.0 GitHub Release as evidence that npmjs or GitHub Packages were published.
