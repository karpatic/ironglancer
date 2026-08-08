# Migrate from 0.1 to 0.2

IronGlancer 0.2 changed finding identities and made the analysis boundary explicit. Complete the baseline migration first. Then review scope and source settings.

## Replace a 0.1 baseline

Version 0.1 created finding IDs from the rule ID, evidence, and source location. Version 0.2 uses a semantic identity for each rule. Each finding also contains `identityVersion`.

Baselines and suppressions still require an exact finding ID. Therefore, a 0.1 baseline or suppression does not match a 0.2 ID.

Complete this one-time 0.1 baseline migration:

1. Use IronGlancer 0.2 with the same base and head that you used for the accepted 0.1 baseline.
2. Run `ironglancer diff`.
3. Review the new report.
4. Save the reviewed 0.2 report as the new baseline. Or, add the new IDs to the suppression file with new human reasons.
5. Run the gate with the new baseline or suppressions.
6. Remove obsolete 0.1 IDs after the gate passes.

The 0.2 IDs do not change because of source-line movement, evidence-count changes, threshold text, severity, confidence, or messages. The IDs still distinguish different rules, modules, functions, exports, and edge endpoints.

## Use a browser entry

IronGlancer 0.2 analyzes browser-side JavaScript/JSX architecture. Use one of these entry types:

- an HTML file with module scripts
- a `.js`, `.jsx`, or `.mjs` browser module

Use an HTML entry to find module scripts and import maps:

```sh
ironglancer ./my-app --entry index.html
```

Or use a module entry and an import alias:

```sh
ironglancer ./my-app --entry src/main.jsx --alias @/=src/
```

Default reports contain only modules that the browser entry can reach. Server files in a full-stack repository stay out of the report unless supported browser import syntax reaches them.

`--route-alias route=path` is a deprecated compatibility option for old root-relative URL mappings. Use `--alias specifier=path` for new configurations.

## Add unreachable front-end modules only when necessary

Use `--include-unreachable` to add other `.js`, `.jsx`, and `.mjs` files from the front-end source root:

```sh
ironglancer ./my-app --entry index.html --include-unreachable --source-root src
```

`--source-root` gives this search a project-relative boundary. If you omit it, IronGlancer infers a front-end root from the entry. The option does not create an inventory of arbitrary backend folders.

## Remove unsupported source assumptions

IronGlancer 0.2 does not analyze these source types as browser modules:

- `.ts`
- `.tsx`
- `.mts`
- `.cts`
- `.cjs`

An import that resolves to one of these files becomes unsupported or unresolved browser evidence. A detected `require()` or `module.exports` is unsupported browser syntax. It does not create a dependency edge.

A reachable Node builtin import, such as `node:fs` or `path`, becomes a browser-incompatibility finding.

IronGlancer does not analyze TypeScript, TSX, CommonJS graphs, backend routes, serverless functions, or a complete project inventory. It also does not make runtime behavior claims.

## Select a source privacy mode

The default source mode is `none`.

- `none` does not write `source-code.json` or `.ironglancer-api/source-modules.json`.
- `declarations` writes declaration snippets to `source-code.json`. It does not write module source.
- `full` writes declaration snippets and full module source.

Example:

```sh
ironglancer ./my-app --entry index.html --source-mode declarations
```

If the selected mode does not contain requested source text, the viewer, API, and local agent return explicit unavailable-source metadata. Structural module and function metadata stays available.

## Keep the module limit

The default module limit is still `500`. Use `--module-limit <count>` for normal generation and for both sides of a Git-ref diff.

The report records the effective limit and the analyzed count in `meta.analysis.moduleLimit`.

## Update GitHub Action review steps

The bundled GitHub Action uses the same diff implementation as the CLI. It writes requested reports before it returns a gate failure.

SARIF upload is a separate step. This separation lets each repository select its own upload policy.

## Understand the 0.2.0 release record

Version 0.2.0 was a GitHub Release only. It was not published to npmjs or GitHub Packages.

The current package version is `0.2.5`. npmjs `ironglancer`, GitHub Packages `@karpatic/ironglancer`, and the GitHub Release all have version `0.2.5`.
