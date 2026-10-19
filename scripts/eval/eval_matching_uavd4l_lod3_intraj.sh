#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

run_pipeline pipeline_matching.py \
    --dataset uavd4l --split inTraj --data_root data/UAVD4L-LoD/inTraj \
    --mesh_path data/MODEL/ply/UAVD4L-LoD3.ply \
    --num_iterations 3 \
    --out outputs/eval_matching_uavd4l_intraj_lod3 \
    "$@"

echo "Done."
