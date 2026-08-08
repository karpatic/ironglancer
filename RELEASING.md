# Release IronGlancer

Publish each version to both package registries:

- npmjs: `ironglancer`
- GitHub Packages: `@karpatic/ironglancer`

A release is complete only when both registries have the target version.

If one registry already has the target version, check if the repository changed after that publish. If it changed, increase the version before you publish again. Do not publish different package contents with the same version.

## Prepare the release

1. Start with a clean worktree.
2. Update the version in `package.json` and `package-lock.json`.
3. Make sure that the two versions are the same.
4. Run `npm test`.
5. Run `npm run build:demo`.
6. Run `npm run check:action-bundle`.
7. Run `npm run release:check`.
8. Run `npm pack --dry-run`.
9. Review the package file list.

Do not continue if a check fails.

## Use the GitHub workflow

The preferred release path is the `Publish packages` workflow. It runs after a GitHub Release is published. You can also start it with manual workflow dispatch.

The workflow checks each registry before it publishes. It skips a registry if that registry already has the package version. A successful publish to only one registry does not complete the release.

## Use the manual fallback

Use these commands only when you cannot use the GitHub workflow:

```sh
npm run publish:npm
npm run publish:github
```

The GitHub Packages command requires `GITHUB_NPM_TOKEN` or `NODE_AUTH_TOKEN`. The token must have package write access.

## Verify both registries

Set the version that you published:

```sh
VERSION=0.2.5
```

Verify npmjs:

```sh
npm view "ironglancer@${VERSION}" version --registry=https://registry.npmjs.org/
```

Verify GitHub Packages with an authenticated GitHub CLI:

```sh
gh api "/users/karpatic/packages/npm/ironglancer/versions?per_page=100" --jq '.[].name'
```

Both results must contain the target version. Do not mark the release complete before they do.

## Clean the worktree

`npm pack` and failed publish commands can create a package tarball in the repository root. Remove a file such as `ironglancer-<version>.tgz` before you commit unrelated work.
