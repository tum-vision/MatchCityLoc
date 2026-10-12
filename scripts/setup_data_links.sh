#!/bin/bash
# Link local data/ and checkpoints/ used by the paper pipelines.
# Usage:
#   bash scripts/setup_data_links.sh /path/to/data /path/to/checkpoints
set -euo pipefail
if [[ $# -lt 2 ]]; then
  echo "Usage: bash scripts/setup_data_links.sh /path/to/data /path/to/checkpoints" >&2
  exit 1
fi
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ln -sfn "$1" "$REPO_ROOT/data"
ln -sfn "$2" "$REPO_ROOT/checkpoints"
echo "Linked data    -> $1"
echo "Linked ckpts   -> $2"
