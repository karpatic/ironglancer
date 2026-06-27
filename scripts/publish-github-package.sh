#!/usr/bin/env bash
set -euo pipefail

REPO_OWNER="${GITHUB_OWNER:-karpatic}"
BASE_NAME="ironglancer"
SCOPED_NAME="@${REPO_OWNER}/${BASE_NAME}"
REGISTRY="https://npm.pkg.github.com"
TOKEN="${GITHUB_NPM_TOKEN:-${NODE_AUTH_TOKEN:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "Error: set GITHUB_NPM_TOKEN (or NODE_AUTH_TOKEN) with write:packages scope."
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

PACK_JSON=$(npm pack --json --pack-destination "$TMP_DIR")
TARBALL=$(node -e 'const d=JSON.parse(process.argv[1]);console.log(d[0].filename)' "$PACK_JSON")

tar -xzf "$TMP_DIR/$TARBALL" -C "$TMP_DIR"

PKG_JSON="$TMP_DIR/package/package.json"
node - <<'NODE' "$PKG_JSON" "$SCOPED_NAME" "$REGISTRY"
const fs = require('fs');
const [,, filePath, scopedName, registry] = process.argv;
const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
pkg.name = scopedName;
pkg.publishConfig = {
  ...(pkg.publishConfig || {}),
  registry,
};
fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
NODE

cat > "$TMP_DIR/package/.npmrc" <<EOF
@${REPO_OWNER}:registry=${REGISTRY}
//npm.pkg.github.com/:_authToken=${TOKEN}
EOF

echo "Publishing ${SCOPED_NAME} to GitHub Packages..."
(
  cd "$TMP_DIR/package"
  npm publish --access public --ignore-scripts
)

echo "Published ${SCOPED_NAME}"
