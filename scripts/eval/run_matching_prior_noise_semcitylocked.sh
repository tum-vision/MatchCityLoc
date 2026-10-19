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

    OUT_DIR="outputs/matching_prior_noise_semcitylocked/t${T_PERTURB}_r${R_PERTURB}"
    echo "Running semcitylocked t=${T_PERTURB}m r=${R_PERTURB}deg -> ${OUT_DIR}"

    run_pipeline pipeline_matching.py \
        --dataset semcitylocked \
        --data_root data/SemCityLockeD \
        --mesh_path data/SemCityLockeD/model/TUM_CC_lod2.obj \
        --perturb_gt_t "${T_PERTURB}" \
        --perturb_gt_r "${R_PERTURB}" \
        --random_seed 42 \
        --num_iterations 2 \
        --out "${OUT_DIR}" \
        "$@"

    echo "Done noise level t=${T_PERTURB} r=${R_PERTURB}"

done
