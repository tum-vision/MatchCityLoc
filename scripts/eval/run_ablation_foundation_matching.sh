#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

# Normal predictor x split, evaluated sequentially by default.
MODELS=(moge2-vits moge2-vitb moge2-vitl metric3dv2-vits metric3dv2-vitl metric3dv2-vitg)
SPLITS=(inTraj outTraj)
select_tasks "${1:-all}" 12
if (( $# > 0 )); then shift; fi

for TASK_IDX in "${TASK_INDICES[@]}"; do
    NORMAL_MODEL="${MODELS[$((TASK_IDX / 2))]}"
    SPLIT="${SPLITS[$((TASK_IDX % 2))]}"
    echo "Normal predictor: ${NORMAL_MODEL}, split: ${SPLIT}"
    run_pipeline pipeline_matching.py \
        --dataset uavd4l --split "${SPLIT}" \
        --data_root "data/UAVD4L-LoD/${SPLIT}" \
        --normal_model "${NORMAL_MODEL}" \
        --num_iterations 4 \
        --out "outputs/ablation_foundation_matching_${NORMAL_MODEL}_${SPLIT}" \
        "$@"
done
