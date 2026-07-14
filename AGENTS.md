# AGENTS.md

Repo guidance for ironglancer.

## Identity
- Canonical package name on npmjs: `ironglancer`
- Canonical mirror package on GitHub Packages: `@karpatic/ironglancer`
- Generated viewer branding should say `IronGlancer`, not `IronGazer`

## Release rule
When the package version changes, treat the release as incomplete until BOTH registries are updated and verified:
1. npmjs: `ironglancer`
2. GitHub Packages: `@karpatic/ironglancer`

Do not call the release done if only one registry moved.

If one registry already has the target version but the repo has changed since that publish, bump the version again before publishing so the two registries do not diverge under the same version number.

## Repo safety rule
- Never roll back, reset, or revert a repo just to get back to a clean state if the repo already had changes when you began. You may inspect prior commits, diffs, or specific files to understand history, but do not discard pre-existing branch work.

## Clean release sequence
1. Keep the repo clean before release work.
2. Bump the package version in `package.json` and `package-lock.json` together.
3. Run local verification:
   - `npm test`
   - `npm run build:demo`
4. Publish to npmjs.
5. Publish to GitHub Packages.
6. Verify both registries show the new version.
7. Remove any regenerated root tarball like `ironglancer-<version>.tgz` before committing unrelated changes.

## Viewer verification
For changes that affect the generated static viewer:
- rebuild with `npm run build:demo`
- serve `docs/` over local HTTP
- verify in a browser that the page loads, Mermaid chunks load, and `output.json` returns 200
- keep the diagram on its own full-width row above the lower details panels unless intentionally redesigning it

## Notes
- `npm pack` and failed `npm publish` attempts often regenerate a root tarball; do not accidentally commit it.
- Prefer fixing the generator source in `src/lib/generate-static-site.js` rather than hand-editing emitted docs.
