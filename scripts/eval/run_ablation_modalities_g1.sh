#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

# Group 1: rgb+depth (x2), rgb+normal inTraj  â 3 combos
combos=(
  "rgb depth inTraj"
  "rgb depth outTraj"
  "rgb normal inTraj"
)

for combo in "${combos[@]}"; do
    uav=$(echo "$combo" | cut -d' ' -f1)
    lod=$(echo "$combo" | cut -d' ' -f2)
    split=$(echo "$combo" | cut -d' ' -f3)
    echo "Running modality: UAV $uav vs LoD $lod on $split"
    run_pipeline pipeline_matching.py \
        --num_iterations 3 \
        --dataset uavd4l --split "$split" \
        --uav_mode "$uav" --lod_mode "$lod" \
        --matcher_key "minima(RoMa)" \
        --out "outputs/ablation_modalities/${uav}_${lod}_${split}" \
        "$@"
done

echo "Group 1 done."
