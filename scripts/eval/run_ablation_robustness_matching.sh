#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

# Define combinations of (T_PERTURB, R_PERTURB)
# Index 0-3: Translation only
# Index 4-7: Rotation only
# Index 8-11: Joint
T_ARRAY=(
    10 20 30 50
    0 0 0 0
    10 20 30 50
)
R_ARRAY=(
    0 0 0 0
    5 10 20 30
    5 10 20 30
)

select_tasks "${1:-all}" 12
if (( $# > 0 )); then shift; fi

for TASK_IDX in "${TASK_INDICES[@]}"; do
    T_PERTURB=${T_ARRAY[$TASK_IDX]}
    R_PERTURB=${R_ARRAY[$TASK_IDX]}

    for LAYOUT in inTraj outTraj; do
        CUR_OUT_DIR="outputs/ablation_robustness_matching_t${T_PERTURB}_r${R_PERTURB}/${LAYOUT}"
        echo "Running layout=${LAYOUT} with t_perturb=${T_PERTURB}m, r_perturb=${R_PERTURB}deg, Output: ${CUR_OUT_DIR}"

        run_pipeline pipeline_matching.py \
            --num_iterations 3 \
            --dataset uavd4l \
            --data_root "data/UAVD4L-LoD/${LAYOUT}" \
            --split "${LAYOUT}" \
            --perturb_gt_t "${T_PERTURB}" \
            --perturb_gt_r "${R_PERTURB}" \
            --random_seed 42 \
            --out "${CUR_OUT_DIR}" \
            "$@"
    done

    echo "Done."

done
