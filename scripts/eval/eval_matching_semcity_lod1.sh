#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

run_pipeline pipeline_matching.py \
    --dataset semcitylocked \
    --data_root data/SemCityLockeD \
    --mesh_path data/SemCityLockeD/model/TUM_CC_lod1.obj \
    --num_iterations 5 \
    --out outputs/eval_matching_semcity_lod1 \
    "$@"

echo "Done."
