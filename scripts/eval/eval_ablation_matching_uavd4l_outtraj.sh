#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

OUT_DIR=${1:-outputs/eval_ablation_matching_uavd4l_outtraj}
BATCH_SIZE=${2:-512}
shift "$(( $# > 2 ? 2 : $# ))"
echo "Output: ${OUT_DIR}  batchsize=${BATCH_SIZE}"

run_pipeline pipeline_matching_ablation.py \
    --dataset uavd4l \
    --data_root data/UAVD4L-LoD/outTraj \
    --mesh_path data/MODEL/ply/UAVD4L-LoD3.ply \
    --batchsize "${BATCH_SIZE}" \
    --num_iterations 5 \
    --out "${OUT_DIR}" \
    --stride 10 \
    "$@"

echo "Done."
