#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Bookmark Dashboard - Release Builder
# ──────────────────────────────────────────────
# Usage:
#   ./scripts/release.sh              # version from src/manifest.json
#   ./scripts/release.sh 1.3.0        # override version
#   ./scripts/release.sh --no-key     # skip PEM key bundling
#
# What it does:
#   1. Runs `npm run build`
#      → compiles React + TypeScript and copies all extension assets into dist/
#      → dist/ is a complete, self-contained Chrome extension
#   2. Zips dist/ into dist/bookmark-dashboard-v{version}.zip
#      ready for the Chrome Web Store
#
# PEM key (optional):
#   Place at config/credentials/key.pem to maintain a consistent
#   extension ID across Web Store updates. Never commit this file.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
RELEASES_DIR="$PROJECT_DIR/releases"
PEM_DIR="$PROJECT_DIR/config/credentials"
PEM_FILE="$PEM_DIR/key.pem"
KEY_FILE="$DIST_DIR/key.pem"   # temporary copy inside dist/ while zipping

NO_KEY=false
VERSION=""

# ── Parse arguments ──────────────────────────
for arg in "$@"; do
  case "$arg" in
    --no-key) NO_KEY=true ;;
    *)        VERSION="$arg" ;;
  esac
done

# ── Read version from src/manifest.json ──────
if [[ -z "$VERSION" ]]; then
  VERSION=$(grep -o '"version": *"[^"]*"' "$PROJECT_DIR/src/manifest.json" | head -1 | sed 's/"version": *"//;s/"//')
fi

if [[ -z "$VERSION" ]]; then
  echo "Error: Could not determine version from src/manifest.json."
  exit 1
fi

ZIP_NAME="bookmark-dashboard-v${VERSION}.zip"
TMP_ZIP="/tmp/$ZIP_NAME"

echo "──────────────────────────────────────────"
echo "  Bookmark Dashboard - Release Builder"
echo "──────────────────────────────────────────"
echo "  Version : $VERSION"
echo "  Output  : releases/$ZIP_NAME"

# ── PEM key (optional) ───────────────────────
HAS_KEY=false
if [[ "$NO_KEY" == false ]] && [[ -f "$PEM_FILE" ]]; then
  HAS_KEY=true
  echo "  PEM key : will bundle from config/credentials/"
elif [[ "$NO_KEY" == false ]]; then
  echo "  PEM key : not found at config/credentials/key.pem (skipped)"
fi
echo ""

# Remove temp key on exit (rm -f never fails even if absent)
cleanup() { rm -f "$KEY_FILE"; }
trap cleanup EXIT

# ── Build ────────────────────────────────────
echo "  Building…"
cd "$PROJECT_DIR"
npm run build
echo ""

# ── Bundle PEM key into dist/ temporarily ────
if [[ "$HAS_KEY" == true ]]; then
  cp "$PEM_FILE" "$KEY_FILE"
fi

# ── Create zip from dist/ ────────────────────
# dist/ is the complete extension; zip its entire contents.
mkdir -p "$RELEASES_DIR"
rm -f "$TMP_ZIP" "$RELEASES_DIR/$ZIP_NAME"

cd "$DIST_DIR"
zip -r "$TMP_ZIP" . \
  -x "*.DS_Store" \
  -x "*__MACOSX*"

mv "$TMP_ZIP" "$RELEASES_DIR/$ZIP_NAME"

# ── Summary ──────────────────────────────────
ZIP_SIZE=$(du -h "$RELEASES_DIR/$ZIP_NAME" | cut -f1 | xargs)
FILE_COUNT=$(zipinfo -1 "$RELEASES_DIR/$ZIP_NAME" | wc -l | xargs)

echo "  Done!"
echo "  File  : releases/$ZIP_NAME"
echo "  Size  : $ZIP_SIZE"
echo "  Files : $FILE_COUNT"
[[ "$HAS_KEY" == true ]] && echo "  Key   : included (key.pem)"
echo ""
echo "  Next steps:"
echo "    1. Test  : chrome://extensions → Load unpacked → select dist/"
echo "    2. Upload: https://chrome.google.com/webstore/developer/dashboard → releases/$ZIP_NAME"
echo "──────────────────────────────────────────"
