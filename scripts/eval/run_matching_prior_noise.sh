#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

T_ARRAY=(0 10 20 30)
R_ARRAY=(0 10 20 30)
select_tasks "${1:-all}" 4
if (( $# > 0 )); then shift; fi

for TASK_IDX in "${TASK_INDICES[@]}"; do
    T_PERTURB=${T_ARRAY[$TASK_IDX]}
    R_PERTURB=${R_ARRAY[$TASK_IDX]}

    for SPLIT in inTraj outTraj; do
        OUT_DIR="outputs/matching_prior_noise/t${T_PERTURB}_r${R_PERTURB}/${SPLIT}"
        echo "Running split=${SPLIT} t=${T_PERTURB}m r=${R_PERTURB}deg -> ${OUT_DIR}"
      run_pipeline pipeline_matching.py \
            --dataset uavd4l \
            --data_root "data/UAVD4L-LoD/${SPLIT}" \
            --split "${SPLIT}" \
            --perturb_gt_t "${T_PERTURB}" \
            --perturb_gt_r "${R_PERTURB}" \
            --random_seed 42 \
            --num_iterations 2 \
            --out "${OUT_DIR}" \
          "$@"
    done

    echo "Done noise level t=${T_PERTURB} r=${R_PERTURB}"

done
