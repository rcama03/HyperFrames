#!/usr/bin/env bash
# Usage: ./render.sh [project-dir] [output-name]
# Example: ./render.sh projects/frankfurt-overlay frankfurt-overlay-v3.mp4

set -e

PROJECT=${1:-projects/frankfurt-overlay}
OUTPUT_NAME=${2:-$(basename "$PROJECT").mp4}
OUTPUT_PATH="renders/$OUTPUT_NAME"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
REPO="rcama03/HyperFrames"

PRODUCER_HYPERFRAME_MANIFEST_PATH=/home/user/HyperFrames/packages/core/dist/hyperframe.manifest.json \
  node packages/cli/dist/cli.js render "$PROJECT" \
  --output "$OUTPUT_PATH" \
  --fps 30 --quality standard --workers 4

# Stage and push the render
git add "$OUTPUT_PATH"
git commit -m "Add rendered output: $OUTPUT_NAME

https://claude.ai/code/session_01Q8v3ipFCEh88TzUNFBwGtW" 2>/dev/null || true
git push -u origin "$BRANCH"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Download link:"
echo "  https://github.com/$REPO/raw/$BRANCH/$OUTPUT_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
