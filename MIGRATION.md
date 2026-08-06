# Migration Guide

## 0.2.0

IronGlancer 0.2.0 makes the product boundary explicit: IronGlancer analyzes browser-side JavaScript/JSX architecture from an HTML or JS module entry. It is not a TypeScript, backend, CommonJS, Express, serverless, or whole-project inventory analyzer.

### 0.1 baseline migration

0.1 finding IDs were derived from rule id, evidence, and location. 0.2 finding IDs are semantic per-rule identities and every finding carries `identityVersion`.

Baselines and suppressions still match exact finding IDs. That means existing 0.1 accepted baselines and suppression files will not automatically suppress the new 0.2 IDs. Do a one-time migration:

1. Run `ironglancer diff` with 0.2.0 against the same base/head pair used for your accepted 0.1 baseline.
2. Review the new report normally.
3. Save the reviewed 0.2 report as the new baseline, or update suppression entries to the new finding IDs with fresh human reasons.
4. Remove any obsolete 0.1 finding IDs after the new gate has passed.

The new IDs intentionally ignore source line movement, evidence count drift, threshold text, severity, confidence, and messages. They still distinguish different rules, modules, functions, exports, and edge endpoints.

### Browser entry reachability

Default reports now include browser-reachable `.js`, `.jsx`, and `.mjs` modules only. Backend files in full-stack repositories stay out unless the configured browser entry can literally reach them through supported browser import syntax.

Use `--entry index.html` for HTML module script and import-map discovery, or pass a JS/JSX/MJS entry directly. Use `--alias specifier=path` for import aliases. `--route-alias` remains as a deprecated compatibility option for older root-relative URL mappings.

`--include-unreachable` is still available, but it is bounded to `--source-root` when provided or to inferred front-end roots such as `src/` from the entry modules. It no longer inventories arbitrary backend folders by default.

### Unsupported source kinds

`.ts`, `.tsx`, `.mts`, `.cts`, and `.cjs` files are not analyzed as source modules. Imports that resolve to those files are reported as unsupported/unresolved browser evidence. `require()` and `module.exports` are reported as unsupported browser syntax where detected, but they do not create dependency edges.

Node builtin imports such as `node:fs` or `path` are browser-incompatibility findings when reachable from browser code.

### Source privacy default

The default source mode is now `none`.

- `none` writes no `source-code.json` and no `.ironglancer-api/source-modules.json`.
- `declarations` writes declaration snippets in `source-code.json` and omits module source.
- `full` writes both declaration snippets and module source.

Viewer, API, and MCP source workflows report explicit unavailable-source metadata when the selected mode does not include the requested source artifact. Structural module/function metadata remains available.

### Module limit

The default module limit remains 500. Use `--module-limit <count>` for ordinary generation and git-ref diffs. Reports include the effective limit and analyzed count under `meta.analysis.moduleLimit`.

### GitHub Action and SARIF

The bundled GitHub Action wraps the same diff implementation as the CLI. It writes requested reports before returning a gate failure. SARIF upload is intentionally separate so repositories can choose their own upload policy.

### Release status

This repository state is prepared for 0.2.0 but does not publish npmjs `ironglancer`, GitHub Packages `@karpatic/ironglancer`, or a GitHub Release. Those external release steps require Carlos's explicit confirmation.
