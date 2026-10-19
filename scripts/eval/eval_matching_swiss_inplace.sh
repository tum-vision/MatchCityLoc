#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

run_pipeline pipeline_matching.py \
    --dataset swiss_epfl --split inPlace --data_root data/Swiss-EPFL \
    --num_iterations 5 \
    --query_seed 20261019 \
    --out outputs/eval_matching_swiss_inplace \
    "$@"

echo "Done."
