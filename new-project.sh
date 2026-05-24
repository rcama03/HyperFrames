#!/usr/bin/env bash
# new-project.sh — bootstrap a new HyperFrames video project
#
# Usage:
#   ./new-project.sh <project-name>
#
# Example:
#   ./new-project.sh handgepaeck-de
#
# What it does:
#   1. Creates projects/<name>/ with all required files
#   2. Copies template build-video.py and render-cards.mjs
#   3. Copies swoosh.mp3 from scanner-de
#   4. Creates output/ directory
#   5. Prints next steps

set -e

NAME="$1"
if [ -z "$NAME" ]; then
  echo "Usage: $0 <project-name>"
  echo "Example: $0 handgepaeck-de"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$SCRIPT_DIR/projects/$NAME"
TEMPLATE="$SCRIPT_DIR/projects/template"
SCANNER="$SCRIPT_DIR/projects/scanner-de"

if [ -d "$DEST" ]; then
  echo "ERROR: projects/$NAME already exists"
  exit 1
fi

echo "Creating project: $NAME"
mkdir -p "$DEST/output" "$DEST/card-frames"

cp "$TEMPLATE/build-video.py"    "$DEST/build-video.py"
cp "$TEMPLATE/render-cards.mjs"  "$DEST/render-cards.mjs"
cp "$SCANNER/swoosh.mp3"         "$DEST/swoosh.mp3"

echo ""
echo "✓ Created projects/$NAME/"
echo ""
echo "Next steps:"
echo "  1. Edit  projects/$NAME/render-cards.mjs  — set your cards + timings"
echo "  2. Run   node projects/$NAME/render-cards.mjs"
echo "  3. Drop  word-timings.json into projects/$NAME/"
echo "  4. Edit  SRC_OFFSET in projects/$NAME/build-video.py  (if source has dark intro)"
echo "  5. Run   python3 projects/$NAME/build-video.py /path/to/source.mp4 /path/to/voiceover.mp3"
echo ""
echo "Output will be at: projects/$NAME/output/<source-name>-final.mp4"
