# Releasing

IronGlancer publishes the same version to two registries:

- npmjs: `ironglancer`
- GitHub Packages: `@karpatic/ironglancer`

A release is complete only after both registries show the target version. If one registry already has the target version but the repository has changed since that publish, bump the version again before publishing so the registries do not diverge under one version.

Release checklist:

1. Start from a clean worktree.
2. Bump `package.json` and `package-lock.json` together.
3. Run `npm test`.
4. Run `npm run build:demo`.
5. Run `npm run check:action-bundle`.
6. Run `npm run release:check`.
7. Run `npm pack --dry-run` and inspect the package file list.
8. Publish to npmjs.
9. Publish to GitHub Packages.
10. Verify both registries show the new version.
11. Remove any generated root package tarball such as `ironglancer-<version>.tgz` before committing unrelated work.

The `Publish packages` GitHub workflow is the preferred release path when triggered by a published GitHub Release or manual workflow dispatch. It checks whether each registry already has the package version before publishing to that registry.

Manual fallback:

```sh
npm run publish:npm
npm run publish:github
```

The GitHub Packages publish path requires `GITHUB_NPM_TOKEN` with package write access.
